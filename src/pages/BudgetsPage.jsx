import { useState } from "react";
import { Wallet, PieChart, Coins } from "lucide-react";
import { validateAmount, validateAllocation, validateTotalBudget } from "../lib/validation.js";
import { formatMoney } from "../lib/format.js";
import KpiCard from "../components/ui/KpiCard.jsx";
import Input from "../components/ui/Input.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";

export default function BudgetsPage({ state, expensesThisMonth, setBudget, setTotalBudget }) {
  const { categories, budgets, settings } = state;
  const currency = settings.currency;
  const totalBudget = settings.totalBudget || 0;

  const [errors, setErrors] = useState({});
  const [totalError, setTotalError] = useState("");

  const spentByCat = {};
  for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;

  const allocated = Object.values(budgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const allocatedPct = totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0;
  const unallocated = totalBudget > 0 ? Math.max(totalBudget - allocated, 0) : 0;

  function handleChange(category, rawValue) {
    if (rawValue) {
      const amountErr = validateAmount(parseFloat(rawValue));
      if (amountErr) { setErrors(prev => ({ ...prev, [category]: amountErr })); return; }
      const allocErr = validateAllocation(parseFloat(rawValue), category, budgets, totalBudget);
      if (allocErr) {
        setErrors(prev => ({ ...prev, [category]: `That would put you ${formatMoney(allocErr.overage, currency)} over your total budget.` }));
        return;
      }
    }
    setErrors(prev => {
      if (!prev[category]) return prev;
      const next = { ...prev };
      delete next[category];
      return next;
    });
    setBudget(category, rawValue);
  }

  function handleTotalChange(rawValue) {
    if (rawValue) {
      const amountErr = validateAmount(parseFloat(rawValue));
      if (amountErr) { setTotalError(amountErr); return; }
      const totalErr = validateTotalBudget(parseFloat(rawValue), budgets);
      if (totalErr) {
        setTotalError(`You've already allocated ${formatMoney(totalErr.allocated, currency)} across categories — lower those first or pick a higher total.`);
        return;
      }
    }
    setTotalError("");
    setTotalBudget(rawValue);
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Total Budget" value={totalBudget > 0 ? formatMoney(totalBudget, currency) : "Not set"} icon={Wallet} />
        <KpiCard label="Allocated" value={formatMoney(allocated, currency)} icon={PieChart} />
        <KpiCard label="Unallocated" value={totalBudget > 0 ? formatMoney(unallocated, currency) : "—"} icon={Coins} />
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card border border-pr-border-subtle p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-pr-primary">Total Monthly Budget</span>
          <Input
            type="number" min="0" step="1" placeholder="—"
            defaultValue={totalBudget > 0 ? totalBudget : ""}
            onBlur={e => handleTotalChange(e.target.value)}
            className="w-32"
            error={totalError}
          />
        </div>
        {totalBudget > 0 && (
          <>
            <ProgressBar label="" value={allocatedPct} tone="success" />
            <p className="text-xs text-pr-tertiary">
              {`Allocated ${formatMoney(allocated, currency)} of ${formatMoney(totalBudget, currency)} total`}
            </p>
          </>
        )}
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card border border-pr-border-subtle p-5 flex flex-col gap-5">
        <h2 className="text-sm font-semibold text-pr-primary">Category Budgets</h2>
        {categories.map(c => {
          const limit = Number(budgets[c]) || 0;
          const spent = spentByCat[c] || 0;
          const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          const tone = limit > 0 && spent > limit ? "danger" : limit > 0 && spent >= limit * 0.9 ? "warning" : "success";
          return (
            <div key={c} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-pr-primary min-w-0 truncate" title={c}>{c}</span>
                <Input
                  type="number" min="0" step="1" placeholder="—"
                  defaultValue={limit > 0 ? limit : ""}
                  onBlur={e => handleChange(c, e.target.value)}
                  className="w-32"
                  error={errors[c]}
                />
              </div>
              <ProgressBar label="" value={pct} tone={tone} />
              <p className="text-xs text-pr-tertiary">
                {limit > 0 ? `${formatMoney(spent, currency)} of ${formatMoney(limit, currency)}` : `${formatMoney(spent, currency)} spent · no budget set`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
