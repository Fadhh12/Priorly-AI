"""In-memory data store (NFR-03).

Structured like database tables (dict keyed by id) so it can be swapped
for a real database later without changing the shape callers rely on.
"""

import random
import time

from models import Candle, Instrument, Order, Trade, Trader

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
        Instrument(symbol="TLKM", name="Telkom Indonesia Tbk"),
        Instrument(symbol="GOTO", name="GoTo Gojek Tokopedia Tbk"),
        Instrument(symbol="ANTM", name="Aneka Tambang Tbk"),
        Instrument(symbol="BMRI", name="Bank Mandiri Tbk"),
        Instrument(symbol="ASII", name="Astra International Tbk"),
        Instrument(symbol="ICBP", name="Indofood CBP Sukses Makmur Tbk"),
    ]
}

_BASE_PRICES: dict[str, int] = {
    "BBCA": 10250,
    "TLKM": 3980,
    "GOTO": 84,
    "ANTM": 1610,
    "BMRI": 6725,
    "ASII": 5425,
    "ICBP": 11800,
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
