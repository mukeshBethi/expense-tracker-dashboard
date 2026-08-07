# Rest-of-App Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the premium redesign by restyling every remaining component (`Header`, `AuthScreen`, `ExpenseForm`, `CategoryManager`, `BudgetList`, `ExpenseTable`, `Toast`, `ConfirmDialog`, the outer layout shell) with Tailwind + the established design tokens, then remove all now-dead legacy CSS in one final pass.

**Architecture:** Every task is styling-only (className/JSX changes) except: (a) the outer layout shell converts from a hand-written CSS grid to Tailwind grid utilities, (b) `ExpenseTable`'s desktop/mobile switch converts from a CSS media query to Tailwind responsive classes, (c) `ConfirmDialog`'s confirm button changes color (danger, not primary) — a deliberate one-line polish fix, not a behavior change. No hooks, no validation logic, no Firestore interaction changes anywhere in this plan.

**Tech Stack:** Tailwind v4 (established), `lucide-react` (established, already installed).

## Global Constraints

- Every task in this plan is styling-only except the three explicitly named exceptions above (spec: Scope).
- `BudgetList.jsx`'s validation/allocation logic must remain byte-identical — this component was just built and reviewed for the total-budget feature (spec: Scope).
- Confirm dialogs use the danger button convention (`bg-red-600 ... hover:bg-red-700`), not primary (spec: Shared conventions).
- No gradient text anywhere in this phase (spec: Shared conventions).
- Header keeps a light backdrop blur as the sole exception to "no blur except true overlays" (spec: Shared conventions).
- Exact shared conventions (card/input/button/chip/tab classNames) are given in the spec's table — use them verbatim for consistency across all 9 tasks, don't improvise per-component variants.
- The final cleanup task (Task 9) must verify via `grep`, not assumption, that every removed CSS selector has zero remaining references in `src/`.

---

### Task 1: New token + outer layout shell + body background cleanup

**Files:**
- Modify: `src/index.css` — add `--radius-input` token; simplify `html, body`'s background (remove the radial-gradient glow orbs, keep a plain `background-color: var(--bg)`).
- Modify: `src/App.jsx` — convert `<main className="layout"><section className="col col-left">...</section><section className="col col-right">...</section></main>` to Tailwind grid classes. Do NOT change anything inside the two sections yet (their internal cards are Tasks 5-8) — only the outer `<main>`/`<section>` wrapper classNames.

**Interfaces:** none — pure layout/CSS change, no prop/function changes.

- [ ] **Step 1: Add the `--radius-input` token**

In `src/index.css`, find the `@theme { ... }` block and add `--radius-input: var(--radius-input);` alongside the existing `--radius-card`/`--radius-pill` lines. Then find the base `:root { ... }` block (the one with `--radius-card: 16px; --radius-pill: 999px;`) and add `--radius-input: 10px;` next to them.

- [ ] **Step 2: Simplify the body background**

Find in `src/index.css`:
```css
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  color: var(--text);
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg);
  background-image:
    radial-gradient(ellipse 900px 600px at 5% 0%,   rgba(16, 185, 129, 0.13) 0%, transparent 65%),
    radial-gradient(ellipse 700px 500px at 90% 20%,  rgba(16, 185, 129, 0.07) 0%, transparent 60%),
    radial-gradient(ellipse 600px 800px at 50% 100%, rgba(5, 150, 105, 0.09) 0%, transparent 70%);
}
```

Remove the `background-image` property entirely (keep everything else, including `background-color: var(--bg);`).

- [ ] **Step 3: Convert the outer layout shell in `src/App.jsx`**

Find:
```jsx
<main className="layout">
  <section className="col col-left">
```
and
```jsx
  </section>
  <section className="col col-right">
```
and the closing
```jsx
  </section>
</main>
```

Replace with:
```jsx
<main className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 px-4 sm:px-6 lg:px-9 py-7 pb-14">
  <section className="flex flex-col gap-6">
```
and
```jsx
  </section>
  <section className="flex flex-col gap-6">
```
and the closing stays
```jsx
  </section>
</main>
```

(i.e. only the opening tag classNames change — `<section>` closing tags and everything between them are untouched in this task).

- [ ] **Step 4: Verify manually**

Run `npm run build`. Resize (or use devtools device toolbar if available) to confirm: below `lg:` (1024px) the two sections stack to one column; above it, a 380px left column + flexible right column, matching the pre-existing layout's proportions. Confirm the body no longer shows the decorative glow gradients (solid background only).

- [ ] **Step 5: Commit**

```bash
npm run build && npm run lint
git add src/index.css src/App.jsx
git commit -m "Add input radius token, simplify body background, convert outer layout to Tailwind grid"
```

---

### Task 2: Redesign `Header`

**Files:**
- Modify: `src/components/Header.jsx` — full restyle.

**Interfaces:** Props unchanged: `{ email, currency, theme, onCurrencyChange, onToggleTheme, onExport, onSignOut }`.

- [ ] **Step 1: Rewrite `src/components/Header.jsx`**

```jsx
import { Sun, Moon, Download, LogOut } from "lucide-react";

export default function Header({ email, currency, theme, onCurrencyChange, onToggleTheme, onExport, onSignOut }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-9 py-4 bg-surface/80 backdrop-blur-md border-b border-border-dim">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-9 h-9 rounded-input bg-primary text-white font-bold text-lg">$</span>
        <h1 className="text-lg font-semibold text-text">Expense Tracker</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          className="p-2.5 rounded-pill hover:bg-surface-2 text-muted hover:text-text transition-colors"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <select
          value={currency}
          onChange={e => onCurrencyChange(e.target.value)}
          aria-label="Currency"
          className="bg-surface-2 border border-border-dim rounded-input px-2.5 py-2 text-sm text-text"
        >
          <option value="$">$ USD</option>
          <option value="€">€ EUR</option>
          <option value="£">£ GBP</option>
          <option value="₹">₹ INR</option>
        </select>
        <button
          className="hidden sm:inline-flex items-center gap-1.5 bg-transparent hover:bg-surface-2 text-text border border-border-dim rounded-pill px-3.5 py-2 text-sm font-medium transition-colors"
          onClick={onExport}
        >
          <Download className="w-4 h-4" /> Export
        </button>
        <div className="flex items-center gap-2 ml-1 sm:ml-2">
          <span className="grid place-items-center w-8 h-8 rounded-pill bg-primary/10 text-primary text-sm font-semibold">
            {(email || "?").charAt(0).toUpperCase()}
          </span>
          <span className="hidden md:inline text-sm text-muted max-w-[160px] truncate">{email}</span>
          <button
            className="p-2 rounded-pill hover:bg-surface-2 text-muted hover:text-text transition-colors"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify manually**

Run `npm run build`. Confirm the "Export" label collapses correctly on narrow viewports (icon-only would need its own `title`, but this task keeps the label hidden below `sm:` rather than icon-only — the button remains clickable, just visually simplified) and the email truncates instead of overflowing on medium widths.

- [ ] **Step 3: Commit**

```bash
npm run build && npm run lint
git add src/components/Header.jsx
git commit -m "Redesign Header with opaque sticky surface and icon buttons"
```

---

### Task 3: Redesign `AuthScreen`

**Files:**
- Modify: `src/components/AuthScreen.jsx` — full restyle. No logic changes (mode switching, submit handling, error display all stay as they are).

**Interfaces:** Props unchanged: `{ onSignIn, onSignUp, authError, clearAuthError }`.

- [ ] **Step 1: Rewrite the JSX in `src/components/AuthScreen.jsx`**

Keep the existing `useState`/`handleSubmit`/`switchMode` functions exactly as they are — only replace the `return (...)` block:

```jsx
return (
  <div className="min-h-screen flex items-center justify-center bg-bg px-4">
    <div className="w-full max-w-sm bg-surface shadow-soft rounded-card p-6 sm:p-8">
      <div className="text-center mb-6">
        <span className="inline-grid place-items-center w-12 h-12 rounded-input bg-primary text-white font-bold text-2xl mb-4">$</span>
        <h1 className="text-xl font-semibold text-text mb-1">Expense Tracker</h1>
        <p className="text-sm text-muted">Track spending. Stay on budget.</p>
      </div>

      <div className="inline-flex w-full bg-surface-2 rounded-pill p-1 mb-5">
        <button
          type="button"
          className={`flex-1 rounded-pill px-4 py-2 text-sm font-medium transition-colors ${mode === "signin" ? "bg-surface text-text shadow-soft" : "text-muted hover:text-text"}`}
          onClick={() => switchMode("signin")}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`flex-1 rounded-pill px-4 py-2 text-sm font-medium transition-colors ${mode === "signup" ? "bg-surface text-text shadow-soft" : "text-muted hover:text-text"}`}
          onClick={() => switchMode("signup")}
        >
          Create Account
        </button>
      </div>

      {authError && <p className="text-xs text-danger bg-danger/10 rounded-input px-3 py-2 mb-4">{authError}</p>}

      <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
        <div>
          <label htmlFor="auth-email" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Email</label>
          <input id="auth-email" type="email" required autoComplete="email"
                 value={email} onChange={e => setEmail(e.target.value)}
                 className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        </div>
        <div>
          <label htmlFor="auth-password" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Password</label>
          <input id="auth-password" type="password" required minLength={6}
                 autoComplete={mode === "signin" ? "current-password" : "new-password"}
                 value={password} onChange={e => setPassword(e.target.value)}
                 className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
        </div>
        <button type="submit" disabled={submitting}
                className="w-full bg-primary text-white hover:bg-primary-text transition-colors rounded-pill px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-xs text-muted mt-5">Your data is securely stored in the cloud.</p>
    </div>
  </div>
);
```

- [ ] **Step 2: Verify manually**

Run `npm run build`. Confirm no gradient text remains (heading is solid `text-text`). Trace: switching tabs still calls `switchMode`, which clears `authError`; submitting still calls `onSignIn`/`onSignUp` based on `mode`.

- [ ] **Step 3: Commit**

```bash
npm run build && npm run lint
git add src/components/AuthScreen.jsx
git commit -m "Redesign AuthScreen with opaque card, segmented tabs, and solid heading"
```

---

### Task 4: Redesign `Toast` and `ConfirmDialog`

**Files:**
- Modify: `src/components/Toast.jsx` — full restyle. Timer/dismiss logic unchanged.
- Modify: `src/components/ConfirmDialog.jsx` — full restyle, including the confirm button changing from primary to danger (the one deliberate behavior-adjacent change in this plan — same `onConfirm`/`onCancel` callbacks, just a different button color).

**Interfaces:** Props unchanged on both: `Toast({ message, onDismiss })`, `ConfirmDialog({ open, message, onConfirm, onCancel })`.

- [ ] **Step 1: Rewrite `src/components/Toast.jsx`**

Keep the `useEffect` exactly as it is — only change the return JSX:

```jsx
if (!message) return null;
return (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface shadow-soft rounded-card px-5 py-3 text-sm text-text z-50" role="status">
    {message}
  </div>
);
```

- [ ] **Step 2: Rewrite `src/components/ConfirmDialog.jsx`**

```jsx
export default function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-surface shadow-soft rounded-card p-6">
        <p className="text-sm text-text mb-5">{message}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onConfirm}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-pill px-4 py-2.5 text-sm font-semibold">
            Confirm
          </button>
          <button type="button" onClick={onCancel}
                  className="flex-1 bg-transparent hover:bg-surface-2 text-text border border-border-dim rounded-pill px-4 py-2.5 text-sm font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify manually**

Run `npm run build`. Confirm `Toast`'s 3-second auto-dismiss timer logic is completely untouched (only the returned JSX changed). Confirm `ConfirmDialog` still takes the same 4 props and calls the same callbacks — only the button color/classNames changed.

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/components/Toast.jsx src/components/ConfirmDialog.jsx
git commit -m "Redesign Toast and ConfirmDialog, confirm button now uses danger color"
```

---

### Task 5: Redesign `ExpenseForm` (+ its card wrapper in `App.jsx`)

**Files:**
- Modify: `src/components/ExpenseForm.jsx` — full restyle. No logic changes (both `useEffect`s, `handleSubmit`, `handleAmountChange`, validation calls all stay exactly as they are).
- Modify: `src/App.jsx` — only the "Add Expense" card wrapper `<div className="card"><h2>...</h2><ExpenseForm .../></div>` changes className/structure, nothing else in the file.

**Interfaces:** Props unchanged: `{ categories, onSubmit, editingExpense, onCancelEdit }`.

- [ ] **Step 1: Rewrite the JSX in `src/components/ExpenseForm.jsx`**

Keep all existing state/effects/handlers — only replace the `return (...)` block:

```jsx
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
      <select id="exp-category" value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors">
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      {errors.category && <p className="text-xs text-danger mt-1">{errors.category}</p>}
    </div>
    <div>
      <label htmlFor="exp-note" className="text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block">Note <span className="font-normal not-italic text-muted/70">(optional)</span></label>
      <input id="exp-note" type="text" maxLength={120} placeholder="e.g. Lunch with team"
             value={note} onChange={e => setNote(e.target.value)}
             className="w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
    </div>
    <div className="flex gap-3">
      <button type="submit" className="flex-1 bg-primary text-white hover:bg-primary-text transition-colors rounded-pill px-4 py-2.5 text-sm font-semibold">
        {editingExpense ? "Save" : "Add"}
      </button>
      {editingExpense && (
        <button type="button" onClick={() => { onCancelEdit(); resetForm(); }}
                className="flex-1 bg-transparent hover:bg-surface-2 text-text border border-border-dim rounded-pill px-4 py-2.5 text-sm font-medium transition-colors">
          Cancel
        </button>
      )}
    </div>
  </form>
);
```

- [ ] **Step 2: Update the card wrapper in `src/App.jsx`**

Find:
```jsx
<div className="card">
  <h2>{editingExpense ? "Edit Expense" : "Add Expense"}</h2>
  <ExpenseForm
```
Replace with:
```jsx
<div className="bg-surface shadow-soft rounded-card p-5 sm:p-6">
  <h2 className="text-sm font-semibold text-text mb-3">{editingExpense ? "Edit Expense" : "Add Expense"}</h2>
  <ExpenseForm
```
(the closing `</div>` for this card and everything else in `App.jsx` stays untouched.)

- [ ] **Step 3: Verify manually**

Run `npm run build`. Trace through: submitting an empty form still shows all three inline errors; editing an expense still pre-fills correctly; the category-reconciliation effect (removing the plan's own comment about "phantom selection") is untouched since only JSX changed.

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/components/ExpenseForm.jsx src/App.jsx
git commit -m "Redesign ExpenseForm and its card wrapper"
```

---

### Task 6: Redesign `CategoryManager` (+ its card wrapper)

**Files:**
- Modify: `src/components/CategoryManager.jsx` — full restyle. No logic changes.
- Modify: `src/App.jsx` — only the "Categories" card wrapper.

**Interfaces:** Props unchanged: `{ categories, expenses, onAddCategory, onRequestRemoveCategory }`.

- [ ] **Step 1: Rewrite the JSX in `src/components/CategoryManager.jsx`**

Keep `handleAdd`/`handleRemove` exactly as they are — only replace the `return (...)` block:

```jsx
import { X } from "lucide-react";
```
(add to the top imports, alongside the existing `useState`/`validateCategoryName` imports)

```jsx
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
```

- [ ] **Step 2: Update the card wrapper in `src/App.jsx`**

Find:
```jsx
<div className="card">
  <h2>Categories</h2>
  <CategoryManager
```
Replace with:
```jsx
<div className="bg-surface shadow-soft rounded-card p-5 sm:p-6">
  <h2 className="text-sm font-semibold text-text mb-3">Categories</h2>
  <CategoryManager
```

- [ ] **Step 3: Verify manually**

Run `npm run build`. Trace: adding a duplicate name still shows the inline error; removing a category in use still blocks with its own inline error (before any confirm dialog); removing an unused category still calls `onRequestRemoveCategory`, which `App.jsx` turns into the confirm-dialog flow (unchanged, not part of this task).

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/components/CategoryManager.jsx src/App.jsx
git commit -m "Redesign CategoryManager and its card wrapper"
```

---

### Task 7: Redesign `BudgetList` (+ its card wrapper) — styling only, zero logic changes

**Files:**
- Modify: `src/components/BudgetList.jsx` — restyle only.
- Modify: `src/App.jsx` — only the "Monthly Budgets" card wrapper.

**Interfaces:** Props unchanged: `{ categories, budgets, expensesThisMonth, currency, onSetBudget, totalBudget, onSetTotalBudget }`.

**This component was just built and reviewed for the total-budget allocation feature. Every function (`handleChange`, `handleTotalChange`), every validator call, every piece of `useState` must stay byte-identical. Only JSX/className changes.**

- [ ] **Step 1: Rewrite the JSX in `src/components/BudgetList.jsx`**

Keep `handleChange`/`handleTotalChange`/all state exactly as they are — only replace the `return (...)` block:

```jsx
return (
  <div className="space-y-5">
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <span className="text-sm font-medium text-text">Total Monthly Budget</span>
        <input type="number" min="0" step="1" placeholder="—"
               defaultValue={totalBudget > 0 ? totalBudget : ""}
               onBlur={e => handleTotalChange(e.target.value)}
               className="w-28 bg-surface-2 border border-border-dim rounded-input px-3 py-1.5 text-sm text-text text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
      </div>
      {totalError && <p className="text-xs text-danger mb-1.5">{totalError}</p>}
      {totalBudget > 0 && (
        <>
          <div className="h-1.5 rounded-pill bg-surface-2 overflow-hidden">
            <span className="block h-full bg-primary rounded-pill transition-all" style={{ width: `${allocatedPct}%` }} />
          </div>
          <p className="text-xs text-muted mt-1.5">
            {`Allocated ${formatMoney(allocated, currency)} of ${formatMoney(totalBudget, currency)} total`}
          </p>
        </>
      )}
    </div>

    {categories.map(c => {
      const limit = Number(budgets[c]) || 0;
      const spent = spentByCat[c] || 0;
      const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      const barColor = limit > 0 && spent > limit ? "bg-danger" : limit > 0 && spent >= limit * 0.9 ? "bg-warn" : "bg-primary";
      return (
        <div key={c}>
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-sm text-text">{c}</span>
            <input type="number" min="0" step="1" placeholder="—"
                   defaultValue={limit > 0 ? limit : ""}
                   onBlur={e => handleChange(c, e.target.value)}
                   className="w-28 bg-surface-2 border border-border-dim rounded-input px-3 py-1.5 text-sm text-text text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
          </div>
          {errors[c] && <p className="text-xs text-danger mb-1.5">{errors[c]}</p>}
          <div className="h-1.5 rounded-pill bg-surface-2 overflow-hidden">
            <span className={`block h-full rounded-pill transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-muted mt-1.5">
            {limit > 0 ? `${formatMoney(spent, currency)} of ${formatMoney(limit, currency)}` : `${formatMoney(spent, currency)} spent · no budget set`}
          </p>
        </div>
      );
    })}
  </div>
);
```

- [ ] **Step 2: Update the card wrapper in `src/App.jsx`**

Find:
```jsx
<div className="card">
  <h2>Monthly Budgets</h2>
  <BudgetList
```
Replace with:
```jsx
<div className="bg-surface shadow-soft rounded-card p-5 sm:p-6">
  <h2 className="text-sm font-semibold text-text mb-3">Monthly Budgets</h2>
  <BudgetList
```

- [ ] **Step 3: Verify manually — re-run the exact scenarios from the total-budget feature's original verification**

Run `npm run build`. Re-trace: setting a total budget of `500`, then a category budget of `600` → still blocked with the overage error (now styled, same message). Lowering the total below current allocation → still blocked. Clearing the total budget → allocation summary disappears, category budgets unconstrained again. This is the same verification the original total-budget task did — confirm nothing about the actual behavior changed, only appearance.

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/components/BudgetList.jsx src/App.jsx
git commit -m "Redesign BudgetList and its card wrapper (styling only, no logic changes)"
```

---

### Task 8: Redesign `ExpenseTable` (+ its card wrapper and filter toolbar)

**Files:**
- Modify: `src/components/ExpenseTable.jsx` — full restyle, plus converting the desktop/mobile switch from a CSS media query to Tailwind responsive classes.
- Modify: `src/App.jsx` — the "Expenses" card wrapper, its `table-toolbar`/`filters` div, and the category-filter `<select>`/search `<input>` inside it.

**Interfaces:** Props unchanged: `{ expenses, budgets, expensesThisMonth, currency, onEdit, onDelete, sort, onSortChange }`.

- [ ] **Step 1: Rewrite `src/components/ExpenseTable.jsx`**

Keep `budgetInfo`/`toggleSort`/`formatDateDisplay` exactly as they are — replace imports and the `return (...)` block:

```jsx
import { formatMoney } from "../lib/format.js";
import { Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
```

```jsx
if (expenses.length === 0) {
  return <p className="text-sm text-muted text-center py-8">No expenses match your filters. Add one on the left to get started.</p>;
}

function SortHeader({ label, sortKey }) {
  const active = sort.key === sortKey;
  return (
    <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort(sortKey)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (sort.dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );
}

return (
  <>
    <table className="hidden md:table w-full text-sm">
      <thead>
        <tr className="border-b border-border-dim">
          <SortHeader label="Date" sortKey="date" />
          <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Category</th>
          <th className="text-left text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Note</th>
          <SortHeader label="Amount" sortKey="amount" />
          <th className="text-right text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Budget</th>
          <th className="text-right text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Remaining</th>
          <th className="text-right text-xs font-semibold uppercase tracking-wide text-muted px-3 py-2.5">Actions</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((e, i) => {
          const { limit, remaining } = budgetInfo(e.category);
          const remainingClass = limit > 0 ? (remaining < 0 ? "text-danger" : remaining <= limit * 0.1 ? "text-warn" : "text-primary-text") : "text-muted";
          return (
            <tr key={e.id} className={`${i % 2 === 1 ? "bg-surface-2/40" : ""} hover:bg-surface-2 transition-colors`}>
              <td className="px-3 py-2.5 text-text">{formatDateDisplay(e.date)}</td>
              <td className="px-3 py-2.5">
                <span className="inline-flex items-center bg-surface-2 text-text text-xs rounded-pill px-2.5 py-1">{e.category}</span>
              </td>
              <td className="px-3 py-2.5 text-muted">{e.note}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-text">{formatMoney(e.amount, currency)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">{limit > 0 ? formatMoney(limit, currency) : "—"}</td>
              <td className={`px-3 py-2.5 text-right tabular-nums ${remainingClass}`}>{limit > 0 ? formatMoney(remaining, currency) : "—"}</td>
              <td className="px-3 py-2.5 text-right">
                <div className="flex justify-end gap-1">
                  <button className="p-2 rounded-lg hover:bg-surface text-muted hover:text-text transition-colors" onClick={() => onEdit(e)} aria-label="Edit expense">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface text-muted hover:text-danger transition-colors" onClick={() => onDelete(e.id)} aria-label="Delete expense">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>

    <div className="md:hidden space-y-3">
      {expenses.map(e => (
        <div className="bg-surface-2 rounded-input p-4" key={e.id}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">{formatDateDisplay(e.date)}</span>
            <span className="text-sm font-semibold tabular-nums text-text">{formatMoney(e.amount, currency)}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center bg-surface text-text text-xs rounded-pill px-2.5 py-1">{e.category}</span>
            {e.note && <span className="text-xs text-muted truncate max-w-[140px]">{e.note}</span>}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-surface text-text text-xs font-medium hover:bg-surface/70 transition-colors" onClick={() => onEdit(e)}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button className="flex-1 inline-flex items-center justify-center gap-1.5 p-2 rounded-lg bg-surface text-danger text-xs font-medium hover:bg-surface/70 transition-colors" onClick={() => onDelete(e.id)}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  </>
);
```

Note: `SortHeader` is defined inside the component body (it closes over `sort`/`toggleSort` from the enclosing scope) — keep it there, don't hoist it to module scope, since it relies on those closures.

- [ ] **Step 2: Update the "Expenses" card wrapper and filter toolbar in `src/App.jsx`**

Find:
```jsx
<div className="card">
  <div className="table-toolbar">
    <h2>Expenses</h2>
    <div className="filters">
      <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
        <option value="">All categories</option>
        {state.categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="search" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
    </div>
  </div>
```
Replace with:
```jsx
<div className="bg-surface shadow-soft rounded-card p-5 sm:p-6">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
    <h2 className="text-sm font-semibold text-text">Expenses</h2>
    <div className="flex gap-2">
      <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="bg-surface-2 border border-border-dim rounded-input px-3 py-2 text-sm text-text">
        <option value="">All categories</option>
        {state.categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="search" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)}
             className="bg-surface-2 border border-border-dim rounded-input px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
    </div>
  </div>
```
(the closing `</div>` for this card, and the `<ExpenseTable .../>` element inside it, are untouched.)

- [ ] **Step 3: Verify manually**

Run `npm run build`. Confirm sorting still toggles correctly (click Date/Amount headers) and the sort direction indicator (chevron) shows on the active column. Confirm filtering by category and searching notes still works (unchanged logic in `App.jsx`, only the wrapping markup changed). Resize below `md:` (768px) and confirm the table is replaced by the card list (Tailwind's `hidden md:table` / `md:hidden` pair), not both or neither showing.

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/components/ExpenseTable.jsx src/App.jsx
git commit -m "Redesign ExpenseTable with icon actions, zebra striping, and Tailwind responsive switch"
```

---

### Task 9: Final legacy CSS cleanup

**Files:**
- Modify: `src/index.css` — remove every rule that's now unreferenced anywhere in `src/`.

**Interfaces:** none.

- [ ] **Step 1: Identify every CSS class still referenced in `.jsx` files**

Run (from the project root):
```bash
grep -roE 'className="[^"]*"' src/ | grep -oE '"[^"]*"' | tr ' ' '\n' | tr -d '"' | sort -u > /tmp/used-classes.txt
```
This captures every literal class name used in JSX. (Some classNames are built via template strings/ternaries — e.g. `` `${isDown ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}` `` — the grep above only catches literal `className="..."` attributes, not the interpolated pieces. Cross-check by also grepping for any custom (non-Tailwind-utility) class names by eye across all `.jsx` files — the ones that matter here are the OLD hand-written class names like `.card`, `.field`, `.btn`, `.chip`, `.budget-list`, `.expense-table`, `.auth-*`, `.app-header`, `.layout`, `.toast`, `.confirm-*`, etc., not Tailwind utilities. Search for each old class name individually, e.g. `grep -rn 'className=".*\bcard\b' src/` for a spot-check, since a plain word-list diff can miss partial matches.)

- [ ] **Step 2: Remove every now-unreferenced rule from `src/index.css`**

Based on this plan's cumulative changes (Phase 2 already made `.stat-card`/`.alert-banner`/`.chart-card` dead; this phase's Tasks 1-8 make everything else dead), the following should have zero remaining references and can be deleted: `.app-header` and its children (`.brand`, `.brand-mark`, `.header-actions`, `.currency-picker`), `.layout`/`.col`, `.card` and `.card::before`/`.card h2`/`.card:hover` variants, `.field`/`.field label`, generic `input, select` / `input::placeholder` rules (verify no other component still relies on the bare `input, select` selector before deleting it — if anything still does, keep it and note why in your commit message instead of silently leaving dead-but-load-bearing CSS), `.btn`/`.btn-primary`/`.btn-secondary`/`.btn-ghost`/`.btn-sm`/`.theme-toggle-btn`, `.chip`/`.inline-form`, `.budget-list`/`.budget-row`/`.budget-head`/`.b-cat`/`.bar`/`.budget-meta`, `.expense-table` and all its descendant selectors, `.expense-cards`/`.expense-card*`, `.table-toolbar`/`.filters`, `.toast`, `.confirm-overlay`/`.confirm-card`, `.auth-overlay`/`.auth-card`/`.auth-brand`/`.auth-mark`/`.auth-title`/`.auth-subtitle`/`.auth-tabs`/`.auth-tab`/`.auth-error`/`.auth-form`/`.auth-submit-btn`/`.auth-footnote`, `.app-footer`/`.link-btn`, `.field-error`, `.loading-label`/`.loading-error`, `.user-section`/`.user-avatar`/`.user-email`, and the now-orphaned `@media (max-width: 700px)` block that referenced `.expense-table`/`.expense-cards`/`.table-toolbar`/`.filters` (superseded by Tailwind's `hidden md:table`/`md:hidden` in Task 8).

**Do not remove**: the `:root { ... }` and `:root[data-theme="light"] { ... }` variable blocks, the `@import`/`@custom-variant`/`@theme` blocks, `* { box-sizing: border-box; }`, `[hidden] { display: none !important; }`, the base `html, body { ... }` rule (simplified in Task 1), the light-mode gradient-text override block (`:root[data-theme="light"] .brand h1, ...` — check if this still has any live consumer after Task 2/3's rewrites; if `.brand h1`/`.auth-title` no longer exist anywhere, this override is also dead and should go), and the color-transition rule block (`body, .app-header, .card, ...` — update its selector list to remove now-nonexistent classes, or replace it with a Tailwind-friendly equivalent if nothing in that list still exists as a literal className — check case by case).

- [ ] **Step 3: Full manual verification pass**

Run `npm run build && npm run preview`. Do a complete click-through: sign up/in, add/edit/delete an expense, add/remove a category, set category and total budgets (including an over-allocation attempt), toggle theme, change currency, export CSV, use "Clear all data", resize to mobile width and confirm the table→card switch and the layout single-column stack. Confirm NOTHING is visually broken/unstyled (an unstyled element is the tell that a class was removed while still in use).

- [ ] **Step 4: Commit**

```bash
npm run build && npm run lint
git add src/index.css
git commit -m "Remove legacy hand-written CSS now fully superseded by Tailwind"
```
