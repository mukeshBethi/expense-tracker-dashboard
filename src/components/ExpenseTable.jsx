import { formatMoney } from "../lib/format.js";

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
    return <p className="empty-state">No expenses match your filters. Add one on the left to get started.</p>;
  }

  return (
    <>
      <table className="expense-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => toggleSort("date")}>Date</th>
            <th>Category</th>
            <th>Note</th>
            <th className="sortable num" onClick={() => toggleSort("amount")}>Amount</th>
            <th className="num">Budget</th>
            <th className="num">Remaining</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(e => {
            const { limit, remaining } = budgetInfo(e.category);
            return (
              <tr key={e.id}>
                <td>{formatDateDisplay(e.date)}</td>
                <td>{e.category}</td>
                <td>{e.note}</td>
                <td className="num">{formatMoney(e.amount, currency)}</td>
                <td className="num">{limit > 0 ? formatMoney(limit, currency) : "—"}</td>
                <td className="num">{limit > 0 ? formatMoney(remaining, currency) : "—"}</td>
                <td className="actions-col">
                  <button className="icon-btn" onClick={() => onEdit(e)}>✎</button>
                  <button className="icon-btn danger" onClick={() => onDelete(e.id)}>🗑</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="expense-cards">
        {expenses.map(e => (
          <div className="expense-card" key={e.id}>
            <div className="expense-card-row">
              <span className="expense-card-date">{formatDateDisplay(e.date)}</span>
              <span className="expense-card-amount">{formatMoney(e.amount, currency)}</span>
            </div>
            <div className="expense-card-row">
              <span className="cat-pill">{e.category}</span>
              {e.note && <span className="muted">{e.note}</span>}
            </div>
            <div className="expense-card-actions">
              <button className="icon-btn" onClick={() => onEdit(e)}>✎ Edit</button>
              <button className="icon-btn danger" onClick={() => onDelete(e.id)}>🗑 Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
