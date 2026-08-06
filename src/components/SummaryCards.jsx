import { Wallet, CalendarDays, Tag, Receipt, ArrowDown, ArrowUp } from "lucide-react";
import { formatMoney } from "../lib/format.js";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function monthKey(iso) { return iso.slice(0, 7); }

function sumForMonthUpToDay(expenses, monthK, dayOfMonth) {
  let total = 0;
  for (const e of expenses) {
    if (monthKey(e.date) !== monthK) continue;
    const day = Number(e.date.slice(8, 10));
    if (day <= dayOfMonth) total += e.amount;
  }
  return total;
}

function previousMonthKey(monthK) {
  const [y, m] = monthK.split("-").map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return `${py}-${String(pm).padStart(2, "0")}`;
}

function StatCard({ icon: Icon, label, value, badge }) {
  return (
    <div className="bg-surface shadow-soft rounded-card p-5 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-pill bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-text">{value}</span>
        {badge}
      </div>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

export default function SummaryCards({ expenses, currency }) {
  if (expenses.length === 0) {
    return (
      <div className="bg-surface shadow-soft rounded-card p-8 flex flex-col items-center gap-2 text-center">
        <Receipt className="w-6 h-6 text-muted" />
        <p className="text-sm text-muted">No expenses yet — add your first one to see your summary here.</p>
      </div>
    );
  }

  const today = todayISO();
  const monthK = today.slice(0, 7);
  const dayOfMonth = Number(today.slice(8, 10));

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

  const prevMonthK = previousMonthKey(monthK);
  const prevMonthToDate = sumForMonthUpToDay(expenses, prevMonthK, dayOfMonth);
  let deltaBadge = null;
  if (prevMonthToDate > 0) {
    const pct = ((monthTotal - prevMonthToDate) / prevMonthToDate) * 100;
    const isDown = pct < 0;
    const Arrow = isDown ? ArrowDown : ArrowUp;
    deltaBadge = (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold rounded-pill px-2 py-0.5 ${isDown ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
        <Arrow className="w-3 h-3" />
        {Math.abs(pct).toFixed(0)}%
      </span>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={Wallet} label="Spent this month" value={formatMoney(monthTotal, currency)} badge={deltaBadge} />
      <StatCard icon={CalendarDays} label="Spent today" value={formatMoney(todayTotal, currency)} />
      <StatCard icon={Tag} label="Top category" value={topCat} />
      <StatCard icon={Receipt} label="Total entries" value={String(expenses.length)} />
    </div>
  );
}
