# Rest-of-App Redesign (Phase 3 of the Premium SaaS Redesign)

## Context

Phase 1 (Tailwind + tokens) and Phase 2 (SummaryCards/AlertBanner/charts/loading states) are merged. This phase finishes the redesign: `Header`, `AuthScreen`, `ExpenseForm`, `CategoryManager`, `BudgetList`, `ExpenseTable`, `Toast`, `ConfirmDialog`, the outer two-column layout shell, and — as the final step — removing every now-dead hand-written CSS rule from `src/index.css` in one pass, since nothing will reference the old classes anymore once this phase lands.

## Shared conventions (apply consistently across every task in this phase)

These are the primitives established or extended from Phase 2's tokens (`bg-surface`, `bg-surface-2`, `shadow-soft`, `rounded-card`, `rounded-pill`, plus the existing color tokens `text-text`, `text-muted`, `text-primary`, `text-primary-text`, `text-danger`, `text-warn`, `border-border`, `border-border-dim`). One new token is needed:

- **New token**: `--radius-input: 10px`, mapped into `@theme` as `--radius-input` (generates `rounded-input`) — for form fields, one step smaller than `--radius-card` (16px), consistent with the existing "intentional radius scale" principle. Add this in Task 1 (it touches `src/index.css` anyway for the layout work).

| Element | Convention |
|---|---|
| Card | `bg-surface shadow-soft rounded-card p-5 sm:p-6` |
| Card heading | `text-sm font-semibold text-text mb-3` |
| Label | `text-xs font-semibold uppercase tracking-wide text-muted mb-1.5 block` |
| Input / select | `w-full bg-surface-2 border border-border-dim rounded-input px-3 py-2.5 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors` |
| Field error | `text-xs text-danger mt-1` (semantic token, not a literal Tailwind red — dogfood the theme system consistently, unlike Phase 2's one-off literal badge colors) |
| Primary button | `bg-primary text-white hover:bg-primary-text transition-colors rounded-pill px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed` |
| Ghost/secondary button | `bg-transparent hover:bg-surface-2 text-text border border-border-dim rounded-pill px-4 py-2.5 text-sm font-medium transition-colors` |
| Danger button (destructive confirms) | `bg-red-600 text-white hover:bg-red-700 rounded-pill px-4 py-2.5 text-sm font-semibold transition-colors` |
| Icon button (table row actions) | `p-2 rounded-lg hover:bg-surface-2 text-muted hover:text-text transition-colors` (add `hover:text-danger` for the delete variant) |
| Chip (categories) | `inline-flex items-center gap-1.5 bg-surface-2 text-text text-sm rounded-pill pl-3 pr-2 py-1.5` |
| Segmented tabs (auth) | Container: `inline-flex bg-surface-2 rounded-pill p-1`. Tab: `rounded-pill px-4 py-2 text-sm font-medium transition-colors`, active `bg-surface text-text shadow-soft`, inactive `text-muted hover:text-text` |
| Table zebra / hover | `odd:bg-surface-2/40 hover:bg-surface-2 transition-colors` per row |
| Icons | `lucide-react`, already installed |

**Confirm dialogs get a danger button, not primary.** All three existing `ConfirmDialog` usages (delete expense, remove category, clear all data) are destructive/irreversible — the "Confirm" button should use the danger convention above, not the emerald primary button it currently uses. This is a deliberate polish fix, not a functional change (same `onConfirm`/`onCancel` callbacks).

**Header keeps a light blur — deliberately, as the one exception.** It's a sticky element with content scrolling underneath it, which is the specific case Phase 2's "no blur except true overlays" rule already carved out. Use a light, low-opacity backdrop blur, not the old heavy glass treatment.

**No gradient text anywhere in this phase** — the auth screen's title currently fades white→accent via a text-fill gradient; replace with solid `text-text`, matching the "gradient text was overused" critique finding.

## Scope (files)

- `src/App.jsx` — the outer `<main className="layout"><section className="col col-left/col-right">` structure becomes a Tailwind responsive grid (single column by default, side-by-side above `lg:`, replacing the fixed `380px 1fr` CSS grid). The four remaining `<div className="card">` wrappers (Add Expense, Categories, Monthly Budgets, Expenses table) switch to the shared card convention. The `<footer className="app-footer">` (Clear all data) gets restyled. The three `<ConfirmDialog>` call sites don't change their props/logic, only rely on `ConfirmDialog`'s own updated internal styling.
- `src/components/Header.jsx` — full restyle per conventions above.
- `src/components/AuthScreen.jsx` — full restyle: opaque card, solid heading, segmented tabs, shared input/button conventions.
- `src/components/ExpenseForm.jsx` — shared input/label/error/button conventions. No logic changes (validation, category-reconciliation effect, amount formatting all stay exactly as they are).
- `src/components/CategoryManager.jsx` — chip + add-form restyle. No logic changes.
- `src/components/BudgetList.jsx` — restyle only. **No logic changes whatsoever** — this component was just built and reviewed for the total-budget allocation feature; every validation call, error state, and prop stays byte-identical, only JSX/classNames change.
- `src/components/ExpenseTable.jsx` — table + mobile card list restyle, lucide `Pencil`/`Trash2` icons replacing the `✎`/`🗑` emoji, zebra striping, colored `Remaining` column (green/amber/red via `text-primary-text`/`text-warn`/`text-danger`) reusing the exact same over/warn/ok thresholds already computed. The desktop-table/mobile-card-list switch converts from the CSS media query (`@media max-width:700px`) to Tailwind responsive utilities (`hidden md:table` / `md:hidden`), retiring the custom breakpoint in favor of Tailwind's stock scale — same pattern already accepted for `AlertBanner`'s margin fix in Phase 2.
- `src/components/Toast.jsx` / `src/components/ConfirmDialog.jsx` — restyle. `ConfirmDialog`'s overlay keeps a dim backdrop (functionally justified — it's a true modal overlay) but the confirm button becomes the danger convention (see above).
- `src/index.css` — Task 1 adds the `--radius-input` token and converts the outer layout/body background (removing the decorative radial-gradient "glow orbs," per the critique's "retire glassmorphism as the default" — replace with a plain `background-color: var(--bg)`). The **final task** in this phase's plan removes every CSS rule that's now unreferenced by any `.jsx` file (verified via grep, not assumption) — everything except the `:root`/`:root[data-theme="light"]` variable blocks, the `@theme`/`@custom-variant` blocks, the box-sizing reset, and the base `html, body` rule.

## Verification

- `npm run build`/`npm run lint` clean after every task.
- Manual run: full click-through (sign up/in, add/edit/delete expense, categories, budgets incl. total-budget allocation blocking, CSV export, clear-all, theme toggle) confirming ZERO functional regressions — this phase is styling-only everywhere except the confirm-button color change.
- Resize to mobile width: confirm the outer layout stacks to one column, the expense table switches to the card list, and nothing overflows.
- After the final cleanup task: `grep` across `src/` for every removed CSS class name to confirm nothing still references it, and manually re-check the app still renders correctly (a missed "still in use" class would show up as literally unstyled elements).
