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
    <div className="budget-list">
      <div className="budget-row total-budget-row">
        <div className="budget-head">
          <span className="b-cat">Total Monthly Budget</span>
          <input type="number" min="0" step="1" placeholder="—"
                 defaultValue={totalBudget > 0 ? totalBudget : ""}
                 onBlur={e => handleTotalChange(e.target.value)} />
        </div>
        {totalError && <p className="field-error">{totalError}</p>}
        {totalBudget > 0 && (
          <>
            <div className="bar"><span style={{ width: `${allocatedPct}%` }} /></div>
            <div className="budget-meta">
              {`Allocated ${formatMoney(allocated, currency)} of ${formatMoney(totalBudget, currency)} total`}
            </div>
          </>
        )}
      </div>

      {categories.map(c => {
        const limit = Number(budgets[c]) || 0;
        const spent = spentByCat[c] || 0;
        const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        const cls = limit > 0 && spent > limit ? "over" : limit > 0 && spent >= limit * 0.9 ? "warn" : "";
        return (
          <div className="budget-row" key={c}>
            <div className="budget-head">
              <span className="b-cat">{c}</span>
              <input type="number" min="0" step="1" placeholder="—"
                     defaultValue={limit > 0 ? limit : ""}
                     onBlur={e => handleChange(c, e.target.value)} />
            </div>
            {errors[c] && <p className="field-error">{errors[c]}</p>}
            <div className={`bar ${cls}`}><span style={{ width: `${pct}%` }} /></div>
            <div className="budget-meta">
              {limit > 0 ? `${formatMoney(spent, currency)} of ${formatMoney(limit, currency)}` : `${formatMoney(spent, currency)} spent · no budget set`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
