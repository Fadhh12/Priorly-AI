import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API & Docs — TradeSim",
};

/** Referensi API TradeSim — dibangun langsung dari backend/main.py &
 * backend/models.py yang sesungguhnya (bukan mockup). Halaman statis (server
 * component), tidak butuh fetch client-side: seluruh isi di bawah adalah
 * dokumentasi tetap dari kontrak REST + WebSocket yang benar-benar berjalan
 * di backend/main.py, backend/models.py, backend/store.py, dan
 * backend/ai_insight.py. Base URL default cocok dengan
 * frontend/lib/api.ts:1 (`NEXT_PUBLIC_API_BASE_URL` → fallback
 * `http://localhost:8000`). */

type Method = "GET" | "POST" | "DELETE" | "WS";

function MethodBadge({ method }: { method: Method }) {
  const styles: Record<Method, string> = {
    GET: "bg-onyx-primary text-onyx-on-primary",
    POST: "bg-onyx-tertiary text-onyx-on-tertiary",
    DELETE: "bg-onyx-secondary text-onyx-on-secondary",
    WS: "border border-onyx-outline-variant/60 bg-onyx-surface-highest text-onyx-primary",
  };
  return (
    <span className={`font-label-md text-label-md px-space-md py-space-xs font-bold uppercase ${styles[method]}`}>
      {method}
    </span>
  );
}

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "primary" | "tertiary" | "secondary" }) {
  const styles = {
    neutral: "bg-onyx-surface-highest text-onyx-on-surface-variant",
    primary: "bg-onyx-primary/10 text-onyx-primary",
    tertiary: "bg-onyx-tertiary/10 text-onyx-tertiary",
    secondary: "bg-onyx-secondary-container/20 text-onyx-secondary",
  };
  return (
    <span className={`font-label-sm text-label-sm px-space-sm py-space-xs uppercase tracking-wider ${styles[tone]}`}>
      {children}
    </span>
  );
}

function CodeBlock({ label, code, tone = "neutral" }: { label?: string; code: string; tone?: "neutral" | "primary" }) {
  return (
    <div className="flex flex-col gap-space-xs bg-onyx-surface-low p-space-sm">
      {label && (
        <span
          className={`font-label-sm text-label-sm uppercase tracking-wider ${
            tone === "primary" ? "text-onyx-primary" : "text-onyx-outline"
          }`}
        >
          {label}
        </span>
      )}
      <pre className="overflow-x-auto font-data-sm text-data-sm leading-relaxed text-onyx-on-surface">{code}</pre>
    </div>
  );
}

type FieldRow = { name: string; type: string; required?: boolean; description: string };

function FieldTable({ rows }: { rows: FieldRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left font-data-sm text-data-sm">
        <thead>
          <tr className="bg-onyx-surface-high font-label-sm text-label-sm uppercase text-onyx-outline">
            <th className="px-space-sm py-1">Field</th>
            <th className="px-space-sm py-1">Tipe</th>
            <th className="px-space-sm py-1">Wajib</th>
            <th className="px-space-sm py-1">Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} className={i % 2 === 0 ? "bg-onyx-surface-low" : "bg-onyx-surface-container"}>
              <td className="px-space-sm py-1 font-semibold text-onyx-primary">{r.name}</td>
              <td className="px-space-sm py-1 text-onyx-on-surface-variant">{r.type}</td>
              <td className="px-space-sm py-1 text-onyx-on-surface-variant">{r.required ? "Ya" : "Tidak"}</td>
              <td className="px-space-sm py-1 text-onyx-on-surface">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ErrorRow = { status: number; error: string; message?: string; when: string };

function ErrorTable({ rows }: { rows: ErrorRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left font-data-sm text-data-sm">
        <thead>
          <tr className="bg-onyx-surface-high font-label-sm text-label-sm uppercase text-onyx-outline">
            <th className="px-space-sm py-1">HTTP</th>
            <th className="px-space-sm py-1">error</th>
            <th className="px-space-sm py-1">message</th>
            <th className="px-space-sm py-1">Kapan terjadi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.error} className={i % 2 === 0 ? "bg-onyx-surface-low" : "bg-onyx-surface-container"}>
              <td className="px-space-sm py-1 font-semibold text-onyx-secondary">{r.status}</td>
              <td className="px-space-sm py-1 text-onyx-on-surface">{r.error}</td>
              <td className="px-space-sm py-1 text-onyx-on-surface-variant">{r.message ?? "—"}</td>
              <td className="px-space-sm py-1 text-onyx-on-surface-variant">{r.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointCard({
  id,
  method,
  path,
  description,
  tag,
  children,
}: {
  id: string;
  method: Method;
  path: string;
  description: string;
  tag?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-space-md bg-onyx-surface-lowest p-space-lg shadow-sm">
      <div className="flex flex-col gap-space-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-space-sm">
          <MethodBadge method={method} />
          <span className="font-data-lg text-data-lg text-onyx-on-surface">{path}</span>
          {tag && <Chip>{tag}</Chip>}
        </div>
        <span className="font-body-sm text-body-sm text-onyx-outline">{description}</span>
      </div>
      {children}
    </section>
  );
}

type NavItem = { href: string; method: Method | "—"; label: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Memulai",
    items: [
      { href: "#overview", method: "—", label: "Ringkasan & Base URL" },
      { href: "#errors", method: "—", label: "Skema Error" },
    ],
  },
  {
    title: "Market Data",
    items: [
      { href: "#endpoint-instruments", method: "GET", label: "/instruments" },
      { href: "#endpoint-orderbook", method: "GET", label: "/orderbook/{symbol}" },
      { href: "#endpoint-candles", method: "GET", label: "/candles/{symbol}" },
    ],
  },
  {
    title: "Orders",
    items: [
      { href: "#endpoint-create-order", method: "POST", label: "/orders" },
      { href: "#endpoint-cancel-order", method: "DELETE", label: "/orders/{order_id}" },
      { href: "#endpoint-orders-trader", method: "GET", label: "/orders/{trader_id}" },
      { href: "#endpoint-trades", method: "GET", label: "/trades/{symbol}" },
    ],
  },
  {
    title: "Trader",
    items: [{ href: "#endpoint-trader", method: "GET", label: "/traders/{trader_id}" }],
  },
  {
    title: "AI Insight",
    items: [{ href: "#endpoint-ai-insight", method: "POST", label: "/ai/insight" }],
  },
  {
    title: "Engine",
    items: [{ href: "#endpoint-engine-stats", method: "GET", label: "/engine/stats" }],
  },
  {
    title: "WebSocket (/ws)",
    items: [{ href: "#endpoint-ws", method: "WS", label: "/ws" }],
  },
];

const NAV_METHOD_COLOR: Record<Method | "—", string> = {
  GET: "text-onyx-primary",
  POST: "text-onyx-tertiary",
  DELETE: "text-onyx-secondary",
  WS: "text-onyx-primary",
  "—": "text-onyx-outline",
};

export default function ApiDocsPage() {
  return (
    <div className="flex w-full flex-col gap-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-md bg-onyx-surface-lowest p-space-sm shadow-sm">
        <div className="flex flex-wrap items-center gap-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="h-3 w-2 bg-onyx-primary" />
            <span className="font-headline-sm text-headline-sm font-bold uppercase tracking-tight text-onyx-on-surface">
              TradeSim API &amp; Docs Reference
            </span>
          </div>
          <Chip tone="primary">v1.0</Chip>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">
            REST • WebSocket • In-Memory Store
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-space-lg font-data-sm text-data-sm">
          <div className="flex items-center gap-space-xs">
            <span className="text-onyx-on-surface-variant">BASE URL:</span>
            <span className="font-data-md text-data-md text-onyx-primary">http://localhost:8000</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="text-onyx-on-surface-variant">WS:</span>
            <span className="font-data-md text-data-md text-onyx-primary">ws://localhost:8000/ws</span>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="text-onyx-on-surface-variant">AUTH:</span>
            <span className="font-data-md text-data-md text-onyx-outline">Tidak ada</span>
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-space-md xl:grid-cols-12">
        <aside className="hidden flex-col gap-space-xs self-start bg-onyx-surface-lowest p-space-md shadow-sm xl:sticky xl:top-16 xl:col-span-3 xl:flex">
          <div className="flex items-center justify-between bg-onyx-surface-container px-space-sm py-space-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-onyx-outline">Daftar Isi</span>
          </div>
          <nav className="flex flex-col gap-space-md">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="flex flex-col gap-space-xs">
                <span className="px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-onyx-on-surface-variant">
                  {group.title}
                </span>
                {group.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-space-sm px-space-sm py-space-xs text-onyx-on-surface-variant transition-colors hover:bg-onyx-surface-container hover:text-onyx-on-surface"
                  >
                    <span className={`font-label-sm text-label-sm w-9 shrink-0 uppercase ${NAV_METHOD_COLOR[item.method]}`}>
                      {item.method === "—" ? "" : item.method}
                    </span>
                    <span className="truncate font-data-sm text-data-sm">{item.label}</span>
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex flex-col gap-space-md xl:col-span-9">
          {/* ---------------------------------------------------------- */}
          {/* Overview                                                   */}
          {/* ---------------------------------------------------------- */}
          <section id="overview" className="flex flex-col gap-space-md bg-onyx-surface-lowest p-space-lg shadow-sm">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="h-4 w-2 bg-onyx-primary" />
                <span className="font-headline-md text-headline-md font-bold uppercase text-onyx-on-surface">
                  Ringkasan &amp; Quickstart
                </span>
              </div>
              <p className="max-w-3xl font-body-sm text-body-sm text-onyx-on-surface-variant">
                TradeSim backend adalah satu proses FastAPI dengan penyimpanan sepenuhnya in-memory (tidak ada
                database) — lihat <code className="font-data-sm text-data-sm text-onyx-on-surface">backend/main.py</code>,{" "}
                <code className="font-data-sm text-data-sm text-onyx-on-surface">backend/store.py</code>. Semua request
                dan response berformat JSON. Order matching berjalan Price-Time Priority (FIFO per level harga), dan
                setiap perubahan order book / eksekusi trade langsung disiarkan lewat WebSocket ke semua klien yang
                terhubung.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
              <div className="flex flex-col gap-space-xs bg-onyx-surface-container p-space-md">
                <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Base URL</span>
                <span className="font-data-md text-data-md text-onyx-primary">http://localhost:8000</span>
                <span className="font-body-sm text-body-sm text-onyx-on-surface-variant">
                  Dari env <code className="font-data-sm text-data-sm">NEXT_PUBLIC_API_BASE_URL</code>, fallback ke
                  nilai ini — lihat <code className="font-data-sm text-data-sm">frontend/lib/api.ts:1</code>.
                </span>
              </div>
              <div className="flex flex-col gap-space-xs bg-onyx-surface-container p-space-md">
                <span className="font-label-sm text-label-sm uppercase text-onyx-outline">CORS</span>
                <span className="font-data-md text-data-md text-onyx-on-surface">localhost:3000 / 3001 / 3002</span>
                <span className="font-body-sm text-body-sm text-onyx-on-surface-variant">
                  Origin yang diizinkan (<code className="font-data-sm text-data-sm">CORSMiddleware</code>), semua
                  method &amp; header diizinkan.
                </span>
              </div>
              <div className="flex flex-col gap-space-xs bg-onyx-surface-container p-space-md">
                <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Yang Sengaja Tidak Ada</span>
                <span className="font-data-md text-data-md text-onyx-tertiary">Auth, rate limit, pagination</span>
                <span className="font-body-sm text-body-sm text-onyx-on-surface-variant">
                  Tidak ada API key, JWT, subscribe/unsubscribe per simbol, atau limit request — proyek simulasi
                  lokal berskala kecil, bukan gateway produksi.
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-space-xs bg-onyx-surface-container p-space-md">
              <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Contoh cURL — GET /instruments</span>
              <CodeBlock code={`curl http://localhost:8000/instruments`} />
            </div>
          </section>

          {/* ---------------------------------------------------------- */}
          {/* Error envelope                                             */}
          {/* ---------------------------------------------------------- */}
          <section id="errors" className="flex flex-col gap-space-md bg-onyx-surface-lowest p-space-lg shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <span className="font-headline-md text-headline-md font-bold uppercase text-onyx-on-surface">
                Skema Error
              </span>
              <Chip tone="secondary">application/json</Chip>
            </div>
            <p className="max-w-3xl font-body-sm text-body-sm text-onyx-on-surface-variant">
              Semua error terduga (validasi, resource tidak ditemukan, state tidak valid) dikembalikan dalam bentuk
              yang sama, ditangani oleh <code className="font-data-sm text-data-sm">ApiError</code> exception handler
              di <code className="font-data-sm text-data-sm">backend/main.py</code> — bukan wrapper default FastAPI{" "}
              <code className="font-data-sm text-data-sm">{`{"detail": ...}`}</code>.
            </p>
            <CodeBlock label="Bentuk envelope" code={`{\n  "error": string,      // kode error, selalu ada\n  "message"?: string    // opsional, hanya ada untuk sebagian kode\n}`} />
            <ErrorTable
              rows={[
                { status: 400, error: "invalid_quantity", message: "Kuantitas order harus lebih dari 0", when: "POST /orders, quantity ≤ 0" },
                { status: 400, error: "invalid_price", message: "Harga order harus lebih dari 0", when: "POST /orders, price ≤ 0" },
                { status: 400, error: "insufficient_balance", message: "Saldo tidak mencukupi", when: "POST /orders BUY, saldo cash tersedia < price × quantity" },
                { status: 400, error: "insufficient_position", message: "Posisi saham tidak mencukupi untuk dijual", when: "POST /orders SELL, posisi tersedia < quantity" },
                { status: 404, error: "order_not_found", when: "DELETE /orders/{order_id}, order_id tidak dikenal" },
                { status: 409, error: "order_not_cancellable", when: "DELETE /orders/{order_id}, order sudah FILLED atau CANCELLED" },
                { status: 404, error: "trader_not_found", when: "GET /traders/{trader_id}, trader belum pernah membuat order" },
                { status: 404, error: "instrument_not_found", message: "instrument '{symbol}' not found", when: "Simbol tidak ada di 10 instrumen dummy (GET /orderbook, /candles, /trades, POST /orders, POST /ai/insight)" },
                { status: 500, error: "internal_error", when: "Exception tak terduga apa pun (fallback handler global)" },
              ]}
            />
          </section>

          {/* ---------------------------------------------------------- */}
          {/* Market data                                                */}
          {/* ---------------------------------------------------------- */}
          <span className="px-space-xs font-label-md text-label-md uppercase tracking-wider text-onyx-on-surface-variant">
            Market Data
          </span>

          <EndpointCard id="endpoint-instruments" method="GET" path="/instruments" description="List seluruh saham dummy di watchlist">
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Tidak ada path/query parameter. Mengembalikan array 10 instrumen IDX blue-chip yang di-seed di{" "}
              <code className="font-data-sm text-data-sm">backend/store.py</code> (BBCA, BBRI, BMRI, BBNI, TLKM, ASII,
              UNVR, ICBP, ANTM, GOTO), masing-masing dengan harga terakhir dan perubahan persentase real-time.
            </p>
            <CodeBlock
              label="200 OK"
              tone="primary"
              code={`[\n  { "symbol": "BBCA", "name": "Bank Central Asia Tbk", "last_price": 10275, "change_pct": 0.98 },\n  { "symbol": "GOTO", "name": "GoTo Gojek Tokopedia Tbk", "last_price": 87, "change_pct": 3.57 },\n  { "symbol": "TLKM", "name": "Telkom Indonesia Tbk", "last_price": 3955, "change_pct": -0.63 }\n]`}
            />
          </EndpointCard>

          <EndpointCard id="endpoint-orderbook" method="GET" path={`/orderbook/{symbol}`} description="Snapshot order book agregat untuk satu simbol">
            <FieldTable rows={[{ name: "symbol", type: "string (path)", required: true, description: "Kode saham, mis. BBCA" }]} />
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Order individual di sisi BUY/SELL diagregasi per level harga (bukan per-order), diurutkan harga terbaik
              lebih dulu, dan dipotong maksimal <code className="font-data-sm text-data-sm">ORDER_BOOK_DEPTH</code> =
              15 level per sisi.
            </p>
            <CodeBlock
              label="200 OK"
              tone="primary"
              code={`{\n  "symbol": "BBCA",\n  "bids": [\n    { "price": 10250, "quantity": 4200 },\n    { "price": 10225, "quantity": 1800 }\n  ],\n  "asks": [\n    { "price": 10275, "quantity": 3100 },\n    { "price": 10300, "quantity": 900 }\n  ]\n}`}
            />
            <ErrorTable rows={[{ status: 404, error: "instrument_not_found", message: "instrument 'XXXX' not found", when: "Simbol tidak dikenal" }]} />
          </EndpointCard>

          <EndpointCard id="endpoint-candles" method="GET" path={`/candles/{symbol}`} description="Data OHLC + volume historis untuk chart">
            <FieldTable rows={[{ name: "symbol", type: "string (path)", required: true, description: "Kode saham, mis. BBCA" }]} />
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Mengembalikan 90 candle harian (di-generate sebagai random-walk saat startup, lalu bar terakhir
              diperbarui live setiap ada trade tereksekusi). <code className="font-data-sm text-data-sm">time</code>{" "}
              adalah unix timestamp detik, sesuai kebutuhan library chart Lightweight Charts.
            </p>
            <CodeBlock
              label="200 OK — array Candle"
              tone="primary"
              code={`[\n  { "time": 1757980800, "open": 10200, "high": 10310, "low": 10175, "close": 10275, "volume": 2450000 },\n  { "time": 1758067200, "open": 10275, "high": 10320, "low": 10230, "close": 10250, "volume": 1980000 }\n]`}
            />
            <ErrorTable rows={[{ status: 404, error: "instrument_not_found", message: "instrument 'XXXX' not found", when: "Simbol tidak dikenal" }]} />
          </EndpointCard>

          {/* ---------------------------------------------------------- */}
          {/* Orders                                                     */}
          {/* ---------------------------------------------------------- */}
          <span className="px-space-xs font-label-md text-label-md uppercase tracking-wider text-onyx-on-surface-variant">
            Orders
          </span>

          <EndpointCard id="endpoint-create-order" method="POST" path="/orders" description="Submit order baru (limit order) — validasi, matching, dan settlement dalam satu path">
            <FieldTable
              rows={[
                { name: "trader_id", type: "string", required: true, description: "Identitas trader (di-generate & disimpan di localStorage browser, lihat frontend/lib/trader.ts)" },
                { name: "symbol", type: "string", required: true, description: "Kode saham, harus salah satu dari 10 instrumen dummy" },
                { name: "side", type: `"BUY" | "SELL"`, required: true, description: "Arah order" },
                { name: "price", type: "integer", required: true, description: "Harga limit dalam Rupiah, harus > 0" },
                { name: "quantity", type: "integer", required: true, description: "Jumlah lembar saham, harus > 0" },
              ]}
            />
            <CodeBlock
              label="Request body"
              code={`{\n  "trader_id": "guest-83f1a2",\n  "symbol": "BBCA",\n  "side": "BUY",\n  "price": 10250,\n  "quantity": 100\n}`}
            />
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Validasi dijalankan berurutan: quantity {">"} 0 → price {">"} 0 → saldo cash tersedia cukup (BUY) atau
              posisi saham tersedia cukup (SELL) — cash/posisi yang sudah &quot;dikunci&quot; oleh order OPEN/
              PARTIALLY_FILLED milik trader yang sama ikut diperhitungkan supaya tidak bisa double-spend lewat
              beberapa order terbuka sekaligus. Setelah lolos, order langsung dicocokkan oleh matching engine
              (price-time priority, self-match dari trader_id yang sama di-skip), dan trade yang terjadi langsung
              disiarkan ke WebSocket sebelum response ini dikembalikan.
            </p>
            <CodeBlock
              label="200 OK — order langsung FILLED (ada lawan di order book)"
              tone="primary"
              code={`{\n  "order": {\n    "id": "6f3a2b7e-9c41-4d3a-9a2e-9d6b8b7b6d10",\n    "trader_id": "guest-83f1a2",\n    "symbol": "BBCA",\n    "side": "BUY",\n    "price": 10250,\n    "quantity": 100,\n    "remaining_quantity": 0,\n    "status": "FILLED",\n    "created_at": "2026-09-16T09:15:32.482000"\n  },\n  "trades": [\n    {\n      "id": "0c9a5e3d-9f21-4c62-8b8e-1a2b3c4d5e6f",\n      "symbol": "BBCA",\n      "buy_order_id": "6f3a2b7e-9c41-4d3a-9a2e-9d6b8b7b6d10",\n      "sell_order_id": "b1d4f9a0-22e3-4a11-9c30-7fa2e9b6c8d1",\n      "price": 10250,\n      "quantity": 100,\n      "executed_at": "2026-09-16T09:15:32.483000"\n    }\n  ]\n}`}
            />
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Bila tidak ada lawan yang cocok, <code className="font-data-sm text-data-sm">status</code> tetap{" "}
              <code className="font-data-sm text-data-sm">OPEN</code> dan <code className="font-data-sm text-data-sm">trades</code> adalah array kosong{" "}
              <code className="font-data-sm text-data-sm">[]</code>; order resting di book menunggu lawan berikutnya.
            </p>
            <ErrorTable
              rows={[
                { status: 400, error: "invalid_quantity", message: "Kuantitas order harus lebih dari 0", when: "quantity ≤ 0" },
                { status: 400, error: "invalid_price", message: "Harga order harus lebih dari 0", when: "price ≤ 0" },
                { status: 400, error: "insufficient_balance", message: "Saldo tidak mencukupi", when: "side BUY, saldo tersedia < price × quantity" },
                { status: 400, error: "insufficient_position", message: "Posisi saham tidak mencukupi untuk dijual", when: "side SELL, posisi tersedia < quantity" },
                { status: 404, error: "instrument_not_found", message: "instrument 'XXXX' not found", when: "symbol tidak dikenal" },
              ]}
            />
          </EndpointCard>

          <EndpointCard id="endpoint-cancel-order" method="DELETE" path={`/orders/{order_id}`} description="Batalkan order yang masih resting di book">
            <FieldTable rows={[{ name: "order_id", type: "string (path)", required: true, description: "ID order (UUID) yang akan dibatalkan" }]} />
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Hanya order berstatus <code className="font-data-sm text-data-sm">OPEN</code> atau{" "}
              <code className="font-data-sm text-data-sm">PARTIALLY_FILLED</code> yang bisa dibatalkan. Order diberi
              status <code className="font-data-sm text-data-sm">CANCELLED</code>, dikeluarkan dari sisi book-nya, dan
              perubahan book disiarkan ke WebSocket (frame <code className="font-data-sm text-data-sm">orderbook_update</code>{" "}
              — tidak ada frame <code className="font-data-sm text-data-sm">trade_executed</code>/{" "}
              <code className="font-data-sm text-data-sm">price_update</code> untuk cancel, karena tidak ada trade
              yang terjadi).
            </p>
            <CodeBlock
              label="200 OK"
              tone="primary"
              code={`{\n  "order": {\n    "id": "6f3a2b7e-9c41-4d3a-9a2e-9d6b8b7b6d10",\n    "trader_id": "guest-83f1a2",\n    "symbol": "BBCA",\n    "side": "BUY",\n    "price": 10150,\n    "quantity": 100,\n    "remaining_quantity": 100,\n    "status": "CANCELLED",\n    "created_at": "2026-09-16T09:12:01.221000"\n  }\n}`}
            />
            <ErrorTable
              rows={[
                { status: 404, error: "order_not_found", when: "order_id tidak dikenal" },
                { status: 409, error: "order_not_cancellable", when: "order sudah berstatus FILLED atau CANCELLED" },
              ]}
            />
          </EndpointCard>

          <EndpointCard id="endpoint-orders-trader" method="GET" path={`/orders/{trader_id}`} description="List seluruh order milik satu trader (semua status, semua simbol)">
            <FieldTable rows={[{ name: "trader_id", type: "string (path)", required: true, description: "Identitas trader" }]} />
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Tidak pernah 404 — trader_id yang belum pernah dipakai cukup mengembalikan array kosong{" "}
              <code className="font-data-sm text-data-sm">[]</code>.
            </p>
            <CodeBlock
              label="200 OK — array Order"
              tone="primary"
              code={`[\n  {\n    "id": "6f3a2b7e-9c41-4d3a-9a2e-9d6b8b7b6d10",\n    "trader_id": "guest-83f1a2",\n    "symbol": "BBCA",\n    "side": "BUY",\n    "price": 10250,\n    "quantity": 100,\n    "remaining_quantity": 0,\n    "status": "FILLED",\n    "created_at": "2026-09-16T09:15:32.482000"\n  },\n  {\n    "id": "a12e4f90-88c1-4a2d-9b0e-3f6c1d2e4b5a",\n    "trader_id": "guest-83f1a2",\n    "symbol": "GOTO",\n    "side": "SELL",\n    "price": 88,\n    "quantity": 5000,\n    "remaining_quantity": 5000,\n    "status": "OPEN",\n    "created_at": "2026-09-16T09:18:44.009000"\n  }\n]`}
            />
          </EndpointCard>

          <EndpointCard id="endpoint-trades" method="GET" path={`/trades/{symbol}`} description="Riwayat seluruh trade yang tereksekusi untuk satu simbol">
            <FieldTable rows={[{ name: "symbol", type: "string (path)", required: true, description: "Kode saham, mis. BBCA" }]} />
            <CodeBlock
              label="200 OK — array Trade"
              tone="primary"
              code={`[\n  {\n    "id": "0c9a5e3d-9f21-4c62-8b8e-1a2b3c4d5e6f",\n    "symbol": "BBCA",\n    "buy_order_id": "6f3a2b7e-9c41-4d3a-9a2e-9d6b8b7b6d10",\n    "sell_order_id": "b1d4f9a0-22e3-4a11-9c30-7fa2e9b6c8d1",\n    "price": 10250,\n    "quantity": 100,\n    "executed_at": "2026-09-16T09:15:32.483000"\n  }\n]`}
            />
            <ErrorTable rows={[{ status: 404, error: "instrument_not_found", message: "instrument 'XXXX' not found", when: "Simbol tidak dikenal" }]} />
          </EndpointCard>

          {/* ---------------------------------------------------------- */}
          {/* Trader                                                     */}
          {/* ---------------------------------------------------------- */}
          <span className="px-space-xs font-label-md text-label-md uppercase tracking-wider text-onyx-on-surface-variant">
            Trader
          </span>

          <EndpointCard id="endpoint-trader" method="GET" path={`/traders/{trader_id}`} description="Saldo kas & posisi saham satu trader">
            <FieldTable rows={[{ name: "trader_id", type: "string (path)", required: true, description: "Identitas trader" }]} />
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Berbeda dari <code className="font-data-sm text-data-sm">GET /orders/{`{trader_id}`}</code>: endpoint ini{" "}
              <em>tidak</em> auto-membuat trader baru. Trader baru pertama kali dibuat (dengan saldo awal Rp
              100.000.000 dan posisi kosong) hanya sebagai efek samping dari <code className="font-data-sm text-data-sm">POST /orders</code>. Memanggil endpoint ini dengan
              trader_id yang belum pernah bertransaksi akan menghasilkan 404.
            </p>
            <CodeBlock
              label="200 OK"
              tone="primary"
              code={`{\n  "id": "guest-83f1a2",\n  "cash_balance": 98975000,\n  "positions": { "BBCA": 100, "GOTO": 5000 }\n}`}
            />
            <ErrorTable rows={[{ status: 404, error: "trader_not_found", when: "trader_id belum pernah membuat order" }]} />
          </EndpointCard>

          {/* ---------------------------------------------------------- */}
          {/* AI Insight                                                 */}
          {/* ---------------------------------------------------------- */}
          <span className="px-space-xs font-label-md text-label-md uppercase tracking-wider text-onyx-on-surface-variant">
            AI Insight
          </span>

          <EndpointCard id="endpoint-ai-insight" method="POST" path="/ai/insight" description="Analisis naratif singkat atas pola harga, via Gemini dengan fallback rule-based" tag="cache 60s / simbol">
            <FieldTable rows={[{ name: "symbol", type: "string", required: true, description: "Kode saham, harus salah satu dari 10 instrumen dummy" }]} />
            <CodeBlock label="Request body" code={`{ "symbol": "BBCA" }`} />
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Memanggil model Gemini (env <code className="font-data-sm text-data-sm">GEMINI_MODEL</code>, default{" "}
              <code className="font-data-sm text-data-sm">gemini-flash-lite-latest</code>) dengan prompt berisi harga
              terakhir, perubahan %, OHLC hari ini, volume, dan 6 harga penutupan terakhir. Bila{" "}
              <code className="font-data-sm text-data-sm">GEMINI_API_KEY</code> tidak diset, request Gemini gagal,
              atau timeout (8 detik), backend otomatis memakai narasi fallback berbasis template (tidak pernah
              gagal total). Hasil di-cache per simbol selama 60 detik agar klik berulang tidak memboroskan kuota
              gratis.
            </p>
            <CodeBlock
              label="200 OK — source: ai"
              tone="primary"
              code={`{\n  "source": "ai",\n  "insight": "BBCA bergerak menguat tipis 0.98% dari penutupan sebelumnya (10175), didukung akumulasi beli bertahap di kisaran 10225-10250. Volume relatif stabil dibanding rata-rata beberapa hari terakhir, mengindikasikan tekanan jual yang terbatas."\n}`}
            />
            <CodeBlock
              label="200 OK — source: fallback (tanpa API key / Gemini gagal)"
              code={`{\n  "source": "fallback",\n  "insight": "BBCA bergerak naik 0.98% dari penutupan sebelumnya (10175), dengan rentang harga hari ini 10175-10310. Volume tercatat sekitar 2.450.000 lembar, dan harga cenderung menguat dalam beberapa periode terakhir."\n}`}
            />
            <ErrorTable rows={[{ status: 404, error: "instrument_not_found", message: "instrument 'XXXX' not found", when: "symbol tidak dikenal" }]} />
          </EndpointCard>

          {/* ---------------------------------------------------------- */}
          {/* Engine                                                     */}
          {/* ---------------------------------------------------------- */}
          <span className="px-space-xs font-label-md text-label-md uppercase tracking-wider text-onyx-on-surface-variant">
            Engine
          </span>

          <EndpointCard id="endpoint-engine-stats" method="GET" path="/engine/stats" description="Telemetri mesin matching secara real-time — untuk halaman Engine Analytics">
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Tidak ada parameter. Setiap angka dihitung langsung dari isi <code className="font-data-sm text-data-sm">store.orders</code>/
              <code className="font-data-sm text-data-sm">store.trades</code>/<code className="font-data-sm text-data-sm">store.traders</code> atau
              state proses saat request masuk — tidak ada angka latensi simulasi/palsu.
            </p>
            <CodeBlock
              label="200 OK"
              tone="primary"
              code={`{\n  "matching_mode": "Price-Time Priority (FIFO per level)",\n  "self_match_rule": "Skip — order dari trader_id sama tidak saling dieksekusi",\n  "order_book_depth": 15,\n  "uptime_seconds": 5423,\n  "total_orders": 187,\n  "total_trades": 96,\n  "orders_by_status": {\n    "OPEN": 42,\n    "PARTIALLY_FILLED": 5,\n    "FILLED": 96,\n    "CANCELLED": 44\n  },\n  "orders_by_symbol": {\n    "BBCA": 31,\n    "GOTO": 27,\n    "TLKM": 18\n  },\n  "trades_last_60s": 4,\n  "ws_connections": 2,\n  "symbols_tracked": 10,\n  "store_records": 285\n}`}
            />
            <FieldTable
              rows={[
                { name: "matching_mode", type: "string", description: "Deskripsi tetap algoritme matching engine" },
                { name: "self_match_rule", type: "string", description: "Deskripsi tetap kebijakan self-match" },
                { name: "order_book_depth", type: "integer", description: "Cap level per sisi book pada snapshot (=15)" },
                { name: "uptime_seconds", type: "integer", description: "Detik sejak proses backend start" },
                { name: "total_orders", type: "integer", description: "Jumlah seluruh order (semua status) di store" },
                { name: "total_trades", type: "integer", description: "Jumlah seluruh trade tereksekusi di store" },
                { name: "orders_by_status", type: "Record<OrderStatus, integer>", description: "Selalu berisi keempat status, termasuk yang bernilai 0" },
                { name: "orders_by_symbol", type: "Record<string, integer>", description: "Hanya berisi simbol yang pernah punya order" },
                { name: "trades_last_60s", type: "integer", description: "Trade dengan executed_at dalam 60 detik terakhir" },
                { name: "ws_connections", type: "integer", description: "Jumlah koneksi WebSocket aktif saat ini" },
                { name: "symbols_tracked", type: "integer", description: "Jumlah instrumen dummy (=10)" },
                { name: "store_records", type: "integer", description: "total_orders + total_trades + jumlah trader" },
              ]}
            />
          </EndpointCard>

          {/* ---------------------------------------------------------- */}
          {/* WebSocket                                                  */}
          {/* ---------------------------------------------------------- */}
          <span className="px-space-xs font-label-md text-label-md uppercase tracking-wider text-onyx-on-surface-variant">
            WebSocket
          </span>

          <section id="endpoint-ws" className="flex flex-col gap-space-md bg-onyx-surface-lowest p-space-lg shadow-sm">
            <div className="flex flex-col gap-space-sm md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-space-sm">
                <MethodBadge method="WS" />
                <span className="font-data-lg text-data-lg text-onyx-on-surface">/ws</span>
                <Chip>broadcast global, tanpa subscribe</Chip>
              </div>
              <span className="font-body-sm text-body-sm text-onyx-outline">Satu koneksi menerima semua event, untuk semua simbol</span>
            </div>
            <p className="max-w-3xl font-body-sm text-body-sm text-onyx-on-surface-variant">
              Implementasinya adalah <code className="font-data-sm text-data-sm">ConnectionManager</code> yang
              menyiarkan (broadcast) setiap event ke <em>seluruh</em> klien yang sedang terhubung — tidak ada
              bookkeeping subscribe/unsubscribe per simbol maupun channel. Trade-off ini diambil sengaja: di skala
              demo (segelintir klien, 10 simbol), trafik ekstra dari klien menerima update simbol yang tidak sedang
              mereka lihat dapat diabaikan, dan ini menghindari perlunya seluruh protokol subscribe/unsubscribe untuk
              proyek 3-hari. Klien tidak perlu mengirim pesan apa pun setelah connect — server hanya menunggu
              (menahan) koneksi tetap terbuka dan mengabaikan isi pesan masuk apa pun.
            </p>
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
              <div className="flex flex-col gap-space-xs bg-onyx-surface-container p-space-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Frame 1</span>
                  <Chip tone="primary">orderbook_update</Chip>
                </div>
                <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
                  Dikirim setelah order book berubah: order baru masuk, order dibatalkan, atau habis
                  dicocokkan (matched).
                </p>
              </div>
              <div className="flex flex-col gap-space-xs bg-onyx-surface-container p-space-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Frame 2</span>
                  <Chip tone="tertiary">trade_executed</Chip>
                </div>
                <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
                  Satu frame per trade yang terjadi akibat sebuah order (bisa lebih dari satu per order jika
                  order tersebut matched terhadap beberapa lawan sekaligus).
                </p>
              </div>
              <div className="flex flex-col gap-space-xs bg-onyx-surface-container p-space-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase text-onyx-outline">Frame 3</span>
                  <Chip tone="secondary">price_update</Chip>
                </div>
                <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
                  Dikirim sekali setelah satu atau lebih trade terjadi, membawa harga terakhir & perubahan %
                  terbaru untuk simbol tersebut. Tidak dikirim untuk cancel (tidak ada trade).
                </p>
              </div>
            </div>
            <CodeBlock
              label="orderbook_update"
              tone="primary"
              code={`{\n  "type": "orderbook_update",\n  "symbol": "BBCA",\n  "bids": [ { "price": 10250, "quantity": 4200 } ],\n  "asks": [ { "price": 10275, "quantity": 3100 } ]\n}`}
            />
            <CodeBlock
              label="trade_executed"
              code={`{\n  "type": "trade_executed",\n  "symbol": "BBCA",\n  "trade": { "price": 10250, "quantity": 100 }\n}`}
            />
            <CodeBlock
              label="price_update"
              code={`{\n  "type": "price_update",\n  "symbol": "BBCA",\n  "last_price": 10250,\n  "change_pct": 0.98\n}`}
            />
            <p className="font-body-sm text-body-sm text-onyx-on-surface-variant">
              Urutan pengiriman untuk satu <code className="font-data-sm text-data-sm">POST /orders</code> yang
              langsung matched: satu <code className="font-data-sm text-data-sm">orderbook_update</code>, lalu satu{" "}
              <code className="font-data-sm text-data-sm">trade_executed</code> per trade, lalu satu{" "}
              <code className="font-data-sm text-data-sm">price_update</code> penutup (lihat{" "}
              <code className="font-data-sm text-data-sm">broadcast_order_effects</code> di{" "}
              <code className="font-data-sm text-data-sm">backend/main.py</code>). Untuk{" "}
              <code className="font-data-sm text-data-sm">DELETE /orders/{`{order_id}`}</code>, hanya{" "}
              <code className="font-data-sm text-data-sm">orderbook_update</code> yang dikirim.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
