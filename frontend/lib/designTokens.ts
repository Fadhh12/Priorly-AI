/**
 * Design System tokens (SDD 3.2). Single source of truth for color,
 * typography, and radius — components import from here instead of
 * hardcoding hex values, and tailwind.config.ts re-exports the same
 * colors as utility classes.
 */

export const colors = {
  /** Background utama aplikasi */
  canvas: "#F8FAFC",
  /** Panel, kartu, elemen naik satu level */
  surface: "#FFFFFF",
  /** Naik dua level dari canvas (tint abu-abu lembut untuk hover/alt row) */
  surfaceRaised: "#F1F5F9",
  /** Hairline divider 1px — bukan shadow */
  line: "#E2E8F0",
  /** Brand — CTA utama, highlight, dan warna naik/Buy (identik, gaya Stockbit). */
  accent: "#00AB6B",
  /** Teks utama */
  ink: "#0F172A",
  /** Label, metrik pendukung */
  subtle: "#64748B",
  /** Placeholder, metadata */
  faint: "#94A3B8",
  /** Data & tombol Buy — sama dengan brand green */
  gain: "#00AB6B",
  /** Data & tombol Sell — konvensi non-negotiable */
  loss: "#FF4D4F",
} as const;

/** Palet aksen sekunder untuk variasi kartu (badge ikon, chart series) — bukan Buy/Sell. */
export const cardAccents = ["#00AB6B", "#2F54EB", "#722ED1", "#FA541C", "#13C2C2", "#FAAD14"] as const;

export const radius = {
  sm: "8px",
  md: "12px",
} as const;

export const fontVars = {
  sans: "var(--font-sora)",
  mono: "var(--font-plex-mono)",
} as const;
