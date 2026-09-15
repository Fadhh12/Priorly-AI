/** One simulated trader session per browser (no login — SDD Out of Scope).
 * Id is generated once and kept in localStorage so refreshing the page
 * keeps the same cash balance / positions / open orders on the backend. */
const STORAGE_KEY = "tradesim_trader_id";

export function getTraderId(): string {
  if (typeof window === "undefined") return "server";

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = `trader-${crypto.randomUUID()}`;
  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
