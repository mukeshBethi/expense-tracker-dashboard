# Procura Redesign — Phase 4: Expenses Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/expenses` — category filter, search, sort, a full `DataTable` (selection + pagination) over every expense, an empty state, and modal-based row CRUD reusing the `ExpenseFormModal`/`ConfirmModal` built in Phase 3. This phase also gives `DataTable`'s selection feature its first real use: bulk-delete of selected rows.

**Architecture:** Filter/search/sort are page-local `useState` in `ExpensesPage.jsx` itself (not lifted to `App.jsx`) — this is route-scoped UI state with no reason to survive a navigation away from `/expenses`, matching the same "view-local state lives with the view" principle this project already applies (per `CLAUDE.md`'s description of the pre-router `App.jsx`). The Add/Edit-expense modal and single-delete-confirm state stay where Phase 3 put them (`App.jsx`), since the Shell's global "Add expense" button must be able to open the same modal from any page — `ExpensesPage` receives that state as props, it does not own it. Bulk-delete confirmation (a new capability, selection-only, `/expenses`-only) is new page-local state with its own `ConfirmModal` instance.

**Tech Stack:** No new dependencies. Reuses `src/lib/format.js` (`formatMoney`) verbatim.

## Global Constraints

- Every dollar amount goes through `formatMoney(amount, currency)` — never format money inline.
- The per-row Budget/Remaining calculation and its color-coding are a direct port of the old `ExpenseTable.jsx`'s `budgetInfo()` logic (below) — do not re-derive.
- `src/lib/validation.js` and `src/lib/format.js` are not modified.
- `src/hooks/useAuth.js`, `src/hooks/useTheme.js` are not modified. `src/hooks/useExpenseData.js` gets exactly one addition (Task 1) — no other change.
- Every interactive element gets `cursor-pointer` explicitly.
- The old `ExpenseTable.jsx`, `ConfirmDialog.jsx` remain dead code (per Phase 3) — Phase 4 doesn't touch them.

## Reused math (verbatim source of truth)

From the old `ExpenseTable.jsx` (per-row Budget/Remaining, needs `expensesThisMonth` — already computed and available in `App.jsx`, already passed to `DashboardPage`):
```js
const spentByCat = {};
for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
function budgetInfo(category) {
  const limit = Number(budgets[category]) || 0;
  const spent = spentByCat[category] || 0;
  return { limit, remaining: limit - spent };
}
// color: no budget (limit===0) -> muted/secondary; remaining<0 -> danger; remaining <= limit*0.1 -> warning; else -> primary text
```

From `App.jsx` (existing filter/sort logic — reintroduced here as page-local state, was removed from `App.jsx` in Phase 3 since nothing used it):
```js
rows = rows.filter(e => {
  if (filterCategory && e.category !== filterCategory) return false;
  if (search && !(e.note || "").toLowerCase().includes(search.toLowerCase())) return false;
  return true;
});
rows.sort((a, b) => {
  const cmp = sortKey === "amount" ? a.amount - b.amount : (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  return sortDir === "asc" ? cmp : -cmp;
});
```

---

### Task 1: Add a bulk-delete mutator to `useExpenseData.js`

**Files:**
- Modify: `src/hooks/useExpenseData.js`

**Why:** `DataTable` (Phase 2) already supports row selection; Expenses is the first page to give it a real action — bulk-deleting selected expenses. There is no existing bulk mutator; `deleteExpense(id)` only removes one row at a time, so doing this via N sequential `deleteExpense` calls would fire N separate `setDoc` writes for a single user action. Add a sibling mutator following the exact same pattern as every other mutator in this file (optimistic local `setState`, background `persistExpenses`, errors logged not surfaced).

**Interfaces:**
- Produces: `deleteExpenses(ids)` — `ids` is an array of expense id strings. Added to the hook's return object alongside `deleteExpense`.

- [ ] **Step 1: Add the mutator**

Immediately after the existing `deleteExpense` callback (`src/hooks/useExpenseData.js`, right after its closing `}, [persistExpenses]);`), add:

```js
const deleteExpenses = useCallback((ids) => {
  setState(prev => {
    const idSet = new Set(ids);
    const expenses = prev.expenses.filter(e => !idSet.has(e.id));
    const next = { ...prev, expenses };
    persistExpenses(expenses).catch(err => console.error("Failed to save bulk expense deletion:", err));
    return next;
  });
}, [persistExpenses]);
```

- [ ] **Step 2: Add it to the returned object**

Change the final `return { state, loading, loadError, addExpense, updateExpense, deleteExpense, addCategory, removeCategory, setBudget, setCurrency, setTotalBudget, setThemePreference, clearAll };` to insert `deleteExpenses` right after `deleteExpense`:

```js
return { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, addCategory, removeCategory, setBudget, setCurrency, setTotalBudget, setThemePreference, clearAll };
```

- [ ] **Step 3: Verify and commit**

This hook has no test suite (project convention — manual/build verification only). Trace by hand: `idSet` construction and `.filter(e => !idSet.has(e.id))` correctly removes every expense whose id is in `ids` and keeps the rest, mirroring `deleteExpense`'s single-id filter exactly. Run:

```bash
npm run build && npm run lint
git add src/hooks/useExpenseData.js
git commit -m "Add deleteExpenses bulk mutator to useExpenseData"
```

---

### Task 2: Wire `App.jsx` for the Expenses page

**Files:**
- Modify: `src/App.jsx`

**Interfaces:**
- Extracts a `sharedExpenseModalProps` object (the Add/Edit-modal + single-delete-confirm + toast state already built in Phase 3) so both `dashboardProps` and the new `expensesProps` can spread it without duplicating the same 10 keys twice.
- Produces `expensesProps` for the new `/expenses` route: `{ ...sharedExpenseModalProps, state, expensesThisMonth, deleteExpenses }`.
- Replaces the `/expenses` route's `<ComingSoonPage title="Expenses" />` with `<ExpensesPage {...expensesProps} />`.

- [ ] **Step 1: Destructure `deleteExpenses` from the hook**

Change:
```jsx
const { state, loading, loadError, addExpense, updateExpense, deleteExpense, setThemePreference } = useExpenseData(user?.uid);
```
to:
```jsx
const { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, setThemePreference } = useExpenseData(user?.uid);
```

- [ ] **Step 2: Extract the shared prop bundle and rebuild `dashboardProps`/`expensesProps`**

Replace the current `dashboardProps` block with:

```jsx
const sharedExpenseModalProps = {
  isExpenseModalOpen, openExpenseModal, closeExpenseModal, editingExpense, handleFormSubmit,
  confirmDeleteId, setConfirmDeleteId, deleteExpense,
  toastMessage, dismissToast, setToastMessage,
};

const dashboardProps = { state, theme, expensesThisMonth, ...sharedExpenseModalProps };
const expensesProps = { state, expensesThisMonth, deleteExpenses, ...sharedExpenseModalProps };
```

- [ ] **Step 3: Import `ExpensesPage` and swap the route**

Add the import alongside the other page imports:
```jsx
import ExpensesPage from "./pages/ExpensesPage.jsx";
```
Change:
```jsx
<Route path="/expenses" element={<ComingSoonPage title="Expenses" />} />
```
to:
```jsx
<Route path="/expenses" element={<ExpensesPage {...expensesProps} />} />
```

- [ ] **Step 4: Verify and commit**

This task's diff references `ExpensesPage.jsx`, which does not exist until Task 3 — `npm run build` will fail until Task 3 lands. That's expected and fine within a single phase's task sequence (the plan's tasks are ordered, not independently mergeable); do not attempt to build/lint/commit Task 2 in isolation. Proceed directly to Task 3, then build/lint/commit both together:

```bash
npm run build && npm run lint
git add src/App.jsx
git commit -m "Wire Expenses page into App.jsx: extract shared expense-modal props, add deleteExpenses/expensesProps"
```

---

### Task 3: Build `ExpensesPage.jsx`

**Files:**
- Create: `src/pages/ExpensesPage.jsx`

**Interfaces:**
- Consumes: `state, expensesThisMonth, deleteExpenses, isExpenseModalOpen, openExpenseModal, closeExpenseModal, editingExpense, handleFormSubmit, confirmDeleteId, setConfirmDeleteId, deleteExpense, toastMessage, dismissToast, setToastMessage` (from Task 2's `expensesProps`).
- Consumes: `Combobox` (Phase 3, restyled), `Select`, `Input`, `Button`, `DataTable`, `Toast` (Phase 1/2 primitives), `ExpenseFormModal`, `ConfirmModal` (Phase 3).
- Owns new local state: `filterCategory`, `search`, `sortLabel` (one of the 4 `SORT_OPTIONS` strings below), `confirmBulkDeleteIds` (array or `null`).

- [ ] **Step 1: Write the component**

```jsx
import { useState, useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatMoney } from "../lib/format.js";
import Combobox from "../components/Combobox.jsx";
import Select from "../components/ui/Select.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import Toast from "../components/ui/Toast.jsx";
import ExpenseFormModal from "../components/ExpenseFormModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const SORT_OPTIONS = ["Newest first", "Oldest first", "Amount (high to low)", "Amount (low to high)"];
const SORT_MAP = {
  "Newest first": { key: "date", dir: "desc" },
  "Oldest first": { key: "date", dir: "asc" },
  "Amount (high to low)": { key: "amount", dir: "desc" },
  "Amount (low to high)": { key: "amount", dir: "asc" },
};

export default function ExpensesPage({
  state, expensesThisMonth, deleteExpenses,
  isExpenseModalOpen, openExpenseModal, closeExpenseModal, editingExpense, handleFormSubmit,
  confirmDeleteId, setConfirmDeleteId, deleteExpense,
  toastMessage, dismissToast, setToastMessage,
}) {
  const currency = state.settings.currency;
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sortLabel, setSortLabel] = useState(SORT_OPTIONS[0]);
  const [confirmBulkDeleteIds, setConfirmBulkDeleteIds] = useState(null);

  const spentByCat = useMemo(() => {
    const map = {};
    for (const e of expensesThisMonth) map[e.category] = (map[e.category] || 0) + e.amount;
    return map;
  }, [expensesThisMonth]);

  function budgetInfo(category) {
    const limit = Number(state.budgets[category]) || 0;
    const spent = spentByCat[category] || 0;
    return { limit, remaining: limit - spent };
  }

  const filteredExpenses = useMemo(() => {
    const { key, dir } = SORT_MAP[sortLabel];
    let rows = state.expenses.filter(e => {
      if (filterCategory && e.category !== filterCategory) return false;
      if (search && !(e.note || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      const cmp = key === "amount" ? a.amount - b.amount : (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
      return dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [state.expenses, filterCategory, search, sortLabel]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-52">
            <Combobox options={state.categories} value={filterCategory} onChange={setFilterCategory} allowClear clearLabel="All categories" placeholder="All categories" />
          </div>
          <Input placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-60" />
          <Select value={sortLabel} onChange={e => setSortLabel(e.target.value)} options={SORT_OPTIONS} className="w-full sm:w-52" />
        </div>
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-4">
        {filteredExpenses.length === 0 ? (
          <p className="text-sm text-pr-secondary py-8 text-center">
            {state.expenses.length === 0 ? "No expenses yet. Add your first one from the top bar." : "No expenses match the current filters."}
          </p>
        ) : (
          <DataTable
            columns={[
              { key: "date", label: "Date" },
              { key: "category", label: "Category" },
              { key: "note", label: "Note", render: row => row.note || "—" },
              { key: "amount", label: "Amount", align: "right", strong: true, render: row => formatMoney(row.amount, currency) },
              {
                key: "budget", label: "Budget", align: "right",
                render: row => { const { limit } = budgetInfo(row.category); return limit > 0 ? formatMoney(limit, currency) : "—"; },
              },
              {
                key: "remaining", label: "Remaining", align: "right",
                render: row => {
                  const { limit, remaining } = budgetInfo(row.category);
                  if (limit <= 0) return <span className="text-pr-tertiary">—</span>;
                  const tone = remaining < 0 ? "text-pr-danger" : remaining <= limit * 0.1 ? "text-pr-warning" : "text-pr-primary";
                  return <span className={tone}>{formatMoney(remaining, currency)}</span>;
                },
              },
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
            rows={filteredExpenses}
            selectable
            rowsPerPage={10}
            resultLabel={`Showing ${filteredExpenses.length} of ${state.expenses.length} expenses`}
            selectionBar={(ids, clearSelection) => (
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-pr-primary">{ids.length} selected</span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={clearSelection}>Clear</Button>
                  <Button variant="danger" icon={Trash2} onClick={() => setConfirmBulkDeleteIds(ids)}>Delete selected</Button>
                </div>
              </div>
            )}
          />
        )}
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
      <ConfirmModal
        open={confirmBulkDeleteIds !== null}
        message={`Delete ${confirmBulkDeleteIds?.length || 0} selected expense${confirmBulkDeleteIds?.length === 1 ? "" : "s"}? This cannot be undone.`}
        onConfirm={() => {
          deleteExpenses(confirmBulkDeleteIds);
          setToastMessage(`${confirmBulkDeleteIds.length} expense${confirmBulkDeleteIds.length === 1 ? "" : "s"} deleted.`);
          setConfirmBulkDeleteIds(null);
        }}
        onCancel={() => setConfirmBulkDeleteIds(null)}
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

Note on the bulk-delete confirm modal not clearing the `DataTable`'s internal selection afterward: `DataTable` (Phase 2) owns its `selected` Set as internal state with no prop to clear it externally. After a bulk delete, the deleted rows disappear from `rows` entirely (since `filteredExpenses` is recomputed from the now-shorter `state.expenses`), so the stale ids left in `DataTable`'s internal `selected` Set simply never match any rendered row again — harmless, not a visible bug, but also not actively cleared. This is an acceptable, minor gap for this phase (`DataTable` would need a `key` reset or a new imperative-clear prop to do better, which is out of scope for a phase focused on shipping the Expenses page) — not something to silently "fix" by reaching into `DataTable`'s internals from here.

- [ ] **Step 2: Verify column/row visual consistency with the Dashboard's recent-transactions table**

Compare this table's column set against `DashboardPage.jsx`'s recent-transactions `DataTable` (Phase 3): Dashboard has no Budget/Remaining columns (by design, per the master spec's page mapping — those are Expenses-page-specific). Confirm this is intentional, not a missed copy-paste, before moving on.

- [ ] **Step 3: Full verification (build/lint + code-trace, same rigor as Phases 1-3)**

```bash
npm run build && npm run lint
```

Trace by hand: an expense with no budget set for its category shows "—" in both Budget and Remaining; an expense whose category is over its monthly budget shows a danger-red Remaining; selecting 2 rows shows the selection bar with "2 selected" and hides `resultLabel`; clicking "Delete selected" opens the bulk-confirm `ConfirmModal` with the correct count and correct singular/plural wording for exactly 1 selected row.

- [ ] **Step 4: Commit (together with Task 2, since Task 2's build only succeeds once this file exists)**

```bash
git add src/pages/ExpensesPage.jsx src/App.jsx
git commit -m "Add ExpensesPage: filter/search/sort, DataTable with selection/pagination, bulk delete, and empty state"
```

---

### Final phase review

- [ ] Confirm via `git diff <phase-4-base>..HEAD --stat` that the only modified (not newly-created) files are `src/hooks/useExpenseData.js` and `src/App.jsx` — `src/pages/ExpensesPage.jsx` is new.
- [ ] Confirm the old `ExpenseTable.jsx` has zero remaining imports from `ExpensesPage.jsx` (it should be a from-scratch `DataTable` usage, not a wrapper around the old component).
- [ ] `npm run build` and `npm run lint` clean.
- [ ] Merge into `main`, push, then pause and report to the user before starting Phase 5 (Budgets page), per the established phase-by-phase operating mode.
