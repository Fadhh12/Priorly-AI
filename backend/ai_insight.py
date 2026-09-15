"""AI Market Insight (FR-13..15, SDD 3.5).

Calls Google Gemini for a short narrative about a stock's price pattern,
with a rule-based fallback that guarantees the demo never breaks just
because the free API quota is gone, the key is missing, or the network
times out. Results are cached per symbol for CACHE_TTL_SECONDS (FR-15) to
avoid burning the free quota on repeated clicks.
"""

import asyncio
import logging
import os
import time

import httpx
from dotenv import load_dotenv

import store

load_dotenv()  # loads backend/.env if present; safe no-op otherwise

logger = logging.getLogger("tradesim.ai_insight")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
REQUEST_TIMEOUT_SECONDS = 8.0
CACHE_TTL_SECONDS = 60

if not GEMINI_API_KEY:
    logger.warning(
        "GEMINI_API_KEY tidak diset — AI Market Insight akan selalu memakai narasi fallback (rule-based), "
        "tidak akan mencoba memanggil Gemini API sama sekali."
    )

# symbol -> {"insight": str, "source": "ai"|"fallback", "expires_at": monotonic time}
_cache: dict[str, dict] = {}
# symbol -> lock, so two concurrent requests for the same symbol before the
# cache is warm don't both call the (rate-limited, free-tier) Gemini API.
_locks: dict[str, asyncio.Lock] = {}


def _trend_description(closes: list[int]) -> str:
    if len(closes) < 2:
        return "data historis masih terbatas"
    ups = sum(1 for a, b in zip(closes, closes[1:]) if b > a)
    downs = sum(1 for a, b in zip(closes, closes[1:]) if b < a)
    if ups > downs:
        return "cenderung menguat dalam beberapa periode terakhir"
    if downs > ups:
        return "cenderung melemah dalam beberapa periode terakhir"
    return "bergerak relatif sideways dalam beberapa periode terakhir"


def _build_fallback(symbol: str) -> str:
    """Pure template string, zero AI — always available, per FR-14."""
    bars = store.get_candles(symbol)
    bar = bars[-1]
    prev_close = store.get_prev_close(symbol)
    change_pct = store.get_change_pct(symbol)
    direction = "naik" if change_pct >= 0 else "turun"
    recent_closes = [c.close for c in bars[-6:]]
    volume_str = f"{bar.volume:,}".replace(",", ".")  # 1,234,567 -> 1.234.567 (format ID)

    return (
        f"{symbol} bergerak {direction} {abs(change_pct)}% dari penutupan sebelumnya "
        f"({prev_close}), dengan rentang harga hari ini {bar.low}-{bar.high}. "
        f"Volume tercatat sekitar {volume_str} lembar, dan harga {_trend_description(recent_closes)}."
    )


def _build_prompt(symbol: str) -> str:
    instrument = store.get_instrument(symbol)
    bars = store.get_candles(symbol)
    bar = bars[-1]
    prev_close = store.get_prev_close(symbol)
    change_pct = store.get_change_pct(symbol)
    recent_closes = [c.close for c in bars[-6:]]

    return (
        "Kamu adalah asisten analisis pasar saham untuk sebuah SIMULASI (bukan penasihat investasi resmi, "
        "dan bukan aplikasi trading sungguhan). Buat ringkasan naratif singkat (2-4 kalimat, bahasa Indonesia) "
        "tentang pola pergerakan harga saham berikut, berdasarkan data ini saja:\n\n"
        f"Simbol: {symbol} ({instrument.name})\n"
        f"Harga terakhir: {store.last_price[symbol]}\n"
        f"Perubahan: {change_pct}% dari penutupan sebelumnya ({prev_close})\n"
        f"Open/High/Low hari ini: {bar.open}/{bar.high}/{bar.low}\n"
        f"Volume hari ini: {bar.volume}\n"
        f"6 harga penutupan terakhir (kronologis): {recent_closes}\n\n"
        "Jangan menyebut ini sebagai saran investasi. Jangan sekadar mengulang angka mentah, "
        "fokus pada pola/narasi pergerakannya."
    )


async def _call_gemini(prompt: str) -> str:
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
        response = await client.post(GEMINI_URL, params={"key": GEMINI_API_KEY}, json=payload)
        response.raise_for_status()
        data = response.json()

    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    if not text:
        raise ValueError("empty response text from Gemini")
    return text


async def get_insight(symbol: str) -> dict:
    """Returns {"source": "ai"|"fallback", "insight": str}. Never raises for
    an AI-side failure — only store.InstrumentNotFoundError propagates (an
    invalid symbol is a caller error, not an AI failure)."""
    store.get_instrument(symbol)  # raises InstrumentNotFoundError -> 404 in main.py

    now = time.monotonic()
    cached = _cache.get(symbol)
    if cached and cached["expires_at"] > now:
        return {"source": cached["source"], "insight": cached["insight"]}

    lock = _locks.setdefault(symbol, asyncio.Lock())
    async with lock:
        # Re-check after acquiring the lock: a concurrent request for the same
        # symbol may have just refreshed the cache while we were waiting.
        now = time.monotonic()
        cached = _cache.get(symbol)
        if cached and cached["expires_at"] > now:
            return {"source": cached["source"], "insight": cached["insight"]}

        if GEMINI_API_KEY:
            try:
                insight = await _call_gemini(_build_prompt(symbol))
                source = "ai"
            except Exception:
                logger.warning("Gemini API gagal untuk simbol %s, pakai fallback", symbol, exc_info=True)
                insight = _build_fallback(symbol)
                source = "fallback"
        else:
            insight = _build_fallback(symbol)
            source = "fallback"

        _cache[symbol] = {"insight": insight, "source": source, "expires_at": now + CACHE_TTL_SECONDS}
        return {"source": source, "insight": insight}
