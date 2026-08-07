# UX Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pre-deployment UX polish: cursor consistency, a real favicon, proactive amount-digit-limiting, a searchable category dropdown, and a mobile responsiveness audit/fix pass at specific breakpoints.

**Architecture:** Six independent tasks. No hooks, no Firestore, no validation-rule changes — `validateAmount`'s 10-digit rule stays the single source of truth; the amount-input change makes it unreachable by typing rather than removing it.

**Tech Stack:** No new dependencies for this phase (Combobox is hand-built, not a library — small enough to not justify a new dependency).

## Global Constraints

- No business-logic changes anywhere in this plan — every task is presentation/UX only, except the digit-cap which changes *when* the existing 10-digit rule is enforced (proactively vs. reactively), not the rule itself (spec: Decisions).
- Every `<button>` element in `src/` needs `cursor-pointer` — verify via grep, not assumption, since Tailwind's Preflight resets buttons to `cursor: default` (spec: Decisions).
- The Combobox component must replace only the two named native `<select>`s (ExpenseForm's category picker, App.jsx's category filter) — not the currency select (spec: Decisions).

---

### Task 1: Favicon + theme-color meta

**Files:**
- Modify: `public/favicon.svg` (full replacement).
- Modify: `index.html` (add theme-color meta tags).

**Interfaces:** none.

- [ ] **Step 1: Replace `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#059669"/>
  <text x="16" y="22" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">$</text>
</svg>
```

- [ ] **Step 2: Add theme-color meta tags to `index.html`**

Find the `<link rel="icon" ...>` line and add immediately after it:

```html
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#020406" media="(prefers-color-scheme: dark)" />
```

(`#020406` matches this app's dark-mode `--bg` value; `#ffffff` matches its light-mode `--surface-1`/near-white background.)

- [ ] **Step 3: Verify and commit**

Run `npm run build`. Confirm `dist/favicon.svg` exists and contains the new SVG (not the old Vite-branded one).

```bash
git add public/favicon.svg index.html
git commit -m "Add a real favicon and theme-color meta tags"
```

---

### Task 2: Cursor consistency

**Files:** every `.jsx` file containing a `<button>` element without `cursor-pointer` in its className — enumerate via grep, don't assume the list below is exhaustive.

**Interfaces:** none — pure className additions.

- [ ] **Step 1: Find every button missing `cursor-pointer`**

```bash
grep -rn "<button" src --include=*.jsx
```

For each match, check whether its className (which may be on the same line or a following line, since some buttons wrap their JSX across multiple lines) already contains `cursor-pointer`. As of this plan's writing, NONE of them do (confirmed via `grep -rn "<button" src --include=*.jsx | grep -v cursor-pointer` returning every button in the app) — so expect to touch all of: `App.jsx` (Clear all data), `AuthScreen.jsx` (2 tab buttons + submit), `CategoryManager.jsx` (remove-chip + add-category submit), `ConfirmDialog.jsx` (confirm + cancel), `ExpenseForm.jsx` (submit + cancel), `ExpenseTable.jsx` (2 desktop icon buttons + 2 mobile buttons), `Header.jsx` (theme toggle, export, sign out). Re-run the grep after your edits to confirm zero remain.

- [ ] **Step 2: Add `cursor-pointer` to every button's className**

Add the literal class `cursor-pointer` into each button's existing `className="..."` string (anywhere in the string is fine — Tailwind doesn't care about order). Do not touch buttons that are `disabled` conditionally (e.g. `ExpenseForm`'s submit button, `AuthScreen`'s submit button) — `cursor-pointer` combined with the browser's native `disabled` cursor behavior is fine as-is; Tailwind's `disabled:cursor-not-allowed` is NOT part of this task's scope (that would be a nice-to-have, but the request only asked for pointer-on-hoverable-buttons, not a disabled-state audit — don't add scope not asked for).

Also check for any non-`<button>` clickable elements that should get the same treatment — specifically the sortable table headers in `ExpenseTable.jsx` (`<th className="... cursor-pointer select-none" onClick=...>`) already have it; verify this and don't duplicate the class if so.

- [ ] **Step 3: Verify and commit**

```bash
grep -rn "<button" src --include=*.jsx | grep -v cursor-pointer
```
Expected: no output (every button now has the class somewhere in a nearby className — if a button's className spans multiple lines, this simple grep may still show a "miss" even though the class is present a line or two down; visually confirm any apparent miss before treating it as a real gap).

```bash
npm run build && npm run lint
git add -A
git commit -m "Add cursor-pointer to every clickable button in the app"
```

---

### Task 3: Proactive amount-digit-limiting

**Files:**
- Modify: `src/lib/format.js` (`formatAmountInput`).

**Interfaces:** `formatAmountInput(rawValue: string) => string` — same signature, new behavior: caps the integer part at 10 digits instead of allowing unlimited typed length.

- [ ] **Step 1: Update `formatAmountInput` in `src/lib/format.js`**

```js
const MAX_INT_DIGITS = 10;

export function formatAmountInput(rawValue) {
  if (!rawValue) return "";
  const cleaned = rawValue.replace(/,/g, "");
  const [intPart, decPart] = cleaned.split(".");
  if (!/^\d*$/.test(intPart)) return rawValue.replace(/,/g, "");
  const cappedIntPart = intPart.slice(0, MAX_INT_DIGITS);
  const withCommas = cappedIntPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
}
```

(`MAX_INT_DIGITS` here is a local copy of the same `10` used by `validateAmount` in `src/lib/validation.js` — these two files don't currently share this constant, and this plan doesn't restructure that; if you want to avoid the duplicate magic number, you may export a shared constant from `validation.js` and import it here instead, but this is optional polish, not required.)

- [ ] **Step 2: Verify both consumers benefit automatically**

`src/components/ExpenseForm.jsx`'s `handleAmountChange` and `src/components/BudgetList.jsx`'s two budget `<input onBlur>` handlers — check whether `BudgetList.jsx` actually calls `formatAmountInput` at all (it may just use a raw `<input type="number">` with no formatting call, in which case this task doesn't apply to it and you should note that in your report rather than inventing a call that doesn't fit the existing code). Only wire `formatAmountInput` into `BudgetList.jsx` if it doesn't already produce comma-formatted display value some other way — read the current file first to check, don't assume.

- [ ] **Step 3: Verify manually**

Trace: typing `12345678901` (11 digits) into the amount field results in the displayed value staying at `1,234,567,890` (10 digits, comma-formatted) — the 11th keystroke is silently dropped, no error shown, no `errors.amount` triggered on submit since the value was never allowed to exceed the limit in the first place.

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/lib/format.js
git commit -m "Cap amount input at 10 digits proactively instead of erroring after the fact"
```

---

### Task 4: Build the `Combobox` component

**Files:**
- Create: `src/components/Combobox.jsx`.

**Interfaces:**
- `Combobox({ options: string[], value: string, onChange: (value: string) => void, placeholder?: string, allowClear?: boolean, clearLabel?: string })` — `allowClear`/`clearLabel` support an optional "no selection" state (used by the category filter, which has an "All categories" option); `ExpenseForm`'s category picker (Task 5) won't use `allowClear`.

- [ ] **Step 1: Write `src/components/Combobox.jsx`**

```jsx
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
```

Note: option-click handlers use `onMouseDown` rather than `onClick` deliberately — `onClick` would fire after the input's `onBlur`/the outside-click-close effect already closed the dropdown and unmounted the list, so the click would never register. `onMouseDown` fires before blur.

- [ ] **Step 2: Verify manually**

Run `npm run build`. This component isn't wired into the app yet (Task 5 does that) — for now just confirm it compiles with no errors and exports correctly.

- [ ] **Step 3: Commit**

```bash
npm run build && npm run lint
git add src/components/Combobox.jsx
git commit -m "Add reusable searchable Combobox component"
```

---

### Task 5: Wire `Combobox` into the category picker and category filter

**Files:**
- Modify: `src/components/ExpenseForm.jsx` — replace the category `<select>` with `<Combobox>`.
- Modify: `src/App.jsx` — replace the category-filter `<select>` with `<Combobox allowClear>`.

**Interfaces:** no prop changes to `ExpenseForm` or the parent-level `filterCategory`/`setFilterCategory` state — only the internal picker markup changes.

- [ ] **Step 1: Replace the category select in `src/components/ExpenseForm.jsx`**

Add the import:
```jsx
import Combobox from "./Combobox.jsx";
```

Find:
```jsx
<div>
  <label htmlFor="exp-category" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Category</label>
  <select id="exp-category" value={category} onChange={e => setCategory(e.target.value)}
          className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
    {categories.map(c => <option key={c} value={c}>{c}</option>)}
  </select>
  {errors.category && <p className="text-xs text-danger mt-1">{errors.category}</p>}
</div>
```
Replace with:
```jsx
<div>
  <label htmlFor="exp-category" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Category</label>
  <Combobox options={categories} value={category} onChange={setCategory} placeholder="Select a category…" />
  {errors.category && <p className="text-xs text-danger mt-1">{errors.category}</p>}
</div>
```

(The `id="exp-category"`/`htmlFor` association is lost since `Combobox` doesn't accept an `id` prop — this is a minor accessibility regression for this one field; if you want to preserve it cleanly, add an optional `id` prop to `Combobox` that forwards to its internal `<input id={id}>`, and pass `id="exp-category"` here. Do this if it's a small addition; don't skip label association silently.)

- [ ] **Step 2: Replace the category filter select in `src/App.jsx`**

Add the import alongside the other component imports:
```jsx
import Combobox from "./components/Combobox.jsx";
```

Find:
```jsx
<select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
        className="bg-surface-2 border border-border-dim rounded-input px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
  <option value="">All categories</option>
  {state.categories.map(c => <option key={c} value={c}>{c}</option>)}
</select>
```
Replace with:
```jsx
<div className="w-44">
  <Combobox options={state.categories} value={filterCategory} onChange={setFilterCategory} allowClear clearLabel="All categories" placeholder="All categories" />
</div>
```

(Wrapped in a fixed-width `div` since `Combobox` is `w-full` internally and this filter sits in a `flex gap-2` row alongside the search input — without a width constraint it would grow to fill available space unevenly; `w-44` roughly matches the old `<select>`'s natural width. Adjust if it looks visually off relative to the search input next to it, using your judgment — this isn't a hard requirement, just a reasonable starting width.)

- [ ] **Step 3: Verify manually**

Trace: `ExpenseForm`'s category `Combobox` — opening it shows all categories, typing filters them, selecting one calls `setCategory` exactly as the old `<select>`'s `onChange` did, submitting the form still validates via `validateCategory(category)` unchanged. The filter `Combobox` — selecting "All categories" sets `filterCategory` to `""` (matching the old `<option value="">All categories</option>` behavor exactly), selecting a real category filters the table exactly as before.

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/components/ExpenseForm.jsx src/App.jsx
git commit -m "Replace category select and filter dropdown with searchable Combobox"
```

---

### Task 6: Mobile responsiveness audit at 320/375/390/414/768px

**Files:** any file where a real issue is found — this task starts as an audit, not a predetermined edit list.

**Interfaces:** none, unless a fix requires one (unlikely for a responsiveness pass).

- [ ] **Step 1: Reason through each of the app's major surfaces at each requested width**

For each of 320px, 375px, 390px, 414px, and 768px, reason through (you don't have a browser — use the same method that caught the real overflow bug in an earlier phase's final review: read the actual Tailwind classes and compute expected rendered widths, don't just assert "should be fine"):

- **Header** (`src/components/Header.jsx`): brand name + icon row, currency select, export button (icon-only below `sm`=640px, so already fine at all 5 widths), user avatar/email/sign-out. Check: does the header's `flex items-center justify-between` wrap or overflow at 320px with all elements present? Email is `hidden md:inline` (768px+) so it's not a factor below that — but check whether the remaining elements (brand, theme toggle, currency select, export icon, avatar, sign-out icon) fit in 320px width without wrapping awkwardly or the currency `<select>` (which has no explicit width constraint) pushing things off-screen.
- **AuthScreen** (`src/components/AuthScreen.jsx`): the card is `max-w-sm` (384px) with `px-4` outer padding on its container — at 320px, does `max-w-sm` combined with the outer `px-4` (16px each side) actually fit, or does 384px + 32px padding exceed 320px (it does — 384 > 320-32=288, so the card should be constrained by `w-full` inside the flex container, not literally hit 384px at this viewport; verify the actual className chain makes this safe, e.g. confirm there's a `w-full` on the card alongside `max-w-sm` so it shrinks below the max-width on narrow screens rather than causing overflow).
- **Outer layout** (`src/App.jsx`'s `<main>`): single column below `lg` (1024px) — all 5 target widths are single-column, so the two-column overflow bug fixed in the previous phase doesn't apply here; but check the `px-4` at the base breakpoint still leaves reasonable content width at 320px (320 − 32 = 288px content width — check whether anything inside (e.g. `SummaryCards`' grid, which is `grid-cols-1` by default and only goes multi-column at `sm`/`xl`) needs more than that).
- **SummaryCards** (`src/components/SummaryCards.jsx`): `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` — single column below 640px, so 320-414px are all single-column (safe), 768px is `sm` (2-column) — check whether a stat card's content (icon pill + large tabular-nums value + delta badge) fits in roughly half of 768px minus gaps/padding (~350px per card) without the delta badge or truncated value looking cramped.
- **Charts** (`CategoryChart.jsx`/`TrendChart.jsx` containers in `App.jsx`): `.charts-grid` (legacy CSS, still has its own `@media (max-width:1100px)` single-column rule per the known Task-9 minor) — confirm this still correctly stacks to one column at all 5 target widths (all are well under 1100px, so this should already be fine, but verify the actual CSS rule is still present and correctly written, not accidentally broken by the cleanup phase).
- **ExpenseForm/CategoryManager/BudgetList cards**: single-column form fields, `flex gap-3` button rows (Add/Cancel, Confirm/Cancel) — at 320px, two `flex-1` buttons side by side with `gap-3` and `px-4` text — check whether button label text ("Create Account", "Remove category" chips, etc.) wraps or truncates awkwardly.
- **ExpenseTable mobile card list** (`md:hidden` below 768px, so active at 320-414px but NOT at 768px, which shows the desktop table): check the card's `flex justify-between` action buttons and category+note row for overflow with a long note (`truncate max-w-[140px]` already present — verify this is enough at 320px width where the card itself is only ~288px wide minus its own `p-4` padding ≈ 256px content width).
- **ExpenseTable desktop table specifically at exactly 768px** (this is the `md` breakpoint, so the table switches ON here) — with the outer layout still single-column at 768px (since `lg`=1024 > 768), the table has the FULL content width available (~768 − 32px page padding − 48px card padding ≈ 688px) which is comfortably more than its ~620px min-content width calculated in the earlier phase's overflow bug — confirm this specific case (single-column layout + desktop table) is safe, since it's a different combination than the previously-fixed 2-column+table overflow case.
- **Dialogs** (`ConfirmDialog.jsx`, the new `Combobox`'s dropdown list): `ConfirmDialog` is `max-w-sm` with `px-4` outer padding — same math as AuthScreen, verify it's safe. `Combobox`'s dropdown (`absolute z-10 mt-1 w-full`) — confirm it doesn't extend past the viewport edge when its parent input is near the right edge of a narrow screen (a `w-full` dropdown relative to its own input shouldn't ever overflow sideways, but verify there's no `min-width` or fixed-width override that would break this).

- [ ] **Step 2: Fix any real issues found**

For each genuine problem identified in Step 1 (not any of the described-as-safe cases above unless your own re-verification finds them actually unsafe), make the minimal Tailwind className fix (e.g., adding `min-w-0`, adjusting a breakpoint, adding `flex-wrap`, constraining a width). Document each fix with the specific viewport(s) and element it addresses.

- [ ] **Step 3: Full verification**

Run `npm run build && npm run lint`. Since no browser tool is available, this task's "verification" IS the careful reasoning in Step 1/2 — be honest in your report about this being a static-analysis audit, not a device-lab test, same caveat as every prior phase in this project's history.

- [ ] **Step 4: Commit**

If fixes were needed:
```bash
git add -A
git commit -m "Fix mobile responsiveness issues found in breakpoint audit"
```
If the audit found zero real issues, commit nothing for this step and report that explicitly — don't invent a change to justify a commit.
