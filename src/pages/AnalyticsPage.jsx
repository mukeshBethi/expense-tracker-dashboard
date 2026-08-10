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
        <div className="bg-pr-card shadow-pr-sm rounded-pr-card border border-pr-border-subtle p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-pr-primary">Monthly Trend (6 months)</h2>
          {state.expenses.length === 0 ? (
            <p className="text-sm text-pr-secondary py-8 text-center">No expenses yet.</p>
          ) : (
            <LineChart series={[{ label: "Spend", color: "#2D63EA", points: months.map(m => m.total) }]} xLabels={months.map(m => m.label)} theme={theme} />
          )}
        </div>
        <div className="bg-pr-card shadow-pr-sm rounded-pr-card border border-pr-border-subtle p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-pr-primary">By Category (This Month)</h2>
          {categoryPieData.length === 0 ? (
            <p className="text-sm text-pr-secondary py-8 text-center">No expenses this month.</p>
          ) : (
            <PieChart data={categoryPieData} theme={theme} />
          )}
        </div>
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card border border-pr-border-subtle p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-pr-primary">Weekly Spend (8 weeks)</h2>
        {state.expenses.length === 0 ? (
          <p className="text-sm text-pr-secondary py-8 text-center">No expenses yet.</p>
        ) : (
          <BarChart data={weeks.map(w => ({ label: w.label, value: w.total, color: "#2D63EA" }))} theme={theme} />
        )}
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card border border-pr-border-subtle p-5 flex flex-col gap-4">
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
