"use client";

import { useEffect, useRef } from "react";
import { API_BASE_URL } from "./api";

export type WsMessage =
  | { type: "orderbook_update"; symbol: string; bids: { price: number; quantity: number }[]; asks: { price: number; quantity: number }[] }
  | { type: "trade_executed"; symbol: string; trade: { price: number; quantity: number } }
  | { type: "price_update"; symbol: string; last_price: number; change_pct: number };

const WS_URL = API_BASE_URL.replace(/^http/, "ws") + "/ws";
const RECONNECT_DELAY_MS = 2000;

/** Single shared `/ws` connection (SDD 3.1 global broadcast) with
 * auto-reconnect. `onMessage` is called for every broadcast frame — callers
 * filter by `type`/`symbol` themselves, matching the backend's "no
 * per-symbol subscription" design (main.py ConnectionManager). */
export function useWebSocket(onMessage: (msg: WsMessage) => void, onStatusChange?: (connected: boolean) => void) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;
  const statusRef = useRef(onStatusChange);
  statusRef.current = onStatusChange;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      socket = new WebSocket(WS_URL);

      socket.onopen = () => statusRef.current?.(true);
      socket.onclose = () => {
        statusRef.current?.(false);
        if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
      socket.onerror = () => socket?.close();
      socket.onmessage = (event) => {
        try {
          handlerRef.current(JSON.parse(event.data) as WsMessage);
        } catch {
          // ignore malformed frame
        }
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);
}
