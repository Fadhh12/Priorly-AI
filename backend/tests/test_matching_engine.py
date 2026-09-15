from models import Order, OrderSide, OrderStatus
from matching_engine import submit_order


def make_order(trader_id, side, price, quantity):
    return Order(
        trader_id=trader_id,
        symbol="BBCA",
        side=side,
        price=price,
        quantity=quantity,
        remaining_quantity=quantity,
    )


def empty_book():
    return {"BUY": [], "SELL": []}


def test_no_match_stays_open_on_empty_book():
    book = empty_book()
    order = make_order("t1", OrderSide.BUY, 10000, 100)

    trades = submit_order(order, book)

    assert trades == []
    assert order.status == OrderStatus.OPEN
    assert order.remaining_quantity == 100
    assert book["BUY"] == [order]


def test_exact_match_fills_both_orders():
    book = empty_book()
    resting = make_order("seller", OrderSide.SELL, 10000, 100)
    book["SELL"].append(resting)

    incoming = make_order("buyer", OrderSide.BUY, 10000, 100)
    trades = submit_order(incoming, book)

    assert len(trades) == 1
    assert trades[0].price == 10000
    assert trades[0].quantity == 100
    assert incoming.status == OrderStatus.FILLED
    assert incoming.remaining_quantity == 0
    assert resting.status == OrderStatus.FILLED
    assert book["SELL"] == []
    assert book["BUY"] == []


def test_partial_fill_leaves_remainder_open_in_book():
    book = empty_book()
    resting = make_order("seller", OrderSide.SELL, 10000, 40)
    book["SELL"].append(resting)

    incoming = make_order("buyer", OrderSide.BUY, 10000, 100)
    trades = submit_order(incoming, book)

    assert len(trades) == 1
    assert trades[0].quantity == 40
    assert incoming.status == OrderStatus.PARTIALLY_FILLED
    assert incoming.remaining_quantity == 60
    assert book["BUY"] == [incoming]
    assert resting.status == OrderStatus.FILLED


def test_execution_price_follows_resting_order():
    book = empty_book()
    resting = make_order("seller", OrderSide.SELL, 9800, 50)
    book["SELL"].append(resting)

    # incoming BUY is willing to pay more, but trade executes at resting price
    incoming = make_order("buyer", OrderSide.BUY, 10000, 50)
    trades = submit_order(incoming, book)

    assert trades[0].price == 9800


def test_no_match_when_price_does_not_cross():
    book = empty_book()
    resting = make_order("seller", OrderSide.SELL, 10500, 50)
    book["SELL"].append(resting)

    incoming = make_order("buyer", OrderSide.BUY, 10000, 50)
    trades = submit_order(incoming, book)

    assert trades == []
    assert incoming.status == OrderStatus.OPEN
    assert book["BUY"] == [incoming]
    assert book["SELL"] == [resting]


def test_price_time_priority_matches_best_price_first_then_earliest():
    book = empty_book()
    worse_price = make_order("s1", OrderSide.SELL, 10100, 30)
    better_price = make_order("s2", OrderSide.SELL, 10000, 30)
    book["SELL"].extend([worse_price, better_price])

    incoming = make_order("buyer", OrderSide.BUY, 10100, 30)
    trades = submit_order(incoming, book)

    assert len(trades) == 1
    assert trades[0].sell_order_id == better_price.id
    assert book["SELL"] == [worse_price]


def test_sequential_match_against_multiple_resting_orders():
    book = empty_book()
    s1 = make_order("s1", OrderSide.SELL, 10000, 20)
    s2 = make_order("s2", OrderSide.SELL, 10000, 30)
    s3 = make_order("s3", OrderSide.SELL, 10100, 100)
    book["SELL"].extend([s1, s2, s3])

    incoming = make_order("buyer", OrderSide.BUY, 10100, 60)
    trades = submit_order(incoming, book)

    assert len(trades) == 3
    assert [t.quantity for t in trades] == [20, 30, 10]
    assert incoming.status == OrderStatus.FILLED
    assert s3.remaining_quantity == 90
    assert s3.status == OrderStatus.PARTIALLY_FILLED
    assert book["SELL"] == [s3]


def test_self_match_is_skipped():
    book = empty_book()
    own_resting = make_order("trader1", OrderSide.SELL, 10000, 50)
    other_resting = make_order("trader2", OrderSide.SELL, 10000, 50)
    book["SELL"].extend([own_resting, other_resting])

    incoming = make_order("trader1", OrderSide.BUY, 10000, 50)
    trades = submit_order(incoming, book)

    assert len(trades) == 1
    assert trades[0].sell_order_id == other_resting.id
    assert book["SELL"] == [own_resting]
    assert incoming.status == OrderStatus.FILLED
