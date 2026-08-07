import { useState, useEffect } from "react";
import { validateDate, validateAmount, validateCategory } from "../lib/validation.js";
import { formatAmountInput, parseAmountInput } from "../lib/format.js";
import Combobox from "./Combobox.jsx";

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

  // If the currently-selected category disappears from the list (e.g. it was
  // removed via CategoryManager while unused and this form was open), fall back
  // to the first available category instead of leaving a phantom selection.
  // Skip this while editing an expense so we don't clobber the just-applied
  // pre-fill from the effect above on the same render pass.
  useEffect(() => {
    if (editingExpense) return;
    if (category && !categories.includes(category)) {
      setCategory(categories[0] || "");
    }
  }, [categories, category, editingExpense]);

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
    <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
      <div>
        <label htmlFor="exp-date" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Date</label>
        <input id="exp-date" type="date" max={todayISO()} value={date}
               onChange={e => setDate(e.target.value)}
               className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        {errors.date && <p className="text-xs text-danger mt-1">{errors.date}</p>}
      </div>
      <div>
        <label htmlFor="exp-amount" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Amount</label>
        <input id="exp-amount" type="text" inputMode="decimal" placeholder="0.00"
               value={amountDisplay} onChange={handleAmountChange}
               className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        {errors.amount && <p className="text-xs text-danger mt-1">{errors.amount}</p>}
      </div>
      <div>
        <label htmlFor="exp-category" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Category</label>
        <Combobox id="exp-category" options={categories} value={category} onChange={setCategory} placeholder="Select a category…" />
        {errors.category && <p className="text-xs text-danger mt-1">{errors.category}</p>}
      </div>
      <div>
        <label htmlFor="exp-note" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Note <span className="font-normal not-italic text-muted/70">(optional)</span></label>
        <input id="exp-note" type="text" maxLength={120} placeholder="e.g. Lunch with team"
               value={note} onChange={e => setNote(e.target.value)}
               className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="flex-1 bg-primary text-white hover:bg-primary-text transition-colors rounded-pill px-4 py-2.5 text-sm font-semibold cursor-pointer">
          {editingExpense ? "Save" : "Add"}
        </button>
        {editingExpense && (
          <button type="button" onClick={() => { onCancelEdit(); resetForm(); }}
                  className="flex-1 bg-transparent hover:bg-surface-2 text-text border border-border-dim rounded-pill px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
