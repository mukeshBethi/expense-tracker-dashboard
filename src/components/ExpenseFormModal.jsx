import { useState, useEffect } from "react";
import { validateDate, validateAmount, validateCategory } from "../lib/validation.js";
import { formatAmountInput, parseAmountInput } from "../lib/format.js";
import Combobox from "./Combobox.jsx";
import Modal from "./ui/Modal.jsx";
import Input from "./ui/Input.jsx";
import Button from "./ui/Button.jsx";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function ExpenseFormModal({ open, categories, editingExpense, onSubmit, onClose }) {
  const [date, setDate] = useState(todayISO());
  const [amountDisplay, setAmountDisplay] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    if (editingExpense) {
      setDate(editingExpense.date);
      setAmountDisplay(formatAmountInput(String(editingExpense.amount)));
      setCategory(editingExpense.category);
      setNote(editingExpense.note || "");
    } else {
      setDate(todayISO());
      setAmountDisplay("");
      setCategory(categories[0] || "");
      setNote("");
    }
    setErrors({});
  }, [open, editingExpense, categories]);

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
    onClose();
  }

  return (
    <Modal
      open={open}
      title={editingExpense ? "Edit Expense" : "Add Expense"}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" form="expense-form-modal" className="flex-1">{editingExpense ? "Save" : "Add"}</Button>
        </div>
      }
    >
      <form id="expense-form-modal" onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
        <Input label="Date" type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} error={errors.date} />
        <Input label="Amount" type="text" inputMode="decimal" placeholder="0.00" value={amountDisplay} onChange={handleAmountChange} error={errors.amount} />
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-pr-tertiary mb-1.5 block">Category</label>
          <Combobox options={categories} value={category} onChange={setCategory} placeholder="Select a category…" />
          {errors.category && <p className="text-xs text-pr-danger mt-1">{errors.category}</p>}
        </div>
        <Input label="Note" type="text" maxLength={120} placeholder="e.g. Lunch with team" value={note} onChange={e => setNote(e.target.value)} helper="Optional" />
      </form>
    </Modal>
  );
}
