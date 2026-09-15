<h1 align="center">TradeSim</h1>
<p align="center">Order book &amp; limit order matching engine simulator — Next.js 14 + FastAPI + WebSocket.</p>

<p align="center">
  <img alt="status" src="https://img.shields.io/badge/status-in%20development-D4A72C" />
  <img alt="stack" src="https://img.shields.io/badge/stack-Next.js%2014%20%7C%20FastAPI-12161F" />
  <img alt="license" src="https://img.shields.io/badge/license-MIT-232A38" />
</p>

---

> **Status:** proyek sedang dibangun bertahap. Bagian ini akan diperbarui setiap fase selesai.
> Dokumen perencanaan lengkap (PRD/SRS/SDD/UI-UX/Task Breakdown) ada di [`docs/dokumen-proyek.md`](docs/dokumen-proyek.md).

## Tentang Proyek

TradeSim adalah simulator order book & limit order execution — **bukan aplikasi trading sungguhan** (tidak menyentuh uang/broker asli, semua data harga & saldo simulasi). Dibangun untuk mendemonstrasikan:

1. Pemahaman mekanisme trading (order book, limit order, matching engine).
2. Kemampuan membangun sistem full-stack (Next.js + FastAPI) dengan kepekaan desain UI/UX kelas produk finansial.
3. Cara kerja disiplin dengan AI-assisted development (Claude Code).

## Struktur Folder

```
Priorly-AI/
  frontend/     Next.js 14 (App Router, TypeScript)
  backend/      FastAPI (Python)
  docs/         Dokumen perencanaan (PRD/SRS/SDD/UI-UX)
```

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind (utility only) |
| Chart | TradingView Lightweight Charts |
| Realtime | Native WebSocket |
| Backend | FastAPI (Python), in-memory store |
| Generative AI | Google Gemini API, fallback rule-based |
| Dev tool | Claude Code |

## Cara Menjalankan (development)

### Backend
```bash
cd backend
python -m venv venv        # gunakan Python 3.11-3.13 (belum semua paket punya wheel untuk 3.14)
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
pytest                       # jalankan unit test matching engine
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3000`, backend di `http://localhost:8000`. Begitu backend jalan, 5 "trader bot" otomatis mulai pasang order acak tiap 1-3 detik (lihat `backend/bot_simulator.py`) supaya order book, chart, dan trade feed langsung terlihat hidup tanpa perlu trader sungguhan.

### API Singkat

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/instruments` | List 10 saham + harga terakhir & %perubahan |
| GET | `/orderbook/{symbol}` | Snapshot bid/ask teragregasi per level harga |
| GET | `/candles/{symbol}` | Data OHLC + volume untuk chart |
| POST | `/orders` | Submit order BUY/SELL |
| DELETE | `/orders/{id}` | Cancel order yang masih OPEN/PARTIALLY_FILLED |
| GET | `/orders/{trader_id}` | Riwayat order milik trader |
| GET | `/trades/{symbol}` | Riwayat transaksi 1 simbol |
| GET | `/traders/{trader_id}` | Saldo & posisi trader |
| WS | `/ws` | Broadcast global: `orderbook_update`, `trade_executed`, `price_update` |

## Roadmap

- [x] Setup struktur proyek (frontend + backend)
- [x] Models & in-memory store
- [x] Matching engine + unit test
- [x] REST API & WebSocket + bot simulator
- [ ] AI Market Insight (Gemini + fallback)
- [ ] Home Page
- [ ] Trading Dashboard
- [ ] Cancel order, polish, testing end-to-end

## Out of Scope (Won't Have)

Diputuskan sadar, bukan kelupaan:

- Autentikasi user sungguhan (login/register) — cukup 1 sesi trader per browser.
- Persistensi ke database sungguhan — semua state in-memory, reset saat server restart.
- Feed harga real-time dari bursa asli (IDX) — data live resmi hanya tersedia lewat vendor berbayar/lisensi (RTI, Stockbit, dll), di luar anggaran proyek dummy ini. Base price 10 saham memakai perkiraan level harga IDX riil sebagai titik awal yang realistis, tapi pergerakan selanjutnya tetap simulasi random-walk — bukan feed live, dan tidak ada dependency ke API eksternal (selalu bisa jalan tanpa koneksi ke bursa).
- Integrasi broker/data pasar asli & kepatuhan regulasi trading nyata.

## Lisensi

MIT — proyek dummy portofolio, bukan produk produksi.
