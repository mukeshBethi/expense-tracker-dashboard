# Procura Redesign — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Procura design tokens, install routing, and build the app shell (sidebar/topbar/mobile-bottom-nav) + 4 core primitives — WITHOUT touching any existing page content yet. The app must remain fully functional throughout: the existing dashboard (all current components, unchanged) renders at `/`, wrapped in the new Shell; the other 5 routes are placeholder pages until their own phase replaces them.

**Architecture:** New Procura tokens are added under a `pr-` prefix (`bg-pr-page`, `text-pr-primary`, `rounded-pr-card`, etc.) so they cannot collide with or destabilize the existing emerald tokens (`bg-surface`, `text-primary`, `rounded-card`, etc.) that every current component still uses. Both token systems coexist until Phase 9's cleanup removes the old one. `react-router-dom` is a new dependency; `BrowserRouter` wraps the app inside the existing auth gate (auth/loading logic in `App.jsx` is unchanged — only what renders *after* a user is authenticated changes, from a single dashboard to a `Shell` + `Routes`).

**Tech Stack:** `react-router-dom` (new), `lucide-react` (already installed).

## Global Constraints

- Every new Procura token is prefixed `pr-` — never reuse an existing Tailwind token name (spec: token collision analysis — `text-primary`/`bg-primary`/`rounded-card` etc. already mean something different in the current emerald system).
- No existing component (`ExpenseForm`, `CategoryManager`, `BudgetList`, `ExpenseTable`, `AuthScreen`, `Header`, `SummaryCards`, `AlertBanner`, `CategoryChart`, `TrendChart`, `Toast`, `ConfirmDialog`) is modified in this phase — they keep rendering exactly as they do today, just now inside the new Shell at the `/` route.
- No Firestore schema, hook, or validation changes in this phase.
- The app must build, lint, and be fully clickable (sign in → see the existing dashboard, now inside a sidebar shell) at the end of every task.

---

### Task 1: Procura design tokens

**Files:**
- Modify: `src/index.css` — add a new `:root` block section (and `:root[data-theme="light"]` overrides) with every `--pr-*` variable from the spec, plus `@theme` mappings generating the `pr-`-prefixed Tailwind utilities.

**Interfaces:**
- Produces Tailwind utilities: `bg-pr-page`, `bg-pr-card`, `bg-pr-subtle`, `bg-pr-sunken`, `text-pr-primary`, `text-pr-secondary`, `text-pr-tertiary`, `text-pr-accent`, `border-pr-subtle`, `border-pr-default`, `border-pr-strong`, `bg-pr-navy` (ink/primary-button bg), `bg-pr-blue`/`text-pr-blue` (accent/interactive), `bg-pr-success`/`text-pr-success`/`bg-pr-success-soft`, `bg-pr-warning`/`text-pr-warning`/`bg-pr-warning-soft`, `bg-pr-danger`/`text-pr-danger`/`bg-pr-danger-soft`, `shadow-pr-xs`/`shadow-pr-sm`/`shadow-pr-md`/`shadow-pr-lg`, `rounded-pr-sm`/`rounded-pr-default`/`rounded-pr-card`/`rounded-pr-modal`/`rounded-pr-large`/`rounded-pr-pill`. Used by every later phase.

- [ ] **Step 1: Add the dark (default) Procura variables to `src/index.css`**

Add a new section (e.g. right after the existing dark `:root { ... }` block, as its own clearly-commented block, do not merge into the existing block):

```css
/* ── Procura design system tokens (prefixed pr- to avoid colliding with
   the existing emerald tokens above) — dark values, default ── */
:root {
  --pr-navy-100: #EEF1F8; --pr-navy-250: #C5CEDE; --pr-navy-400: #8A9BB8; --pr-navy-550: #4A6290; --pr-navy-700: #1B2B4B; --pr-navy-850: #070C17;
  --pr-blue-100: #E9EFFF; --pr-blue-250: #B9CDFF; --pr-blue-400: #789BFF; --pr-blue-550: #2D63EA; --pr-blue-700: #1E40AF; --pr-blue-850: #172B59;
  --pr-slate-50: #F8FAFC; --pr-slate-400: #94A3B8; --pr-slate-500: #64748B; --pr-slate-900: #0F172A;
  --pr-success: #16A34A; --pr-success-soft: #123326; --pr-success-text: #6EE7B7;
  --pr-warning: #D97706; --pr-warning-soft: #3A2A0C; --pr-warning-light: #FCD34D;
  --pr-danger: #DC2626; --pr-danger-soft: #3A1418; --pr-danger-subtle: #260F12;
  --pr-viz-1: #2D63EA; --pr-viz-2: #16A34A; --pr-viz-3: #D97706; --pr-viz-4: #E11D48; --pr-viz-5: #7C3AED; --pr-viz-6: #0891B2; --pr-viz-7: #EA580C; --pr-viz-8: #4A6290;

  --pr-page: #0A0F1C;
  --pr-card: #121A2B;
  --pr-subtle: #182135;
  --pr-sunken: #0E1526;
  --pr-border-subtle: #212C45;
  --pr-border-default: #25314C;
  --pr-border-strong: #38455F;
  --pr-primary: #EDF1F9;
  --pr-secondary: #93A2BC;
  --pr-tertiary: #6B7A96;
  --pr-accent: var(--pr-blue-550);
  --pr-navy: var(--pr-navy-850);

  --pr-shadow-xs: 0 1px 2px rgba(0,0,0,0.2);
  --pr-shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --pr-shadow-md: 0 4px 12px rgba(0,0,0,0.35);
  --pr-shadow-lg: 0 12px 28px rgba(0,0,0,0.45);

  --pr-radius-sm: 3px;
  --pr-radius-default: 4px;
  --pr-radius-card: 6px;
  --pr-radius-modal: 8px;
  --pr-radius-large: 12px;
  --pr-radius-pill: 9999px;
}
```

- [ ] **Step 2: Add the light-theme overrides**

Add to the existing `:root[data-theme="light"] { ... }` block (append inside it, don't create a second `:root[data-theme="light"]` selector):

```css
--pr-page: #F4F5F7;
--pr-card: #FFFFFF;
--pr-subtle: #F4F7FC;
--pr-sunken: #E4EAF5;
--pr-border-subtle: #E3E9F3;
--pr-border-default: #D9E1EF;
--pr-border-strong: #CBD5E1;
--pr-primary: #0F172A;
--pr-secondary: #64748B;
--pr-tertiary: #94A3B8;
--pr-success-soft: #D1FAE5;
--pr-success-text: #065F46;
--pr-warning-soft: #FEF3C7;
--pr-danger-soft: #FEE2E2;
--pr-danger-subtle: #FEF2F2;
--pr-shadow-xs: 0 1px 2px rgba(15,23,42,0.04);
--pr-shadow-sm: 0 1px 3px rgba(15,23,42,0.06);
--pr-shadow-md: 0 4px 12px rgba(0,0,0,0.051);
--pr-shadow-lg: 0 12px 28px rgba(15,23,42,0.10);
```

- [ ] **Step 3: Extend the `@theme` block**

Find the existing `@theme { ... }` block in `src/index.css` and add (do not remove any existing lines):

```css
--color-pr-page: var(--pr-page);
--color-pr-card: var(--pr-card);
--color-pr-subtle: var(--pr-subtle);
--color-pr-sunken: var(--pr-sunken);
--color-pr-primary: var(--pr-primary);
--color-pr-secondary: var(--pr-secondary);
--color-pr-tertiary: var(--pr-tertiary);
--color-pr-accent: var(--pr-accent);
--color-pr-navy: var(--pr-navy);
--color-pr-success: var(--pr-success);
--color-pr-success-soft: var(--pr-success-soft);
--color-pr-success-text: var(--pr-success-text);
--color-pr-warning: var(--pr-warning);
--color-pr-warning-soft: var(--pr-warning-soft);
--color-pr-danger: var(--pr-danger);
--color-pr-danger-soft: var(--pr-danger-soft);
--color-pr-danger-subtle: var(--pr-danger-subtle);
--color-pr-border-subtle: var(--pr-border-subtle);
--color-pr-border-default: var(--pr-border-default);
--color-pr-border-strong: var(--pr-border-strong);
--shadow-pr-xs: var(--pr-shadow-xs);
--shadow-pr-sm: var(--pr-shadow-sm);
--shadow-pr-md: var(--pr-shadow-md);
--shadow-pr-lg: var(--pr-shadow-lg);
--radius-pr-sm: var(--pr-radius-sm);
--radius-pr-default: var(--pr-radius-default);
--radius-pr-card: var(--pr-radius-card);
--radius-pr-modal: var(--pr-radius-modal);
--radius-pr-large: var(--pr-radius-large);
--radius-pr-pill: var(--pr-radius-pill);
```

- [ ] **Step 4: Add the Procura font stack alongside the existing one**

Do not change the existing `html, body { font-family: ... }` rule (that still serves old components). Instead, plan to apply `font-family: 'Inter', ...` via a Tailwind arbitrary/utility class on the new Shell root in Task 3, not globally — so this step is just adding the Google Fonts import for Inter + JetBrains Mono. Add near the top of `src/index.css`, after the existing `@import "tailwindcss";` line:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

- [ ] **Step 5: Verify the tokens resolve**

Same pattern as every prior phase: temporarily add a scratch element with `className="bg-pr-card text-pr-primary rounded-pr-card shadow-pr-md p-4"` somewhere in `App.jsx`, run `npm run build`, grep `dist/assets/*.css` to confirm the utilities compile referencing the right variables, then remove the scratch element — `git diff src/App.jsx` must be empty before committing.

- [ ] **Step 6: Commit**

```bash
npm run build && npm run lint
git add src/index.css
git commit -m "Add Procura design tokens (pr- prefixed) for the redesign, coexisting with existing tokens"
```

---

### Task 2: Install React Router and wrap the app

**Files:**
- Modify: `package.json`/`package-lock.json` (new dependency).
- Modify: `src/main.jsx` — wrap `<App />` in `<BrowserRouter>`.
- Modify: `src/App.jsx` — after the existing `authLoading`/`!user`/`loadError`/`loading` early returns (all unchanged), replace the final `return (...)` with a `<Routes>` block. The `/` route renders a NEW small wrapper component (`DashboardPage`, created in this task as a thin pass-through, NOT yet the real redesigned Dashboard — that's Phase 3) that renders **exactly the same JSX `App.jsx` currently returns** (Header, AlertBanner, the two-column layout with all existing cards) — i.e., you're relocating existing JSX into a new file unchanged, not rewriting it. The other 5 routes (`/expenses`, `/budgets`, `/analytics`, `/categories`, `/settings`) render a shared `ComingSoonPage` placeholder (new, simple).

**Interfaces:**
- `DashboardPage` (new, `src/pages/DashboardPage.jsx`): receives all the same props/state `App.jsx`'s current dashboard JSX depends on (`state`, `filteredExpenses`, `expensesThisMonth`, `theme`, filter/sort/editing/confirm state and their setters, `handleFormSubmit`, `handleExport`, etc.) — passed down from `App.jsx`, which keeps owning all of that state exactly as it does today. This is a pure relocation, not a rewrite.
- `ComingSoonPage` (new, `src/pages/ComingSoonPage.jsx`): `{ title }` prop, renders a simple centered placeholder using the new `pr-` tokens.

- [ ] **Step 1: Install react-router-dom**

```bash
npm install react-router-dom
```

- [ ] **Step 2: Wrap the app in `src/main.jsx`**

Add the import and wrap `<App />`:

```jsx
import { BrowserRouter } from "react-router-dom";
```
```jsx
<BrowserRouter>
  <App />
</BrowserRouter>
```
(Keep the existing `<React.StrictMode>` wrapper — nest `BrowserRouter` inside or outside it, doesn't matter, but don't remove StrictMode.)

- [ ] **Step 3: Create `src/pages/DashboardPage.jsx`**

Read the CURRENT `src/App.jsx` in full first. Create `src/pages/DashboardPage.jsx` that is a functional component accepting all the props the current dashboard JSX (everything from `<div>` … `<Header .../>` … through the closing `</div>` before the three `<ConfirmDialog>`s, roughly) actually uses, and returns that exact JSX unchanged. Name the props sensibly matching what `App.jsx` already calls its own state/handlers (e.g. `{ state, theme, toggleTheme, signOutUser, ... }` — read the actual current variable names and use them as the prop names, so the move is mechanical). Do NOT alter any markup, className, or logic — this is a cut-and-paste relocation with a props interface added around it.

- [ ] **Step 4: Create `src/pages/ComingSoonPage.jsx`**

```jsx
export default function ComingSoonPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-pr-tertiary">{title}</p>
      <p className="text-pr-secondary text-sm">This page is being rebuilt in the new design — coming shortly.</p>
    </div>
  );
}
```

- [ ] **Step 5: Update `src/App.jsx`'s final return to use `<Routes>`**

Add imports:
```jsx
import { Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage.jsx";
import ComingSoonPage from "./pages/ComingSoonPage.jsx";
```

Replace the final `return (...)` block (everything from the outer `<div>` that currently wraps `<Header>`/`<AlertBanner>`/`<main>`/`<footer>`/`<Toast>`/the 3 `<ConfirmDialog>`s) with:

```jsx
return (
  <Routes>
    <Route path="/" element={<DashboardPage /* all the props DashboardPage needs, passed through from this component's existing state/handlers */ />} />
    <Route path="/expenses" element={<ComingSoonPage title="Expenses" />} />
    <Route path="/budgets" element={<ComingSoonPage title="Budgets" />} />
    <Route path="/analytics" element={<ComingSoonPage title="Analytics" />} />
    <Route path="/categories" element={<ComingSoonPage title="Categories" />} />
    <Route path="/settings" element={<ComingSoonPage title="Settings" />} />
  </Routes>
);
```

Every prop `DashboardPage` needs (per Task 2 Step 3's interface) must be passed explicitly here — don't skip any, or the dashboard will silently lose functionality (e.g. forgetting to pass `onDelete`/`confirmDeleteId` would break the delete flow). Cross-check against the props list you defined when creating `DashboardPage.jsx`.

- [ ] **Step 6: Verify manually**

Run `npm run build && npm run dev`. Sign in, confirm the dashboard renders EXACTLY as before (same look, same functionality — add/edit/delete expense, categories, budgets, charts, export, theme toggle, clear-all) at the `/` URL. Manually navigate the browser to `/expenses`, `/budgets`, etc. and confirm each shows the "coming soon" placeholder without crashing. Navigate back to `/` and confirm the dashboard still works (state wasn't lost/corrupted by the route change).

- [ ] **Step 7: Commit**

```bash
npm run build && npm run lint
git add package.json package-lock.json src/main.jsx src/App.jsx src/pages/DashboardPage.jsx src/pages/ComingSoonPage.jsx
git commit -m "Add React Router, relocate existing dashboard into DashboardPage, add placeholder routes"
```

---

### Task 3: Build the Shell (Sidebar + TopBar + MobileBottomNav)

**Files:**
- Create: `src/components/shell/Sidebar.jsx`, `src/components/shell/TopBar.jsx`, `src/components/shell/MobileBottomNav.jsx`, `src/components/shell/Shell.jsx`.
- Modify: `src/App.jsx` — wrap the `<Routes>` block from Task 2 inside `<Shell>`.

**Interfaces:**
- `Shell({ children, user, theme, toggleTheme, onSignOut, currency, onCurrencyChange, onExport, onOpenAdd })` — renders `Sidebar` + (`TopBar` + `children` in a scrollable main area) + `MobileBottomNav`, matching the design's flex layout (`display:flex;height:100vh`).
- `Sidebar({ collapsed, onToggleCollapse, user, onSignOut, monthTotal, totalBudgetShort, budgetUsedPct })` — nav links via `react-router-dom`'s `NavLink` (active state styling driven by `NavLink`'s built-in `isActive`, replacing the prototype's manual `isDash`/`notDash` flag pattern — this is simpler and idiomatic with real routing).
- `TopBar({ title, subtitle, onOpenAdd, onExport, theme, toggleTheme })` — search input (visual only in this phase — wiring search to `filteredExpenses` happens in Phase 4 when Expenses gets rebuilt; for now it can be a non-functional or locally-scoped input, your call, but don't fake-wire it to break anything), notification bell (icon only, no functionality yet — this phase is shell/layout only), export button, add-expense button, theme toggle.
- `MobileBottomNav()` — 4 icons (Home/Expenses/Insights/More) using `NavLink`, "More" links to `/settings` for now (a proper "More" menu covering Budgets/Categories/Settings is a nice-to-have; a single link to Settings is an acceptable minimal version for this phase — note this as a known simplification in your report, don't over-build a whole menu system here).

- [ ] **Step 1: Write `src/components/shell/Sidebar.jsx`**

```jsx
import { NavLink } from "react-router-dom";
import { Home, FileText, Package, TrendingUp, Grid, Settings, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/expenses", label: "Expenses", icon: FileText },
  { to: "/budgets", label: "Budgets", icon: Package },
  { to: "/analytics", label: "Analytics", icon: TrendingUp },
  { to: "/categories", label: "Categories", icon: Grid },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ collapsed, onToggleCollapse, email, onSignOut, monthTotal, totalBudgetShort, budgetUsedPct }) {
  return (
    <aside className={`hidden lg:flex flex-col h-full bg-pr-navy transition-[width] duration-200 overflow-hidden ${collapsed ? "w-[72px]" : "w-[236px]"}`}>
      <div className={`flex items-center gap-3 px-4 pt-5 pb-4 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-[30px] h-[30px] rounded-pr-default bg-pr-blue-550 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">T</div>
        {!collapsed && (
          <div className="flex flex-col min-w-0 overflow-hidden whitespace-nowrap">
            <span className="text-white font-semibold text-[15px] leading-none">Tally</span>
            <span className="text-pr-tertiary text-[11px] leading-none">Personal finance</span>
          </div>
        )}
      </div>
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-pr-default text-[13.5px] font-medium transition-colors cursor-pointer ${collapsed ? "justify-center" : ""} ${
                isActive ? "text-white bg-pr-blue-550/20 shadow-[inset_3px_0_0_var(--pr-blue-550)]" : "text-pr-secondary hover:text-white hover:bg-white/5"
              }`
            }
          >
            <Icon size={17} />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="m-3 p-3.5 rounded-pr-large bg-white/[0.04]">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-pr-tertiary mb-2.5">This month</p>
          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="text-white font-semibold text-[19px] font-mono tabular-nums">{monthTotal}</span>
            <span className="text-pr-tertiary text-[11px]">of {totalBudgetShort}</span>
          </div>
          <div className="h-[5px] rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-pr-blue-550 transition-all" style={{ width: budgetUsedPct }} />
          </div>
        </div>
      )}
      <div className={`px-4 py-3.5 border-t border-white/[0.07] flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-[30px] h-[30px] rounded-full bg-pr-blue-550 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {(email || "?").charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-white text-[12.5px] font-semibold truncate">{email}</span>
          </div>
        )}
        <button onClick={onSignOut} title="Log out" className="w-7 h-7 flex items-center justify-center rounded-lg text-pr-tertiary hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer flex-shrink-0">
          <LogOut size={16} />
        </button>
      </div>
      <button onClick={onToggleCollapse} className="absolute top-4 right-[-12px] w-6 h-6 rounded-full bg-pr-navy border border-white/10 text-pr-tertiary hover:text-white flex items-center justify-center cursor-pointer">
        <span className="text-xs">{collapsed ? "›" : "‹"}</span>
      </button>
    </aside>
  );
}
```

Note: the collapse-toggle button uses `absolute top-4 right-[-12px]` relative to the `aside` — `aside` needs `relative` positioning for this to anchor correctly; add `relative` to the `aside`'s className (it's missing from the block above — add it: `className={\`hidden lg:flex flex-col h-full bg-pr-navy transition-[width] duration-200 overflow-hidden relative ...\`}`).

- [ ] **Step 2: Write `src/components/shell/TopBar.jsx`**

```jsx
import { Search, Bell, Download, Plus, Sun, Moon } from "lucide-react";

export default function TopBar({ title, subtitle, onOpenAdd, onExport, theme, toggleTheme }) {
  return (
    <header className="flex items-center gap-3.5 px-6 lg:px-8 py-4 bg-pr-card border-b border-pr-border-default flex-wrap">
      <div className="flex-1 min-w-[180px] flex flex-col gap-0.5">
        <h1 className="text-[19px] font-semibold text-pr-primary leading-tight">{title}</h1>
        <p className="text-[12.5px] text-pr-secondary leading-tight">{subtitle}</p>
      </div>
      <div className="relative hidden md:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pr-tertiary pointer-events-none" />
        <input type="search" placeholder="Search expenses…" className="w-60 bg-pr-subtle border border-pr-border-default rounded-pr-default pl-9 pr-3 py-2.5 text-sm text-pr-primary placeholder:text-pr-tertiary focus:outline-none focus:ring-2 focus:ring-pr-blue-550/30" />
      </div>
      <button onClick={toggleTheme} title={theme === "dark" ? "Switch to light" : "Switch to dark"} className="w-10 h-10 flex items-center justify-center rounded-pr-default text-pr-secondary bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer">
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <button title="Notifications" className="w-10 h-10 flex items-center justify-center rounded-pr-default text-pr-secondary bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer">
        <Bell size={17} />
      </button>
      <button onClick={onExport} className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-pr-default text-sm font-medium text-pr-primary bg-pr-subtle hover:bg-pr-border-default transition-colors cursor-pointer">
        <Download size={16} /> Export
      </button>
      <button onClick={onOpenAdd} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-pr-default text-sm font-semibold text-white bg-pr-blue-550 hover:bg-pr-blue-700 transition-colors cursor-pointer">
        <Plus size={16} /> Add expense
      </button>
    </header>
  );
}
```

Note: `bg-pr-blue-550`/`bg-pr-blue-700`/`hover:text-pr-primary` etc. reference raw ramp colors (`--pr-blue-550`) not yet mapped into `@theme` in Task 1 (only semantic aliases were mapped, e.g. `--color-pr-accent`). Before using `bg-pr-blue-550` as a Tailwind class here, either (a) add `--color-pr-blue-550: var(--pr-blue-550);` etc. to the `@theme` block for every raw ramp color referenced across Sidebar/TopBar (`pr-blue-550`, `pr-blue-700`), or (b) use the semantic `bg-pr-accent`/`hover:bg-pr-navy` equivalents already mapped in Task 1 instead of raw ramp names. Prefer (b) — reuse the semantic tokens already established — and only fall back to (a) for a specific color with no semantic equivalent (e.g. `--pr-blue-700` for a hover-darken state needs its own mapping since Task 1 didn't map a "darker accent" alias; add `--color-pr-accent-hover: var(--pr-blue-700);` to `@theme` if needed and use `hover:bg-pr-accent-hover`). Resolve this consistently — don't leave any unmapped raw-ramp Tailwind class in the final code, verify by checking the compiled CSS output the same way Task 1 did.

- [ ] **Step 3: Write `src/components/shell/MobileBottomNav.jsx`**

```jsx
import { NavLink } from "react-router-dom";
import { Home, FileText, TrendingUp, Settings } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/expenses", label: "Expenses", icon: FileText },
  { to: "/analytics", label: "Insights", icon: TrendingUp },
  { to: "/settings", label: "More", icon: Settings },
];

export default function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 gap-1 px-3 py-2.5 bg-pr-card border-t border-pr-border-subtle">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex flex-col items-center gap-1 py-2 cursor-pointer ${isActive ? "text-pr-accent" : "text-pr-tertiary"}`}>
          <Icon size={19} />
          <span className="text-[10.5px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

(Same note as Step 2 applies to `text-pr-accent` — confirm it's mapped in `@theme`, per Task 1 it should already be via `--color-pr-accent`.)

- [ ] **Step 4: Write `src/components/shell/Shell.jsx`**

```jsx
import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import MobileBottomNav from "./MobileBottomNav.jsx";

export default function Shell({ children, title, subtitle, email, onSignOut, theme, toggleTheme, onExport, onOpenAdd, monthTotal, totalBudgetShort, budgetUsedPct }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-pr-page font-['Inter',_sans-serif]">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(c => !c)} email={email} onSignOut={onSignOut} monthTotal={monthTotal} totalBudgetShort={totalBudgetShort} budgetUsedPct={budgetUsedPct} />
      <main className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} subtitle={subtitle} onOpenAdd={onOpenAdd} onExport={onExport} theme={theme} toggleTheme={toggleTheme} />
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7 pb-24 lg:pb-12">
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
```

- [ ] **Step 5: Wire `Shell` into `src/App.jsx`**

Wrap the `<Routes>` block from Task 2 inside `<Shell>`, passing the props `Shell` needs (`title`/`subtitle` can be derived from the current route — for this phase, a simple approach: pass a static title like `"Tally"` / a static subtitle, since per-page titles matching the design's dynamic title-per-view are a nice-to-have this phase doesn't need to solve — each page built in Phases 3-8 can render its own heading inside its own content if needed; don't over-engineer a route-to-title mapping system now). Pass `email={user.email}`, `onSignOut={signOutUser}`, `theme`, `toggleTheme`, `onExport={handleExport}` (already exists in `App.jsx`), `onOpenAdd` (for this phase, can just navigate to `/expenses` or be a no-op — the real "open add-expense modal" behavior is built in Phase 4; note this as a known limitation, don't build modal logic in this phase), and the three sidebar summary values (`monthTotal`, `totalBudgetShort`, `budgetUsedPct` — compute these the same way `SummaryCards.jsx` already does, or pass placeholder values like `"—"` for this phase if computing them here would duplicate too much logic — your call, but if you compute them, do it via the same formulas already established, don't invent new math).

- [ ] **Step 6: Verify manually**

Run `npm run build && npm run dev`. Sign in, confirm: sidebar renders with all 6 nav items, clicking each navigates to the right URL (dashboard renders the full existing app, others show "coming soon"), active nav item is highlighted, collapse toggle works, sign-out works from the sidebar, resizing below `lg` (1024px) hides the sidebar and shows the bottom nav instead, resizing back shows the sidebar again.

- [ ] **Step 7: Commit**

```bash
npm run build && npm run lint
git add src/components/shell src/App.jsx
git commit -m "Add Procura Shell: Sidebar, TopBar, MobileBottomNav"
```

---

### Task 4: Core primitives — Button, Input, Select, IconButton

**Files:**
- Create: `src/components/ui/Button.jsx`, `src/components/ui/Input.jsx`, `src/components/ui/Select.jsx`, `src/components/ui/IconButton.jsx`.

**Interfaces:**
- `Button({ variant = "primary", icon: Icon, children, onClick, type = "button", disabled })` — variants: `primary` (bg-pr-navy or bg-pr-accent — pick `bg-pr-accent` since that's the interactive action color the design uses for "Add expense"/primary actions per the `.dc.html` markup, text white), `secondary` (bg-pr-subtle, text-pr-primary), `ghost` (transparent, text-pr-secondary), `danger` (bg-pr-danger, text white).
- `Input({ label, prefix, error, helper, ...inputProps })` — wraps a native `<input>`, forwards all standard input props via `...inputProps` (value/onChange/type/placeholder/etc.), renders label above, prefix (e.g. "₹") inline-left if provided, error text below in `text-pr-danger`, helper text below in `text-pr-tertiary` if no error.
- `Select({ label, value, onChange, options, ...rest })` — wraps a native `<select>`, same label/styling conventions as `Input`. `options` is `string[]`.
- `IconButton({ icon: Icon, label, onClick, size = 40 })` — a square icon-only button with `aria-label={label}`/`title={label}`, matching TopBar's notification-bell style.

- [ ] **Step 1: Write `src/components/ui/Button.jsx`**

```jsx
const VARIANTS = {
  primary: "bg-pr-accent text-white hover:bg-pr-accent-hover",
  secondary: "bg-pr-subtle text-pr-primary hover:bg-pr-border-default",
  ghost: "bg-transparent text-pr-secondary hover:bg-pr-subtle hover:text-pr-primary",
  danger: "bg-pr-danger text-white hover:opacity-90",
};

export default function Button({ variant = "primary", icon: Icon, children, onClick, type = "button", disabled, className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-pr-default text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
```

Note: this references `bg-pr-accent-hover` — add `--color-pr-accent-hover: var(--pr-blue-700);` to the `@theme` block if you haven't already added it in Task 3 Step 2's resolution. Check first; add once, don't duplicate the mapping.

- [ ] **Step 2: Write `src/components/ui/Input.jsx`**

```jsx
export default function Input({ label, prefix, error, helper, className = "", ...inputProps }) {
  return (
    <div className={className}>
      {label && <label className="text-xs font-semibold uppercase tracking-wide text-pr-tertiary mb-1.5 block">{label}</label>}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pr-secondary text-sm pointer-events-none">{prefix}</span>}
        <input
          {...inputProps}
          className={`w-full bg-pr-subtle border border-pr-border-default rounded-pr-default py-2.5 text-sm text-pr-primary placeholder:text-pr-tertiary focus:outline-none focus:ring-2 focus:ring-pr-accent/30 focus:border-pr-accent transition-colors ${prefix ? "pl-7 pr-3" : "px-3"}`}
        />
      </div>
      {error && <p className="text-xs text-pr-danger mt-1">{error}</p>}
      {!error && helper && <p className="text-xs text-pr-tertiary mt-1">{helper}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/ui/Select.jsx`**

```jsx
export default function Select({ label, value, onChange, options, className = "" }) {
  return (
    <div className={className}>
      {label && <label className="text-xs font-semibold uppercase tracking-wide text-pr-tertiary mb-1.5 block">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-pr-subtle border border-pr-border-default rounded-pr-default px-3 py-2.5 text-sm text-pr-primary focus:outline-none focus:ring-2 focus:ring-pr-accent/30 focus:border-pr-accent transition-colors cursor-pointer"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/components/ui/IconButton.jsx`**

```jsx
export default function IconButton({ icon: Icon, label, onClick, size = 40 }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-pr-default text-pr-secondary bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer"
    >
      <Icon size={17} />
    </button>
  );
}
```

- [ ] **Step 5: Verify manually**

These aren't wired into any page yet (that's Phases 3+). Verify via a temporary scratch render in `App.jsx` (removed before commit, same pattern as every token-verification step in this project's history): mount one of each with representative props, run `npm run build`, confirm no errors, then remove the scratch code — `git diff` on any file other than the 4 new component files must be empty.

- [ ] **Step 6: Commit**

```bash
npm run build && npm run lint
git add src/components/ui
git commit -m "Add core Procura primitives: Button, Input, Select, IconButton"
```
