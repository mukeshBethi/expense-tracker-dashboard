import { useState } from "react";
import { Trash2 } from "lucide-react";
import { validateCategoryName } from "../lib/validation.js";
import { formatMoney } from "../lib/format.js";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Toast from "../components/ui/Toast.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

export default function CategoriesPage({ state, addCategory, removeCategory, toastMessage, dismissToast, setToastMessage }) {
  const { categories, expenses } = state;
  const currency = state.settings.currency;
  const [name, setName] = useState("");
  const [addError, setAddError] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [confirmRemoveCategory, setConfirmRemoveCategory] = useState(null);

  const statsByCategory = {};
  for (const c of categories) statsByCategory[c] = { count: 0, total: 0 };
  for (const e of expenses) {
    if (!statsByCategory[e.category]) continue;
    statsByCategory[e.category].count += 1;
    statsByCategory[e.category].total += e.amount;
  }

  function handleAdd(evt) {
    evt.preventDefault();
    const err = validateCategoryName(name, categories);
    if (err) { setAddError(err); return; }
    addCategory(name.trim());
    setName("");
    setAddError("");
    setToastMessage("Category added.");
  }

  function handleRequestRemove(cat) {
    if (expenses.some(e => e.category === cat)) {
      setRemoveError(`"${cat}" is used by existing expenses and can't be removed.`);
      return;
    }
    setRemoveError("");
    setConfirmRemoveCategory(cat);
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <form onSubmit={handleAdd} className="flex gap-3 items-end">
        <Input
          placeholder="Add a category…" maxLength={24}
          value={name} onChange={e => setName(e.target.value)}
          error={addError}
          className="flex-1 max-w-sm"
        />
        <Button type="submit">Add category</Button>
      </form>

      {removeError && <p className="text-sm text-pr-danger">{removeError}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(c => {
          const stats = statsByCategory[c] || { count: 0, total: 0 };
          return (
            <div key={c} className="bg-pr-card shadow-pr-sm rounded-pr-card border border-pr-border-subtle p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-pr-primary truncate" title={c}>{c}</span>
                <button
                  onClick={() => handleRequestRemove(c)} aria-label={`Remove ${c}`} title={`Remove ${c}`}
                  className="w-10 h-10 flex items-center justify-center rounded-pr-default text-pr-secondary hover:bg-pr-danger-soft hover:text-pr-danger transition-colors cursor-pointer flex-shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-xs text-pr-tertiary">
                {stats.count} {stats.count === 1 ? "expense" : "expenses"} · {formatMoney(stats.total, currency)}
              </p>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={confirmRemoveCategory !== null}
        title="Remove category"
        message={confirmRemoveCategory ? `Remove category "${confirmRemoveCategory}"? This cannot be undone.` : ""}
        onConfirm={() => { removeCategory(confirmRemoveCategory); setConfirmRemoveCategory(null); setToastMessage("Category removed."); }}
        onCancel={() => setConfirmRemoveCategory(null)}
      />
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast tone="success" title={toastMessage} onClose={dismissToast} />
        </div>
      )}
    </div>
  );
}
