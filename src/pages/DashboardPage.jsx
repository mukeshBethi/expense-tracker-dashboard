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
