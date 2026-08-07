import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [sortLabel, setSortLabel] = useState(SORT_OPTIONS[0]);
  const [confirmBulkDeleteIds, setConfirmBulkDeleteIds] = useState(null);

  // Running per-transaction "remaining" balance, category-scoped and computed
  // in date-ascending order regardless of the table's chosen display sort —
  // each expense shows the budget left AFTER it, ledger-style, not a flat
  // per-category snapshot repeated on every row. Only expenses in the current
  // month have a meaningful figure here, since budgets are monthly.
  const runningRemainingById = useMemo(() => {
    const byCategory = {};
    for (const e of expensesThisMonth) {
      if (!byCategory[e.category]) byCategory[e.category] = [];
      byCategory[e.category].push(e);
    }
    const result = {};
    for (const [category, list] of Object.entries(byCategory)) {
      const limit = Number(state.budgets[category]) || 0;
      if (limit <= 0) continue;
      const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      let cumulative = 0;
      for (const e of sorted) {
        cumulative += e.amount;
        result[e.id] = limit - cumulative;
      }
    }
    return result;
  }, [expensesThisMonth, state.budgets]);

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
                render: row => { const limit = Number(state.budgets[row.category]) || 0; return limit > 0 ? formatMoney(limit, currency) : "—"; },
              },
              {
                key: "remaining", label: "Remaining", align: "right",
                render: row => {
                  const limit = Number(state.budgets[row.category]) || 0;
                  if (limit <= 0 || !(row.id in runningRemainingById)) return <span className="text-pr-tertiary">—</span>;
                  const remaining = runningRemainingById[row.id];
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
