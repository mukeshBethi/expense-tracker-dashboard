import { useState, useEffect } from "react";
import { validateDate, validateAmount, validateCategory } from "../lib/validation.js";
import { formatAmountInput, parseAmountInput } from "../lib/format.js";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function ExpenseForm({ categories, onSubmit, editingExpense, onCancelEdit }) {
  const [date, setDate] = useState(todayISO());
  const [amountDisplay, setAmountDisplay] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingExpense) {
      setDate(editingExpense.date);
      setAmountDisplay(formatAmountInput(String(editingExpense.amount)));
      setCategory(editingExpense.category);
      setNote(editingExpense.note || "");
    }
  }, [editingExpense]);

  function resetForm() {
    setDate(todayISO());
    setAmountDisplay("");
    setCategory(categories[0] || "");
    setNote("");
    setErrors({});
  }

  function handleAmountChange(evt) {
    setAmountDisplay(formatAmountInput(evt.target.value));
  }

  function handleSubmit(evt) {
    evt.preventDefault();
    const amount = parseAmountInput(amountDisplay);
    const nextErrors = {
      date: validateDate(date, todayISO()),
      amount: validateAmount(amount),
      category: validateCategory(category),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    onSubmit({ date, amount, category, note: note.trim() });
    if (editingExpense) onCancelEdit();
    resetForm();
  }

  return (
    <form className="expense-form" onSubmit={handleSubmit} autoComplete="off">
      <div className="field">
        <label htmlFor="exp-date">Date</label>
        <input id="exp-date" type="date" max={todayISO()} value={date}
               onChange={e => setDate(e.target.value)} />
        {errors.date && <p className="field-error">{errors.date}</p>}
      </div>
      <div className="field">
        <label htmlFor="exp-amount">Amount</label>
        <input id="exp-amount" type="text" inputMode="decimal" placeholder="0.00"
               value={amountDisplay} onChange={handleAmountChange} />
        {errors.amount && <p className="field-error">{errors.amount}</p>}
      </div>
      <div className="field">
        <label htmlFor="exp-category">Category</label>
        <select id="exp-category" value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {errors.category && <p className="field-error">{errors.category}</p>}
      </div>
      <div className="field">
        <label htmlFor="exp-note">Note <span className="muted">(optional)</span></label>
        <input id="exp-note" type="text" maxLength={120} placeholder="e.g. Lunch with team"
               value={note} onChange={e => setNote(e.target.value)} />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">{editingExpense ? "Save" : "Add"}</button>
        {editingExpense && (
          <button type="button" className="btn btn-ghost" onClick={() => { onCancelEdit(); resetForm(); }}>Cancel</button>
        )}
      </div>
    </form>
  );
}
