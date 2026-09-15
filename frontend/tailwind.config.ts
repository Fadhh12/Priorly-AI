import type { Config } from "tailwindcss";
import { colors, radius } from "./lib/designTokens";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: colors.canvas,
        surface: colors.surface,
        "surface-raised": colors.surfaceRaised,
        line: colors.line,
        accent: colors.accent,
        ink: colors.ink,
        subtle: colors.subtle,
        faint: colors.faint,
        gain: colors.gain,
        loss: colors.loss,
        // "Terminal Onyx" dark theme — Trading App only (app/trading/**).
        // Kept separate from the light marketing tokens above so Home page is untouched.
        onyx: {
          surface: "#10131a",
          "surface-dim": "#0b0e15",
          "surface-bright": "#363941",
          "surface-lowest": "#0b0e15",
          "surface-low": "#191c23",
          "surface-container": "#1d2027",
          "surface-high": "#272a31",
          "surface-highest": "#32353c",
          "on-surface": "#e0e2ec",
          "on-surface-variant": "#bbcabf",
          outline: "#86948a",
          "outline-variant": "#3c4a42",
          primary: "#4edea3",
          "on-primary": "#003824",
          "primary-container": "#10b981",
          secondary: "#ffb2b7",
          "on-secondary": "#67001b",
          "secondary-container": "#b50036",
          tertiary: "#ffb95f",
          "on-tertiary": "#472a00",
          "tertiary-container": "#e29100",
          error: "#ffb4ab",
          "on-error": "#690005",
          "error-container": "#93000a",
          // Terminal-grade neon accent — chart up-candles, live pulse dots, and
          // order-book flash highlights only (kept separate from `primary` so
          // sidebar/buttons/badges don't shift shade project-wide).
          neon: "#00ff66",
        },
      },
      borderRadius: {
        sm: radius.sm,
        md: radius.md,
      },
      fontFamily: {
        sans: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        // Trading App data columns (order book, tickets, blotter) — tabular JetBrains Mono per Terminal Onyx design.
        data: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
        "headline-lg": ["var(--font-sora)"],
        "headline-md": ["var(--font-sora)"],
        "headline-sm": ["var(--font-sora)"],
        "body-lg": ["var(--font-sora)"],
        "body-md": ["var(--font-sora)"],
        "body-sm": ["var(--font-sora)"],
        "label-md": ["var(--font-sora)"],
        "label-sm": ["var(--font-jetbrains-mono)"],
        "data-lg": ["var(--font-jetbrains-mono)"],
        "data-md": ["var(--font-jetbrains-mono)"],
        "data-sm": ["var(--font-jetbrains-mono)"],
      },
      // Trading App (Terminal Onyx) type scale — text-{name} carries size + line-height + tracking + weight together.
      fontSize: {
        "headline-lg": ["24px", { lineHeight: "32px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "headline-md": ["18px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["14px", { lineHeight: "20px", letterSpacing: "0em", fontWeight: "600" }],
        "body-lg": ["14px", { lineHeight: "20px", letterSpacing: "0em", fontWeight: "400" }],
        "body-md": ["12px", { lineHeight: "16px", letterSpacing: "0em", fontWeight: "400" }],
        "body-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.01em", fontWeight: "400" }],
        "label-md": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "600" }],
        "label-sm": ["9px", { lineHeight: "12px", letterSpacing: "0.06em", fontWeight: "600" }],
        "data-lg": ["16px", { lineHeight: "20px", letterSpacing: "-0.02em", fontWeight: "500" }],
        "data-md": ["12px", { lineHeight: "16px", letterSpacing: "-0.01em", fontWeight: "500" }],
        "data-sm": ["10px", { lineHeight: "13px", letterSpacing: "0em", fontWeight: "400" }],
      },
      spacing: {
        gutter: "0.25rem",
        margin: "0.5rem",
        "space-xs": "0.125rem",
        "space-sm": "0.25rem",
        "space-md": "0.5rem",
        "space-lg": "0.75rem",
        "space-xl": "1rem",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        // Order book / tape tick flash — a brief tint on the row/cell that just changed.
        flashUp: {
          "0%": { backgroundColor: "rgba(0,255,102,0.35)" },
          "100%": { backgroundColor: "rgba(0,255,102,0)" },
        },
        flashDown: {
          "0%": { backgroundColor: "rgba(244,63,94,0.35)" },
          "100%": { backgroundColor: "rgba(244,63,94,0)" },
        },
        // SVG-safe "just updated" pulse (rect/line fill doesn't support
        // background-color) — brightens then settles via `filter`.
        barPulse: {
          "0%": { filter: "brightness(1)" },
          "30%": { filter: "brightness(1.9)" },
          "100%": { filter: "brightness(1)" },
        },
        glowPulse: {
          "0%": { filter: "drop-shadow(0 0 0px rgba(0,255,102,0))" },
          "30%": { filter: "drop-shadow(0 0 6px rgba(0,255,102,0.85))" },
          "100%": { filter: "drop-shadow(0 0 0px rgba(0,255,102,0))" },
        },
        // New live-tape row sliding/fading in — reinforces "continuously
        // adding" the same way the candlestick's live last bar does.
        rowIn: {
          "0%": { opacity: "0", transform: "translateY(-4px)", backgroundColor: "rgba(0,255,102,0.25)" },
          "100%": { opacity: "1", transform: "translateY(0)", backgroundColor: "rgba(0,255,102,0)" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        flashUp: "flashUp 650ms ease-out",
        flashDown: "flashDown 650ms ease-out",
        barPulse: "barPulse 600ms ease-out",
        glowPulse: "glowPulse 700ms ease-out",
        rowIn: "rowIn 500ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
