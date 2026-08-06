# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `SummaryCards`, `AlertBanner`, `CategoryChart`, `TrendChart`, and `App.jsx`'s loading/error states into a premium, opaque-surface aesthetic using Tailwind utility classes and `lucide-react` icons, with no functional/logic changes beyond the two additive calculations the spec calls for (month-over-month delta, empty-state detection).

**Architecture:** New CSS variables (`--surface-1`, `--surface-2`, `--shadow-soft`) added to `src/index.css`'s existing dark/light theme blocks and mapped into the Phase 1 `@theme` block, generating Tailwind utilities (`bg-surface`, `shadow-soft`, `rounded-card`, etc.) that the redesigned components consume directly — no new hand-written CSS classes for these components.

**Tech Stack:** Tailwind v4 (already set up), `lucide-react` (already installed), `chart.js`/`react-chartjs-2` (already installed — `TrendChart` switches from `Bar` to `Line`, same libraries).

## Global Constraints

- Do not touch `ExpenseForm.jsx`, `CategoryManager.jsx`, `BudgetList.jsx`, `ExpenseTable.jsx`, `AuthScreen.jsx`, `Header.jsx`, or the outer `.layout`/`.col` grid shell — Phase 3's territory (spec: Context).
- No functional/logic changes beyond the month-over-month delta calculation and empty-state detection — both purely derived from existing `expenses`/`state`, no new persisted data (spec: Design decisions).
- The month-over-month delta on "Spent this month" compares against the *same elapsed number of days* in the previous month, not the previous month's full total (spec: Design decisions).
- Delta badge color is inverted from a typical revenue dashboard: less spending = green/good, more spending = red/bad (spec: Design decisions).
- Do not remove any existing CSS rules that become unused (`.stat-card`, `.alert-banner`, `.chart-card`, etc.) — cleanup happens once, at the end of Phase 3 (spec: Scope).
- Exact new token values (colors, shadow, radius) are given below — do not invent different values.

---

### Task 1: New design tokens

**Files:**
- Modify: `src/index.css` — add `--surface-1`, `--surface-2`, `--shadow-soft` to both `:root` and `:root[data-theme="light"]`; add `--radius-card`, `--radius-pill` (theme-independent, can go in either block or a shared location — put them in the base `:root` block since they don't change between themes); extend the existing `@theme` block (from Phase 1) with the new mappings.

**Interfaces:**
- Produces Tailwind utilities: `bg-surface`, `bg-surface-2`, `shadow-soft`, `rounded-card`, `rounded-pill` — used by every subsequent task in this plan.

- [ ] **Step 1: Add the new variables to `src/index.css`**

In the dark `:root` block, add (anywhere alongside the existing surface-related variables like `--surface-fill`):

```css
--surface-1: #12151a;
--surface-2: #1a1e25;
--shadow-soft: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 20px rgba(0, 0, 0, 0.45);
--radius-card: 16px;
--radius-pill: 999px;
```

In the light `:root[data-theme="light"]` block, add:

```css
--surface-1: #ffffff;
--surface-2: #f3f4f7;
--shadow-soft: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 20px rgba(15, 23, 42, 0.06);
```

(`--radius-card`/`--radius-pill` are theme-independent — do not repeat them in the light block, they're inherited from `:root`.)

- [ ] **Step 2: Extend the `@theme` block**

Find the `@theme { ... }` block added in the Phase 1 work (near the top of `src/index.css`) and add these lines inside it, alongside the existing `--color-*` mappings:

```css
--color-surface:   var(--surface-1);
--color-surface-2: var(--surface-2);
--shadow-soft:      var(--shadow-soft);
--radius-card:      var(--radius-card);
--radius-pill:      var(--radius-pill);
```

- [ ] **Step 3: Verify the tokens actually resolve**

Same pattern as Phase 1's verification: temporarily add a throwaway element (e.g. in `App.jsx`, removed before commit) with `className="bg-surface shadow-soft rounded-card p-4"`, run `npm run build`, and grep `dist/assets/*.css` for `.bg-surface{background-color:var(--color-surface)}` (or equivalent) to confirm the mapping compiled correctly. Remove the scratch element before committing — `git diff src/App.jsx` must be empty.

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/index.css
git commit -m "Add surface, shadow, and radius design tokens for the dashboard redesign"
```

---

### Task 2: Redesign `SummaryCards`

**Files:**
- Modify: `src/components/SummaryCards.jsx` — full rewrite.

**Interfaces:**
- Props unchanged: `{ expenses, currency }`.

- [ ] **Step 1: Rewrite `src/components/SummaryCards.jsx`**

```jsx
import { Wallet, CalendarDays, Tag, Receipt, ArrowDown, ArrowUp } from "lucide-react";
import { formatMoney } from "../lib/format.js";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function monthKey(iso) { return iso.slice(0, 7); }

function sumForMonthUpToDay(expenses, monthK, dayOfMonth) {
  let total = 0;
  for (const e of expenses) {
    if (monthKey(e.date) !== monthK) continue;
    const day = Number(e.date.slice(8, 10));
    if (day <= dayOfMonth) total += e.amount;
  }
  return total;
}

function previousMonthKey(monthK) {
  const [y, m] = monthK.split("-").map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return `${py}-${String(pm).padStart(2, "0")}`;
}

function StatCard({ icon: Icon, label, value, badge }) {
  return (
    <div className="bg-surface shadow-soft rounded-card p-5 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-pill bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-text">{value}</span>
        {badge}
      </div>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export default function SummaryCards({ expenses, currency }) {
  if (expenses.length === 0) {
    return (
      <div className="bg-surface shadow-soft rounded-card p-8 flex flex-col items-center gap-2 text-center">
        <Receipt className="w-6 h-6 text-muted" />
        <p className="text-sm text-muted">No expenses yet — add your first one to see your summary here.</p>
      </div>
    );
  }

  const today = todayISO();
  const monthK = today.slice(0, 7);
  const dayOfMonth = Number(today.slice(8, 10));

  let monthTotal = 0, todayTotal = 0;
  const byCatMonth = {};
  for (const e of expenses) {
    if (monthKey(e.date) === monthK) {
      monthTotal += e.amount;
      byCatMonth[e.category] = (byCatMonth[e.category] || 0) + e.amount;
    }
    if (e.date === today) todayTotal += e.amount;
  }

  let topCat = "—", topVal = 0;
  for (const [c, v] of Object.entries(byCatMonth)) if (v > topVal) { topVal = v; topCat = c; }

  const prevMonthK = previousMonthKey(monthK);
  const prevMonthToDate = sumForMonthUpToDay(expenses, prevMonthK, dayOfMonth);
  let deltaBadge = null;
  if (prevMonthToDate > 0) {
    const pct = ((monthTotal - prevMonthToDate) / prevMonthToDate) * 100;
    const isDown = pct < 0;
    const Arrow = isDown ? ArrowDown : ArrowUp;
    deltaBadge = (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold rounded-pill px-2 py-0.5 ${isDown ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
        <Arrow className="w-3 h-3" />
        {Math.abs(pct).toFixed(0)}%
      </span>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={Wallet} label="Spent this month" value={formatMoney(monthTotal, currency)} badge={deltaBadge} />
      <StatCard icon={CalendarDays} label="Spent today" value={formatMoney(todayTotal, currency)} />
      <StatCard icon={Tag} label="Top category" value={topCat} />
      <StatCard icon={Receipt} label="Total entries" value={String(expenses.length)} />
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

Run `npm run build`. Manually trace `sumForMonthUpToDay`/`previousMonthKey` against a few hand-picked dates (e.g. today = `2026-08-06`, confirm `previousMonthKey("2026-08")` returns `"2026-07"`, and `sumForMonthUpToDay` only counts July expenses with day ≤ 6). If you can run the dev server, sign in and add 2-3 expenses to check the cards render (icons visible, delta badge appears/hidden correctly depending on whether prior-month data exists). No browser tool is expected to be available — code-tracing plus build success is the verification bar, same as prior tasks in this project; be honest in your report about what was and wasn't visually confirmed.

- [ ] **Step 3: Commit**

```bash
npm run build && npm run lint
git add src/components/SummaryCards.jsx
git commit -m "Redesign SummaryCards with icons, month-over-month delta, and empty state"
```

---

### Task 3: Redesign `AlertBanner`

**Files:**
- Modify: `src/components/AlertBanner.jsx` — full rewrite.

**Interfaces:**
- Props unchanged: `{ categories, budgets, expensesThisMonth }`.

- [ ] **Step 1: Rewrite `src/components/AlertBanner.jsx`**

```jsx
import { AlertTriangle } from "lucide-react";

export default function AlertBanner({ categories, budgets, expensesThisMonth }) {
  const spentByCat = {};
  for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
  const over = categories.filter(c => {
    const limit = Number(budgets[c]) || 0;
    return limit > 0 && (spentByCat[c] || 0) > limit;
  });
  if (over.length === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-card px-4 py-3 mx-9 mt-4">
      <div className="w-8 h-8 rounded-pill bg-red-500/15 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-red-500" />
      </div>
      <p className="text-sm text-text">
        <strong className="font-semibold">Over budget this month:</strong> {over.join(", ")}.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify manually**

Trace the filtering logic (unchanged from before — only the JSX changed) against the same test cases the original component was reviewed against: no categories over budget → renders `null`; one or more over → renders the banner with all over-budget category names joined by `, `. Run `npm run build`.

- [ ] **Step 3: Commit**

```bash
npm run build && npm run lint
git add src/components/AlertBanner.jsx
git commit -m "Redesign AlertBanner with icon pill and new surface styling"
```

---

### Task 4: Restyle `CategoryChart`

**Files:**
- Modify: `src/components/CategoryChart.jsx`.

**Interfaces:**
- Props unchanged: `{ expenses, currency }`. Same `Doughnut` chart type.

- [ ] **Step 1: Update `src/components/CategoryChart.jsx`**

```jsx
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { PieChart } from "lucide-react";
import { formatMoney } from "../lib/format.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ["#10b981", "#6c8cff", "#f59e0b", "#f87171", "#a78bfa", "#22d3ee", "#fb923c", "#f472b6"];

export default function CategoryChart({ expenses, currency }) {
  const totals = {};
  for (const e of expenses) totals[e.category] = (totals[e.category] || 0) + e.amount;
  const labels = Object.keys(totals);
  const data = labels.map(l => totals[l]);

  if (labels.length === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-center">
        <PieChart className="w-6 h-6 text-muted" />
        <p className="text-sm text-muted">No data for this filter yet.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[260px]">
      <Doughnut
        data={{ labels, datasets: [{ data, backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]), borderWidth: 0 }] }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { boxWidth: 10, boxHeight: 10, padding: 16, font: { size: 12, family: "inherit" } },
            },
            tooltip: {
              callbacks: { label: c => `${c.label}: ${formatMoney(c.parsed, currency)}` },
              backgroundColor: "#1a1e25",
              padding: 10,
              cornerRadius: 8,
              titleFont: { size: 12, weight: "600" },
              bodyFont: { size: 12 },
              displayColors: true,
            },
          },
          cutout: "65%",
        }}
      />
    </div>
  );
}
```

Note: the tooltip `backgroundColor` is a fixed dark value (`#1a1e25`, matching the dark-mode `--surface-2`) rather than a CSS variable, because Chart.js tooltips are drawn on `<canvas>` and cannot read CSS custom properties at render time — a fixed dark tooltip on both light and dark backgrounds is the standard Chart.js pattern (also matches most real-world dashboards, where chart tooltips stay dark regardless of page theme for consistent legibility) and is intentional here, not an oversight.

- [ ] **Step 2: Verify manually**

Run `npm run build`. If a dev server check is possible, confirm the doughnut renders with the new palette and the tooltip shows a rounded dark card on hover, in both light and dark page themes. Confirm the empty state (zero filtered expenses) shows the designed placeholder, not a blank canvas.

- [ ] **Step 3: Commit**

```bash
npm run build && npm run lint
git add src/components/CategoryChart.jsx
git commit -m "Restyle CategoryChart tooltip, legend, and palette"
```

---

### Task 5: Convert `TrendChart` to a line chart with gradient fill

**Files:**
- Modify: `src/components/TrendChart.jsx`.

**Interfaces:**
- Props unchanged: `{ expenses, currency }`. Chart type changes from `Bar` to `Line` — same input data shape, this is a visual-only change per the spec.

- [ ] **Step 1: Update `src/components/TrendChart.jsx`**

```jsx
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler } from "chart.js";
import { TrendingUp } from "lucide-react";
import { formatMoney } from "../lib/format.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

function gradientFill(ctx, chartArea) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, "rgba(16, 185, 129, 0.35)");
  gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
  return gradient;
}

export default function TrendChart({ expenses, currency }) {
  const byKey = {};
  for (const e of expenses) byKey[e.date] = (byKey[e.date] || 0) + e.amount;
  const labels = Object.keys(byKey).sort();
  const data = labels.map(k => byKey[k]);

  if (labels.length === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-center">
        <TrendingUp className="w-6 h-6 text-muted" />
        <p className="text-sm text-muted">No data for this filter yet.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[260px]">
      <Line
        data={{
          labels,
          datasets: [{
            label: "Spent",
            data,
            borderColor: "#10b981",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: "#10b981",
            tension: 0.35,
            fill: true,
            backgroundColor: (context) => {
              const { ctx, chartArea } = context.chart;
              if (!chartArea) return "rgba(16, 185, 129, 0)";
              return gradientFill(ctx, chartArea);
            },
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: c => formatMoney(c.parsed.y, currency) },
              backgroundColor: "#1a1e25",
              padding: 10,
              cornerRadius: 8,
              titleFont: { size: 12, weight: "600" },
              bodyFont: { size: 12 },
            },
          },
          scales: {
            x: { grid: { color: "rgba(148, 163, 184, 0.12)" }, ticks: { font: { size: 11 } } },
            y: { grid: { color: "rgba(148, 163, 184, 0.12)" }, ticks: { callback: v => formatMoney(v, currency), font: { size: 11 } } },
          },
        }}
      />
    </div>
  );
}
```

Note: like the previous task, tooltip `backgroundColor` is intentionally a fixed dark value for canvas-rendering reasons. The gridline color (`rgba(148, 163, 184, 0.12)`) is a fixed muted slate tone chosen to be faintly visible against both the dark surface (`#12151a`) and light surface (`#ffffff`) — verify this visually if you have any way to check both themes; if the line is too faint in one theme, note it in your report rather than silently picking a different value, since color tuning here is a design judgment call, not yours to make unilaterally.

- [ ] **Step 2: Verify manually**

Run `npm run build`. Confirm `Line`/gradient fill imports resolve with no chart.js registration errors (same registration-correctness concern as the original chart tasks — cross-check `LineElement`/`PointElement`/`Filler` are the correct registerables for a filled line chart, the same way earlier tasks in this project verified chart.js registrations against the library's actual source when in doubt). Confirm the empty state renders correctly.

- [ ] **Step 3: Commit**

```bash
npm run build && npm run lint
git add src/components/TrendChart.jsx
git commit -m "Convert TrendChart from bar to line chart with gradient fill"
```

---

### Task 6: Redesign `App.jsx`'s loading/error states

**Files:**
- Modify: `src/App.jsx` — only the `loadError`/`loading` early-return JSX (no other changes to this file).

**Interfaces:** none — pure JSX/markup change to two existing conditionals.

- [ ] **Step 1: Locate the two early returns in `src/App.jsx`**

Find:
```jsx
if (loadError) {
  return <p className="loading-error">Couldn't load your data. Please refresh the page.</p>;
}
if (loading) {
  return <p className="loading-label">Loading your data…</p>;
}
```

- [ ] **Step 2: Replace with a designed centered state**

```jsx
import { AlertCircle, Loader2 } from "lucide-react";
```
(add to the top imports)

```jsx
if (loadError) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <p className="text-text font-medium">Couldn't load your data</p>
      <p className="text-sm text-muted">Please refresh the page to try again.</p>
    </div>
  );
}
if (loading) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
      <p className="text-sm text-muted">Loading your data…</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify manually**

Run `npm run build`. Confirm no other part of `App.jsx` changed (`git diff` should show only these two blocks and the new import line).

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/App.jsx
git commit -m "Redesign loading and error states with icons and centered layout"
```
