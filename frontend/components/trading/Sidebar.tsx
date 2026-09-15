"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/trading", label: "Trading Terminal", icon: "candlestick_chart" },
  { href: "/trading/order-book", label: "Order Book & Depth", icon: "format_align_center" },
  { href: "/trading/portfolio", label: "Portfolio & History", icon: "receipt_long" },
  { href: "/trading/analytics", label: "Engine Analytics", icon: "monitoring" },
  { href: "/trading/docs", label: "API & Docs", icon: "terminal" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col justify-between border-r border-onyx-outline-variant/40 bg-onyx-surface-lowest">
      <div className="flex flex-col">
        <div className="flex h-14 items-center justify-between border-b border-onyx-outline-variant/30 bg-onyx-surface-low px-space-lg">
          <Link href="/trading" className="flex items-center gap-space-sm">
            <div className="h-5 w-2 rounded-none bg-onyx-primary" />
            <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-onyx-on-surface">
              TRADESIM
            </span>
            <span className="font-label-sm text-label-sm rounded-none border border-onyx-outline-variant/50 bg-onyx-surface-highest px-space-xs py-0.5 text-onyx-on-surface-variant">
              v1.0
            </span>
          </Link>
          <div className="flex items-center gap-space-xs">
            <span className="h-2 w-2 animate-pulse rounded-none bg-onyx-primary" />
            <span className="font-label-sm text-label-sm tracking-widest text-onyx-primary">LIVE</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-onyx-outline-variant/20 bg-onyx-surface-dim px-space-md py-space-sm">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">
            Simulator Trading
          </span>
        </div>

        <nav className="flex flex-col gap-space-xs p-space-sm">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/trading" ? pathname === "/trading" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-space-md px-space-md py-space-sm transition-colors ${
                  active
                    ? "border-l-2 border-onyx-primary bg-onyx-surface-container font-bold text-onyx-primary"
                    : "text-onyx-on-surface-variant hover:bg-onyx-surface-high hover:text-onyx-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="font-body-md text-body-md uppercase tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-space-sm border-t border-onyx-outline-variant/40 bg-onyx-surface-lowest p-space-md">
        <div className="flex items-center justify-between border-b border-onyx-outline-variant/20 pb-space-xs">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">
            Status Backend
          </span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-space-xs text-onyx-on-surface-variant hover:text-onyx-on-surface"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span className="font-body-sm text-body-sm uppercase tracking-wider">Kembali ke Home</span>
        </Link>
      </div>
    </aside>
  );
}
