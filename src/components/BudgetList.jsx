import { useState } from "react";
import { validateAmount } from "../lib/validation.js";
import { formatMoney } from "../lib/format.js";

export default function BudgetList({ categories, budgets, expensesThisMonth, currency, onSetBudget }) {
  const [errors, setErrors] = useState({});
  const spentByCat = {};
  for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;

  function handleChange(category, rawValue) {
    if (rawValue) {
      const err = validateAmount(parseFloat(rawValue));
      if (err) {
        setErrors(prev => ({ ...prev, [category]: err }));
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

  return (
    <div className="budget-list">
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
