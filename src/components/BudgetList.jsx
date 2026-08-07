import { useState } from "react";
import { validateAmount, validateAllocation, validateTotalBudget } from "../lib/validation.js";
import { formatMoney } from "../lib/format.js";

export default function BudgetList({ categories, budgets, expensesThisMonth, currency, onSetBudget, totalBudget, onSetTotalBudget }) {
  const [errors, setErrors] = useState({});
  const [totalError, setTotalError] = useState("");
  const spentByCat = {};
  for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;

  const allocated = Object.values(budgets).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const allocatedPct = totalBudget > 0 ? Math.min((allocated / totalBudget) * 100, 100) : 0;

  function handleChange(category, rawValue) {
    if (rawValue) {
      const amountErr = validateAmount(parseFloat(rawValue));
      if (amountErr) {
        setErrors(prev => ({ ...prev, [category]: amountErr }));
        return;
      }
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
    onSetBudget(category, rawValue);
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
    onSetTotalBudget(rawValue);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span className="text-sm font-medium text-text">Total Monthly Budget</span>
          <input type="number" min="0" step="1" placeholder="—"
                 defaultValue={totalBudget > 0 ? totalBudget : ""}
                 onBlur={e => handleTotalChange(e.target.value)}
                 className="w-28 bg-surface-2 border border-border-dim rounded-input px-3 py-1.5 text-sm text-text text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        </div>
        {totalError && <p className="text-xs text-danger mb-1.5">{totalError}</p>}
        {totalBudget > 0 && (
          <>
            <div className="h-1.5 rounded-pill bg-surface-2 overflow-hidden">
              <span className="block h-full bg-primary rounded-pill transition-all" style={{ width: `${allocatedPct}%` }} />
            </div>
            <p className="text-xs text-muted mt-1.5">
              {`Allocated ${formatMoney(allocated, currency)} of ${formatMoney(totalBudget, currency)} total`}
            </p>
          </>
        )}
      </div>

      {categories.map(c => {
        const limit = Number(budgets[c]) || 0;
        const spent = spentByCat[c] || 0;
        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const barColor = limit > 0 && spent > limit ? "bg-danger" : limit > 0 && spent >= limit * 0.9 ? "bg-warn" : "bg-primary";
        return (
          <div key={c}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-sm text-text min-w-0 truncate" title={c}>{c}</span>
              <input type="number" min="0" step="1" placeholder="—"
                     defaultValue={limit > 0 ? limit : ""}
                     onBlur={e => handleChange(c, e.target.value)}
                     className="w-28 shrink-0 bg-surface-2 border border-border-dim rounded-input px-3 py-1.5 text-sm text-text text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
            </div>
            {errors[c] && <p className="text-xs text-danger mb-1.5">{errors[c]}</p>}
            <div className="h-1.5 rounded-pill bg-surface-2 overflow-hidden">
              <span className={`block h-full rounded-pill transition-all ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-muted mt-1.5">
              {limit > 0 ? `${formatMoney(spent, currency)} of ${formatMoney(limit, currency)}` : `${formatMoney(spent, currency)} spent · no budget set`}
            </p>
          </div>
        );
      })}
    </div>
  );
}
