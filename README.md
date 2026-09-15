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
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3000`, backend di `http://localhost:8000`.

## Roadmap

- [x] Setup struktur proyek (frontend + backend)
- [ ] Models & in-memory store
- [ ] Matching engine + unit test
- [ ] REST API & WebSocket
- [ ] AI Market Insight (Gemini + fallback)
- [ ] Home Page
- [ ] Trading Dashboard
- [ ] Cancel order, polish, testing end-to-end

## Out of Scope (Won't Have)

Diputuskan sadar, bukan kelupaan:

- Autentikasi user sungguhan (login/register) — cukup 1 sesi trader per browser.
- Persistensi ke database sungguhan — semua state in-memory, reset saat server restart.
- Integrasi broker/data pasar asli & kepatuhan regulasi trading nyata.

## Lisensi

MIT — proyek dummy portofolio, bukan produk produksi.
