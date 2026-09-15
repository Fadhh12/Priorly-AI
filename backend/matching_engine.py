"""Price-time priority matching engine (VAL-05..VAL-07).

Pure logic, no FastAPI/store dependency, so it can be unit-tested in isolation
(see tests/test_matching_engine.py).

Design decisions:
- Execution price always follows the RESTING order's price (VAL-07) — the
  order that was already sitting in the book, regardless of which side it is.
- Partial fills leave the unmatched remainder OPEN/PARTIALLY_FILLED in the
  book (VAL-06).
- Self-match prevention: an incoming order is not matched against a resting
  order from the SAME trader_id. It is skipped (not treated as a book
  block), so a same-trader order sitting at the best price does not stall
  matching against everyone behind it — this mirrors how real exchanges
  avoid wash trades without letting one trader jam the book.
"""

from models import Order, OrderSide, OrderStatus, Trade


def _opposite_side(side: OrderSide) -> OrderSide:
    return OrderSide.SELL if side == OrderSide.BUY else OrderSide.BUY


def _sort_key(order: Order) -> tuple:
    """Best price first, then earliest created_at first (price-time priority).
    BUY book: highest price is best -> sort by negative price.
    SELL book: lowest price is best -> sort by price ascending.
    """
    price_rank = -order.price if order.side == OrderSide.BUY else order.price
    return (price_rank, order.created_at)


def _insert_sorted(book_side: list[Order], order: Order) -> None:
    book_side.append(order)
    book_side.sort(key=_sort_key)


def _price_matches(incoming: Order, resting: Order) -> bool:
    if incoming.side == OrderSide.BUY:
        return resting.price <= incoming.price
    return resting.price >= incoming.price


def submit_order(order: Order, book: dict[str, list[Order]]) -> list[Trade]:
    """Match `order` against the opposite side of `book`, mutating both the
    order and the book in place. Returns the list of trades executed."""
    resting_side = book[_opposite_side(order.side).value]
    trades: list[Trade] = []

    for resting in sorted(resting_side, key=_sort_key):
        if order.remaining_quantity <= 0:
            break
        if resting.trader_id == order.trader_id:
            continue  # self-match prevention, see module docstring
        if not _price_matches(order, resting):
            break  # sorted best-first: nothing further down the book will match

        trade_qty = min(order.remaining_quantity, resting.remaining_quantity)
        execution_price = resting.price  # VAL-07

        buy_order_id = order.id if order.side == OrderSide.BUY else resting.id
        sell_order_id = resting.id if order.side == OrderSide.BUY else order.id
        trades.append(
            Trade(
                symbol=order.symbol,
                buy_order_id=buy_order_id,
                sell_order_id=sell_order_id,
                price=execution_price,
                quantity=trade_qty,
            )
        )

        order.remaining_quantity -= trade_qty
        resting.remaining_quantity -= trade_qty

        if resting.remaining_quantity == 0:
            resting.status = OrderStatus.FILLED
            resting_side.remove(resting)
        else:
            resting.status = OrderStatus.PARTIALLY_FILLED

    if order.remaining_quantity == 0:
        order.status = OrderStatus.FILLED
    elif order.remaining_quantity < order.quantity:
        order.status = OrderStatus.PARTIALLY_FILLED
        _insert_sorted(book[order.side.value], order)
    else:
        order.status = OrderStatus.OPEN
        _insert_sorted(book[order.side.value], order)

    return trades
