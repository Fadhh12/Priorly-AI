---
name: Terminal Onyx
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191c23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e0e2ec'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#e0e2ec'
  inverse-on-surface: '#2d3038'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#ffb2b7'
  on-secondary: '#67001b'
  secondary-container: '#b50036'
  on-secondary-container: '#ffc2c4'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b7'
  on-secondary-fixed: '#40000d'
  on-secondary-fixed-variant: '#92002a'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#10131a'
  on-background: '#e0e2ec'
  surface-variant: '#32353c'
typography:
  headline-lg:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Sora
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0em
  body-lg:
    fontFamily: Sora
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-md:
    fontFamily: Sora
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  body-sm:
    fontFamily: Sora
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.01em
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.02em
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 13px
    letterSpacing: 0em
  label-md:
    fontFamily: Sora
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 9px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.06em
spacing:
  gutter: 0.25rem
  margin: 0.5rem
  space-xs: 0.125rem
  space-sm: 0.25rem
  space-md: 0.5rem
  space-lg: 0.75rem
  space-xl: 1rem
---

## Brand & Style

This design system delivers a high-density, mission-critical institutional trading environment engineered for quantitative analysts, execution traders, and portfolio managers. The aesthetic takes inspiration from professional market terminals (Refinitiv, Bloomberg) stripped of decorative noise and modernized with precision telemetry.

The visual style is characterized by:
- **Zero Distraction Dark Architecture:** Low-luminance charcoal and onyx foundations optimize sustained viewing over 12-hour shifts while minimizing eye fatigue.
- **Strict Financial Semiotics:** Semantic signaling is binary and uncompromising. Color is reserved entirely for market activity, liquidity states, and order execution. Blue hues are rigorously omitted across the entire system to prevent semantic confusion with non-directional data states.
- **High-Density Data Grid:** Maximum spatial efficiency with razor-sharp structural delineation, explicit border containment, and tabular data prioritization over whitespace.

## Colors

The palette operates under strict institutional discipline: color communicates functional state or financial movement, never ornamentation.

### Background Foundations
- **Base Canvas (`#0a0c10`):** Deepest terminal floor for main application framing and viewport guttering.
- **Surface Level 1 (`#12151c`):** Primary panel, blotter, and book container background.
- **Surface Level 2 (`#1a1e27`):** Elevated modules, popovers, splitters, header bars, and active tabs.
- **Surface Level 3 / Hover (`#222733`):** Row highlight, pressed states, and interactive element backgrounds.

### Core Market Semantics
- **Bid / Long / Gain (`#10b981`):** Primary Emerald for buy buttons, rising tickers, positive yield deltas, and executed bids. Deep emerald (`#059669`) provides pressed states and volume fill bars.
- **Ask / Short / Loss (`#f43f5e`):** Crimson/Rose for sell triggers, downward momentum, negative PnL, and ask walls. Deep crimson (`#e11d48`) serves as active fill and alert badges.
- **Attention / Fill / Warning (`#f59e0b`):** Warm Amber/Gold for partially filled orders, execution warnings, market state notices, and pending telemetry.
- **Absolute Blue Prohibition:** No cobalt, navy, cyan, sky, or azure shades are allowed in any token, border, background, or data visualization.

### Monochromatic Text & Borders
- **Text High-Emphasis (`#f8fafc`):** Crisp pure off-white for primary metrics, order entry, and active tabs.
- **Text Medium-Emphasis (`#94a3b8`):** Slate gray for table headers, labels, and secondary indicators.
- **Text Low-Emphasis (`#64748b`):** Deep slate for watermarks, disabled toggles, and metadata stamps.
- **Grid Border / Divider (`#1f2430`):** Structural 1px division between ledger panels.
- **Accent Active Border (`#334155`):** Focused inputs and selected window chrome.

## Typography

Typography enforces a strict bifurcated system:
1. **Structural Headings & Operational Controls:** Set in **Sora** for its sharp geometry, high legibility at condensed sizes, and modern institutional presence.
2. **Financial Data, Quotations & Order Tables:** Rendered in a fixed-pitch, tabular-aligned monospaced typeface (**JetBrains Mono**) to ensure non-proportional column lining, rapid ocular scanning of order book depth, and zero horizontal jitter during real-time tick streaming.

All numerical tables must enforce tabular figures (`font-variant-numeric: tabular-nums lining-nums`). Data cells displaying timestamps, currency pairs, lots, basis points, and pricing tiers default exclusively to the `data-*` tokens.

## Layout & Spacing

The terminal utilizes a dense, zero-waste CSS Grid workspace model. Panels dock edge-to-edge with 1px border lines and minimal gutters (`0.25rem` / 4px).

### Layout Rules
- **Docking Workspaces:** High modularity using CSS grid columns with draggable resizers between panels (DOM, Level 2 depth book, charts, blotter, execution tickets).
- **Spatial Conservation:** White space is compressed. Standard container paddings default to `space-sm` (4px) or `space-md` (8px). Table cell rows sit at a strict 22px to 26px height to maximize the visible count of bids and asks per viewport.
- **Responsive Handling:** When screen widths drop below 1280px, multi-column blotters reflow into tabbed docks rather than scaling downward. Handheld mobile profiles consolidate into stacked single-pane telemetry views with fixed bottom execution drawers.

## Elevation & Depth

Institutional terminals reject diffuse, ambient drop shadows in favor of precise, flat architectural depth:
- **Tonal Stepping:** Surfaces elevate strictly through luminance contrast (`#0a0c10` -> `#12151c` -> `#1a1e27` -> `#222733`).
- **Crisp Structural Borders:** Hierarchy is defined using crisp, 1px solid borders (`#1f2430` for structural containers, `#334155` for focused or active floating modules).
- **Modal and Popover Separation:** Detached overlays (e.g., ticket confirmation dialogs, settings modals) employ a sharp 1px `#334155` rim accompanied by a zero-blur key line shadow (`0 4px 12px rgba(0, 0, 0, 0.85)`), preventing visual bleed into the active price tape below.

## Shapes

The interface adheres to an absolute **Sharp (0px)** geometry. 

Corners on order ticket buttons, input fields, tabs, modal windows, and data tables maintain right-angled 0px radii. This maximizes spatial efficiency, lines up flush with dense grid splitters, and honors the utilitarian visual pedigree of trading hardware and classic low-latency financial systems.

## Components

### Action Buttons
- **Buy / Bid Button:** Solid Emerald Green (`#10b981`) background with pitch black (`#0a0c10`) bold Sora typography. Active state darkens to `#059669`.
- **Sell / Ask Button:** Solid Crimson Rose (`#f43f5e`) background with pure white (`#ffffff`) bold Sora typography. Active state darkens to `#e11d48`.
- **Secondary / Utility Controls:** Matte dark charcoal background (`#1a1e27`) with slate border (`#334155`) and crisp white text (`#f8fafc`). Hover shifts background to `#222733`.

### Numeric & Quantity Inputs
- **Container:** Pure `#0a0c10` inset background, 1px border (`#1f2430`).
- **Typography:** `JetBrains Mono`, aligned right, colored `#f8fafc`.
- **Focus State:** 1px border shift to Amber (`#f59e0b`) or white (`#f8fafc`); no glow rings. Stepper buttons are integrated as sharp, flush squares on the right edge.

### Level 2 Order Book & Data Tables
- **Table Headers:** All-caps `label-sm`, text `#64748b`, height 20px, bottom border 1px solid `#1f2430`.
- **Rows:** 20px to 22px fixed line height. Monospaced numeric alignment.
- **Depth Visualization:** Background horizontal volume bars rendered via semi-transparent tints: Emerald at 12% opacity (`rgba(16, 185, 129, 0.12)`) for cumulative bids; Crimson at 12% opacity (`rgba(244, 63, 94, 0.12)`) for cumulative asks.
- **Price Flashes:** Background transitions to solid green or red at 25% opacity for 150ms on price tick updates, immediately fading back to transparent.

### Chips & Status Indicators
- **Execution States:** Pill shapes are forbidden; all indicators are compact, sharp rectangles (`padding: 2px 6px`).
- **States:**
  - Filled: `#10b981` text, dark emerald border (`#059669`), transparent background.
  - Rejected/Canceled: `#f43f5e` text, crimson border (`#e11d48`), transparent background.
  - Partial/Working: `#f59e0b` text, amber border (`#d97706`), transparent background.

### Selection Controls (Checkboxes & Radios)
- **Checkboxes:** 12px by 12px sharp square boxes. Inset `#0a0c10` with `#334155` border. Checked state renders a solid `#10b981` inner box with no rounded corners.
- **Radio Buttons:** Square diamond or sharp square dot; circular radios are replaced with square inner ticks to preserve the angular terminal ethos.