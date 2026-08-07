# Procura Redesign — Phase 6: Categories Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/categories` — a "category cards grid" (per the master spec, replacing the old pill-chip list) plus an add-category form. Reuses `addCategory`/`removeCategory`/`validateCategoryName` exactly as-is, and the exact same "can't remove a category that's in use" guard `CategoryManager.jsx` already has — zero validation-rule changes, only the visual presentation and the removal-confirmation UI change (old raw `ConfirmDialog` → Phase 3's `ConfirmModal`).

**Architecture:** `CategoriesPage.jsx` inlines `CategoryManager.jsx`'s exact `handleAdd`/`handleRemove` logic. The one behavioral upgrade: each card additionally shows the category's all-time expense count and total spent (not present in the old pill list, but trivial to compute from `state.expenses` and gives the "cards grid" real content instead of being a plain relabeled list). Removal confirmation moves from the old raw `ConfirmDialog` to Phase 3's `ConfirmModal`, with the confirmation state owned locally by this page (page-local, same pattern Phase 4/5 established) rather than lifted to `App.jsx`.

**Tech Stack:** No new dependencies. Reuses `src/lib/validation.js` (`validateCategoryName`) verbatim.

## Global Constraints

- `src/lib/validation.js` is not modified.
- The "in-use category can't be removed" check (`expenses.some(e => e.category === cat)`) runs BEFORE opening any confirmation UI — same order as `CategoryManager.jsx` — so a blocked removal never flashes a confirm modal it's about to reject.
- Every interactive element gets `cursor-pointer` explicitly.
- The old `CategoryManager.jsx` remains dead code (per Phase 3's convention) — this phase doesn't touch it, doesn't delete it.

## Reused logic (verbatim source of truth — copy exactly)

From `CategoryManager.jsx`:
```js
function handleAdd(name, categories) {
  return validateCategoryName(name, categories); // null if valid, else an error string
}
function canRemove(cat, expenses) {
  return !expenses.some(e => e.category === cat); // false => "in use", show inline error, do not open confirm
}
```

---

### Task 1: Wire `App.jsx` for the Categories page

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Re-adds `addCategory`, `removeCategory` to the `useExpenseData` destructuring (removed in Phase 3 since nothing used them at the time).
- Produces `categoriesProps`: `{ state, setToastMessage }` (categories/expenses come from `state`; a toast confirms add/remove, reusing the existing `toastMessage`/`setToastMessage` already in `App.jsx` — but NOT the rest of `sharedExpenseModalProps`, since this page has no expense-modal or single-expense-delete concerns of its own).
- Replaces the `/categories` route's `<ComingSoonPage title="Categories" />` with `<CategoriesPage {...categoriesProps} />`.

- [ ] **Step 1: Re-add the two mutators to the hook destructuring**

Change:
```jsx
const { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, setBudget, setTotalBudget, setThemePreference } = useExpenseData(user?.uid);
```
to:
```jsx
const { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, addCategory, removeCategory, setBudget, setTotalBudget, setThemePreference } = useExpenseData(user?.uid);
```

- [ ] **Step 2: Import `CategoriesPage` and add `categoriesProps`**

Add the import alongside the other page imports:
```jsx
import CategoriesPage from "./pages/CategoriesPage.jsx";
```
Add, right after `budgetsProps` is built:
```jsx
const categoriesProps = { state, addCategory, removeCategory, toastMessage, dismissToast, setToastMessage };
```

Note: `toastMessage`/`dismissToast` are included too (not just `setToastMessage`) so the page can render the same `Toast` primitive Dashboard/Expenses already do, confirming a successful add/remove — this matches the interface note above's intent even though the header text listed only `setToastMessage`; include all three toast-related props (`toastMessage, dismissToast, setToastMessage`) for a consistent, fully-working toast, not a partial one.

- [ ] **Step 3: Swap the route**

Change:
```jsx
<Route path="/categories" element={<ComingSoonPage title="Categories" />} />
```
to:
```jsx
<Route path="/categories" element={<CategoriesPage {...categoriesProps} />} />
```

- [ ] **Step 4: Verify and commit (together with Task 2 — this task's build only succeeds once `CategoriesPage.jsx` exists)**

Proceed to Task 2, then build/lint/commit both together:
```bash
npm run build && npm run lint
git add src/App.jsx
git commit -m "Wire Categories page into App.jsx: re-add addCategory/removeCategory, add categoriesProps"
```

---

### Task 2: Build `CategoriesPage.jsx`

**Files:**
- Create: `src/pages/CategoriesPage.jsx`

**Interfaces:**
- Consumes: `state, addCategory, removeCategory, toastMessage, dismissToast, setToastMessage` (Task 1's `categoriesProps`).
- Consumes: `Input`, `Button`, `Toast` (Phase 1/2 primitives); `ConfirmModal` (Phase 3); `validateCategoryName` from `src/lib/validation.js`; `Trash2` icon from `lucide-react`.
- Owns local state: `name` (add-category input), `addError`, `removeError`, `confirmRemoveCategory` (string or `null`).

- [ ] **Step 1: Write the component**

```jsx
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { validateCategoryName } from "../lib/validation.js";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Toast from "../components/ui/Toast.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

export default function CategoriesPage({ state, addCategory, removeCategory, toastMessage, dismissToast, setToastMessage }) {
  const { categories, expenses } = state;
  const [name, setName] = useState("");
  const [addError, setAddError] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [confirmRemoveCategory, setConfirmRemoveCategory] = useState(null);

  const statsByCategory = {};
  for (const c of categories) statsByCategory[c] = { count: 0, total: 0 };
  for (const e of expenses) {
    if (!statsByCategory[e.category]) continue;
    statsByCategory[e.category].count += 1;
    statsByCategory[e.category].total += e.amount;
  }

  function handleAdd(evt) {
    evt.preventDefault();
    const err = validateCategoryName(name, categories);
    if (err) { setAddError(err); return; }
    addCategory(name.trim());
    setName("");
    setAddError("");
    setToastMessage("Category added.");
  }

  function handleRequestRemove(cat) {
    if (expenses.some(e => e.category === cat)) {
      setRemoveError(`"${cat}" is used by existing expenses and can't be removed.`);
      return;
    }
    setRemoveError("");
    setConfirmRemoveCategory(cat);
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <form onSubmit={handleAdd} className="flex gap-3 items-end">
        <Input
          placeholder="Add a category…" maxLength={24}
          value={name} onChange={e => setName(e.target.value)}
          error={addError}
          className="flex-1 max-w-sm"
        />
        <Button type="submit">Add category</Button>
      </form>

      {removeError && <p className="text-sm text-pr-danger">{removeError}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => {
          const stats = statsByCategory[c] || { count: 0, total: 0 };
          return (
            <div key={c} className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-pr-primary truncate" title={c}>{c}</span>
                <button
                  onClick={() => handleRequestRemove(c)} aria-label={`Remove ${c}`} title={`Remove ${c}`}
                  className="w-8 h-8 flex items-center justify-center rounded-pr-default text-pr-secondary hover:bg-pr-danger-soft hover:text-pr-danger transition-colors cursor-pointer flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-xs text-pr-tertiary">
                {stats.count} {stats.count === 1 ? "expense" : "expenses"} · {stats.total.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={confirmRemoveCategory !== null}
        title="Remove category"
        message={confirmRemoveCategory ? `Remove category "${confirmRemoveCategory}"? This cannot be undone.` : ""}
        onConfirm={() => { removeCategory(confirmRemoveCategory); setConfirmRemoveCategory(null); setToastMessage("Category removed."); }}
        onCancel={() => setConfirmRemoveCategory(null)}
      />
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast tone="success" title={toastMessage} onClose={dismissToast} />
        </div>
      )}
    </div>
  );
}
```

Note: the per-card total-spent text (`stats.total.toFixed(2)`) does NOT go through `formatMoney` — this is a real gap, not a stylistic choice: every other money value in this entire app (Dashboard, Expenses, Budgets) is formatted with the currency symbol via `formatMoney(amount, currency)`, and this page has `state.settings.currency` available (`state` is passed in whole). **Fix this before verifying**: import `formatMoney` from `../lib/format.js` and render `formatMoney(stats.total, state.settings.currency)` instead of the raw `.toFixed(2)`. This was written wrong in this plan and must not be copied as-is.

- [ ] **Step 2: Apply the `formatMoney` fix from the note above**

```jsx
import { formatMoney } from "../lib/format.js";
```
and
```jsx
{stats.count} {stats.count === 1 ? "expense" : "expenses"} · {formatMoney(stats.total, state.settings.currency)}
```

- [ ] **Step 3: Full verification (build/lint + code-trace)**

```bash
npm run build && npm run lint
```

Trace by hand: adding a duplicate category name (case-insensitive) shows the exact same error as `validateCategoryName` produces today; adding a 25+ character name shows the same length error; attempting to remove a category that has at least one expense shows the inline `removeError` text and does NOT open `ConfirmModal`; removing an unused category opens `ConfirmModal`, and confirming calls `removeCategory` and shows the "Category removed." toast; every dollar amount on the page renders through `formatMoney` (per Step 2's fix).

- [ ] **Step 4: Commit (together with Task 1)**

```bash
git add src/pages/CategoriesPage.jsx src/App.jsx
git commit -m "Add CategoriesPage: category cards grid with per-category stats, add form, and removal guard (restyle + relocation of CategoryManager, zero validation changes)"
```

---

### Final phase review

- [ ] Confirm via `git diff <phase-6-base>..HEAD --stat` that the only modified (not newly-created) file is `src/App.jsx` — `src/pages/CategoriesPage.jsx` is new.
- [ ] Confirm the old `CategoryManager.jsx` has zero remaining imports from `CategoriesPage.jsx`.
- [ ] Confirm every dollar amount on the page renders through `formatMoney` (the Step 2 fix specifically) — grep the file for `.toFixed(` and confirm zero matches outside of `format.js` itself.
- [ ] `npm run build` and `npm run lint` clean.
- [ ] Merge into `main`, push, then pause and report to the user before starting Phase 7 (Analytics page), per the established phase-by-phase operating mode.
