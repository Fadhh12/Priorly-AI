"use client";

import { useEffect, useState } from "react";
import { ApiRequestError, submitOrder, type OrderSide } from "@/lib/api";
import { getTraderId } from "@/lib/trader";

type OrderTicketProps = {
  symbol: string;
  lastPrice: number;
  cashBalance: number | null;
  position: number;
  onSubmitted: () => void;
};

const priceStep = (price: number) => Math.max(1, Math.round(price * 0.0025 / 5) * 5) || 5;

/** Real order ticket — POSTs straight to /orders (main.py place_order). No
 * lots (×100) and no brokerage fee: the backend model has neither, so the
 * total shown here is exactly what the API will charge/credit. */
export function OrderTicket({ symbol, lastPrice, cashBalance, position, onSubmitted }: OrderTicketProps) {
  const [side, setSide] = useState<OrderSide>("BUY");
  const [price, setPrice] = useState(lastPrice);
  const [quantity, setQuantity] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setPrice(lastPrice);
    setError(null);
    setSuccess(null);
  }, [symbol, lastPrice]);

  const step = priceStep(price);
  const total = price * quantity;
  const maxQtyByCash = cashBalance !== null && price > 0 ? Math.floor(cashBalance / price) : 0;
  const maxQty = side === "BUY" ? maxQtyByCash : position;

  function setQtyPct(pct: number) {
    setQuantity(Math.max(1, Math.floor(maxQty * (pct / 100))));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const traderId = getTraderId();
      const { trades } = await submitOrder({ trader_id: traderId, symbol, side, price, quantity });
      setSuccess(
        trades.length > 0
          ? `Order tereksekusi sebagian/penuh — ${trades.length} trade match.`
          : "Order masuk ke book (belum ada match).",
      );
      onSubmitted();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Gagal mengirim order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-center justify-between pb-1">
        <span className="font-label-sm text-label-sm font-semibold uppercase text-onyx-outline">Order Execution</span>
        <span className="font-label-sm text-label-sm text-onyx-tertiary">
          {side === "BUY" ? `CASH: Rp ${(cashBalance ?? 0).toLocaleString("id-ID")}` : `POSISI: ${position.toLocaleString("id-ID")} lembar`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-space-xs">
        <button
          onClick={() => setSide("BUY")}
          type="button"
          className={`py-1 font-headline-sm text-headline-sm font-bold uppercase tracking-wide transition-colors ${
            side === "BUY" ? "bg-onyx-primary text-onyx-on-primary" : "bg-onyx-surface-high text-onyx-on-surface-variant hover:text-onyx-on-surface"
          }`}
        >
          Beli (Buy)
        </button>
        <button
          onClick={() => setSide("SELL")}
          type="button"
          className={`py-1 font-headline-sm text-headline-sm font-bold uppercase tracking-wide transition-colors ${
            side === "SELL" ? "bg-onyx-secondary-container text-onyx-on-surface" : "bg-onyx-surface-high text-onyx-on-surface-variant hover:text-onyx-on-surface"
          }`}
        >
          Jual (Sell)
        </button>
      </div>

      <div className="flex flex-col gap-space-xs pt-1">
        <div className="flex items-center justify-between bg-onyx-surface-low px-space-sm py-1">
          <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Harga (IDR)</span>
          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={() => setPrice((p) => Math.max(1, p - step))}
              className="h-6 w-6 bg-onyx-surface-highest text-center font-bold text-onyx-on-surface hover:bg-onyx-surface-bright"
            >
              -
            </button>
            <input
              value={price}
              onChange={(e) => setPrice(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 0))}
              className="w-24 bg-onyx-surface-lowest px-1.5 py-0.5 text-right font-data-md text-data-md font-bold text-onyx-on-surface focus:bg-onyx-surface focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setPrice((p) => p + step)}
              className="h-6 w-6 bg-onyx-surface-highest text-center font-bold text-onyx-on-surface hover:bg-onyx-surface-bright"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between bg-onyx-surface-low px-space-sm py-1">
          <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Kuantitas (Lembar)</span>
          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-6 w-6 bg-onyx-surface-highest text-center font-bold text-onyx-on-surface hover:bg-onyx-surface-bright"
            >
              -
            </button>
            <input
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 0))}
              className="w-24 bg-onyx-surface-lowest px-1.5 py-0.5 text-right font-data-md text-data-md font-bold text-onyx-on-surface focus:bg-onyx-surface focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="h-6 w-6 bg-onyx-surface-highest text-center font-bold text-onyx-on-surface hover:bg-onyx-surface-bright"
            >
              +
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setQtyPct(pct)}
              className="bg-onyx-surface-high py-0.5 font-data-sm text-data-sm text-onyx-outline hover:bg-onyx-surface-bright hover:text-onyx-on-surface"
            >
              {pct}%
            </button>
          ))}
        </div>

        <div className="mt-1 flex flex-col gap-0.5 bg-onyx-surface-low p-space-xs font-data-sm text-data-sm">
          <div className="flex justify-between text-onyx-on-surface font-bold">
            <span>Total Estimasi:</span>
            <span className="font-data-md text-data-md text-onyx-primary">Rp {total.toLocaleString("id-ID")}</span>
          </div>
        </div>

        {error && <p className="bg-onyx-error-container/20 px-space-xs py-1 text-body-sm text-onyx-error">{error}</p>}
        {success && <p className="bg-onyx-primary/10 px-space-xs py-1 text-body-sm text-onyx-primary">{success}</p>}

        <button
          type="button"
          disabled={submitting || quantity <= 0 || price <= 0}
          onClick={handleSubmit}
          className={`mt-1 w-full py-2 font-headline-sm text-headline-sm font-bold uppercase tracking-wider shadow-md transition-colors disabled:opacity-50 ${
            side === "BUY"
              ? "bg-onyx-primary text-onyx-on-primary hover:bg-onyx-primary-container"
              : "bg-onyx-secondary-container text-onyx-on-surface hover:bg-onyx-on-secondary"
          }`}
        >
          {submitting ? "Mengirim…" : `Kirim Order ${side === "BUY" ? "Beli" : "Jual"} ${symbol}`}
        </button>
      </div>
    </div>
  );
}
