import { cardAccents } from "@/lib/designTokens";

type Feature = {
  tag: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    tag: "01",
    title: "Order Book Real-Time",
    description: "Bid/ask depth live lewat WebSocket, update ke semua client di bawah 500ms.",
  },
  {
    tag: "02",
    title: "Matching Engine",
    description: "Price-time priority, partial fill, dan pencegahan self-match — dites lewat 8 unit test.",
  },
  {
    tag: "03",
    title: "Validasi Transaksi",
    description: "Saldo kas & posisi saham otomatis dicek sebelum order masuk ke order book.",
  },
  {
    tag: "04",
    title: "Candlestick Chart",
    description: "OHLC + volume per saham, scroll & zoom sinkron antara chart harga dan volume.",
  },
  {
    tag: "05",
    title: "AI Market Insight",
    description: "Narasi pola harga dari Gemini, dengan fallback rule-based bila API gagal atau kena rate limit.",
  },
  {
    tag: "06",
    title: "Aktivitas Pasar Otomatis",
    description: "Order masuk terus-menerus dari beberapa pelaku pasar, supaya order book & trade feed selalu aktif.",
  },
];

export function FeatureGrid() {
  return (
    <section id="fitur" className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">Fitur Utama</h2>
        <p className="max-w-sm text-sm text-subtle">
          Dibangun untuk pengalaman trading yang cepat dan transparan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.tag}
            className="rounded-xl border border-line bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xs font-bold text-white"
              style={{ backgroundColor: cardAccents[i % cardAccents.length] }}
            >
              {feature.tag}
            </span>
            <h3 className="mt-4 text-sm font-semibold text-ink">{feature.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-subtle">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
