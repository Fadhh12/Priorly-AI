export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type Instrument = {
  symbol: string;
  name: string;
  last_price: number;
  change_pct: number;
};

export async function getInstruments(): Promise<Instrument[]> {
  const res = await fetch(`${API_BASE_URL}/instruments`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /instruments failed: ${res.status}`);
  return res.json();
}

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export async function getCandles(symbol: string): Promise<Candle[]> {
  const res = await fetch(`${API_BASE_URL}/candles/${symbol}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /candles/${symbol} failed: ${res.status}`);
  return res.json();
}

export type OrderBookLevel = { price: number; quantity: number };
export type OrderBook = { symbol: string; bids: OrderBookLevel[]; asks: OrderBookLevel[] };

export async function getOrderBook(symbol: string): Promise<OrderBook> {
  const res = await fetch(`${API_BASE_URL}/orderbook/${symbol}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /orderbook/${symbol} failed: ${res.status}`);
  return res.json();
}

export type OrderSide = "BUY" | "SELL";
export type OrderStatus = "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED";

export type Order = {
  id: string;
  trader_id: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  remaining_quantity: number;
  status: OrderStatus;
  created_at: string;
};

export type Trade = {
  id: string;
  symbol: string;
  buy_order_id: string;
  sell_order_id: string;
  price: number;
  quantity: number;
  executed_at: string;
};

export type Trader = {
  id: string;
  cash_balance: number;
  positions: Record<string, number>;
};

/** Thrown for the backend's typed `{error, message}` body (SDD 2.4) so
 * callers can show the exact validation reason next to the order form field
 * instead of a generic toast. */
export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: string,
    message?: string,
  ) {
    super(message ?? error);
  }
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiRequestError(res.status, body.error ?? "unknown_error", body.message);
  }
  return res.json();
}

export async function submitOrder(input: {
  trader_id: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
}): Promise<{ order: Order; trades: Trade[] }> {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseOrThrow(res);
}

export async function cancelOrder(orderId: string): Promise<{ order: Order }> {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, { method: "DELETE" });
  return parseOrThrow(res);
}

export async function getOrdersForTrader(traderId: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE_URL}/orders/${traderId}`, { cache: "no-store" });
  return parseOrThrow(res);
}

export async function getTrades(symbol: string): Promise<Trade[]> {
  const res = await fetch(`${API_BASE_URL}/trades/${symbol}`, { cache: "no-store" });
  return parseOrThrow(res);
}

export async function getTrader(traderId: string): Promise<Trader> {
  const res = await fetch(`${API_BASE_URL}/traders/${traderId}`, { cache: "no-store" });
  return parseOrThrow(res);
}

export type AiInsight = { source: "ai" | "fallback"; insight: string };

export async function getAiInsight(symbol: string): Promise<AiInsight> {
  const res = await fetch(`${API_BASE_URL}/ai/insight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  return parseOrThrow(res);
}

export type EngineStats = {
  matching_mode: string;
  self_match_rule: string;
  order_book_depth: number;
  uptime_seconds: number;
  total_orders: number;
  total_trades: number;
  orders_by_status: Record<OrderStatus, number>;
  orders_by_symbol: Record<string, number>;
  trades_last_60s: number;
  ws_connections: number;
  symbols_tracked: number;
  store_records: number;
};

export async function getEngineStats(): Promise<EngineStats> {
  const res = await fetch(`${API_BASE_URL}/engine/stats`, { cache: "no-store" });
  return parseOrThrow(res);
}
