# Monthly Total Budget & Allocation

## Context

Category budgets already exist (a flat monthly limit per category, set once and reused every month). There's no concept of an overall monthly spending ceiling that those category budgets should collectively respect. The user wants a total monthly budget, distributed across categories, where the sum of category budgets can never exceed the total — surfaced before the Phase 2 visual redesign so the redesigned Budgets card can be built around the real feature rather than needing rework.

## Decisions

- **Ongoing setting, not per-month.** `totalBudget` behaves like existing category budgets: set once, applies every month until changed. No new Firestore schema shape — one new key in the existing `settings` map (`{ currency, theme, totalBudget }`), no migration needed for existing users (absent/`0` = no total budget configured, fully backward compatible).
- **Over-allocation is blocked, not just warned**, consistent with how the rest of the app already handles invalid input (inline error, never `alert()`). This applies symmetrically: raising a category budget past the remaining allocation is blocked, and lowering the total below the current sum of category budgets is blocked.

## Scope

**Data layer (`src/hooks/useExpenseData.js`):**
- `state.settings.totalBudget` — a number, `0`/absent meaning "no total budget set."
- New mutator `setTotalBudget(value)`, following the exact same pattern as `setCurrency`/`setThemePreference` (parse, update `settings`, persist via `persistProfile`, no validation inside the hook — validation happens in the component layer, same division of responsibility as every other mutator in this file).

**Validation (`src/lib/validation.js`):**
- New pure function `validateAllocation(newAmount, category, budgets, totalBudget)` → returns an error string or `null`. Computes the sum of all category budgets *excluding* `category`'s current value, adds `newAmount`, and compares to `totalBudget` (only when `totalBudget > 0` — no total set means no constraint). On failure, the message states the overage amount (e.g. `"That would put you $50.00 over your $2,000.00 total budget."`), using the existing `formatMoney` helper.
- A second pure function `validateTotalBudget(newTotal, budgets)` → returns an error string or `null` if `newTotal` (when `> 0`) is less than the current sum of all category budgets, naming the currently-allocated amount.

**UI (`src/components/BudgetList.jsx`):**
- A "Total Monthly Budget" input added above the existing per-category list, using the same numeric-input + inline-error pattern already used for category budgets in this file.
- An allocation summary line + progress bar (reusing the existing `.bar`/`.budget-meta` CSS classes) showing "Allocated `$X` of `$Y` total," only rendered when a total budget is actually set.
- Editing a category budget now runs `validateAllocation` in addition to the existing `validateAmount` check before calling `onSetBudget` — same short-circuit-with-inline-error pattern already in this file for invalid amounts.

**Wiring (`src/App.jsx`):** pass `totalBudget={state.settings.totalBudget}` and `onSetTotalBudget={setTotalBudget}` down to `BudgetList`, alongside its existing props.

## Verification

- `npm run build`/`npm run lint` clean.
- Manual trace/run: set a total budget of $500, then try to set a single category budget of $600 → blocked with the overage message. Set two category budgets summing to $500, then try to lower the total to $400 → blocked. Clear the total budget entirely → category budgets behave exactly as before (no constraint). Sign out/in → the total budget persists (Firestore round-trip via the existing `settings` field).
