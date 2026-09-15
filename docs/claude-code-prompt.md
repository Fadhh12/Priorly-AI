# TradeSim — Prompt Siap Pakai untuk Claude Code

Panduan ini berisi prompt bertahap per modul, mengikuti urutan Task Breakdown di `tradesim-dokumen-proyek.md`. Jalankan berurutan — jangan lompat ke modul berikutnya sebelum modul sebelumnya selesai & kamu paham isinya. Untuk tiap modul, pola yang dipakai selalu: **rencana → implementasi → identifikasi edge case → refactor**.

Sebelum mulai: lampirkan file `tradesim-dokumen-proyek.md` ke context Claude Code (atau paste isinya di awal sesi) supaya semua keputusan PRD/SRS/SDD sudah diketahui, tidak perlu diulang-ulang di tiap prompt.

---

## Setup Awal

```
Saya akan membangun proyek bernama TradeSim — order book & limit order simulator — sesuai dokumen yang saya lampirkan (PRD/SRS/SDD/UI-UX/Task Breakdown).

Tolong buatkan dulu struktur folder kosong sesuai bagian 3.6 (Struktur Folder) di dokumen: folder frontend/ (Next.js 14 App Router + TypeScript) dan backend/ (FastAPI). Untuk frontend, inisialisasi dengan create-next-app (App Router, TypeScript, Tailwind boleh dipakai untuk utility spacing tapi styling warna/komponen custom tetap mengikuti Design System di dokumen, bukan default Tailwind). Untuk backend, siapkan virtual environment Python + requirements.txt (fastapi, uvicorn, websockets, python-dotenv, google-generativeai atau httpx untuk call Gemini API).

Jangan install semua dependency sekaligus tanpa saya cek dulu — tunjukkan requirements.txt dan package.json yang diusulkan sebelum run install.
```

---

## Modul 1 — Models & Store (Backend)

**Tahap 1 — rencana:**
```
Berdasarkan bagian 3.4 (Data Model) di dokumen, outline dulu struktur file models.py (pakai Pydantic) untuk Order, Trade, Trader, dan Instrument — termasuk enum untuk status order dan side. Jangan tulis implementasi penuh dulu, saya mau cek dulu apakah field-nya sudah lengkap sesuai SRS.
```

**Tahap 2 — implementasi:**
```
Lanjutkan implementasi models.py berdasarkan outline tadi. Setelah itu buat store.py — in-memory store berupa dict untuk orders, trades, traders, dan list instruments (isi 7 saham dummy: BBCA, TLKM, GOTO, ANTM, BMRI, ASII, ICBP, sesuai contoh di dokumen). Sertakan fungsi generate candle OHLC dummy (random walk) per instrumen untuk kebutuhan chart.
```

**Tahap 3 — edge case:**
```
Identifikasi edge case di store.py — misalnya apa yang terjadi kalau instrument yang diminta tidak ada di store, atau trader_id belum terdaftar. Jelaskan dulu, jangan langsung perbaiki.
```

**Tahap 4 — refactor:**
```
Perbaiki berdasarkan edge case tadi — tambahkan trader default (saldo awal & posisi 0) kalau trader_id belum ada, dan return error yang jelas (bukan exception mentah) kalau instrument tidak ditemukan.
```

---

## Modul 2 — Matching Engine (Backend, paling krusial)

**Tahap 1 — rencana:**
```
Sekarang bangun matching_engine.py — logic murni tanpa dependency ke FastAPI, supaya gampang di-unit-test terpisah. Sebelum coding, outline dulu algoritma matching berdasarkan VAL-05 sampai VAL-07 di dokumen (price-time priority, partial fill, harga eksekusi ikut resting order). Jangan tulis kode dulu.
```

**Tahap 2 — implementasi:**
```
Lanjutkan implementasi matching_engine.py berdasarkan outline tadi. Fungsi utamanya menerima order baru + order book existing, dan mengembalikan: order book yang sudah ter-update, serta list trade yang tereksekusi (bisa lebih dari satu kalau satu order match dengan beberapa order lawan sekaligus).
```

**Tahap 3 — edge case:**
```
Identifikasi edge case: order book kosong di salah satu sisi, order baru langsung match penuh vs partial, order dengan kuantitas sangat besar yang match beberapa order lawan sekaligus, dan self-match (trader yang sama match dengan ordernya sendiri — apakah perlu dicegah?). Jelaskan risikonya dulu.
```

**Tahap 4 — refactor:**
```
Perbaiki kode untuk menangani edge case tadi.
```

**Tahap 5 — unit test (WAJIB, ini yang paling penting ditunjukkan ke interviewer):**
```
Buatkan unit test lengkap di tests/test_matching_engine.py mencakup: exact match, partial fill, tidak ada match sama sekali (order tetap OPEN), dan beberapa order match berurutan sesuai price-time priority. Gunakan pytest.
```

---

## Modul 3 — REST API & WebSocket (Backend)

**Tahap 1 — rencana:**
```
Outline dulu struktur main.py: endpoint REST apa saja (sesuai SDD 3.5) yang akan memanggil store.py dan matching_engine.py, plus bagaimana struktur WebSocket connection manager untuk broadcast per simbol (supaya client yang subscribe simbol A tidak ikut menerima update simbol B secara tidak perlu — atau putuskan semua broadcast global kalau itu lebih simple untuk skala demo ini, jelaskan trade-off-nya ke saya).
```

**Tahap 2 — implementasi:**
```
Implementasikan main.py berdasarkan outline tadi: semua endpoint REST, endpoint WebSocket /ws, dan pastikan setiap kali ada trade tereksekusi dari matching engine, event di-broadcast ke semua client yang terkoneksi sesuai format di SDD 3.5.
```

**Tahap 3 — edge case:**
```
Identifikasi edge case: client WebSocket disconnect tiba-tiba (apakah server crash atau handle graceful?), request order dengan trader_id yang belum pernah ada, dan concurrent request (dua order masuk hampir bersamaan — apakah in-memory store ini thread-safe/async-safe)?
```

**Tahap 4 — refactor:**
```
Perbaiki kode untuk menangani edge case tadi, terutama pastikan disconnect WebSocket di-handle graceful (dihapus dari connection manager, tidak bikin server error).
```

---

## Modul 4 — AI Market Insight (Backend) — Value-Add Feature

**Tahap 1 — rencana:**
```
Saya mau tambahkan fitur "AI Market Insight" sesuai FR-13 s/d FR-15 dan SDD 3.5 di dokumen: endpoint POST /ai/insight yang generate narasi singkat (2-4 kalimat) tentang pola pergerakan harga saham, pakai Google Gemini API (model gemini-2.5-flash-lite, API key dari .env, JANGAN pernah hardcode).

Sebelum coding, outline dulu: 1) bagaimana bentuk prompt yang dikirim ke Gemini (data apa saja yang disertakan: harga, change%, open/high/low/prev close, tren beberapa candle terakhir), 2) bagaimana struktur cache in-memory per simbol (60 detik) supaya tidak boros kuota API gratis, 3) bagaimana fallback rule-based bekerja kalau API gagal. Jangan tulis kode dulu.
```

**Tahap 2 — implementasi:**
```
Lanjutkan implementasi ai_insight.py berdasarkan outline tadi. Untuk fallback rule-based, buat fungsi yang menyusun kalimat sederhana dari data (contoh: "{symbol} bergerak {naik/turun} {change_pct}% dari penutupan sebelumnya, dengan rentang harga {low}-{high} hari ini.") — tanpa AI sama sekali, murni template string, supaya selalu bisa jalan walau API AI down total.

Tambahkan endpoint POST /ai/insight di main.py yang memanggil ai_insight.py.
```

**Tahap 3 — edge case:**
```
Identifikasi edge case: API key tidak ter-set di .env (apakah aplikasi crash saat startup atau baru error saat endpoint dipanggil?), Gemini API mengembalikan response yang tidak terduga (kosong, format aneh), dan request bersamaan untuk simbol yang sama sebelum cache 60 detik selesai (apakah akan double call ke API?). Jelaskan risikonya dulu.
```

**Tahap 4 — refactor:**
```
Perbaiki berdasarkan edge case tadi. Pastikan kalau API key tidak ter-set, sistem langsung selalu pakai fallback (tidak coba-coba call API dan gagal berulang), dan log peringatan yang jelas di console (bukan silent fail).
```

**Tahap 5 — test manual:**
```
Tolong buatkan skenario test manual singkat (bukan pytest, cukup langkah manual) untuk saya coba: 1) endpoint jalan normal dengan API key valid, 2) endpoint dengan API key sengaja salah/dikosongkan (harus fallback), 3) panggil endpoint yang sama 2x berturut-turut dalam 60 detik (harus dapat hasil dari cache, bukan call API lagi).
```

---

## Modul 5 — Frontend: Design Tokens & Layout Dasar

**Tahap 1 — rencana:**
```
Berdasarkan Design System di SDD 3.2 (palet warna, tipografi Sora + IBM Plex Mono, radius, prinsip layout), outline dulu isi file lib/designTokens.ts — export konstanta warna, font, dan spacing yang akan dipakai konsisten di semua komponen. Jangan bangun komponen UI dulu.
```

**Tahap 2 — implementasi:**
```
Implementasikan designTokens.ts, lalu setup app/layout.tsx dengan font Sora & IBM Plex Mono (via next/font/google), dan global CSS dasar (background canvas, warna teks default) sesuai token tadi.
```

---

## Modul 6 — Frontend: Halaman Trading App

Untuk tiap komponen di bawah, pola prompt sama: **tunjukkan referensi mockup HTML yang sudah ada** (`tradesim-app.html`) ke Claude Code sebagai acuan visual persis, lalu minta diterjemahkan ke komponen React/TSX modular sesuai struktur folder di SDD 3.6.

**Prompt umum per komponen (ulangi untuk Watchlist, StockDetailHeader, CandleChart, OrderBookPanel, OrderForm, MyOrders, TradeHistory):**
```
Ini file referensi visual (tradesim-app.html) untuk bagian [nama komponen]. Tolong outline dulu: props apa saja yang dibutuhkan komponen ini, state apa yang dikelola sendiri vs yang diterima dari parent/WebSocket, dan bagaimana strukturnya dipecah jadi sub-komponen kalau perlu. Jangan tulis kode dulu.
```
```
Lanjutkan implementasi [NamaKomponen].tsx berdasarkan outline tadi, styling mengikuti designTokens.ts (bukan hardcode hex/warna baru), dan sesuaikan visual semirip mungkin dengan referensi HTML tapi dalam bentuk komponen React yang reusable.
```
```
Identifikasi edge case di komponen ini — misalnya data kosong/belum ter-load dari API, error saat fetch, atau props yang tidak lengkap. Jelaskan dulu.
```
```
Perbaiki berdasarkan edge case tadi — tambahkan loading state dan empty state yang sesuai.
```

**Khusus untuk CandleChart.tsx, tambahkan prompt ini di awal:**
```
Komponen ini pakai library TradingView Lightweight Charts (npm: lightweight-charts). Tolong pastikan chart candlestick dan volume histogram di bawahnya sinkron saat di-scroll/zoom (subscribeVisibleLogicalRangeChange di kedua chart saling update satu sama lain), sesuai referensi HTML yang saya lampirkan.
```

**Khusus untuk AIInsightCard.tsx:**
```
Komponen ini punya tombol "Analisa dengan AI" yang memanggil POST /ai/insight di backend. Tampilkan loading state singkat saat menunggu, lalu tampilkan hasil narasi + label kecil sumber ("Dihasilkan AI" kalau source: "ai", atau "Analisis otomatis" kalau source: "fallback" — jangan tampilkan kata "fallback" mentah ke user, itu istilah internal) + disclaimer "Bukan saran investasi, dihasilkan dari data simulasi" di bawahnya.
```

**Terakhir, integrasi WebSocket:**
```
Buat lib/useWebSocket.ts — custom hook yang konek ke /ws backend, subscribe event orderbook_update/trade_executed/price_update, dan expose state yang bisa dipakai semua komponen di atas. Setelah itu, integrasikan hook ini ke Watchlist, StockDetailHeader, CandleChart, dan OrderBookPanel supaya semuanya ter-update real-time tanpa refresh.
```

---

## Modul 7 — Frontend: Home Page

```
Ini file referensi visual (tradesim-home.html). Tolong pecah jadi komponen Hero.tsx, TickerStrip.tsx, dan FeatureGrid.tsx di folder components/home/, styling mengikuti designTokens.ts yang sama dengan Trading App (supaya konsisten satu Design System), dan pastikan tombol "Buka demo trading" mengarah ke route /trading (App Router).
```

---

## Modul 8 — Cancel Order, Testing End-to-End, README

```
Implementasikan fitur cancel order (FR-07): endpoint DELETE /orders/{id} di backend (return 404/409 sesuai tabel error handling di dokumen), dan tombol cancel di komponen MyOrders.tsx yang memanggilnya.
```
```
Tolong buatkan README.md untuk proyek ini mencakup: cara menjalankan (frontend & backend terpisah), arsitektur singkat, keputusan desain penting (kenapa in-memory bukan database, kenapa AI insight ada fallback, dll — ambil dari dokumen), dan bagian "Out of Scope" yang menyebutkan eksplisit apa yang sengaja tidak dibangun (auth, database sungguhan, broker asli) beserta alasannya.
```

---

## Catatan Penting Saat Pakai Prompt Ini

- **Jangan skip tahap edge case.** Ini yang paling sering dinilai saat sesi AI-assisted coding di interview — tunjukkan kamu selalu mikir "apa yang bisa salah" sebelum lanjut, bukan cuma terima kode jadi.
- **Selalu baca hasil implementasi sebelum lanjut ke tahap berikutnya.** Kalau ada bagian yang kamu sendiri tidak paham, tanya balik ke Claude Code: *"jelaskan bagian [X] ini kenapa ditulis begini"* — sebelum lanjut.
- Simpan `GEMINI_API_KEY` di file `.env` lokal, dan pastikan `.env` masuk `.gitignore` sebelum push ke GitHub manapun.
