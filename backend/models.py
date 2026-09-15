"""Pydantic data models for TradeSim (SDD 3.4)."""

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderStatus(str, Enum):
    OPEN = "OPEN"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"


class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    trader_id: str
    symbol: str
    side: OrderSide
    price: int
    quantity: int
    remaining_quantity: int
    status: OrderStatus = OrderStatus.OPEN
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Trade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    buy_order_id: str
    sell_order_id: str
    price: int
    quantity: int
    executed_at: datetime = Field(default_factory=datetime.utcnow)


class Trader(BaseModel):
    id: str
    cash_balance: int
    positions: dict[str, int] = Field(default_factory=dict)


class Instrument(BaseModel):
    symbol: str
    name: str


class Candle(BaseModel):
    time: int  # unix timestamp (seconds), required by Lightweight Charts
    open: int
    high: int
    low: int
    close: int
    volume: int
