"""REST API + WebSocket layer. Business logic (validation, matching,
settlement) lives here as plain functions so bot_simulator.py can reuse the
exact same place_order() path instead of poking the store directly."""

import asyncio
import logging
import time
from datetime import datetime, timedelta

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import ai_insight
import bot_simulator
import matching_engine
import store
from models import Order, OrderSide, OrderStatus, Trade

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tradesim")

app = FastAPI(title="TradeSim API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ApiError(Exception):
    """Raised for expected, well-typed failures (SDD 2.4). Caught by the
    handler below so responses match the documented `{error, message}`
    contract instead of FastAPI's default `{detail: ...}` wrapping."""

    def __init__(self, status_code: int, error: str, message: str | None = None):
        self.status_code = status_code
        self.error = error
        self.message = message


@app.exception_handler(ApiError)
async def handle_api_error(request, exc: ApiError):
    body = {"error": exc.error}
    if exc.message:
        body["message"] = exc.message
    return JSONResponse(status_code=exc.status_code, content=body)


@app.exception_handler(store.InstrumentNotFoundError)
async def handle_instrument_not_found(request, exc: store.InstrumentNotFoundError):
    return JSONResponse(status_code=404, content={"error": "instrument_not_found", "message": str(exc)})


@app.exception_handler(Exception)
async def handle_unexpected_error(request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url)
    return JSONResponse(status_code=500, content={"error": "internal_error"})


class ConnectionManager:
    """Global broadcast to every connected client — no per-symbol
    subscription bookkeeping. Trade-off accepted deliberately: at demo scale
    (a handful of clients, 10 symbols) the extra traffic from clients
    receiving updates for symbols they aren't viewing is negligible, and it
    avoids a whole subscribe/unsubscribe protocol for a 3-day project."""

    def __init__(self):
        self.active: set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()
START_TIME = time.time()


class OrderCreateRequest(BaseModel):
    trader_id: str
    symbol: str
    side: OrderSide
    price: int
    quantity: int


def place_order(trader_id: str, symbol: str, side: OrderSide, price: int, quantity: int) -> tuple[Order, list[Trade]]:
    """Shared order-submission path used by both POST /orders and the bot
    simulator: validate (VAL-01..04) -> match -> settle -> return."""
    instrument_book = store.get_order_book(symbol)  # raises InstrumentNotFoundError -> 404

    if quantity <= 0:
        raise ApiError(400, "invalid_quantity", "Kuantitas order harus lebih dari 0")
    if price <= 0:
        raise ApiError(400, "invalid_price", "Harga order harus lebih dari 0")

    if side == OrderSide.BUY:
        if store.available_cash(trader_id) < price * quantity:
            raise ApiError(400, "insufficient_balance", "Saldo tidak mencukupi")
    else:
        if store.available_position(trader_id, symbol) < quantity:
            raise ApiError(400, "insufficient_position", "Posisi saham tidak mencukupi untuk dijual")

    order = Order(
        trader_id=trader_id,
        symbol=symbol,
        side=side,
        price=price,
        quantity=quantity,
        remaining_quantity=quantity,
    )
    store.register_order(order)

    trades = matching_engine.submit_order(order, instrument_book)
    for trade in trades:
        store.apply_trade(trade)

    return order, trades


async def broadcast_order_effects(symbol: str, trades: list[Trade]) -> None:
    await manager.broadcast(
        {
            "type": "orderbook_update",
            "symbol": symbol,
            **store.get_orderbook_snapshot(symbol),
        }
    )
    for trade in trades:
        await manager.broadcast(
            {
                "type": "trade_executed",
                "symbol": symbol,
                "trade": {"price": trade.price, "quantity": trade.quantity},
            }
        )
    if trades:
        await manager.broadcast(
            {
                "type": "price_update",
                "symbol": symbol,
                "last_price": store.last_price[symbol],
                "change_pct": store.get_change_pct(symbol),
            }
        )


@app.on_event("startup")
async def on_startup():
    bot_simulator.seed_bots()
    asyncio.create_task(bot_simulator.run(place_order, broadcast_order_effects))


@app.get("/instruments")
def list_instruments():
    return [
        {
            "symbol": i.symbol,
            "name": i.name,
            "last_price": store.last_price[i.symbol],
            "change_pct": store.get_change_pct(i.symbol),
        }
        for i in store.list_instruments()
    ]


@app.get("/orderbook/{symbol}")
def get_orderbook(symbol: str):
    snapshot = store.get_orderbook_snapshot(symbol)  # raises 404 via InstrumentNotFoundError
    return {"symbol": symbol, **snapshot}


@app.get("/candles/{symbol}")
def get_candles(symbol: str):
    bars = store.get_candles(symbol)
    return [b.model_dump() for b in bars]


@app.post("/orders")
async def create_order(body: OrderCreateRequest):
    order, trades = place_order(body.trader_id, body.symbol, body.side, body.price, body.quantity)
    await broadcast_order_effects(body.symbol, trades)
    return {"order": order.model_dump(), "trades": [t.model_dump() for t in trades]}


@app.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    order = store.get_order(order_id)
    if order is None:
        raise ApiError(404, "order_not_found")
    if order.status in (OrderStatus.FILLED, OrderStatus.CANCELLED):
        raise ApiError(409, "order_not_cancellable")

    order.status = OrderStatus.CANCELLED
    book_side = store.get_order_book(order.symbol)[order.side.value]
    if order in book_side:
        book_side.remove(order)

    await manager.broadcast(
        {"type": "orderbook_update", "symbol": order.symbol, **store.get_orderbook_snapshot(order.symbol)}
    )
    return {"order": order.model_dump()}


@app.get("/orders/{trader_id}")
def list_orders_for_trader(trader_id: str):
    return [o.model_dump() for o in store.get_orders_for_trader(trader_id)]


@app.get("/trades/{symbol}")
def list_trades(symbol: str):
    return [t.model_dump() for t in store.get_trades(symbol)]


@app.get("/traders/{trader_id}")
def get_trader(trader_id: str):
    trader = store.get_trader(trader_id)
    if trader is None:
        raise ApiError(404, "trader_not_found")
    return trader.model_dump()


@app.get("/engine/stats")
def get_engine_stats():
    """Real, derivable engine telemetry (Engine Analytics page) — no
    simulated latency numbers: everything here is a plain count over
    store.orders/trades/traders or process state, nothing fabricated."""
    all_orders = list(store.orders.values())
    all_trades = store.trades
    cutoff = datetime.utcnow() - timedelta(seconds=60)

    orders_by_status = {status.value: 0 for status in OrderStatus}
    orders_by_symbol: dict[str, int] = {}
    for o in all_orders:
        orders_by_status[o.status.value] += 1
        orders_by_symbol[o.symbol] = orders_by_symbol.get(o.symbol, 0) + 1

    return {
        "matching_mode": "Price-Time Priority (FIFO per level)",
        "self_match_rule": "Skip — order dari trader_id sama tidak saling dieksekusi",
        "order_book_depth": store.ORDER_BOOK_DEPTH,
        "uptime_seconds": round(time.time() - START_TIME),
        "total_orders": len(all_orders),
        "total_trades": len(all_trades),
        "orders_by_status": orders_by_status,
        "orders_by_symbol": orders_by_symbol,
        "trades_last_60s": sum(1 for t in all_trades if t.executed_at >= cutoff),
        "ws_connections": len(manager.active),
        "symbols_tracked": len(store.INSTRUMENTS),
        "store_records": len(all_orders) + len(all_trades) + len(store.traders),
    }


class AiInsightRequest(BaseModel):
    symbol: str


@app.post("/ai/insight")
async def get_ai_insight(body: AiInsightRequest):
    return await ai_insight.get_insight(body.symbol)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # client doesn't need to send anything; just keeps the socket open
    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        logger.exception("WebSocket connection dropped unexpectedly")
        manager.disconnect(ws)
