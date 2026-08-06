import { useState } from "react";
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
      <div className="chips">
        {categories.map(c => (
          <span className="chip" key={c}>
            {c}
            <button type="button" title="Remove category" onClick={() => handleRemove(c)}>×</button>
          </span>
        ))}
      </div>
      {error && <p className="field-error">{error}</p>}
      <form className="inline-form" onSubmit={handleAdd}>
        <input type="text" maxLength={24} placeholder="Add category…"
               value={name} onChange={e => setName(e.target.value)} />
        <button type="submit" className="btn btn-secondary">Add</button>
      </form>
    </div>
  );
}
