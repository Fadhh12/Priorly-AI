export function formatIDR(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/** Compact number for dashboard tiles: 12450000 -> "12.45M", 162450 -> "162.45K". */
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  return value.toFixed(0);
}
