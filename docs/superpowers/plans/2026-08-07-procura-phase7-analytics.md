# Procura Redesign — Phase 7: Analytics Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/analytics` — 3 stat cards with sparklines, a 6-month trend line, a this-month category pie, an 8-week bar chart, and budget-utilization progress bars for every category that has a budget (not capped at 4, unlike Dashboard's "top 4" widget — Analytics is the deep-dive page). Per the master spec: "mostly the same underlying data as Dashboard, sliced differently (monthly instead of daily, weekly buckets)."

**Architecture:** This page is **read-only** — no expense/category/budget mutators, no modals, no toast. `analyticsProps` is just `{ state, theme, expensesThisMonth }`, by far the simplest wiring of any page phase so far. All new logic is bucketing (by month, by rolling 7-day week) that Dashboard didn't need; the category-pie and budget-utilization math are exact, unmodified reuses of Dashboard's Phase-3 logic (only the "top 4" cap is removed for budget utilization, since Analytics has room to show everything).

**Tech Stack:** No new dependencies. Reuses `src/lib/format.js` (`formatMoney`) verbatim.

## Global Constraints

- Every dollar amount goes through `formatMoney(amount, currency)`.
- The category-pie and budget-utilization formulas are copied verbatim from `DashboardPage.jsx` (Phase 3) — see "Reused math" below. Do not re-derive them.
- This page adds zero new Firestore fields and zero new mutators — it only reads `state`.

## Reused math (verbatim source of truth, from `DashboardPage.jsx`)

```js
const VIZ_PALETTE = ["#2D63EA", "#16A34A", "#D97706", "#E11D48", "#7C3AED", "#0891B2", "#EA580C", "#4A6290"];

// category pie (this month) — identical to Dashboard's categoryPieData
const byCat = {};
for (const e of expensesThisMonth) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
const categoryPieData = Object.entries(byCat).map(([label, value], i) => ({ label, value, color: VIZ_PALETTE[i % VIZ_PALETTE.length] }));

// budget utilization tone — identical to Dashboard's budgetHealth, minus the .slice(0, 4) cap
const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
const tone = limit > 0 && spent > limit ? "danger" : limit > 0 && spent >= limit * 0.9 ? "warning" : "success";
```

## New bucketing logic (this phase only — Dashboard doesn't need month/week buckets)

```js
function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// last 6 calendar months, oldest first, keyed "YYYY-MM"
function monthlyTotals(expenses) {
  const byMonth = {};
  for (const e of expenses) { const k = e.date.slice(0, 7); byMonth[k] = (byMonth[k] || 0) + e.amount; }
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ label: d.toLocaleDateString("en-US", { month: "short" }), total: byMonth[key] || 0 });
  }
  return months;
}

// last 8 rolling 7-day weeks, oldest first (week 0 = most recent 7 days including today)
function weeklyTotals(expenses) {
  const byDay = {};
  for (const e of expenses) byDay[e.date] = (byDay[e.date] || 0) + e.amount;
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const dt = new Date();
      dt.setDate(dt.getDate() - (w * 7 + d));
      const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      total += byDay[iso] || 0;
    }
    const startDt = new Date();
    startDt.setDate(startDt.getDate() - (w * 7 + 6));
    weeks.push({ label: startDt.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }), total });
  }
  return weeks;
}
```

---

### Task 1: Wire `App.jsx` for the Analytics page

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces `analyticsProps`: `{ state, theme, expensesThisMonth }` — no new hook destructuring needed (Analytics reads existing `state`/`theme`/`expensesThisMonth`, all already computed in `App.jsx`).
- Replaces the `/analytics` route's `<ComingSoonPage title="Analytics" />` with `<AnalyticsPage {...analyticsProps} />`.

- [ ] **Step 1: Import `AnalyticsPage` and add `analyticsProps`**

Add the import alongside the other page imports:
```jsx
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
```
Add, right after `categoriesProps` is built:
```jsx
const analyticsProps = { state, theme, expensesThisMonth };
```

- [ ] **Step 2: Swap the route**

Change:
```jsx
<Route path="/analytics" element={<ComingSoonPage title="Analytics" />} />
```
to:
```jsx
<Route path="/analytics" element={<AnalyticsPage {...analyticsProps} />} />
```

- [ ] **Step 3: Verify and commit (together with Task 2 — this task's build only succeeds once `AnalyticsPage.jsx` exists)**

Proceed to Task 2, then build/lint/commit both together:
```bash
npm run build && npm run lint
git add src/App.jsx
git commit -m "Wire Analytics page into App.jsx: add analyticsProps (read-only, no new mutators)"
```

---

### Task 2: Build `AnalyticsPage.jsx`

**Files:**
- Create: `src/pages/AnalyticsPage.jsx`

**Interfaces:**
- Consumes: `state, theme, expensesThisMonth` (Task 1's `analyticsProps`).
- Consumes: `StatCard`, `KpiCard`, `ProgressBar`, `LineChart`, `PieChart`, `BarChart` (Phase 2 primitives); `formatMoney` from `src/lib/format.js`. **Note:** `StatCard.jsx`'s actual signature is `{ label, value, delta, trend, spark, accentClass }` — it has NO `icon` prop (only `KpiCard` does). The two sparkline-bearing cards below use `StatCard` without an icon; the "Top Category" card (no sparkline) uses `KpiCard` instead, since that's the primitive with an icon slot.

- [ ] **Step 1: Write the component**

```jsx
import { useMemo } from "react";
import { Crown } from "lucide-react";
import { formatMoney } from "../lib/format.js";
import StatCard from "../components/ui/StatCard.jsx";
import KpiCard from "../components/ui/KpiCard.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import LineChart from "../components/ui/LineChart.jsx";
import PieChart from "../components/ui/PieChart.jsx";
import BarChart from "../components/ui/BarChart.jsx";

const VIZ_PALETTE = ["#2D63EA", "#16A34A", "#D97706", "#E11D48", "#7C3AED", "#0891B2", "#EA580C", "#4A6290"];

function monthlyTotals(expenses) {
  const byMonth = {};
  for (const e of expenses) { const k = e.date.slice(0, 7); byMonth[k] = (byMonth[k] || 0) + e.amount; }
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({ label: d.toLocaleDateString("en-US", { month: "short" }), total: byMonth[key] || 0 });
  }
  return months;
}

function weeklyTotals(expenses) {
  const byDay = {};
  for (const e of expenses) byDay[e.date] = (byDay[e.date] || 0) + e.amount;
  const weeks = [];
  for (let w = 7; w >= 0; w--) {
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const dt = new Date();
      dt.setDate(dt.getDate() - (w * 7 + d));
      const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      total += byDay[iso] || 0;
    }
    const startDt = new Date();
    startDt.setDate(startDt.getDate() - (w * 7 + 6));
    weeks.push({ label: startDt.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }), total });
  }
  return weeks;
}

export default function AnalyticsPage({ state, theme, expensesThisMonth }) {
  const currency = state.settings.currency;

  const months = useMemo(() => monthlyTotals(state.expenses), [state.expenses]);
  const weeks = useMemo(() => weeklyTotals(state.expenses), [state.expenses]);

  const avgMonthly = useMemo(() => months.reduce((s, m) => s + m.total, 0) / months.length, [months]);
  const avgWeekly = useMemo(() => weeks.reduce((s, w) => s + w.total, 0) / weeks.length, [weeks]);

  const topCategoryAllTime = useMemo(() => {
    const byCat = {};
    for (const e of state.expenses) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    let top = "—", topAmt = -1;
    for (const [cat, amt] of Object.entries(byCat)) { if (amt > topAmt) { top = cat; topAmt = amt; } }
    return top;
  }, [state.expenses]);

  const categoryPieData = useMemo(() => {
    const byCat = {};
    for (const e of expensesThisMonth) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    return Object.entries(byCat).map(([label, value], i) => ({ label, value, color: VIZ_PALETTE[i % VIZ_PALETTE.length] }));
  }, [expensesThisMonth]);

  const budgetUtilization = useMemo(() => {
    const spentByCat = {};
    for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
    return state.categories
      .map(c => {
        const limit = Number(state.budgets[c]) || 0;
        const spent = spentByCat[c] || 0;
        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const tone = limit > 0 && spent > limit ? "danger" : limit > 0 && spent >= limit * 0.9 ? "warning" : "success";
        return { category: c, limit, spent, pct, tone };
      })
      .filter(b => b.limit > 0)
      .sort((a, b) => b.pct - a.pct);
  }, [state.categories, state.budgets, expensesThisMonth]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Avg Monthly Spend (6 mo)" value={formatMoney(avgMonthly, currency)} spark={months.map(m => m.total)} />
        <StatCard label="Avg Weekly Spend (8 wk)" value={formatMoney(avgWeekly, currency)} spark={weeks.map(w => w.total)} />
        <KpiCard label="Top Category (all time)" value={topCategoryAllTime} icon={Crown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-pr-primary">Monthly Trend (6 months)</h2>
          {state.expenses.length === 0 ? (
            <p className="text-sm text-pr-secondary py-8 text-center">No expenses yet.</p>
          ) : (
            <LineChart series={[{ label: "Spend", color: "#2D63EA", points: months.map(m => m.total) }]} xLabels={months.map(m => m.label)} theme={theme} />
          )}
        </div>
        <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-pr-primary">By Category (This Month)</h2>
          {categoryPieData.length === 0 ? (
            <p className="text-sm text-pr-secondary py-8 text-center">No expenses this month.</p>
          ) : (
            <PieChart data={categoryPieData} theme={theme} />
          )}
        </div>
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-pr-primary">Weekly Spend (8 weeks)</h2>
        {state.expenses.length === 0 ? (
          <p className="text-sm text-pr-secondary py-8 text-center">No expenses yet.</p>
        ) : (
          <BarChart data={weeks.map(w => ({ label: w.label, value: w.total, color: "#2D63EA" }))} theme={theme} />
        )}
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-pr-primary">Budget Utilization</h2>
        {budgetUtilization.length === 0 ? (
          <p className="text-sm text-pr-secondary">No budgets set yet.</p>
        ) : (
          budgetUtilization.map(b => (
            <ProgressBar key={b.category} label={`${b.category} — ${formatMoney(b.spent, currency)} of ${formatMoney(b.limit, currency)}`} value={b.pct} tone={b.tone} showValue />
          ))
        )}
      </div>
    </div>
  );
}
```

Note on `avgMonthly`/`avgWeekly` including the current, still-in-progress month/week: this is a deliberate simplification, not an oversight — excluding the partial current period would need an extra "is this bucket complete?" branch for a page whose numbers are explicitly framed as trends/averages, not precise-to-the-day totals. If a future phase wants a "complete periods only" average, that's a separate, explicit follow-up.

- [ ] **Step 2: Verify chart/stat-card data shapes match Phase 2's primitives exactly**

Before treating the above as correct, re-check `StatCard.jsx`'s prop names (`label, value, delta, trend, spark, accentClass`) and `LineChart`/`BarChart`/`PieChart`'s prop names (`series`/`xLabels`/`theme` for `LineChart`; `data`/`theme` for `PieChart`/`BarChart`) against their actual Phase 2 source — this plan's code above should already match, but confirm rather than assume, the same rigor every prior phase applied before wiring a primitive.

- [ ] **Step 3: Full verification (build/lint + code-trace)**

```bash
npm run build && npm run lint
```

Trace by hand on a fresh/empty account: `months`/`weeks` still produce 6/8 entries (all zeros) since the loops run regardless of `state.expenses.length`, so `avgMonthly`/`avgWeekly` compute as `0`, not `NaN` or a crash — confirm the sparkline components handle an all-zero array without dividing by zero (check `Sparkline.jsx`'s `range = max - min || 1` guard, already built in Phase 2, covers this). Confirm the Monthly Trend and Weekly Spend sections show their "No expenses yet" text instead of an all-zero chart when `state.expenses.length === 0` (matching the pattern Dashboard already uses).

- [ ] **Step 4: Commit (together with Task 1)**

```bash
git add src/pages/AnalyticsPage.jsx src/App.jsx
git commit -m "Add AnalyticsPage: stat cards with sparklines, 6-month trend, category pie, 8-week bar chart, budget utilization"
```

---

### Final phase review

- [ ] Confirm via `git diff <phase-7-base>..HEAD --stat` that the only modified file is `src/App.jsx` — `src/pages/AnalyticsPage.jsx` is new.
- [ ] Confirm this phase added zero new Firestore fields and zero new mutators (Analytics is read-only, per the Global Constraints).
- [ ] `npm run build` and `npm run lint` clean.
- [ ] Merge into `main`, push, then pause and report to the user before starting Phase 8 (Settings page), per the established phase-by-phase operating mode.
