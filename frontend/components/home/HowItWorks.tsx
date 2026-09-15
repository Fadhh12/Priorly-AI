import { cardAccents } from "@/lib/designTokens";

const STEPS = [
  {
    step: "01",
    title: "Pilih Saham",
    description: "Cari atau klik salah satu dari 10 saham di watchlist untuk lihat chart & order book-nya.",
  },
  {
    step: "02",
    title: "Isi Form Buy/Sell",
    description: "Masukkan harga & kuantitas, atau pakai quick-select 25/50/75/100% dari saldo/posisi tersedia.",
  },
  {
    step: "03",
    title: "Order Masuk Order Book",
    description: "Sistem validasi saldo/posisi, lalu order berstatus OPEN masuk ke antrean price-time priority.",
  },
  {
    step: "04",
    title: "Matching Engine Eksekusi",
    description: "Begitu ada order lawan yang cocok, trade tereksekusi otomatis dan semua UI update real-time.",
  },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="border-t border-line bg-surface-raised/60 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 max-w-xl">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Cara Kerja</h2>
          <p className="mt-2 text-sm text-subtle">Dari klik saham sampai transaksi tereksekusi — 4 langkah.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item, i) => (
            <div key={item.step} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-bold text-white"
                style={{ backgroundColor: cardAccents[i % cardAccents.length] }}
              >
                {item.step}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-subtle">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
