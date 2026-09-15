"use client";

import { useState } from "react";
import { getAiInsight, type AiInsight } from "@/lib/api";

/** POST /ai/insight — single narrative string from Gemini, with a rule-based
 * fallback the backend switches to transparently (FR-14/FR-15). There is no
 * structured multi-signal breakdown on the backend, so this renders exactly
 * what the API returns: one paragraph + its `source`. */
export function AiInsightCard({ symbol }: { symbol: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      setResult(await getAiInsight(symbol));
    } catch {
      setError("Gagal memuat insight AI. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-space-xs bg-onyx-surface-low p-space-sm shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="h-3 w-2 bg-onyx-tertiary" />
          <span className="font-headline-sm text-headline-sm font-bold text-onyx-on-surface">AI Market Insight</span>
          {result && (
            <span
              className={`font-label-sm text-label-sm px-space-xs py-0.5 font-semibold ${
                result.source === "ai" ? "bg-onyx-primary/10 text-onyx-primary" : "bg-onyx-tertiary/10 text-onyx-tertiary"
              }`}
            >
              {result.source === "ai" ? "DIHASILKAN AI" : "FALLBACK RULE-BASED"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-space-xs bg-onyx-surface-high px-space-md py-1 font-body-sm text-body-sm font-bold text-onyx-tertiary transition-colors hover:bg-onyx-surface-bright disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[15px] ${loading ? "animate-spin" : ""}`}>
            {loading ? "refresh" : "auto_awesome"}
          </span>
          <span>{loading ? "Memproses…" : "Analisa dengan AI"}</span>
        </button>
      </div>

      {error && <p className="text-body-sm text-onyx-error">{error}</p>}

      {result && (
        <div className="flex flex-col gap-space-xs bg-onyx-surface-container p-space-sm">
          <p className="text-body-lg leading-snug text-onyx-on-surface">{result.insight}</p>
          <p className="text-body-sm text-onyx-outline">
            Bukan saran investasi — narasi otomatis untuk simulasi, tidak mencerminkan data pasar riil.
          </p>
        </div>
      )}
    </div>
  );
}
