# Expense Tracker — React Redesign

## Context

The Expense Tracker dashboard was recently converted from a `localStorage`-only prototype
to a real hosted app: Firebase Auth (email/password) + Firestore for storage, deployed on
Vercel. The frontend, however, is still the original vanilla HTML/CSS/JS from before that
conversion — no build step, one large `app.js`, DOM manipulation via manual `querySelector`
calls, and a mobile layout that's a retrofit (media queries bolted onto a desktop-first design)
rather than designed mobile-first.

The user wants the app to feel "top notch" now, with room to add real features later
(multi-currency accounts, recurring expenses, sharing with family, etc. are examples that came
up, not committed scope). They chose to rebuild the frontend in React to get there, keeping the
current dark/green aesthetic as the visual base while adding a light mode toggle. The Firebase
backend (Auth + Firestore, same document shape, same security rules) is explicitly *not*
changing — this is a frontend rewrite only, to keep risk and scope contained.

## Approach

**Vite + React, plain JS (no TypeScript), no Next.js.** This is a client-only SPA gated behind
login with no need for SSR or file-based routing, so a full framework would add build
complexity without benefit. Vite gives fast dev reload and a simple `dist/` build output that
Vercel auto-detects — deployment stays a one-command `vercel --prod`, no `vercel.json` needed.

## Architecture

```
src/
  main.jsx              — React root, mounts <App/>
  App.jsx               — top-level: auth gate, theme provider, renders AuthScreen or dashboard
  firebase.js           — Firebase init + exports (direct port of firebase-config.js)
  hooks/
    useAuth.js           — wraps onAuthStateChanged; exposes { user, signIn, signUp, signOut, authError }
    useExpenseData.js     — loads/saves the Firestore doc; exposes { state, addExpense, updateExpense,
                            deleteExpense, addCategory, removeCategory, setBudget, setCurrency }
    useTheme.js           — light/dark mode; persisted to the Firestore profile doc (settings.theme),
                            with localStorage as a same-tab fallback before the Firestore doc loads
  components/
    AuthScreen.jsx         — sign in / create account tabs, field-level validation errors
    Header.jsx             — brand, currency picker, theme toggle, export button, user menu
    ExpenseForm.jsx         — add/edit expense, with validation (see below)
    CategoryManager.jsx     — category chips + add-category form
    BudgetList.jsx           — per-category monthly budget inputs + progress bars
    SummaryCards.jsx          — spent this month/today, top category, entry count
    ExpenseTable.jsx           — desktop: sortable table. Mobile: card list (see Mobile layout)
    CategoryChart.jsx           — doughnut chart (react-chartjs-2)
    TrendChart.jsx                — bar chart (react-chartjs-2)
    AlertBanner.jsx                — over-budget warning banner
    Toast.jsx / ConfirmDialog.jsx    — replace alert()/confirm() from the vanilla version
  lib/
    validation.js          — shared field validators (see below)
    format.js               — money formatting (comma-separated), date helpers
```

State lives in `useExpenseData`'s local React state, loaded once from Firestore on login and
written back on every mutation — same "load once, write on mutation" model as today, no
real-time `onSnapshot` listeners (matches the earlier "just needs to be online" decision).

## Form validation & formatting

Centralized in `lib/validation.js`, applied in `ExpenseForm`, `BudgetList`, and
`CategoryManager`. Errors render inline under each field (not `alert()`).

| Field | Rules | Error message |
|---|---|---|
| Date | Required. Not after today (`max` attribute + explicit check). | "Date is required." / "Date can't be in the future." |
| Amount | Required. Must be `> 0`. Integer part capped at 10 digits. | "Amount is required." / "Amount must be greater than 0." / "Amount can't exceed 10 digits." |
| Category | Required. | "Please choose a category." |
| Budget amount | Optional; when present, same numeric + 10-digit rule as Amount. | "Amount can't exceed 10 digits." |
| New category name | Required, ≤24 characters, not a duplicate (case-insensitive). | "Category name is required." / "That category already exists." |

`lib/format.js` provides:
- `formatMoney(n, currency)` — existing comma-separated display logic (`toLocaleString`), used
  for the table, summary cards, chart tooltips, budgets — unchanged behavior from today.
- `formatAmountInput(rawDigits)` / `parseAmountInput(displayValue)` — live comma formatting in
  the Amount input as the user types/blurs, stripping commas back out before validation/save.

## Theming

Existing CSS custom properties (`--bg`, `--text`, `--primary`, etc.) get a light-mode value set.
`useTheme` toggles a `data-theme="light" | "dark"` attribute on `<html>`; CSS just needs a
`:root[data-theme="light"] { ... }` override block alongside the existing dark defaults — no
rewrite of the color system, just a second value set plus the toggle control in `Header`.

## Mobile layout

Rebuilt mobile-first rather than retrofitted:
- Single-column stacked layout by default; multi-column grid only above the existing ~1100px
  breakpoint.
- The five-control filter toolbar (category, range, from, to, search) collapses into a compact
  bar with a "Filters" disclosure below ~700px, instead of staying inline and cramped.
- `ExpenseTable` renders as a card list on narrow screens (date/category/amount/actions per
  card) instead of a horizontally-scrolling table — the biggest concrete mobile gap in the
  current version.

## Data flow / migration

No Firestore data migration — same `users/{uid}` document shape, same security rules already
configured. Old `index.html` / `app.js` / `styles.css` are replaced by the Vite build output;
existing accounts and their data keep working unchanged after redeploy.

## Testing / Verification

- `npm run dev` locally: check both themes, mobile viewport via browser devtools, sign-in/up,
  add/edit/delete expense (including each validation rule above), budgets, category add/remove,
  CSV export, both charts rendering and updating on filter changes.
- Deploy via `vercel --prod`; re-verify sign-in against the same Firebase project (same
  authorized-domains configuration already in place) and re-check the mobile card layout on an
  actual phone or devtools device emulation.
- Push to GitHub (`main` branch) as changes land, now that the repo is initialized.
