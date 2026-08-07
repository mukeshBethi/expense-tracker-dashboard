import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export default function Combobox({ options, value, onChange, placeholder = "Select…", allowClear = false, clearLabel = "All" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const allOptions = allowClear ? ["", ...options] : options;
  const labelFor = (opt) => (opt === "" ? clearLabel : opt);
  const filtered = query
    ? allOptions.filter(opt => labelFor(opt).toLowerCase().includes(query.toLowerCase()))
    : allOptions;

  useEffect(() => {
    function handleClickOutside(evt) {
      if (containerRef.current && !containerRef.current.contains(evt.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectOption(opt) {
    onChange(opt);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(evt) {
    if (evt.key === "ArrowDown") {
      evt.preventDefault();
      setOpen(true);
      setHighlightedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (evt.key === "ArrowUp") {
      evt.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (evt.key === "Enter") {
      evt.preventDefault();
      if (open && filtered[highlightedIndex] !== undefined) selectOption(filtered[highlightedIndex]);
    } else if (evt.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  const displayValue = open ? query : labelFor(value);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="combobox-listbox"
          placeholder={placeholder}
          value={displayValue}
          onFocus={() => { setOpen(true); setHighlightedIndex(0); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlightedIndex(0); }}
          onKeyDown={handleKeyDown}
          className="w-full bg-surface-2 border border-border-dim rounded-input pl-3 pr-8 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors cursor-text"
        />
        {open ? <Search className="w-4 h-4 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" /> : <ChevronDown className="w-4 h-4 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />}
      </div>
      {open && (
        <ul id="combobox-listbox" role="listbox" className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-surface shadow-soft rounded-input border border-border-dim py-1">
          {filtered.length === 0 && <li className="px-3 py-2 text-sm text-muted">No matches</li>}
          {filtered.map((opt, i) => (
            <li key={opt || "__clear__"} role="option" aria-selected={opt === value}
                onMouseDown={() => selectOption(opt)}
                className={`px-3 py-2 text-sm cursor-pointer ${i === highlightedIndex ? "bg-surface-2" : ""} ${opt === value ? "text-primary font-medium" : "text-text"}`}>
              {labelFor(opt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
