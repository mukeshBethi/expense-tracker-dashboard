# Dashboard Redesign (Phase 2 of the Premium SaaS Redesign)

## Context

Following the design critique (glassmorphism overload, gradient text everywhere, flat hierarchy, bare stat cards, default-Chart.js styling, undesigned loading/empty states — see the conversation for the full critique), this phase does the actual visual work on the dashboard's data-forward surfaces: the stat cards, the over-budget banner, the two charts, and the top-level loading/error screens. Tailwind v4 is already wired up (Phase 1) with color tokens pointing at the existing `--bg`/`--text`/`--primary`/etc. CSS variables, so this phase can use real utility classes instead of hand-written CSS.

**Explicitly out of scope (Phase 3):** `ExpenseForm`, `CategoryManager`, `BudgetList`, `ExpenseTable`, `AuthScreen`, `Header`, and the outer two-column `.layout`/`.col` grid shell that arranges the left (forms) and right (dashboard) columns — this phase must not restructure that shell, since Phase 3's components still live inside it unchanged. "Redesign the dashboard" here means: `SummaryCards`, `AlertBanner`, `CategoryChart`, `TrendChart`, and the top-level loading/error states in `App.jsx`.

## Design decisions

**Surfaces: opaque, not glass.** New `--surface-1` / `--surface-2` CSS variables (solid colors, not translucent) replace glassmorphism for these components: dark mode gets a solid shade slightly lighter than `--bg`; light mode gets solid white / near-white. No blur, no glow shadows, no shimmer edge — a soft, quiet shadow instead (new `--shadow-soft` variable, theme-aware like every other color token).

**Color stays emerald, spent sparingly.** No gradient text. The accent color is used for: icon pill backgrounds on stat cards, the primary chart's line/fill, and nothing else in this phase — everything else uses the neutral text/muted scale.

**New design tokens** — CSS variables added to both `:root` and `:root[data-theme="light"]` in `src/index.css`, then mapped into Phase 1's `@theme` block exactly like the existing color tokens:

| Variable | Dark value | Light value | Purpose |
|---|---|---|---|
| `--surface-1` | `#12151a` | `#ffffff` | Card background — solid, not translucent |
| `--surface-2` | `#1a1e25` | `#f3f4f7` | Nested/hover surface, one step up from `--surface-1` |
| `--shadow-soft` | `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 20px rgba(0,0,0,0.45)` | `0 1px 2px rgba(15,23,42,0.04), 0 8px 20px rgba(15,23,42,0.06)` | Card elevation — a quiet shadow, not a glow. Dark mode uses a subtle inset top highlight instead of a dark-on-dark drop shadow, since shadows don't read well on near-black backgrounds. |

Plus two static (non-theme-dependent) tokens: `--radius-card: 16px`, `--radius-pill: 999px` — mapped into `@theme` as `--radius-card`/`--radius-pill` to generate `rounded-card`/`rounded-pill` Tailwind utilities, for consistent, intentional rounding (replacing ad hoc per-component radius values in the components this phase touches).

**Icons:** `lucide-react` (already installed). Stat cards get a colored icon-pill (soft-tinted circle, accent-colored icon) top-left: `Wallet` (spent this month), `CalendarDays` (spent today), `Tag` (top category), `Receipt` (total entries). `AlertBanner` gets `AlertTriangle` in a warning-tinted pill.

**Month-over-month delta — one card only, "Spent this month".** Compare month-to-date spend against the *same elapsed number of days* in the previous month (not the previous month's full total — that would make early-month comparisons misleading). Rendered as a small colored badge. **Semantics are inverted from a typical revenue dashboard**: since this is an expense tracker, spending *less* than the same point last month is the good outcome (green badge, down arrow), spending *more* is the concerning one (red badge, up arrow). No delta badge on the other three stat cards — there's no meaningful equivalent comparison for "spent today," "top category" (non-numeric), or "total entries."

**Trend chart becomes a line chart with a gradient fill** (same underlying per-day data, just a different chart type — no functional change): smooth curve (moderate tension, not jagged straight segments), a `chart.js` canvas gradient fill under the line fading from the accent color to transparent, muted gridlines that read correctly against the new surface color in both themes, and a tooltip restyled to look like a small elevated card (rounded corners, padding, drop shadow via `cornerRadius`/`padding`/`backgroundColor` tooltip options) rather than Chart.js's default plain box.

**Category chart (stays a doughnut)**: same restyled tooltip treatment, legend typography matched to the app's type scale, and a tastefully curated slice-color palette (kept close to the existing categorical colors — this is about polish, not switching the whole palette).

**Loading/error states redesigned**: replace the current plain-text "Loading your data…" / "Couldn't load your data. Please refresh the page." in `App.jsx` with a centered, designed state (icon + message, using the new surface/spacing language) — still just two conditional early-returns, no new logic.

**Empty state for "no expenses yet"**: if `SummaryCards`/charts receive zero expenses, they should show a quiet, designed empty state (small icon + one line of copy) rather than a `$0.00`/blank chart, since a brand-new user's first impression of "the dashboard" is currently a wall of zeros.

## Scope (files)

- `src/index.css` — add the new tokens (`--surface-1`, `--surface-2`, `--shadow-soft`) to both theme blocks, and the two radius tokens to the `@theme` block from Phase 1. No removal of existing rules (the old `.stat-card`/`.alert-banner`/`.chart-card`/etc. CSS becomes unused dead code for now — cleanup happens at the end of Phase 3, in one pass, once nothing references the old classes anywhere in the app; don't clean it up mid-phase).
- `src/components/SummaryCards.jsx` — full rewrite using Tailwind classes + `lucide-react` icons + the month-over-month delta calculation for one card + empty state.
- `src/components/AlertBanner.jsx` — full rewrite using Tailwind classes + icon.
- `src/components/CategoryChart.jsx` — restyled tooltip/legend/palette, same chart type.
- `src/components/TrendChart.jsx` — converted from `Bar` to `Line` with gradient fill, restyled tooltip/grid, empty state.
- `src/App.jsx` — only the loading/error early-return JSX changes; no logic changes.
- New dependency: none (`lucide-react` already installed in the earlier icon-toggle task).

## Verification

- `npm run build`/`npm run lint` clean.
- Manual run: sign in with an account that has no expenses yet → confirm the designed empty states appear (not zeros/blank charts). Add a few expenses across two months (or manipulate dates) → confirm the "Spent this month" delta badge shows the correct color/direction for a month-to-date comparison. Confirm both charts render correctly in light and dark mode, with legible gridlines/tooltips in both. Confirm the over-budget banner still triggers under the same conditions as before (only the visual treatment changed). Resize to mobile width → confirm stat cards and charts stack sensibly (this phase doesn't own the grid breakpoints of the outer shell, but its own internal grids — e.g. the 4-stat-card row — should still be responsive on their own).
