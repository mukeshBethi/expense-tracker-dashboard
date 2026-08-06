# Monthly Total Budget & Allocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an overall monthly budget ceiling (`state.settings.totalBudget`) that category budgets must collectively respect, blocked (not warned) on over-allocation, fully backward compatible when unset.

**Architecture:** One new field in the existing `settings` map (no schema restructuring), one new mutator in `useExpenseData.js`, two new pure validators in `validation.js`, and UI additions confined to `BudgetList.jsx` + prop-threading in `App.jsx`.

**Tech Stack:** No new dependencies — same React/Firestore stack already in use.

## Global Constraints

- `totalBudget` is an ongoing setting (like category budgets), not stored per-calendar-month (spec: Decisions).
- `0`/absent `totalBudget` means "no constraint" — category budgets behave exactly as today (spec: Scope, backward compatibility).
- Over-allocation is blocked with an inline error, never `alert()`/`confirm()`, consistent with every other validated field in this app (spec: Decisions).
- The overage error message states the actual overage amount using `formatMoney` (spec: Scope — validation).

---

### Task 1: Total budget data layer, validation, and UI

**Files:**
- Modify: `src/hooks/useExpenseData.js` — add `setTotalBudget` mutator, default `totalBudget` in initial/loaded state.
- Modify: `src/lib/validation.js` — add `validateAllocation` and `validateTotalBudget`.
- Modify: `src/components/BudgetList.jsx` — total-budget input, allocation summary, allocation check on category-budget edits.
- Modify: `src/App.jsx` — thread `totalBudget`/`onSetTotalBudget` props to `BudgetList`.

**Interfaces:**
- `validateAllocation(newAmount: number, category: string, budgets: object, totalBudget: number) => { overage: number } | null`
- `validateTotalBudget(newTotal: number, budgets: object) => { allocated: number } | null`
- `setTotalBudget(value: string | number) => void` (mirrors `setCurrency`'s signature/pattern exactly)
- `BudgetList` gains props `totalBudget: number`, `onSetTotalBudget: (value) => void` alongside its existing props.

- [ ] **Step 1: Add `validateAllocation` and `validateTotalBudget` to `src/lib/validation.js`**

`validation.js` has no access to the app's `currency` setting or `formatMoney`, so both functions return `null` (valid) or a small object carrying the raw number — the calling component (`BudgetList.jsx`, Step 3) turns that into a currency-formatted message via `formatMoney`.

Append to the file (after `validateCategoryName`):

```js
export function validateAllocation(newAmount, category, budgets, totalBudget) {
  if (!(totalBudget > 0)) return null;
  let othersSum = 0;
  for (const [cat, val] of Object.entries(budgets)) {
    if (cat === category) continue;
    othersSum += Number(val) || 0;
  }
  const projected = othersSum + (Number(newAmount) || 0);
  if (projected > totalBudget) {
    return { overage: projected - totalBudget };
  }
  return null;
}

export function validateTotalBudget(newTotal, budgets) {
  if (!(newTotal > 0)) return null;
  let allocated = 0;
  for (const val of Object.values(budgets)) allocated += Number(val) || 0;
  if (newTotal < allocated) {
    return { allocated };
  }
  return null;
}
```

- [ ] **Step 2: Add `setTotalBudget` to `src/hooks/useExpenseData.js`**

Add immediately after the existing `setCurrency` callback (follow its exact pattern):

```js
const setTotalBudget = useCallback((value) => {
  setState(prev => {
    const num = parseFloat(value);
    const totalBudget = !value || Number.isNaN(num) || num <= 0 ? 0 : num;
    const settings = { ...prev.settings, totalBudget };
    const next = { ...prev, settings };
    persistProfile(next).catch(err => console.error("Failed to save total budget:", err));
    return next;
  });
}, [persistProfile]);
```

Add `totalBudget` to the two places `settings` gets a default value (the `DEFAULT_STATE` constant, and the `getDoc(...).then(...)` load callback's `settings` object) — default to `0`. Add `setTotalBudget` to the hook's final returned object.

- [ ] **Step 3: Update `src/components/BudgetList.jsx`**

Full replacement for the file:

```jsx
import { useState } from "react";
import { validateAmount, validateAllocation, validateTotalBudget } from "../lib/validation.js";
import { formatMoney } from "../lib/format.js";

export default function BudgetList({ categories, budgets, expensesThisMonth, currency, onSetBudget, totalBudget, onSetTotalBudget }) {
  const [errors, setErrors] = useState({});
  const [totalError, setTotalError] = useState("");
  const spentByCat = {};
  for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;

  const allocated = Object.values(budgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const allocatedPct = totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0;

  function handleChange(category, rawValue) {
    if (rawValue) {
      const amountErr = validateAmount(parseFloat(rawValue));
      if (amountErr) {
        setErrors(prev => ({ ...prev, [category]: amountErr }));
        return;
      }
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

  return (
    <div className="budget-list">
      <div className="budget-row total-budget-row">
        <div className="budget-head">
          <span className="b-cat">Total Monthly Budget</span>
          <input type="number" min="0" step="1" placeholder="—"
                 defaultValue={totalBudget > 0 ? totalBudget : ""}
                 onBlur={e => handleTotalChange(e.target.value)} />
        </div>
        {totalError && <p className="field-error">{totalError}</p>}
        {totalBudget > 0 && (
          <>
            <div className="bar"><span style={{ width: `${allocatedPct}%` }} /></div>
            <div className="budget-meta">
              {`Allocated ${formatMoney(allocated, currency)} of ${formatMoney(totalBudget, currency)} total`}
            </div>
          </>
        )}
      </div>

      {categories.map(c => {
        const limit = Number(budgets[c]) || 0;
        const spent = spentByCat[c] || 0;
        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const cls = limit > 0 && spent > limit ? "over" : limit > 0 && spent >= limit * 0.9 ? "warn" : "";
        return (
          <div className="budget-row" key={c}>
            <div className="budget-head">
              <span className="b-cat">{c}</span>
              <input type="number" min="0" step="1" placeholder="—"
                     defaultValue={limit > 0 ? limit : ""}
                     onBlur={e => handleChange(c, e.target.value)} />
            </div>
            {errors[c] && <p className="field-error">{errors[c]}</p>}
            <div className={`bar ${cls}`}><span style={{ width: `${pct}%` }} /></div>
            <div className="budget-meta">
              {limit > 0 ? `${formatMoney(spent, currency)} of ${formatMoney(limit, currency)}` : `${formatMoney(spent, currency)} spent · no budget set`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Wire the new props in `src/App.jsx`**

Find where `useExpenseData` is destructured and add `setTotalBudget` to the destructured list. Find the `<BudgetList ... />` element and add two props:

```jsx
totalBudget={state.settings.totalBudget || 0}
onSetTotalBudget={setTotalBudget}
```

- [ ] **Step 5: Verify manually**

Run `npm run dev`. Sign in, go to Monthly Budgets: set a Total Monthly Budget of `500`. Set a category budget of `600` on any category → confirm the inline error appears ("That would put you $100.00 over your total budget.") and the value is NOT saved (check Firestore console or reload to confirm). Set that category to `300` instead → succeeds, allocation summary shows "Allocated $300.00 of $500.00 total" with a partial progress bar. Try lowering the total budget to `200` → blocked with the allocation error. Clear the total budget field entirely (blur with empty value) → total budget becomes unset, allocation summary disappears, and category budgets can now be set freely again without any allocation constraint. Sign out and back in → total budget value persisted.

- [ ] **Step 6: Run build/lint and commit**

```bash
npm run build
npm run lint
git add src/hooks/useExpenseData.js src/lib/validation.js src/components/BudgetList.jsx src/App.jsx
git commit -m "Add monthly total budget with per-category allocation limits"
```
