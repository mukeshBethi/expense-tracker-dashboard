# Procura Redesign — Phase 5: Budgets Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/budgets` — a KPI row (Total Budget / Allocated / Unallocated), a total-budget input, and per-category budget rows with progress bars. Per the master spec, this is a **restyle + relocation of `BudgetList.jsx`'s existing logic — zero logic changes**. Every validation call, every error message, and the uncontrolled-input-with-`onBlur` pattern (deliberate: avoids re-render-while-typing) are copied verbatim.

**Architecture:** `BudgetsPage.jsx` inlines the exact validation/error-state logic `BudgetList.jsx` already has (same `useState` error maps, same `handleChange`/`handleTotalChange` functions) but renders it with Procura primitives: `KpiCard` for the 3 summary numbers, `Input` for the (still uncontrolled, still `onBlur`-driven) amount fields, and `ProgressBar` (Phase 2) instead of the old hand-rolled colored `<div>` bars. The one deliberate visual decision beyond a straight port: the "good" progress-bar state uses `tone="success"` (green) instead of the old plain blue `bg-primary`, matching the tone convention Phase 3's Dashboard "Budget Health" widget already established — so this page looks consistent with a widget the user has already seen, not different from it.

**Tech Stack:** No new dependencies. Reuses `src/lib/validation.js` (`validateAmount`, `validateAllocation`, `validateTotalBudget`) and `src/lib/format.js` (`formatMoney`) verbatim.

## Global Constraints

- `src/lib/validation.js` and `src/lib/format.js` are not modified.
- The total-budget and per-category amount inputs stay **uncontrolled** (`defaultValue` + `onBlur`, not `value` + `onChange`) — this is `BudgetList.jsx`'s existing, deliberate pattern (avoids fighting the user's typing on every keystroke) and must not be "fixed" into a controlled input.
- Every dollar amount goes through `formatMoney(amount, currency)`.
- The old `BudgetList.jsx` remains dead code (per Phase 3's convention) — this phase doesn't touch it, doesn't delete it.

## Reused logic (verbatim source of truth — copy exactly)

From `BudgetList.jsx`:
```js
const spentByCat = {};
for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;

const allocated = Object.values(budgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
const allocatedPct = totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0;

function handleChange(category, rawValue) {
  if (rawValue) {
    const amountErr = validateAmount(parseFloat(rawValue));
    if (amountErr) { setErrors(prev => ({ ...prev, [category]: amountErr })); return; }
    const allocErr = validateAllocation(parseFloat(rawValue), category, budgets, totalBudget);
    if (allocErr) {
      setErrors(prev => ({ ...prev, [category]: `That would put you ${formatMoney(allocErr.overage, currency)} over your total budget.` }));
      return;
    }
  }
  setErrors(prev => {
    if (!prev[category]) return prev;
    const next = { ...prev };
    delete next[category];
    return next;
  });
  onSetBudget(category, rawValue);
}

function handleTotalChange(rawValue) {
  if (rawValue) {
    const amountErr = validateAmount(parseFloat(rawValue));
    if (amountErr) { setTotalError(amountErr); return; }
    const totalErr = validateTotalBudget(parseFloat(rawValue), budgets);
    if (totalErr) {
      setTotalError(`You've already allocated ${formatMoney(totalErr.allocated, currency)} across categories — lower those first or pick a higher total.`);
      return;
    }
  }
  setTotalError("");
  onSetTotalBudget(rawValue);
}

// per-category tone (this phase maps the old bg-danger/bg-warn/bg-primary to ProgressBar's danger/warning/success):
const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
const tone = limit > 0 && spent > limit ? "danger" : limit > 0 && spent >= limit * 0.9 ? "warning" : "success";
```

---

### Task 1: Wire `App.jsx` for the Budgets page

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Re-adds `setBudget`, `setTotalBudget` to the `useExpenseData` destructuring (removed in Phase 3 since nothing used them at the time).
- Produces `budgetsProps`: `{ state, expensesThisMonth, setBudget, setTotalBudget }`.
- Replaces the `/budgets` route's `<ComingSoonPage title="Budgets" />` with `<BudgetsPage {...budgetsProps} />`.

- [ ] **Step 1: Re-add the two mutators to the hook destructuring**

Change:
```jsx
const { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, setThemePreference } = useExpenseData(user?.uid);
```
to:
```jsx
const { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, setBudget, setTotalBudget, setThemePreference } = useExpenseData(user?.uid);
```

- [ ] **Step 2: Import `BudgetsPage` and add `budgetsProps`**

Add the import alongside the other page imports:
```jsx
import BudgetsPage from "./pages/BudgetsPage.jsx";
```
Add, right after `expensesProps` is built:
```jsx
const budgetsProps = { state, expensesThisMonth, setBudget, setTotalBudget };
```

- [ ] **Step 3: Swap the route**

Change:
```jsx
<Route path="/budgets" element={<ComingSoonPage title="Budgets" />} />
```
to:
```jsx
<Route path="/budgets" element={<BudgetsPage {...budgetsProps} />} />
```

- [ ] **Step 4: Verify and commit (together with Task 2 — this task's build only succeeds once `BudgetsPage.jsx` exists)**

Proceed to Task 2, then build/lint/commit both together:
```bash
npm run build && npm run lint
git add src/App.jsx
git commit -m "Wire Budgets page into App.jsx: re-add setBudget/setTotalBudget, add budgetsProps"
```

---

### Task 2: Build `BudgetsPage.jsx`

**Files:**
- Create: `src/pages/BudgetsPage.jsx`

**Interfaces:**
- Consumes: `state, expensesThisMonth, setBudget, setTotalBudget` (Task 1's `budgetsProps`).
- Consumes: `KpiCard`, `Input`, `ProgressBar` (Phase 1/2 primitives); `validateAmount`, `validateAllocation`, `validateTotalBudget` from `src/lib/validation.js`; `formatMoney` from `src/lib/format.js`.

- [ ] **Step 1: Write the component**

```jsx
import { useState } from "react";
import { Wallet, PieChart, Coins } from "lucide-react";
import { validateAmount, validateAllocation, validateTotalBudget } from "../lib/validation.js";
import { formatMoney } from "../lib/format.js";
import KpiCard from "../components/ui/KpiCard.jsx";
import Input from "../components/ui/Input.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";

export default function BudgetsPage({ state, expensesThisMonth, setBudget, setTotalBudget }) {
  const { categories, budgets, settings } = state;
  const currency = settings.currency;
  const totalBudget = settings.totalBudget || 0;

  const [errors, setErrors] = useState({});
  const [totalError, setTotalError] = useState("");

  const spentByCat = {};
  for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;

  const allocated = Object.values(budgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const allocatedPct = totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0;
  const unallocated = totalBudget > 0 ? Math.max(totalBudget - allocated, 0) : 0;

  function handleChange(category, rawValue) {
    if (rawValue) {
      const amountErr = validateAmount(parseFloat(rawValue));
      if (amountErr) { setErrors(prev => ({ ...prev, [category]: amountErr })); return; }
      const allocErr = validateAllocation(parseFloat(rawValue), category, budgets, totalBudget);
      if (allocErr) {
        setErrors(prev => ({ ...prev, [category]: `That would put you ${formatMoney(allocErr.overage, currency)} over your total budget.` }));
        return;
      }
    }
    setErrors(prev => {
      if (!prev[category]) return prev;
      const next = { ...prev };
      delete next[category];
      return next;
    });
    setBudget(category, rawValue);
  }

  function handleTotalChange(rawValue) {
    if (rawValue) {
      const amountErr = validateAmount(parseFloat(rawValue));
      if (amountErr) { setTotalError(amountErr); return; }
      const totalErr = validateTotalBudget(parseFloat(rawValue), budgets);
      if (totalErr) {
        setTotalError(`You've already allocated ${formatMoney(totalErr.allocated, currency)} across categories — lower those first or pick a higher total.`);
        return;
      }
    }
    setTotalError("");
    setTotalBudget(rawValue);
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Budget" value={totalBudget > 0 ? formatMoney(totalBudget, currency) : "Not set"} icon={Wallet} />
        <KpiCard label="Allocated" value={formatMoney(allocated, currency)} icon={PieChart} />
        <KpiCard label="Unallocated" value={totalBudget > 0 ? formatMoney(unallocated, currency) : "—"} icon={Coins} />
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-pr-primary">Total Monthly Budget</span>
          <Input
            type="number" min="0" step="1" placeholder="—"
            defaultValue={totalBudget > 0 ? totalBudget : ""}
            onBlur={e => handleTotalChange(e.target.value)}
            className="w-32"
            error={totalError}
          />
        </div>
        {totalBudget > 0 && (
          <>
            <ProgressBar label="" value={allocatedPct} tone="success" />
            <p className="text-xs text-pr-tertiary">
              {`Allocated ${formatMoney(allocated, currency)} of ${formatMoney(totalBudget, currency)} total`}
            </p>
          </>
        )}
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-pr-primary">Category Budgets</h2>
        {categories.map(c => {
          const limit = Number(budgets[c]) || 0;
          const spent = spentByCat[c] || 0;
          const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const tone = limit > 0 && spent > limit ? "danger" : limit > 0 && spent >= limit * 0.9 ? "warning" : "success";
          return (
            <div key={c} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-pr-primary min-w-0 truncate" title={c}>{c}</span>
                <Input
                  type="number" min="0" step="1" placeholder="—"
                  defaultValue={limit > 0 ? limit : ""}
                  onBlur={e => handleChange(c, e.target.value)}
                  className="w-32"
                  error={errors[c]}
                />
              </div>
              <ProgressBar label="" value={pct} tone={tone} />
              <p className="text-xs text-pr-tertiary">
                {limit > 0 ? `${formatMoney(spent, currency)} of ${formatMoney(limit, currency)}` : `${formatMoney(spent, currency)} spent · no budget set`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

Note: `ProgressBar` (Phase 2) requires a `label` prop and renders it above the bar — passing `label=""` here renders an empty label row above each bar, which is intentional (the category name and the spent/limit text are already shown separately above/below the bar in this layout, so `ProgressBar`'s own label would be redundant). Before treating this as correct, **re-check `ProgressBar.jsx`'s actual JSX** — if an empty-string label still renders a visible empty flex row (extra vertical gap) rather than collapsing to nothing, that's a real layout gap worth a one-line tweak (`{label && <div>...}`) in `ProgressBar.jsx` itself, since every other current/future caller benefits from a component that skips rendering its own label row when none is given. Fix `ProgressBar.jsx` if needed; do not work around it by inventing a fake label string here.

- [ ] **Step 2: Verify `ProgressBar`'s empty-label behavior and fix if needed**

Read `src/components/ui/ProgressBar.jsx`. If its label row (`<span className="text-sm text-pr-primary truncate">{label}</span>`) is unconditionally rendered inside the flex row regardless of whether `label` is truthy, wrap that whole top flex row in a conditional so it only renders when `label` (or `showValue`) is truthy:

```jsx
export default function ProgressBar({ label, value, tone = "success", showValue = false }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col gap-1.5">
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-pr-primary truncate">{label}</span>
          {showValue && <span className="text-xs font-medium text-pr-secondary flex-shrink-0">{pct}%</span>}
        </div>
      )}
      <div className="h-1.5 rounded-pr-pill bg-pr-subtle overflow-hidden">
        <div className={`h-full rounded-pr-pill transition-all ${TONE_CLASS[tone] || TONE_CLASS.success}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

This is a backward-compatible change — every existing caller (`DashboardPage.jsx`'s Budget Health widget) always passes a real `label`, so its rendering is unaffected; only the new `label=""` calls from this page start collapsing the empty row.

- [ ] **Step 3: Full verification (build/lint + code-trace)**

```bash
npm run build && npm run lint
```

Trace by hand: entering an over-allocating category amount shows the exact same error message text as the old `BudgetList.jsx`; entering a total-budget value lower than the current allocated sum shows the exact same "You've already allocated..." message; a category with no budget set shows "spent · no budget set" and no progress-bar label row (per Task 2's fix); the 3 KPI cards show "Not set"/"—" correctly when `totalBudget` is 0.

- [ ] **Step 4: Commit (together with Task 1)**

```bash
git add src/pages/BudgetsPage.jsx src/components/ui/ProgressBar.jsx src/App.jsx
git commit -m "Add BudgetsPage: KPI row, total-budget input, and per-category budget rows (restyle + relocation of BudgetList, zero logic changes)"
```

---

### Final phase review

- [ ] Confirm via `git diff <phase-5-base>..HEAD --stat` that the only modified (not newly-created) files are `src/App.jsx` and `src/components/ui/ProgressBar.jsx` (only if Task 2 Step 2's fix was needed) — `src/pages/BudgetsPage.jsx` is new.
- [ ] Confirm the old `BudgetList.jsx` has zero remaining imports from `BudgetsPage.jsx`.
- [ ] `npm run build` and `npm run lint` clean.
- [ ] Merge into `main`, push, then pause and report to the user before starting Phase 6 (Categories page), per the established phase-by-phase operating mode.
