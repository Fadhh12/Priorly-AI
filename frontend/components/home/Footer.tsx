export function Footer() {
  return (
    <footer id="tentang" className="border-t border-line">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
                T
              </span>
              <span className="text-sm font-semibold text-ink">TradeSim</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-faint">
              Platform trading saham dengan order book dan matching engine real-time,
              dilengkapi AI Market Insight untuk membaca pergerakan pasar lebih cepat.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-faint">Tautan</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/Fadhh12/Priorly-AI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-subtle hover:text-ink"
                >
                  Kode Sumber (GitHub)
                </a>
              </li>
              <li>
                <a href="/trading" className="text-subtle hover:text-ink">
                  Mulai Trading
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-10 text-xs text-faint">
          © {new Date().getFullYear()} TradeSim. Seluruh hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
