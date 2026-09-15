"""Randomized 'trader bot' background task (Should Have, PRD 1.4) so the
order book and trade feed look alive even with no real user connected.

Depends only on store/models — the order-submission logic itself (place_order)
and the broadcast callback are passed in by main.py at startup, so this
module never imports main (would be circular: main starts this task).
"""

import asyncio
import logging
import random

import store
from models import OrderSide

logger = logging.getLogger("tradesim.bot")

BOT_IDS = [f"bot-{i}" for i in range(1, 6)]
BOT_STARTING_CASH = 2_000_000_000
BOT_STARTING_SHARES = 200_000
TICK_INTERVAL_RANGE = (1.0, 3.0)
PRICE_VARIANCE_PCT = 0.008
MAX_QUANTITY = 50


def seed_bots() -> None:
    """Give each bot cash and a starting position in every instrument so it
    can plausibly place both BUY and SELL orders from the start."""
    for bot_id in BOT_IDS:
        if bot_id in store.traders:
            continue
        trader = store.get_or_create_trader(bot_id)
        trader.cash_balance = BOT_STARTING_CASH
        trader.positions = {symbol: BOT_STARTING_SHARES for symbol in store.INSTRUMENTS}


def _random_order():
    bot_id = random.choice(BOT_IDS)
    symbol = random.choice(list(store.INSTRUMENTS))
    side = random.choice(["BUY", "SELL"])
    reference_price = store.last_price[symbol]
    offset = random.uniform(-PRICE_VARIANCE_PCT, PRICE_VARIANCE_PCT)
    price = max(1, round(reference_price * (1 + offset)))
    quantity = random.randint(1, MAX_QUANTITY)
    return bot_id, symbol, side, price, quantity


async def run(place_order_fn, broadcast_fn) -> None:
    """Runs forever as a background asyncio task. Any single bad tick (e.g. a
    bot momentarily failing its own balance check) is logged and skipped —
    it must never take down the whole simulator loop."""
    while True:
        await asyncio.sleep(random.uniform(*TICK_INTERVAL_RANGE))
        bot_id, symbol, side, price, quantity = _random_order()
        try:
            _order, trades = place_order_fn(bot_id, symbol, OrderSide(side), price, quantity)
            await broadcast_fn(symbol, trades)
        except Exception:
            logger.debug("Bot tick skipped for %s/%s", bot_id, symbol, exc_info=True)
