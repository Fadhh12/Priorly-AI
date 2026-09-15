# TradeSim — Dokumen Proyek (PRD / SRS / SDD / UI-UX / Task Breakdown)

**Project:** End-to-end Order Book & Limit Order Execution Simulator
**Konteks:** Proyek dummy portofolio untuk follow-up interview Junior Software Engineer di ForgeFun
**Tech Stack:** Next.js 14 (App Router, TypeScript) — FastAPI (Python) — WebSocket — Claude Code sebagai AI-assisted dev tool
**Timeline:** 3 hari
**Versi:** 2 (revisi setelah eksplorasi desain — menambahkan Home Page, Design System, dan detail fitur trading terminal)

---

## 1. PRD (Product Requirements Document)

### 1.1 Latar Belakang & Tujuan

ForgeFun bergerak di area produk web dengan fitur-fitur terkait trading, dan tim mereka menggunakan Claude Code sebagai alat bantu development sehari-hari. TradeSim dibangun untuk membuktikan tiga hal sekaligus ke tim ForgeFun:

1. Pemahaman dasar mekanisme trading (order book, limit order, eksekusi transaksi).
2. Kemampuan membangun sistem full-stack (Next.js + FastAPI) dari nol, termasuk kepekaan desain UI/UX kelas produk finansial sungguhan.
3. Cara kerja yang disiplin dengan AI-assisted development (Claude Code) — bukan asal generate, tapi terarah dan dipahami penuh.

Ini **bukan** aplikasi trading sungguhan (tidak menyentuh uang/broker asli). Semua data harga dan saldo adalah simulasi.

### 1.2 Target User (Skenario Demo)

- **Primary:** Tim teknis ForgeFun yang akan menilai proyek ini saat sesi lanjutan/demo.
- **Persona simulasi di dalam produk:** satu "trader" yang bisa memasang limit order, melihat order book real-time, memantau beberapa saham di watchlist, dan melihat riwayat transaksinya sendiri.
- Tidak butuh multi-user/otentikasi kompleks — cukup satu sesi trader per browser (session ID sederhana), karena ini demo, bukan produk produksi.

### 1.3 Struktur Produk: 2 Halaman

| Halaman | Tujuan |
|---|---|
| **Home / Landing** | Perkenalan proyek — apa itu TradeSim, fitur yang ditawarkan, tech stack, dan pintu masuk ke demo. Fungsinya menunjukkan kemampuan presentasi produk, bukan cuma coding. |
| **Trading App (Dashboard)** | Aplikasi inti — watchlist multi-saham, chart candlestick + volume, order book, form Buy/Sell, riwayat order & transaksi. |

### 1.4 Fitur Utama

**Must Have (wajib ada untuk demo):**
- Home page dengan hero section, preview harga live, ticker strip berjalan, feature highlight, tech stack.
- Watchlist multi-saham (minimal 5-7 instrumen dummy) dengan sparkline mini dan persentase naik/turun berwarna, plus search/filter by simbol atau nama.
- Halaman detail saham: harga besar, badge persentase, statistik Open/High/Low/Prev Close/Volume.
- **Candlestick chart** per saham (OHLC) lengkap dengan volume bar di bawahnya, sinkron saat scroll/zoom.
- Live order book (bid/ask) untuk saham aktif, dengan depth bar visual dan spread.
- Tab **Order Book / Recent Trades** untuk melihat kedalaman order atau feed transaksi terbaru.
- Form pasang limit order — **panel Buy dan Sell berdampingan** (bukan toggle satu form), masing-masing dengan quick-select persentase kuantitas (25/50/75/100%) dan kalkulasi Total otomatis.
- Engine pencocokan order (matching engine) sederhana: bid dan ask yang cocok otomatis jadi transaksi.
- Update harga, order book, dan chart secara real-time ke frontend (via WebSocket).
- Riwayat order milik user ("Order Saya") dan riwayat transaksi global (live feed).
- Validasi transaksi: saldo cukup, kuantitas valid, harga valid.

**Value-Add — AI Market Insight (differentiator utama):**
- Tombol "Analisa dengan AI" di panel detail saham yang men-generate ringkasan naratif singkat (2-4 kalimat) tentang pola pergerakan harga saham aktif, berdasarkan data OHLC/volume/persentase yang sedang tampil.
- Memakai **Google Gemini API** (model `gemini-2.5-flash-lite` atau `gemini-3-flash-preview` — masih gratis per free tier AI Studio; Gemini 2.5 Pro sudah berbayar sejak April 2026 jadi tidak dipakai), dengan API key disimpan di backend (tidak pernah di-expose ke frontend).
- Ada fallback naratif berbasis rule (bukan AI) kalau API AI gagal/timeout/kena rate limit — demo tidak pernah "rusak" hanya karena kuota API habis.
- Selalu disertai disclaimer "Analisis dihasilkan AI dari data simulasi, bukan saran investasi" — menunjukkan kepekaan etis yang penting di domain finansial.

**Should Have:**
- Simulasi beberapa "trader bot" lain yang otomatis pasang order acak, supaya order book & trade feed terlihat hidup.
- Cancel order yang belum ter-match.

**Could Have:**
- Dark/light mode toggle (dark tetap default, sesuai konvensi platform trading profesional).
- Lebih dari 7 instrumen dummy.

**Won't Have (di luar scope 3 hari ini — sampaikan eksplisit ke tim ForgeFun sebagai keputusan sadar, bukan kelupaan):**
- Autentikasi user sungguhan (login/register).
- Persistensi data ke database sungguhan (state in-memory, reset saat server restart).
- Integrasi broker/data pasar asli, kepatuhan regulasi trading nyata.

### 1.5 User Flow (High-Level)

```
Buka Home Page
   → Baca perkenalan produk & fitur
   → Klik "Buka demo trading"
Masuk Trading App
   → Lihat watchlist, pilih/cari saham
   → Lihat chart candlestick + detail statistik saham terpilih
   → Isi form Buy atau Sell (harga, kuantitas atau pilih persentase)
   → Submit order
       → Sistem validasi (saldo, qty > 0, dst)
       → Kalau valid: order masuk ke order book
       → Kalau ada match: eksekusi trade otomatis, update saldo & portofolio
   → User lihat update di watchlist, chart, order book, dan riwayat transaksi (semua real-time)
```

---

## 2. SRS (Software Requirements Specification)

### 2.1 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | Sistem harus menampilkan order book (bids & asks) yang ter-update real-time via WebSocket |
| FR-02 | User dapat submit limit order (BUY/SELL) dengan input: harga, kuantitas |
| FR-03 | Sistem harus mencocokkan order baru dengan order lawan di order book (matching engine) berdasarkan price-time priority |
| FR-04 | Setiap match menghasilkan satu atau lebih record transaksi (trade), tersimpan di trade history |
| FR-05 | Sistem harus meng-update saldo kas dan posisi saham trader setelah trade tereksekusi |
| FR-06 | User dapat melihat riwayat transaksinya sendiri dan feed transaksi global |
| FR-07 | User dapat membatalkan order yang masih berstatus OPEN (belum ter-match penuh) |
| FR-08 | Sistem harus mem-broadcast update harga terakhir (last price) setiap ada trade baru |
| FR-09 | User dapat mencari/memfilter watchlist berdasarkan simbol atau nama saham |
| FR-10 | Sistem harus menampilkan data candlestick (OHLC) beserta volume per periode untuk saham yang dipilih |
| FR-11 | User dapat berpindah antara tampilan "Order Book" dan "Recent Trades" pada panel yang sama |
| FR-12 | Form order menyediakan quick-select persentase (25/50/75/100%) yang otomatis menghitung kuantitas berdasarkan saldo/posisi tersedia |
| FR-13 | User dapat memicu (tombol, bukan otomatis) generate analisis naratif AI atas saham aktif, berdasarkan data harga/OHLC/volume terkini |
| FR-14 | Kalau layanan AI gagal/timeout/kena rate limit, sistem menampilkan analisis fallback berbasis rule (bukan AI) — bukan error kosong |
| FR-15 | Hasil analisis AI di-cache per simbol selama minimal 60 detik untuk menghindari spam call ke API gratis (hemat kuota) |

### 2.2 Validasi & Business Rules

| ID | Rule |
|----|------|
| VAL-01 | Kuantitas order harus berupa integer > 0 |
| VAL-02 | Harga order harus > 0, dengan presisi bulat (rupiah, tanpa desimal) — konsisten dengan konvensi harga saham Indonesia |
| VAL-03 | Untuk order BUY: saldo kas trader harus mencukupi (harga × kuantitas), kalau tidak cukup order ditolak dengan pesan error jelas |
| VAL-04 | Untuk order SELL: kuantitas saham yang dijual tidak boleh melebihi posisi yang dimiliki trader (tidak ada short selling) |
| VAL-05 | Order BUY hanya bisa match dengan order SELL yang harganya ≤ harga BUY (begitu juga sebaliknya) |
| VAL-06 | Kalau kuantitas order BUY dan SELL yang match tidak sama persis, sisa kuantitas yang belum ter-match tetap OPEN (partial fill) |
| VAL-07 | Harga eksekusi trade mengikuti harga order yang **sudah ada duluan** di order book (resting order) |
| VAL-08 | Order dengan status FILLED atau CANCELLED tidak bisa diubah/dibatalkan lagi |

### 2.3 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | Update order book & chart ke client harus terasa "real-time" (target < 500ms dari event terjadi ke tampil di UI) |
| NFR-02 | Kode backend harus modular — matching engine terpisah dari layer API/WebSocket |
| NFR-03 | Semua state disimpan in-memory (Python dict/list), tapi struktur data didesain seolah tabel database supaya gampang dipindah nanti |
| NFR-04 | Frontend harus tetap responsif meski order book & watchlist berubah puluhan kali per detik |
| NFR-05 | UI harus mengikuti Design System (lihat SDD 3.2) secara konsisten — bukan styling ad-hoc per komponen |

### 2.4 Error Handling (API)

| Skenario | HTTP Status | Response |
|---|---|---|
| Validasi gagal (VAL-01 s/d VAL-04) | 400 Bad Request | `{ "error": "insufficient_balance", "message": "Saldo tidak mencukupi" }` |
| Order tidak ditemukan (saat cancel) | 404 Not Found | `{ "error": "order_not_found" }` |
| Order sudah FILLED/CANCELLED saat mau di-cancel | 409 Conflict | `{ "error": "order_not_cancellable" }` |
| Trader tidak ditemukan | 404 Not Found | `{ "error": "trader_not_found" }` |
| Error tak terduga di server | 500 Internal Server Error | `{ "error": "internal_error" }` (log detail di server, jangan expose stack trace ke client) |
| AI service gagal/timeout/rate limit (FR-14) | 200 OK (bukan error ke frontend) | `{ "source": "fallback", "insight": "<narasi rule-based>" }` — frontend tetap render normal, cuma beda `source` |

---

## 3. SDD (System Design Document)

### 3.1 Arsitektur Sistem

```
┌──────────────────┐        WebSocket (real-time)       ┌──────────────────────┐
│                   │ ◄─────────────────────────────────► │                      │
│  Next.js (FE)     │        REST API (order submit,       │   FastAPI (BE)       │
│  - Home Page      │        cancel, history, orderbook)   │   - API layer        │
│  - Trading App     │ ─────────────────────────────────►   │   - Matching Engine  │
│    (watchlist,    │                                        │   - Bot Simulator    │
│     chart, order   │                                        │   - In-memory store  │
│     form, book)    │                                        │                      │
└──────────────────┘                                        └──────────────────────┘
```

### 3.2 Design System

**Palet Warna**
| Peran | Hex | Fungsi |
|---|---|---|
| Canvas | `#0B0E14` | Background utama aplikasi |
| Surface | `#12161F` / `#171C27` | Panel, kartu, elemen naik satu level |
| Border | `#232A38` | Hairline divider (bukan shadow) |
| Accent (brand) | `#D4A72C` | Dipakai HEMAT — CTA utama, highlight harga terakhir, brand mark. Bukan warna Buy/Sell. |
| Teks utama | `#EEF0F4` | |
| Teks sekunder | `#8891A3` | Label, metrik pendukung |
| Teks muted | `#565F72` | Placeholder, metadata |
| Gain / Buy | `#26C281` | Data & tombol Buy — konvensi non-negotiable |
| Loss / Sell | `#F0555A` | Data & tombol Sell — konvensi non-negotiable |

**Tipografi**
- **Sora** — font utama UI (heading, label, body). Dipilih karena berkarakter modern-teknis tanpa terasa generik (bukan Inter/Poppins default).
- **IBM Plex Mono** — WAJIB untuk semua angka finansial (harga, kuantitas, persentase, volume) agar digit sejajar (tabular figures) dan mudah dipindai cepat — ini konvensi nyata di platform trading profesional (Bloomberg, TradingView), bukan sekadar gaya.

**Layout & Komponen**
- Panel flat dengan hairline border 1px — tanpa drop shadow lembut ala kartu SaaS generik.
- Border radius kecil-menengah (6-8px) — cukup lembut untuk terasa modern, tidak setajam terminal Bloomberg klasik, tidak sebulat kartu konsumer.
- Warna hijau/merah HANYA dipakai untuk data dan aksi Buy/Sell — tidak untuk dekorasi/branding.
- Density tinggi di dashboard (banyak informasi terlihat sekaligus); Home page lebih lega/bernapas karena tujuannya presentasi, bukan monitoring.
- Motion terbatas: flash halus saat harga berubah, transisi hover ringan — tidak ada animasi dekoratif berlebihan.

### 3.3 Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router), TypeScript | Sesuai JD ForgeFun persis |
| Chart | TradingView Lightweight Charts (open-source, via npm) | Real candlestick + volume, ringan, dipakai luas di industri |
| Realtime client | Native WebSocket API | Tidak perlu library tambahan |
| Backend | FastAPI (Python) | Async native, built-in WebSocket support |
| State/storage | In-memory Python (dict/list) | NFR-03 |
| Generative AI | Google Gemini API (`gemini-2.5-flash-lite` / `gemini-3-flash-preview`) | Masih gratis per free tier AI Studio; fallback ke Groq API (Llama, gratis 30rpm/1000hari) kalau kuota Gemini bermasalah |
| Dev tool | Claude Code | Sesuai requirement JD |

### 3.4 Data Model

**Order**
```
id: string (UUID)
trader_id: string
symbol: string
side: "BUY" | "SELL"
price: int
quantity: int
remaining_quantity: int
status: "OPEN" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED"
created_at: datetime
```

**Trade**
```
id: string (UUID)
symbol: string
buy_order_id: string
sell_order_id: string
price: int
quantity: int
executed_at: datetime
```

**Trader**
```
id: string
cash_balance: int
positions: { [symbol: string]: int }   # qty lembar saham per simbol
```

**Instrument** (data statis untuk watchlist)
```
symbol: string
name: string
```

### 3.5 API Contract

**REST**
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/instruments` | List semua saham dummy di watchlist |
| GET | `/orderbook/{symbol}` | Snapshot order book untuk 1 simbol |
| GET | `/candles/{symbol}` | Data OHLC + volume untuk chart |
| POST | `/orders` | Submit order baru `{ trader_id, symbol, side, price, quantity }` |
| DELETE | `/orders/{order_id}` | Cancel order |
| GET | `/orders/{trader_id}` | List order milik trader |
| GET | `/trades/{symbol}` | Riwayat trade untuk 1 simbol |
| GET | `/traders/{trader_id}` | Info saldo & posisi trader |
| POST | `/ai/insight` | Generate analisis naratif AI `{ symbol }` → `{ source: "ai"\|"fallback", insight: string }` |

**WebSocket** — endpoint `/ws`
```json
{ "type": "orderbook_update", "symbol": "BBCA", "bids": [...], "asks": [...] }
{ "type": "trade_executed", "symbol": "BBCA", "trade": { "price": 10250, "quantity": 5 } }
{ "type": "price_update", "symbol": "BBCA", "last_price": 10250, "change_pct": 1.2 }
```

### 3.6 Struktur Folder

```
tradesim/
  frontend/
    app/
      page.tsx                  -> Home page
      trading/
        page.tsx                -> Trading App (dashboard)
      layout.tsx
    components/
      home/
        Hero.tsx
        TickerStrip.tsx
        FeatureGrid.tsx
      trading/
        Watchlist.tsx            -> termasuk search + sparkline
        StockDetailHeader.tsx    -> harga besar + stat Open/High/Low/dst
        CandleChart.tsx          -> chart + volume (Lightweight Charts)
        OrderBookPanel.tsx       -> tab Order Book / Recent Trades
        OrderForm.tsx            -> panel Buy & Sell berdampingan
        MyOrders.tsx
        TradeHistory.tsx
        AIInsightCard.tsx        -> tombol "Analisa dengan AI" + hasil narasi + disclaimer
    lib/
      api.ts
      useWebSocket.ts
      designTokens.ts            -> export warna/spacing sesuai Design System
  backend/
    main.py
    matching_engine.py
    models.py
    store.py
    bot_simulator.py
    ai_insight.py                -> panggil Gemini API + logic fallback rule-based + cache 60 detik
    .env.example                 -> GEMINI_API_KEY=... (jangan pernah commit .env asli)
    tests/
      test_matching_engine.py
```

---

## 4. UI/UX Flow

### 4.1 Home Page

```
┌─────────────────────────────────────────────────────────┐
│ Nav: Logo | Fitur, Teknologi, Tentang | [Buka demo]       │
├─────────────────────────────┬─────────────────────────────┤
│ Hero copy + 2 CTA            │ Card: harga live + mini      │
│                               │ chart + Top Gainers          │
├─────────────────────────────┴─────────────────────────────┤
│ Ticker strip berjalan (harga beberapa saham)                │
├───────────────────────────────────────────────────────────┤
│ Feature grid (4 kartu: order book, matching engine,          │
│ validasi, chart)                                             │
├───────────────────────────────────────────────────────────┤
│ Tech stack strip                                              │
└───────────────────────────────────────────────────────────┘
```
Flow: user baca hero → klik "Buka demo trading" → masuk Trading App.

### 4.2 Trading App

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Logo TradeSim | Kembali ke Home                        │
├───────────┬─────────────────────────────────┬─────────────────┤
│ Watchlist │ Detail saham (simbol, harga,      │ Form Buy | Sell  │
│ + search  │ badge %, Open/High/Low/Prev/Vol)  │ berdampingan,    │
│ (klik →   │                                    │ quick % kuantitas│
│ ganti      │ Candlestick chart + volume bar     │                  │
│ saham      │                                    │ Tab: Order Book  │
│ aktif)     ├─────────────────────────────────┤ / Recent Trades  │
│            │ [Analisa dengan AI] → kartu narasi │                  │
│            │ AI Market Insight + disclaimer     │                  │
│            │                                    │                  │
│            │ Order Saya | Riwayat Transaksi     │                  │
└───────────┴─────────────────────────────────┴─────────────────┘
```

**Flow interaksi:**
1. User buka Trading App → fetch snapshot awal (`GET /instruments`, `GET /orderbook/{symbol}`, `GET /candles/{symbol}`) → konek WebSocket.
2. User cari/klik saham di watchlist → detail, chart, order book, dan form ikut update ke simbol tersebut.
3. User isi form Buy atau Sell (manual atau pakai quick-select persen) → submit.
4. Validasi gagal → pesan error spesifik tampil dekat field terkait (bukan alert generik).
5. Order match → watchlist, chart, order book, saldo, dan trade history ter-update otomatis via WebSocket.
6. User bisa switch tab "Order Book" ↔ "Recent Trades" tanpa reload apapun.
7. User klik tombol "Analisa dengan AI" → tombol berubah jadi loading state singkat → tampil kartu narasi 2-4 kalimat + label kecil ("Dihasilkan AI" atau "Fallback" kalau API AI gagal) + disclaimer bahwa ini bukan saran investasi.

**Prinsip UX:** setiap aksi user harus ada feedback visual jelas (loading/sukses/error); warna hijau/merah konsisten di semua tempat (watchlist, chart, order book, badge) — tidak ada penyimpangan makna warna di satu bagian pun.

---

## 5. Task Breakdown (3 Hari)

### Hari 1 — Fondasi Backend & Matching Engine
- [ ] Setup folder `frontend/` (Next.js + TS) dan `backend/` (FastAPI)
- [ ] Definisikan models (`Order`, `Trade`, `Trader`, `Instrument`)
- [ ] Bangun `store.py` (in-memory data store, termasuk data dummy 7 instrumen)
- [ ] Bangun `matching_engine.py` — price-time priority matching (VAL-05, VAL-06, VAL-07)
- [ ] Unit test matching engine (`tests/test_matching_engine.py`)
- [ ] Endpoint REST: `GET /instruments`, `POST /orders`, `GET /orderbook/{symbol}`, `GET /candles/{symbol}`
- [ ] Endpoint generator candle OHLC dummy per instrumen (random walk, disimpan di store)

### Hari 2 — Real-time Layer & Komponen Inti Frontend
- [ ] WebSocket endpoint `/ws` + broadcast manager per simbol
- [ ] `bot_simulator.py` — order acak berkala per simbol
- [ ] Setup design tokens (`lib/designTokens.ts`) sesuai SDD 3.2
- [ ] Komponen `Watchlist.tsx` (search + sparkline + list, klik ganti simbol aktif)
- [ ] Komponen `StockDetailHeader.tsx` + `CandleChart.tsx` (integrasi Lightweight Charts + volume)
- [ ] Komponen `OrderBookPanel.tsx` (tab Order Book/Recent Trades)
- [ ] Komponen `OrderForm.tsx` (panel Buy/Sell berdampingan + quick % + validasi error inline)
- [ ] `useWebSocket.ts` custom hook, integrasi ke semua komponen di atas
- [ ] Daftarkan API key Gemini gratis di Google AI Studio, simpan di `.env` backend (JANGAN commit ke Git)
- [ ] Bangun `ai_insight.py`: fungsi build prompt dari data saham → call Gemini API → parse respons; termasuk cache in-memory per simbol (60 detik) dan try/except fallback ke narasi rule-based kalau API gagal/timeout
- [ ] Endpoint `POST /ai/insight` + unit test untuk fallback path (simulasikan API gagal, pastikan tetap return 200 dengan narasi rule-based)

### Hari 3 — Home Page, Polish, Testing, Demo Prep
- [ ] Bangun Home Page (`Hero.tsx`, `TickerStrip.tsx`, `FeatureGrid.tsx`)
- [ ] Cancel order (FR-07) + endpoint `DELETE /orders/{id}`
- [ ] `MyOrders.tsx` + `TradeHistory.tsx` + saldo/posisi trader
- [ ] `AIInsightCard.tsx` — tombol trigger, loading state, tampilan narasi + label sumber (AI/Fallback) + disclaimer
- [ ] Terapkan error handling API (2.4) secara konsisten
- [ ] Testing end-to-end: submit order dari 2 sisi sampai match, cek semua UI ter-update
- [ ] Tulis README (arsitektur, cara run, keputusan desain, bagian "Out of Scope")
- [ ] Siapkan skrip demo: urutan langkah ditunjukkan ke tim ForgeFun + poin yang mau dijelaskan tiap langkah

---

## 6. Catatan untuk Sesi Coding Bersama Claude Code

Lihat file terpisah **`tradesim-claude-code-prompt.md`** untuk prompt bertahap siap pakai per modul, mengikuti pola: rencana → implementasi → identifikasi edge case → refactor, supaya kamu tetap paham dan bisa jelasin tiap bagian saat demo ke tim ForgeFun.
