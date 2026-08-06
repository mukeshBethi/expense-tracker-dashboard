import { formatMoney } from "../lib/format.js";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function monthKey(iso) { return iso.slice(0, 7); }

export default function SummaryCards({ expenses, currency }) {
  const monthK = todayISO().slice(0, 7);
  const today = todayISO();
  let monthTotal = 0, todayTotal = 0;
  const byCatMonth = {};

  for (const e of expenses) {
    if (monthKey(e.date) === monthK) {
      monthTotal += e.amount;
      byCatMonth[e.category] = (byCatMonth[e.category] || 0) + e.amount;
    }
    if (e.date === today) todayTotal += e.amount;
  }

  let topCat = "—", topVal = 0;
  for (const [c, v] of Object.entries(byCatMonth)) if (v > topVal) { topVal = v; topCat = c; }

  return (
    <div className="summary-grid">
      <div className="stat-card"><span className="stat-label">Spent this month</span><span className="stat-value">{formatMoney(monthTotal, currency)}</span></div>
      <div className="stat-card"><span className="stat-label">Spent today</span><span className="stat-value">{formatMoney(todayTotal, currency)}</span></div>
      <div className="stat-card"><span className="stat-label">Top category</span><span className="stat-value">{topCat}</span></div>
      <div className="stat-card"><span className="stat-label">Total entries</span><span className="stat-value">{expenses.length}</span></div>
    </div>
  );
}
