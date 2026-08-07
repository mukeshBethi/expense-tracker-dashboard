import { formatMoney } from "../lib/format.js";
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";

function formatDateDisplay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function ExpenseTable({ expenses, budgets, expensesThisMonth, currency, onEdit, onDelete, sort, onSortChange }) {
  const spentByCat = {};
  for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;

  function budgetInfo(category) {
    const limit = Number(budgets[category]) || 0;
    const spent = spentByCat[category] || 0;
    return { limit, remaining: limit - spent };
  }

  function toggleSort(key) {
    onSortChange(sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  }

  if (expenses.length === 0) {
    return <p className="text-sm text-muted text-center py-8">No expenses match your filters. Add one on the left to get started.</p>;
  }

  function SortHeader({ label, sortKey }) {
    const active = sort.key === sortKey;
    return (
      <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort(sortKey)}>
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (sort.dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
        </span>
      </th>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
      <table className="hidden md:table w-full text-sm">
        <thead>
          <tr className="border-b border-border-dim">
            <SortHeader label="Date" sortKey="date" />
            <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Category</th>
            <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Note</th>
            <SortHeader label="Amount" sortKey="amount" />
            <th className="text-right text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Budget</th>
            <th className="text-right text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Remaining</th>
            <th className="text-right text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e, i) => {
            const { limit, remaining } = budgetInfo(e.category);
            const remainingClass = limit > 0 ? (remaining < 0 ? "text-danger" : remaining <= limit * 0.1 ? "text-warn" : "text-primary-text") : "text-muted";
            return (
              <tr key={e.id} className={`${i % 2 === 1 ? "bg-surface-2/40" : ""} hover:bg-surface-2 transition-colors`}>
                <td className="px-3 py-2.5 text-text">{formatDateDisplay(e.date)}</td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center bg-surface-2 text-text text-xs rounded-pill px-2.5 py-1">{e.category}</span>
                </td>
                <td className="px-3 py-2.5 text-muted">{e.note}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-text">{formatMoney(e.amount, currency)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted">{limit > 0 ? formatMoney(limit, currency) : "—"}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${remainingClass}`}>{limit > 0 ? formatMoney(remaining, currency) : "—"}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-2 rounded-lg hover:bg-surface text-muted hover:text-text transition-colors cursor-pointer" onClick={() => onEdit(e)} aria-label="Edit expense">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-surface text-muted hover:text-danger transition-colors cursor-pointer" onClick={() => onDelete(e.id)} aria-label="Delete expense">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <div className="md:hidden space-y-3">
        {expenses.map(e => (
          <div className="bg-surface-2 rounded-input p-4" key={e.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted">{formatDateDisplay(e.date)}</span>
              <span className="text-sm font-semibold tabular-nums text-text">{formatMoney(e.amount, currency)}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center bg-surface text-text text-xs rounded-pill px-2.5 py-1 min-w-0"><span className="truncate min-w-0">{e.category}</span></span>
              {e.note && <span className="text-xs text-muted truncate max-w-[140px]">{e.note}</span>}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-surface text-text text-xs font-medium hover:bg-surface/70 transition-colors cursor-pointer" onClick={() => onEdit(e)}>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-surface text-danger text-xs font-medium hover:bg-surface/70 transition-colors cursor-pointer" onClick={() => onDelete(e.id)}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
