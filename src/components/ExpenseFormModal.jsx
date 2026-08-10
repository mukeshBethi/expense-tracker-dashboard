import { useState, useEffect, useRef, useMemo } from "react";
import { Repeat } from "lucide-react";
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

const QUICK_CATEGORY_COUNT = 5;

export default function ExpenseFormModal({ open, categories, expenses, templates, editingExpense, onSubmit, onSaveTemplate, onClose }) {
  const [date, setDate] = useState(todayISO());
  const [amountDisplay, setAmountDisplay] = useState("");
  const [category, setCategory] = useState(categories[0] || "");
  const [note, setNote] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [errors, setErrors] = useState({});
  const amountInputRef = useRef(null);

  // Most-frequently-used categories stand in for "recent" here -- there's no
  // per-use timestamp tracked today, and frequency is a reasonable proxy for
  // the categories someone actually taps over and over (coffee, groceries,
  // gas), which is exactly what a one-tap shortcut should target.
  const quickCategories = useMemo(() => {
    const counts = {};
    for (const e of expenses || []) counts[e.category] = (counts[e.category] || 0) + 1;
    return [...categories].sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, QUICK_CATEGORY_COUNT);
  }, [categories, expenses]);

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
    setSaveAsTemplate(false);
    setErrors({});
    // Focus after the sheet/modal has actually mounted, not mid-render.
    const id = requestAnimationFrame(() => amountInputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open, editingExpense, categories]);

  function handleAmountChange(evt) {
    setAmountDisplay(formatAmountInput(evt.target.value));
  }

  function applyTemplate(t) {
    setCategory(t.category);
    setAmountDisplay(formatAmountInput(String(t.amount)));
    setNote(t.note || "");
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

    const trimmedNote = note.trim();
    onSubmit({ date, amount, category, note: trimmedNote });
    if (saveAsTemplate && !editingExpense && onSaveTemplate) {
      onSaveTemplate({ label: category, category, amount, note: trimmedNote });
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      sheet
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
        {!editingExpense && templates && templates.length > 0 && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-pr-tertiary mb-1.5 block">Quick add</label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-pr-pill text-xs font-medium border border-pr-border-default bg-pr-subtle text-pr-secondary hover:text-pr-primary transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <Input
          ref={amountInputRef}
          label="Amount" type="text" inputMode="decimal" placeholder="0.00"
          value={amountDisplay} onChange={handleAmountChange} error={errors.amount}
        />
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-pr-tertiary mb-1.5 block">Category</label>
          {quickCategories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-0.5 px-0.5">
              {quickCategories.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-pr-pill text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    category === c
                      ? "bg-pr-accent text-white border-pr-accent"
                      : "bg-pr-subtle text-pr-secondary border-pr-border-default hover:text-pr-primary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <Combobox options={categories} value={category} onChange={setCategory} placeholder="Select a category…" />
          {errors.category && <p className="text-xs text-pr-danger mt-1">{errors.category}</p>}
        </div>
        <Input label="Date" type="date" max={todayISO()} value={date} onChange={e => setDate(e.target.value)} error={errors.date} />
        <Input label="Note" type="text" maxLength={120} placeholder="e.g. Lunch with team" value={note} onChange={e => setNote(e.target.value)} helper="Optional" />
        {!editingExpense && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={saveAsTemplate} onChange={e => setSaveAsTemplate(e.target.checked)} className="cursor-pointer" />
            <span className="text-sm text-pr-secondary">
              <Repeat size={13} className="inline mr-1 -mt-0.5" />
              Save as a quick-add template for next time
            </span>
          </label>
        )}
      </form>
    </Modal>
  );
}
