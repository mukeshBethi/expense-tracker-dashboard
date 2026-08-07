# Procura Redesign — Master Design Spec

## Context

A design was authored in Claude Design (`claude.ai/design`, project "Form design decisions", file `Expense Tracker.dc.html`) using a design system called "Procura" (navy/blue, Inter + JetBrains Mono, 4px spacing base). It's a full information-architecture change: a persistent sidebar with six pages (Dashboard, Expenses, Budgets, Analytics, Categories, Settings), modal-based expense CRUD, a data table with row selection/pagination, and light+dark theme variants. This replaces the current emerald single-page Tailwind design **project-wide** (per explicit decision) — not an additive theme.

**Critical distinction**: the `.dc.html` file is a *visual/interaction prototype* with its own fake local state (seed data, `Component extends DCLogic`, no backend). We are implementing its **design and behavior**, wired to our **real** Firebase Auth + Firestore data layer (`useAuth`, `useExpenseData`, `validation.js`, `format.js` — all unchanged). Nothing about the backend, the total-budget-allocation feature, or any validation rule changes. This is a UI/architecture rewrite, not a backend rewrite.

## Decisions

- **Routing**: `react-router-dom` (new dependency), real URLs: `/` (Dashboard), `/expenses`, `/budgets`, `/analytics`, `/categories`, `/settings`. Auth gate stays exactly as it is (`AuthScreen` shown when `!user`, wrapping the router).
- **Responsive strategy**: no "preview mode" toggle. Real CSS breakpoints: sidebar visible ≥ `lg` (1024px); below that, sidebar collapses to a bottom tab bar (Home/Expenses/Insights/More — matching the prototype's mobile phone-mockup bottom nav, but as an actual responsive layout, not a nested phone frame). "More" opens/links to Settings+Categories (a simple menu, since the mobile nav only has room for 4 icons but we have 6 pages — Budgets and Categories fold under "More" alongside Settings on mobile).
- **Theme**: both light (default) and dark, matching the prototype's two token sets. Reuses the existing `useTheme.js` hook and `data-theme` attribute mechanism already in the codebase (Phase 1 of the earlier redesign) — only the token *values* change to Procura's palette, the mechanism doesn't.
- **New Firestore fields** (added to the existing `settings` map, following the exact pattern `totalBudget`/`currency`/`theme` already use): `budgetAlertsEnabled` (bool), `weeklySummaryEnabled` (bool), `displayName` (string). These are **UI preferences only** — no email-sending or push-notification infrastructure is being built (that's a distinct, large feature this spec explicitly does not include). The Settings page persists the toggle state; it does not make the toggles *do* anything beyond that.
- **"Upcoming Recurring" dashboard widget**: the prototype shows 3 hardcoded recurring bills. We have no recurring-expense feature. Rather than fake data or silently build a real recurring-expenses feature (out of scope, a substantial feature on its own), **this widget is dropped** from the Dashboard page. Everything else on the Dashboard (KPIs, trend chart, category pie, recent transactions, budget health) maps to real data we already have.
- **DataTable pagination**: implemented for real (client-side, since all data is already loaded into memory) — page through `filteredExpenses` rather than rendering all rows at once, matching the prototype's `rows-per-page` prop.
- **Component library**: net new, built to match Procura's tokens exactly (colors.css/typography.css/spacing.css values below), reusing `lucide-react` for icons (already installed) mapped 1:1 to the prototype's icon names (`home`→`Home`, `file-text`→`FileText`, `package`→`Package`, `trending-up`→`TrendingUp`, `grid`→`Grid`, `settings`→`Settings`, `log-out`→`LogOut`, `bell`→`Bell`, `download`→`Download`, `plus`→`Plus`, `search`→`Search`, `filter`→`Filter`, `chevron-right`→`ChevronRight`, `clock`→`Clock`, `x`→`X`, `edit`→`Pencil`, `trash-2`→`Trash2`).

## Design tokens (verbatim from the Procura design system files)

```css
/* Colors */
--navy-100:#EEF1F8; --navy-250:#C5CEDE; --navy-400:#8A9BB8; --navy-550:#4A6290; --navy-700:#1B2B4B; --navy-850:#0D1628;
--blue-100:#E9EFFF; --blue-250:#B9CDFF; --blue-400:#789BFF; --blue-550:#2D63EA; --blue-700:#1E40AF; --blue-850:#172B59;
--slate-50:#F8FAFC; --slate-100:#F1F5F9; --slate-200:#E2E8F0; --slate-300:#CBD5E1; --slate-400:#94A3B8; --slate-500:#64748B; --slate-600:#475569; --slate-700:#334155; --slate-800:#1E293B; --slate-900:#0F172A;
--success:#16A34A; --success-soft:#D1FAE5; --success-text:#065F46;
--warning:#D97706; --warning-soft:#FEF3C7; --warning-light:#FCD34D;
--danger:#DC2626; --danger-soft:#FEE2E2; --danger-subtle:#FEF2F2;
--info:#2563EB;
--viz-1:#2D63EA; --viz-2:#16A34A; --viz-3:#D97706; --viz-4:#E11D48; --viz-5:#7C3AED; --viz-6:#0891B2; --viz-7:#EA580C; --viz-8:#4A6290;

/* Light theme (default) */
--surface-page:#F4F5F7; --surface-card:#FFFFFF; --surface-subtle:#F4F7FC; --surface-sunken:#E4EAF5;
--border-subtle:#E3E9F3; --border-default:#D9E1EF; --border-strong:#CBD5E1;
--text-primary:#0F172A; --text-secondary:#64748B; --text-tertiary:#94A3B8; --text-accent:#2D63EA;

/* Dark theme override (applied the same way useTheme.js already applies dark/light — see prototype's DARK object) */
--surface-page:#0A0F1C; --surface-card:#121A2B; --surface-subtle:#182135; --surface-sunken:#0E1526;
--border-subtle:#212C45; --border-default:#25314C; --border-strong:#38455F;
--text-primary:#EDF1F9; --text-secondary:#93A2BC; --text-tertiary:#6B7A96;
--navy-850(dark):#070C17;

/* Typography */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
/* sizes: h1 36/1.11/600, h2 28/1.21/600, h3 22/1.27/600, h4 18/1.33/600, body 14/1.57/400, small 13/1.46/400, caption 11/1.45/400, overline 11/1.27/600 uppercase +1px tracking */

/* Spacing (4px base): 4,6,8,12,16,20,24,32,40,48,64,80,96,128 */
/* Radius: sm 3px (chips/checkboxes), default 4px, card 6px, modal 8px, large 12px, pill 9999px */
/* Shadows: xs 0 1px 2px rgba(15,23,42,.04) · sm 0 1px 3px rgba(15,23,42,.06) · md 0 4px 12px rgba(0,0,0,.051) · lg 0 12px 28px rgba(15,23,42,.10) */
/* Hairline border: inset 0 0 0 1px var(--border-default) — used instead of a real border for crispness */
/* Sidebar width: 240px expanded / 72px collapsed. Content max-width: 1200px */
```

These get mapped into Tailwind's `@theme` block in `src/index.css` exactly like the existing emerald tokens were (same mechanism, new values) — `--color-*`, `--shadow-*`, `--radius-*` custom properties generating Tailwind utilities, still driven by the existing `data-theme` attribute for light/dark.

## Page-by-page mapping (design → real data)

- **Dashboard** (`/`): 4 KPI cards (Spent This Month / Budget Remaining / Top Category / Entries Logged — all from `state.expenses`+`state.budgets`, same math already in `SummaryCards.jsx`), 14-day trend line chart, category pie chart, recent-transactions table (6 rows, no pagination), budget health (top 4 categories by % used, `ProgressBar`).
- **Expenses** (`/expenses`): category filter + sort dropdown + search, DataTable with selection + pagination (client-side), empty state, row actions (edit/delete) open the Modal / confirm dialog.
- **Budgets** (`/budgets`): KPI row (Total Budget / Allocated / Unallocated), total-budget input (reuses `setTotalBudget`/`validateTotalBudget` exactly as-is), per-category budget rows (reuses `setBudget`/`validateAllocation`/`validateAmount` exactly as-is) — **zero logic changes**, this page is a restyle + relocation of `BudgetList.jsx`'s existing, recently-hardened logic.
- **Analytics** (`/analytics`): stat cards with sparklines, monthly trend line chart, category pie, weekly bar chart, budget utilization progress bars — mostly the same underlying data as Dashboard, sliced differently (monthly instead of daily, weekly buckets).
- **Categories** (`/categories`): category cards grid (reuses `addCategory`/`removeCategory`/`validateCategoryName` exactly as-is) — restyle + relocation of `CategoryManager.jsx`'s existing logic.
- **Settings** (`/settings`): profile (display name — new field, currency — existing `setCurrency`), preferences (dark mode switch — existing `toggleTheme`, budget alerts switch — new persisted bool, weekly summary switch — new persisted bool), export all data (existing `handleExport`/CSV logic, relocated here from the header).

## New/rebuilt components (`src/components/`)

`Sidebar.jsx`, `TopBar.jsx` (search + theme toggle + notifications icon + export + add-expense button), `MobileBottomNav.jsx`, `Button.jsx` (primary/secondary/ghost/danger variants + icon slot), `Input.jsx` (label/prefix/error/helper), `Select.jsx` (native, restyled — the prototype's `Select` is a plain styled select, not a combobox; our existing `Combobox.jsx` stays reserved for the category picker specifically per its own established use, evaluate case-by-case per page), `IconButton.jsx`, `KpiCard.jsx`, `StatCard.jsx` (Analytics variant with sparkline), `ProgressBar.jsx`, `Modal.jsx` (replaces/extends `ConfirmDialog.jsx`'s overlay pattern with a generic title+body+footer shape), `Switch.jsx`, `DataTable.jsx` (selection + pagination + custom column renderers), `Toast.jsx` (restyled to new tokens, tone-aware: success/danger/info/warning), `Alert.jsx` (inline warning banner, used in the delete-confirmation modal). Charts (`LineChart`/`PieChart`/`BarChart`) stay `react-chartjs-2`-based like today, restyled to Procura's viz palette and fonts.

## Verification

- `npm run build`/`npm run lint` clean after every phase.
- Full click-through per phase (sign in, navigate every page via the sidebar and via direct URL, add/edit/delete an expense through the modal, category CRUD, budget CRUD including total-budget allocation blocking, CSV export, theme toggle, resize to mobile width and confirm the bottom nav + responsive pages).
- No regression in any existing validation rule, Firestore field, or business logic — every page's data operations are traced against the existing hooks/validators, same rigor as prior phases (especially Budgets/Categories, which carry forward recently-hardened logic verbatim).
