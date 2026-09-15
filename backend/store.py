"""In-memory data store (NFR-03).

Structured like database tables (dict keyed by id) so it can be swapped
for a real database later without changing the shape callers rely on.
"""

import random
import time

from models import Candle, Instrument, Order, OrderSide, OrderStatus, Trade, Trader

OPEN_STATUSES = (OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED)
ORDER_BOOK_DEPTH = 15

DEFAULT_CASH_BALANCE = 100_000_000  # simulated starting balance (IDR)
CANDLE_PERIODS = 90
CANDLE_INTERVAL_SECONDS = 24 * 60 * 60  # 1 day per candle


class InstrumentNotFoundError(Exception):
    def __init__(self, symbol: str):
        self.symbol = symbol
        super().__init__(f"instrument '{symbol}' not found")


INSTRUMENTS: dict[str, Instrument] = {
    i.symbol: i
    for i in [
        Instrument(symbol="BBCA", name="Bank Central Asia Tbk"),
        Instrument(symbol="BBRI", name="Bank Rakyat Indonesia Tbk"),
        Instrument(symbol="BMRI", name="Bank Mandiri Tbk"),
        Instrument(symbol="BBNI", name="Bank Negara Indonesia Tbk"),
        Instrument(symbol="TLKM", name="Telkom Indonesia Tbk"),
        Instrument(symbol="ASII", name="Astra International Tbk"),
        Instrument(symbol="UNVR", name="Unilever Indonesia Tbk"),
        Instrument(symbol="ICBP", name="Indofood CBP Sukses Makmur Tbk"),
        Instrument(symbol="ANTM", name="Aneka Tambang Tbk"),
        Instrument(symbol="GOTO", name="GoTo Gojek Tokopedia Tbk"),
    ]
}

# Base price = perkiraan level harga IDX riil, hanya sebagai titik awal simulasi
# (bukan feed live — lihat README bagian "Out of Scope" untuk alasannya).
_BASE_PRICES: dict[str, int] = {
    "BBCA": 10225,
    "BBRI": 4850,
    "BMRI": 6725,
    "BBNI": 5475,
    "TLKM": 3980,
    "ASII": 5425,
    "UNVR": 1825,
    "ICBP": 11800,
    "ANTM": 1610,
    "GOTO": 84,
}

orders: dict[str, Order] = {}
trades: list[Trade] = []
traders: dict[str, Trader] = {}
# order_books[symbol] = {"BUY": [Order, ...], "SELL": [Order, ...]}
order_books: dict[str, dict[str, list[Order]]] = {
    symbol: {"BUY": [], "SELL": []} for symbol in INSTRUMENTS
}
candles: dict[str, list[Candle]] = {}
last_price: dict[str, int] = dict(_BASE_PRICES)


def _generate_dummy_candles(symbol: str, base_price: int) -> list[Candle]:
    """Random-walk OHLC generator so the chart has realistic-looking history."""
    result: list[Candle] = []
    price = base_price
    now = int(time.time())
    start = now - CANDLE_PERIODS * CANDLE_INTERVAL_SECONDS

    for i in range(CANDLE_PERIODS):
        open_price = price
        drift_pct = random.uniform(-0.03, 0.03)
        close_price = max(1, round(open_price * (1 + drift_pct)))
        high_price = max(open_price, close_price) + random.randint(0, max(1, int(open_price * 0.01)))
        low_price = max(1, min(open_price, close_price) - random.randint(0, max(1, int(open_price * 0.01))))
        volume = random.randint(50_000, 5_000_000)

        result.append(
            Candle(
                time=start + i * CANDLE_INTERVAL_SECONDS,
                open=open_price,
                high=high_price,
                low=low_price,
                close=close_price,
                volume=volume,
            )
        )
        price = close_price

    return result


for _symbol, _base in _BASE_PRICES.items():
    candles[_symbol] = _generate_dummy_candles(_symbol, _base)
    last_price[_symbol] = candles[_symbol][-1].close


def get_instrument(symbol: str) -> Instrument:
    instrument = INSTRUMENTS.get(symbol)
    if instrument is None:
        raise InstrumentNotFoundError(symbol)
    return instrument


def list_instruments() -> list[Instrument]:
    return list(INSTRUMENTS.values())


def get_trader(trader_id: str) -> Trader | None:
    """Pure lookup, no side effect — unlike get_or_create_trader, used where a
    never-before-seen trader_id should read as 'not found' (GET /traders)."""
    return traders.get(trader_id)


def get_or_create_trader(trader_id: str) -> Trader:
    """First-touch trader creation: a trader_id is valid the moment it's used,
    seeded with a default balance and empty positions (demo has no signup step)."""
    trader = traders.get(trader_id)
    if trader is None:
        trader = Trader(id=trader_id, cash_balance=DEFAULT_CASH_BALANCE, positions={})
        traders[trader_id] = trader
    return trader


def get_order_book(symbol: str) -> dict[str, list[Order]]:
    if symbol not in INSTRUMENTS:
        raise InstrumentNotFoundError(symbol)
    return order_books[symbol]


def get_candles(symbol: str) -> list[Candle]:
    if symbol not in INSTRUMENTS:
        raise InstrumentNotFoundError(symbol)
    return candles[symbol]


def get_trades(symbol: str) -> list[Trade]:
    if symbol not in INSTRUMENTS:
        raise InstrumentNotFoundError(symbol)
    return [t for t in trades if t.symbol == symbol]


def get_orders_for_trader(trader_id: str) -> list[Order]:
    return [o for o in orders.values() if o.trader_id == trader_id]


def get_order(order_id: str) -> Order | None:
    return orders.get(order_id)


def register_order(order: Order) -> None:
    orders[order.id] = order


def available_cash(trader_id: str) -> int:
    """Cash not already committed to the trader's own OPEN/PARTIALLY_FILLED
    BUY orders. Balance/positions are only mutated on actual trade execution
    (see apply_trade), so double-spend across several open orders is
    prevented by checking this instead of the raw cash_balance."""
    trader = get_or_create_trader(trader_id)
    committed = sum(
        o.price * o.remaining_quantity
        for o in orders.values()
        if o.trader_id == trader_id and o.side == OrderSide.BUY and o.status in OPEN_STATUSES
    )
    return trader.cash_balance - committed


def available_position(trader_id: str, symbol: str) -> int:
    """Shares not already committed to the trader's own OPEN/PARTIALLY_FILLED
    SELL orders for this symbol (mirrors available_cash for VAL-04)."""
    trader = get_or_create_trader(trader_id)
    committed = sum(
        o.remaining_quantity
        for o in orders.values()
        if o.trader_id == trader_id
        and o.symbol == symbol
        and o.side == OrderSide.SELL
        and o.status in OPEN_STATUSES
    )
    return trader.positions.get(symbol, 0) - committed


def get_prev_close(symbol: str) -> int:
    bars = candles[symbol]
    return bars[-2].close if len(bars) >= 2 else bars[-1].open


def get_change_pct(symbol: str) -> float:
    prev_close = get_prev_close(symbol)
    if prev_close == 0:
        return 0.0
    return round((last_price[symbol] - prev_close) / prev_close * 100, 2)


def get_orderbook_snapshot(symbol: str) -> dict[str, list[dict]]:
    """Aggregate individual resting orders into price levels (like a real
    order book depth view), best price first, capped at ORDER_BOOK_DEPTH."""
    book = get_order_book(symbol)

    def aggregate(side_orders: list[Order]) -> list[dict]:
        levels: dict[int, int] = {}
        for o in side_orders:
            levels[o.price] = levels.get(o.price, 0) + o.remaining_quantity
        return [{"price": p, "quantity": q} for p, q in levels.items()]

    bids = sorted(aggregate(book["BUY"]), key=lambda lvl: -lvl["price"])[:ORDER_BOOK_DEPTH]
    asks = sorted(aggregate(book["SELL"]), key=lambda lvl: lvl["price"])[:ORDER_BOOK_DEPTH]
    return {"bids": bids, "asks": asks}


def _update_last_candle(symbol: str, price: int, quantity: int) -> None:
    """Live-update the most recent bar so the chart reflects each trade tick
    without waiting for a new period to roll over."""
    bar = candles[symbol][-1]
    bar.close = price
    bar.high = max(bar.high, price)
    bar.low = min(bar.low, price)
    bar.volume += quantity


def apply_trade(trade: Trade) -> None:
    """Settle a trade: move cash and shares between buyer and seller, append
    to the trade log, and refresh last price / the live candle."""
    buy_order = orders[trade.buy_order_id]
    sell_order = orders[trade.sell_order_id]
    buyer = get_or_create_trader(buy_order.trader_id)
    seller = get_or_create_trader(sell_order.trader_id)
    amount = trade.price * trade.quantity

    buyer.cash_balance -= amount
    buyer.positions[trade.symbol] = buyer.positions.get(trade.symbol, 0) + trade.quantity
    seller.cash_balance += amount
    seller.positions[trade.symbol] = seller.positions.get(trade.symbol, 0) - trade.quantity

    trades.append(trade)
    last_price[trade.symbol] = trade.price
    _update_last_candle(trade.symbol, trade.price, trade.quantity)
