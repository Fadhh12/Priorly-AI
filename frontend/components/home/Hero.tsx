import Link from "next/link";
import type { Instrument } from "@/lib/api";
import { DashboardPreview } from "./DashboardPreview";

type LiveStatus = "loading" | "ready" | "error";

type HeroProps = {
  status: LiveStatus;
  instruments: Instrument[];
};

export function Hero({ status, instruments }: HeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 pt-14 md:pt-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-gain" />
          ORDER BOOK & MATCHING ENGINE REAL-TIME
        </div>

        <h1 className="mt-5 text-[2.75rem] font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          Trading saham,
          <br />
          <span className="text-accent">secepat</span> pasar bergerak.
        </h1>

        <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-subtle">
          Pasang limit order beli/jual dan lihat matching engine price-time priority
          mencocokkannya seketika — order book, chart, dan saldo ter-update lewat
          WebSocket, bukan refresh manual.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/trading"
            className="rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-accent/20 transition-opacity hover:opacity-90"
          >
            Mulai Trading →
          </Link>
          <a
            href="#cara-kerja"
            className="text-sm font-semibold text-subtle transition-colors hover:text-ink"
          >
            Lihat cara kerja
          </a>
        </div>
      </div>

      <div className="mt-14">
        <DashboardPreview status={status} instruments={instruments} />
      </div>
    </section>
  );
}
