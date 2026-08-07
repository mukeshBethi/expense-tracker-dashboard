import { useState } from "react";
import { X } from "lucide-react";
import { validateCategoryName } from "../lib/validation.js";

export default function CategoryManager({ categories, expenses, onAddCategory, onRequestRemoveCategory }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleAdd(evt) {
    evt.preventDefault();
    const err = validateCategoryName(name, categories);
    if (err) { setError(err); return; }
    onAddCategory(name.trim());
    setName("");
    setError("");
  }

  function handleRemove(cat) {
    if (expenses.some(e => e.category === cat)) {
      setError(`"${cat}" is used by existing expenses and can't be removed.`);
      return;
    }
    setError("");
    onRequestRemoveCategory(cat);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {categories.map(c => (
          <span className="inline-flex items-center gap-1.5 bg-surface-2 text-text text-sm rounded-pill pl-3 pr-2 py-1.5" key={c}>
            {c}
            <button type="button" title="Remove category" onClick={() => handleRemove(c)}
                    className="p-0.5 rounded-pill hover:bg-surface text-muted hover:text-danger transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>
      {error && <p className="text-xs text-danger mb-3">{error}</p>}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input type="text" maxLength={24} placeholder="Add category…"
               value={name} onChange={e => setName(e.target.value)}
               className="flex-1 bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        <button type="submit" className="bg-transparent hover:bg-surface-2 text-text border border-border-dim rounded-pill px-4 py-2.5 text-sm font-medium transition-colors">
          Add
        </button>
      </form>
    </div>
  );
}
