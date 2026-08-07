# Procura Redesign — Phase 3: Dashboard Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/` (Dashboard) using the Procura primitives from Phases 1-2, wired to the real Firebase-backed data (`useExpenseData`), replacing the old emerald inline-form layout. This is the first page phase — it also introduces the shared Add/Edit-Expense modal flow (`ExpenseFormModal`) and a Procura-styled delete confirmation (`ConfirmModal`), both of which Phase 4 (Expenses page) will reuse rather than rebuild.

**Architecture:** `App.jsx` keeps owning all state and Firestore-mutator wiring (unchanged pattern) but its `dashboardProps` shrinks to only what the new Dashboard actually needs — category/budget management, filtering, and the old `ExpenseTable` move to their own pages in later phases and are simply not passed down yet (their state stays in `App.jsx`, unused by Dashboard, ready for Phase 4-6). `DashboardPage.jsx` is a full rewrite: 4 KPI cards, a 14-day trend line, a this-month category pie, a top-4-by-%-used budget health list, and a 6-row recent-transactions table — all built from `KpiCard`/`LineChart`/`PieChart`/`ProgressBar`/`DataTable` (Phase 2) plus the two new components this phase adds.

**Tech Stack:** Existing `react-chartjs-2`/`chart.js`, `lucide-react`. No new dependencies. Reuses `src/lib/validation.js` and `src/lib/format.js` verbatim — zero validation-rule changes.

## Global Constraints

- Every dollar amount goes through `formatMoney(amount, currency)` from `src/lib/format.js` — never format money inline.
- Every KPI/chart/budget calculation in this phase is a direct port of an existing, already-correct formula (see the "Reused math" section below) — do not invent new formulas or edge-case handling.
- `src/lib/validation.js` and `src/lib/format.js` are not modified.
- `src/hooks/useAuth.js`, `src/hooks/useExpenseData.js`, `src/hooks/useTheme.js` are not modified.
- The old `CategoryManager.jsx`, `BudgetList.jsx`, `SummaryCards.jsx`, `AlertBanner.jsx`, `TrendChart.jsx`, `CategoryChart.jsx`, `ExpenseTable.jsx`, `ExpenseForm.jsx`, `ConfirmDialog.jsx`, `Toast.jsx` (the old one) become dead code once this phase lands (zero remaining imports) — this is expected and intentional; they are removed only in Phase 9 (Cleanup), not this phase. Do not delete them now.
- Every interactive element gets `cursor-pointer` explicitly (project convention, since Tailwind Preflight resets buttons to `cursor: default`).
- `todayISO()` (local-timezone-adjusted date string) is duplicated today in both `App.jsx` and `ExpenseForm.jsx` — this phase adds a third legitimate use in `ExpenseFormModal.jsx`. Do not deduplicate into a shared util as part of this phase (out of scope, not blocking); note it for Phase 9.

## Reused math (verbatim source of truth — copy these exactly, do not re-derive)

From `SummaryCards.jsx`:
```js
function monthKey(iso) { return iso.slice(0, 7); }
// this month's total = sum of expensesThisMonth amounts (already computed in App.jsx)
// top category this month:
const byCatMonth = {};
for (const e of expensesThisMonth) byCatMonth[e.category] = (byCatMonth[e.category] || 0) + e.amount;
let topCategory = "—", topAmt = -1;
for (const [cat, amt] of Object.entries(byCatMonth)) { if (amt > topAmt) { topCategory = cat; topAmt = amt; } }
// month-over-month delta (only meaningful if prevMonthToDate > 0):
function sumForMonthUpToDay(expenses, monthK, dayOfMonth) {
  let total = 0;
  for (const e of expenses) {
    if (monthKey(e.date) !== monthK) continue;
    const day = Number(e.date.slice(8, 10));
    if (day <= dayOfMonth) total += e.amount;
  }
  return total;
}
```

From `BudgetList.jsx` (per-category % used, for the budget-health widget):
```js
const spentByCat = {};
for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
const limit = Number(budgets[c]) || 0;
const spent = spentByCat[c] || 0;
const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
const tone = limit > 0 && spent > limit ? "danger" : limit > 0 && spent >= limit * 0.9 ? "warning" : "success";
```

From `AlertBanner.jsx` (over-budget categories, reused as an Alert instead of a bespoke banner):
```js
const over = categories.filter(c => {
  const limit = Number(budgets[c]) || 0;
  return limit > 0 && (spentByCat[c] || 0) > limit;
});
```

---

### Task 1: Restyle `Combobox.jsx` to Procura tokens

**Files:**
- Modify: `src/components/Combobox.jsx`

**Why now, why here:** `ExpenseFormModal` (Task 2) needs a category picker inside a `pr-card`-styled `Modal`. `Combobox.jsx` currently uses the old emerald tokens (`bg-surface-2`, `border-border-dim`, `text-primary`, `shadow-soft`) — those tokens still compile (old system coexists with `pr-*` per the established migration pattern) but would render an emerald-blue focus ring and emerald accent color inside an otherwise all-navy modal, a visible inconsistency on the very first page of the new design. `Combobox` is explicitly called out in the master spec as staying in use project-wide for category pickers, so it gets restyled once, here, rather than left inconsistent through every future phase that touches a category field.

**Interfaces:** No prop or behavior change — same `{ id, options, value, onChange, placeholder, allowClear, clearLabel }` signature, same keyboard/click-outside logic. Only Tailwind classes change.

- [ ] **Step 1: Replace the input's className**

In `src/components/Combobox.jsx`, find the `<input ... className="w-full bg-surface-2 border border-border-dim rounded-input pl-3 pr-8 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-text" />` and replace the className with:

```jsx
className="w-full bg-pr-subtle border border-pr-border-default rounded-pr-default pl-3 pr-8 py-2.5 text-sm text-pr-primary placeholder:text-pr-tertiary focus:outline-none focus:ring-2 focus:ring-pr-accent/30 focus:border-pr-accent transition-colors cursor-text"
```

- [ ] **Step 2: Replace the icons' className**

Both `<Search .../>` and `<ChevronDown .../>` currently use `className="w-4 h-4 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"`. Replace `text-muted` with `text-pr-tertiary` in both.

- [ ] **Step 3: Replace the listbox `<ul>` className**

```jsx
className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-pr-card shadow-pr-md rounded-pr-default border border-pr-border-default py-1"
```

- [ ] **Step 4: Replace each `<li>` className**

```jsx
className={`px-3 py-2 text-sm cursor-pointer ${i === highlightedIndex ? "bg-pr-subtle" : ""} ${opt === value ? "text-pr-accent font-medium" : "text-pr-primary"}`}
```

Also change the "No matches" `<li>`'s className from `"px-3 py-2 text-sm text-muted"` to `"px-3 py-2 text-sm text-pr-tertiary"`.

- [ ] **Step 5: Verify no other component broke**

`Combobox` is currently used by the OLD `ExpenseForm.jsx` and the OLD `DashboardPage.jsx` (category filter dropdown) — both still render today until this phase's later tasks replace them. Since only Tailwind classes changed (no prop/behavior change), those call sites keep working, just now with `pr-*` visual styling — which is fine since they're being removed within this same phase anyway. Run `npm run build`, confirm no errors.

```bash
npm run build && npm run lint
git add src/components/Combobox.jsx
git commit -m "Restyle Combobox to Procura tokens ahead of the Dashboard rebuild"
```

---

### Task 2: `ExpenseFormModal` — shared Add/Edit modal

**Files:**
- Create: `src/components/ExpenseFormModal.jsx`

**Interfaces:**
- `ExpenseFormModal({ open, categories, editingExpense, onSubmit, onClose })` — `editingExpense` is `null` for "add" mode or an `{ id, date, amount, category, note }` object for "edit" mode. `onSubmit(expense)` receives `{ date, amount, category, note }` (no `id` — the caller already knows whether it's adding or updating via `editingExpense`). `onClose()` is called on Cancel, on successful submit, and on the Modal's own close paths (Escape/backdrop).
- Consumes: `validateDate`, `validateAmount`, `validateCategory` from `src/lib/validation.js`; `formatAmountInput`, `parseAmountInput` from `src/lib/format.js`; `Modal`, `Input`, `Button` (Phase 1/2 primitives); `Combobox` (Task 1, restyled).

- [ ] **Step 1: Write the component**

```jsx
import { useState, useEffect } from "react";
import { validateDate, validateAmount, validateCategory } from "../lib/validation.js";
import { formatAmountInput, parseAmountInput } from "../lib/format.js";
import Combobox from "./Combobox.jsx";
import Modal from "./ui/Modal.jsx";
import Input from "./ui/Input.jsx";
import Button from "./ui/Button.jsx";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function ExpenseFormModal({ open, categories, editingExpense, onSubmit, onClose }) {
  const [date, setDate] = useState(todayISO());
  const [amountDisplay, setAmountDisplay] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (editingExpense) {
      setDate(editingExpense.date);
      setAmountDisplay(formatAmountInput(String(editingExpense.amount)));
      setCategory(editingExpense.category);
      setNote(editingExpense.note || "");
    } else {
      setDate(todayISO());
      setAmountDisplay("");
      setCategory(categories[0] || "");
      setNote("");
    }
    setErrors({});
  }, [open, editingExpense, categories]);

  function handleAmountChange(evt) {
    setAmountDisplay(formatAmountInput(evt.target.value));
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    const amount = parseAmountInput(amountDisplay);
    const nextErrors = {
      date: validateDate(date, todayISO()),
      amount: validateAmount(amount),
      category: validateCategory(category),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    onSubmit({ date, amount, category, note: note.trim() });
    onClose();
  }

  return (
    <Modal
      open={open}
      title={editingExpense ? "Edit Expense" : "Add Expense"}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" form="expense-form-modal" className="flex-1">{editingExpense ? "Save" : "Add"}</Button>
        </div>
      }
    >
      <form id="expense-form-modal" onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
        <Input label="Date" type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} error={errors.date} />
        <Input label="Amount" type="text" inputMode="decimal" placeholder="0.00" value={amountDisplay} onChange={handleAmountChange} error={errors.amount} />
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-pr-tertiary mb-1.5 block">Category</label>
          <Combobox options={categories} value={category} onChange={setCategory} placeholder="Select a category…" />
          {errors.category && <p className="text-xs text-pr-danger mt-1">{errors.category}</p>}
        </div>
        <Input label="Note" type="text" maxLength={120} placeholder="e.g. Lunch with team" value={note} onChange={e => setNote(e.target.value)} helper="Optional" />
      </form>
    </Modal>
  );
}
```

Note: the submit `Button` uses `form="expense-form-modal"` so it can live in the `Modal`'s `footer` slot (rendered outside the `<form>` element) while still submitting it — standard HTML `form` attribute association. Verify `Button.jsx` (Phase 1) forwards arbitrary props like `form` and `type` through to the underlying `<button>` — it does (see its signature: `type` is already a named prop with a default, and `form` would need to pass through via the rest of the props). **Before writing this, re-check `src/components/ui/Button.jsx`'s actual signature** — if it does NOT spread extra props (`...rest`) onto the `<button>`, `form="expense-form-modal"` will be silently dropped and the Save button won't submit the form. If that's the case, add `...rest` spreading to `Button.jsx` in this task (a one-line, backward-compatible addition — every existing call site keeps working, this only adds pass-through for props nobody was using before).

- [ ] **Step 2: Verify `Button.jsx` passes through `form`/`type` correctly, fixing it if not**

Read `src/components/ui/Button.jsx`. If its function signature is `Button({ variant = "primary", icon: Icon, children, onClick, type = "button", disabled, className = "" })` with no `...rest`, add `...rest` to the destructuring and spread `{...rest}` onto the `<button>` element (after `className`, so `rest` can't accidentally clobber the computed `className` — though `rest` won't contain a `className` key since it's already destructured out). This is the only edit to `Button.jsx` in this phase.

- [ ] **Step 3: Verify and commit**

Scratch-mount `ExpenseFormModal` (temporarily, in `App.jsx`, forced `open=true`, fake `categories=["Food","Rent"]`, `editingExpense=null`) to confirm it renders: title "Add Expense", date/amount/category/note fields, Cancel + Add buttons in the footer, clicking Add with an empty amount shows the amount validation error inline (trace by hand: `validateAmount(0)` — check `src/lib/validation.js` to confirm what it returns for `0` — must be a non-empty string, i.e. amount must be `>0` per this project's existing rule). Repeat with `editingExpense={ id: "x", date: "2026-08-01", amount: 12.5, category: "Food", note: "test" }` and confirm the form pre-fills. Remove scratch code before committing.

```bash
npm run build && npm run lint
git add src/components/ExpenseFormModal.jsx src/components/ui/Button.jsx
git commit -m "Add shared ExpenseFormModal for add/edit expense flows"
```

---

### Task 3: `ConfirmModal` — Procura-styled destructive-action confirmation

**Files:**
- Create: `src/components/ConfirmModal.jsx`

**Interfaces:**
- `ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel })` — `confirmLabel` defaults to `"Delete"`. Renders an `Alert tone="danger"` with `message` as its body inside a `Modal`, with `Cancel`/`confirmLabel` buttons in the footer (`Cancel` is `variant="secondary"`, the confirm button is `variant="danger"`).
- Consumes: `Modal`, `Alert`, `Button` (Phase 1/2 primitives).

This does NOT replace the old `ConfirmDialog.jsx` used by other still-not-yet-rebuilt flows (category removal, clear-all) — those keep using the old component, unchanged, until the phases that rebuild Categories (Phase 6) and Settings (Phase 8) land. `ConfirmModal` is used starting this phase only for expense deletion, from the new Dashboard's recent-transactions table.

- [ ] **Step 1: Write the component**

```jsx
import Modal from "./ui/Modal.jsx";
import Alert from "./ui/Alert.jsx";
import Button from "./ui/Button.jsx";

export default function ConfirmModal({ open, title = "Confirm", message, onConfirm, onCancel, confirmLabel = "Delete" }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">{confirmLabel}</Button>
        </div>
      }
    >
      <Alert tone="danger">{message}</Alert>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify and commit**

Scratch-mount with `open=true`, `message="Delete this expense? This cannot be undone."`, confirm it renders inside a working `Modal` with the danger `Alert` styling. Remove scratch code before committing.

```bash
npm run build && npm run lint
git add src/components/ConfirmModal.jsx
git commit -m "Add ConfirmModal for Procura-styled destructive-action confirmation"
```

---

### Task 4: Rewire `App.jsx` for the new Dashboard

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: a new `isExpenseModalOpen` boolean state and `openExpenseModal(expense)` / `closeExpenseModal()` helpers, passed to `Shell` (replacing the current no-op `onOpenAdd={() => setEditingExpense(null)}`) and to the new `dashboardProps`.
- `dashboardProps` shrinks to only what the new `DashboardPage` (Task 5) needs: `state`, `theme`, `expensesThisMonth`, `isExpenseModalOpen`, `openExpenseModal`, `closeExpenseModal`, `editingExpense`, `handleFormSubmit`, `confirmDeleteId`, `setConfirmDeleteId`, `deleteExpense`, `toastMessage`, `dismissToast`, `setToastMessage`. Everything else currently in `dashboardProps` (`setCurrency`, `addCategory`, `setConfirmRemoveCategory`, `setBudget`, `setTotalBudget`, `filteredExpenses`, `filterCategory`, `setFilterCategory`, `search`, `setSearch`, `sort`, `setSort`, `setConfirmClearAll`, `confirmRemoveCategory`, `removeCategory`, `confirmClearAll`, `clearAll`) stays defined in `App.jsx` (still needed by later phases) but is no longer passed to `DashboardPage` — it has nothing to do with those anymore.

- [ ] **Step 1: Add expense-modal state and helpers**

Add, right after the existing `dismissToast` `useCallback`:

```jsx
const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

const openExpenseModal = useCallback((expense = null) => {
  setEditingExpense(expense);
  setIsExpenseModalOpen(true);
}, []);

const closeExpenseModal = useCallback(() => {
  setIsExpenseModalOpen(false);
  setEditingExpense(null);
}, []);
```

- [ ] **Step 2: Update `handleFormSubmit` to close the modal after submit**

Current:
```jsx
function handleFormSubmit(expense) {
  if (editingExpense) updateExpense(editingExpense.id, expense);
  else addExpense(expense);
  setToastMessage(editingExpense ? "Expense updated." : "Expense added.");
}
```
`ExpenseFormModal` (Task 2) already calls `onClose()` itself after a successful submit, so `handleFormSubmit` does NOT need to close the modal — leave it exactly as-is. (Verifying this explicitly here so it isn't "fixed" redundantly: the modal owns its own close-after-submit behavior, `handleFormSubmit` only owns the Firestore write + toast, same separation of concerns as today.)

- [ ] **Step 3: Replace the `Shell`'s `onOpenAdd` prop**

Change:
```jsx
onOpenAdd={() => setEditingExpense(null)}
```
to:
```jsx
onOpenAdd={() => openExpenseModal(null)}
```

- [ ] **Step 4: Shrink `dashboardProps`**

Replace the current `dashboardProps` object with:

```jsx
const dashboardProps = {
  state, theme, expensesThisMonth,
  isExpenseModalOpen, openExpenseModal, closeExpenseModal, editingExpense, handleFormSubmit,
  confirmDeleteId, setConfirmDeleteId, deleteExpense,
  toastMessage, dismissToast, setToastMessage,
};
```

- [ ] **Step 5: Verify no other route needs the removed props yet**

`ComingSoonPage` (rendered for `/expenses`, `/budgets`, `/analytics`, `/categories`, `/settings`) only takes a `title` prop — confirm via `grep -n "ComingSoonPage" src/App.jsx` that none of the `<Route>` elements for those paths spread `dashboardProps` or any of the removed variables into `ComingSoonPage`. They don't today (each is `<ComingSoonPage title="..." />`), so this step is a sanity check, not an expected fix.

- [ ] **Step 6: Verify and commit**

```bash
npm run build && npm run lint
git add src/App.jsx
git commit -m "Wire Add/Edit-expense modal state into App.jsx, shrink dashboardProps for the new Dashboard page"
```

---

### Task 5: Rewrite `DashboardPage.jsx`

**Files:**
- Modify: `src/pages/DashboardPage.jsx` (full rewrite — the file keeps its name/route position but nearly all content changes)

**Interfaces:**
- Consumes exactly the trimmed prop list from Task 4: `state, theme, expensesThisMonth, isExpenseModalOpen, openExpenseModal, closeExpenseModal, editingExpense, handleFormSubmit, confirmDeleteId, setConfirmDeleteId, deleteExpense, toastMessage, dismissToast, setToastMessage`.
- Consumes: `KpiCard`, `ProgressBar`, `DataTable`, `LineChart`, `PieChart`, `Alert`, `Toast` (new, Procura-styled) from `src/components/ui/`; `ExpenseFormModal`, `ConfirmModal` from Task 2/3; `formatMoney` from `src/lib/format.js`.

- [ ] **Step 1: Write the data-derivation logic at the top of the component**

```jsx
import { useMemo } from "react";
import { TrendingUp, Wallet, Tag, Receipt, Pencil, Trash2 } from "lucide-react";
import { formatMoney } from "../lib/format.js";
import KpiCard from "../components/ui/KpiCard.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import LineChart from "../components/ui/LineChart.jsx";
import PieChart from "../components/ui/PieChart.jsx";
import Alert from "../components/ui/Alert.jsx";
import Toast from "../components/ui/Toast.jsx";
import ExpenseFormModal from "../components/ExpenseFormModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const VIZ_PALETTE = ["#2D63EA", "#16A34A", "#D97706", "#E11D48", "#7C3AED", "#0891B2", "#EA580C", "#4A6290"];

function monthKey(iso) { return iso.slice(0, 7); }
function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function sumForMonthUpToDay(expenses, monthK, dayOfMonth) {
  let total = 0;
  for (const e of expenses) {
    if (monthKey(e.date) !== monthK) continue;
    const day = Number(e.date.slice(8, 10));
    if (day <= dayOfMonth) total += e.amount;
  }
  return total;
}

export default function DashboardPage({
  state, theme, expensesThisMonth,
  isExpenseModalOpen, openExpenseModal, closeExpenseModal, editingExpense, handleFormSubmit,
  confirmDeleteId, setConfirmDeleteId, deleteExpense,
  toastMessage, dismissToast, setToastMessage,
}) {
  const currency = state.settings.currency;

  const monthTotal = useMemo(() => expensesThisMonth.reduce((sum, e) => sum + e.amount, 0), [expensesThisMonth]);

  const monthDelta = useMemo(() => {
    const today = todayISO();
    const monthK = today.slice(0, 7);
    const dayOfMonth = Number(today.slice(8, 10));
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    const prevMonthK = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 7);
    const prevMonthToDate = sumForMonthUpToDay(state.expenses, prevMonthK, dayOfMonth);
    if (prevMonthToDate <= 0) return null;
    const pct = ((monthTotal - prevMonthToDate) / prevMonthToDate) * 100;
    return { text: `${pct >= 0 ? "+" : ""}${Math.round(pct)}%`, trend: pct < 0 ? "down" : "up" };
  }, [state.expenses, monthTotal]);

  const topCategory = useMemo(() => {
    const byCat = {};
    for (const e of expensesThisMonth) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    let top = "—", topAmt = -1;
    for (const [cat, amt] of Object.entries(byCat)) { if (amt > topAmt) { top = cat; topAmt = amt; } }
    return top;
  }, [expensesThisMonth]);

  const totalBudget = state.settings.totalBudget || 0;
  const budgetRemaining = totalBudget - monthTotal;

  const trendSeries = useMemo(() => {
    const byDay = {};
    for (const e of state.expenses) byDay[e.date] = (byDay[e.date] || 0) + e.amount;
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      days.push(iso);
    }
    return {
      labels: days.map(iso => iso.slice(5)),
      points: days.map(iso => byDay[iso] || 0),
    };
  }, [state.expenses]);

  const categoryPieData = useMemo(() => {
    const byCat = {};
    for (const e of expensesThisMonth) byCat[e.category] = (byCat[e.category] || 0) + e.amount;
    return Object.entries(byCat).map(([label, value], i) => ({ label, value, color: VIZ_PALETTE[i % VIZ_PALETTE.length] }));
  }, [expensesThisMonth]);

  const spentByCat = useMemo(() => {
    const map = {};
    for (const e of expensesThisMonth) map[e.category] = (map[e.category] || 0) + e.amount;
    return map;
  }, [expensesThisMonth]);

  const budgetHealth = useMemo(() => {
    return state.categories
      .map(c => {
        const limit = Number(state.budgets[c]) || 0;
        const spent = spentByCat[c] || 0;
        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const tone = limit > 0 && spent > limit ? "danger" : limit > 0 && spent >= limit * 0.9 ? "warning" : "success";
        return { category: c, limit, spent, pct, tone };
      })
      .filter(b => b.limit > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }, [state.categories, state.budgets, spentByCat]);

  const overBudgetCategories = useMemo(
    () => state.categories.filter(c => (Number(state.budgets[c]) || 0) > 0 && (spentByCat[c] || 0) > Number(state.budgets[c])),
    [state.categories, state.budgets, spentByCat]
  );

  const recentExpenses = useMemo(
    () => [...state.expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 6),
    [state.expenses]
  );

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {overBudgetCategories.length > 0 && (
        <Alert tone="danger" title="Over budget this month">{overBudgetCategories.join(", ")}</Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Spent This Month" value={formatMoney(monthTotal, currency)} delta={monthDelta?.text} trend={monthDelta?.trend} icon={TrendingUp} />
        <KpiCard label="Budget Remaining" value={totalBudget > 0 ? formatMoney(budgetRemaining, currency) : "No budget set"} icon={Wallet} />
        <KpiCard label="Top Category" value={topCategory} icon={Tag} />
        <KpiCard label="Entries Logged" value={state.expenses.length} icon={Receipt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-pr-primary">14-Day Trend</h2>
          {state.expenses.length === 0 ? (
            <p className="text-sm text-pr-secondary py-8 text-center">No expenses yet.</p>
          ) : (
            <LineChart series={[{ label: "Spend", color: "#2D63EA", points: trendSeries.points }]} xLabels={trendSeries.labels} theme={theme} />
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

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-pr-primary">Budget Health</h2>
        {budgetHealth.length === 0 ? (
          <p className="text-sm text-pr-secondary">No budgets set yet.</p>
        ) : (
          budgetHealth.map(b => (
            <ProgressBar key={b.category} label={`${b.category} — ${formatMoney(b.spent, currency)} of ${formatMoney(b.limit, currency)}`} value={b.pct} tone={b.tone} showValue />
          ))
        )}
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-pr-primary">Recent Transactions</h2>
        <DataTable
          columns={[
            { key: "date", label: "Date" },
            { key: "category", label: "Category" },
            { key: "note", label: "Note", render: row => row.note || "—" },
            { key: "amount", label: "Amount", align: "right", strong: true, render: row => formatMoney(row.amount, currency) },
            {
              key: "actions", label: "", align: "right",
              render: row => (
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => openExpenseModal(row)} aria-label="Edit" className="w-8 h-8 flex items-center justify-center rounded-pr-default text-pr-secondary hover:bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setConfirmDeleteId(row.id)} aria-label="Delete" className="w-8 h-8 flex items-center justify-center rounded-pr-default text-pr-secondary hover:bg-pr-danger-soft hover:text-pr-danger transition-colors cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={recentExpenses}
          rowsPerPage={6}
        />
      </div>

      <ExpenseFormModal
        open={isExpenseModalOpen}
        categories={state.categories}
        editingExpense={editingExpense}
        onSubmit={handleFormSubmit}
        onClose={closeExpenseModal}
      />
      <ConfirmModal
        open={confirmDeleteId !== null}
        message="Delete this expense? This cannot be undone."
        onConfirm={() => { deleteExpense(confirmDeleteId); setConfirmDeleteId(null); setToastMessage("Expense deleted."); }}
        onCancel={() => setConfirmDeleteId(null)}
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

Note on the toast auto-dismiss: the OLD `Toast.jsx` (still used nowhere after this task) had its own internal auto-dismiss timer. The NEW `Toast.jsx` (Phase 2) is presentation-only — no timer. This phase does not add one either (it wasn't in the Phase 2 scope, and adding a timer here would be scope creep). The toast is dismissed by its close button (`dismissToast`) — leaving it open until manually dismissed is an acceptable, deliberate gap for this phase, not a bug; if a future phase wants auto-dismiss, that's an explicit small follow-up (e.g. Phase 9), not something to sneak into this task.

- [ ] **Step 2: Verify `validateAmount(0)` returns a truthy error string**

Before treating the `ExpenseFormModal` validation wiring in Task 2 as correct, read `src/lib/validation.js`'s `validateAmount` function once and confirm it rejects `0` (per this project's documented rule "amount must be `>0`"). This is a read-only sanity check — no code changes expected, but if `validateAmount(0)` somehow returns falsy, stop and flag it as a pre-existing bug before proceeding (out of scope to fix here, but must not go unnoticed).

- [ ] **Step 3: Full click-through verification**

Run `npm run dev` (or trace by hand if no browser is available — same rigor as Phases 1-2's "code-trace since no browser tool" verification): confirm the Dashboard renders 4 KPI cards, a 14-day trend line (or the "No expenses yet" empty state on a fresh account), a this-month category pie (or its empty state), a budget-health list (or "No budgets set yet"), and a 6-row recent-transactions table with working Edit (opens `ExpenseFormModal` pre-filled) and Delete (opens `ConfirmModal`) actions. Confirm the TopBar's "Add expense" button (wired in Task 4) opens `ExpenseFormModal` in add mode. Confirm an over-budget category shows the danger `Alert` at the top.

- [ ] **Step 4: Verify and commit**

```bash
npm run build && npm run lint
git add src/pages/DashboardPage.jsx
git commit -m "Rewrite DashboardPage with Procura KPIs, 14-day trend, category pie, budget health, and recent transactions"
```

---

### Final phase review

- [ ] Confirm via `git diff <phase-3-base>..HEAD --stat` that the only modified (not newly-created) files are `src/components/Combobox.jsx`, `src/components/ui/Button.jsx` (only if Step 2 of Task 2 required the `...rest` fix), `src/App.jsx`, and `src/pages/DashboardPage.jsx` — everything else is a new file.
- [ ] Confirm zero remaining imports of the now-dead-code components (`CategoryManager`, `BudgetList`, `SummaryCards`, `AlertBanner`, `TrendChart`, `CategoryChart`, `ExpenseTable`, `ExpenseForm`, `ConfirmDialog`, the old `Toast`) FROM `DashboardPage.jsx` specifically — they may still be imported by nothing at all (expected; removed in Phase 9) but must not be imported by the new `DashboardPage.jsx`.
- [ ] `npm run build` and `npm run lint` clean.
- [ ] Merge into `main`, push, then pause and report to the user before starting Phase 4 (Expenses page), per the established phase-by-phase operating mode.
