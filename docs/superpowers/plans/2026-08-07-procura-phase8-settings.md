# Procura Redesign — Phase 8: Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/settings` — profile (display name, currency), preferences (dark mode / budget alerts / weekly summary switches), and CSV export. Per the master spec: `budgetAlertsEnabled`, `weeklySummaryEnabled`, `displayName` are **new, UI-preference-only Firestore fields** — the Settings page persists their toggle state and does nothing further with them (no email/push infrastructure). This phase also relocates two capabilities that currently live in the global `TopBar` (Phase 1) into this page, per the master spec's explicit page mapping: the **currency picker** (dropped from `DashboardPage.jsx` during its Phase 3 rewrite and never rebuilt anywhere since — confirmed via `grep`, there is currently NO way to change currency in the app) and **CSV export** (currently a global "Export" button in `TopBar`, used on every page — the spec's Settings mapping says this is "relocated here," so it comes out of the global bar and becomes Settings-only).

**Architecture:** Three small, isolated primitive/hook changes precede the page itself: (1) `useExpenseData.js` gets 3 new `settings` fields and 3 new mutators, following the exact pattern `setCurrency` already uses; (2) `Select.jsx` (Phase 1) gets backward-compatible support for `{ value, label }` option objects, since the currency picker needs "$" to display as "$ USD" — today's `Select` only supports plain strings where the value and label are identical; (3) `TopBar.jsx`/`Shell.jsx` lose the `onExport` prop and Export button, since Export becomes Settings-only.

**Tech Stack:** No new dependencies. Reuses `src/lib/format.js` and the existing `handleExport`/`toggleTheme` functions verbatim.

## Global Constraints

- The 3 new toggles (`budgetAlertsEnabled`, `weeklySummaryEnabled`) and the new `displayName` field are **UI state only** — this phase must not add any email-sending, push-notification, or scheduling infrastructure. Flipping a switch persists a boolean to Firestore and nothing else.
- `Select.jsx`'s change must be backward-compatible — every existing caller passing plain strings (`ExpensesPage.jsx`'s sort dropdown) must keep working unchanged.
- Every dollar amount goes through `formatMoney(amount, currency)`.
- Every interactive element gets `cursor-pointer` explicitly.

## Reused logic (verbatim source of truth)

`setCurrency`'s existing pattern in `useExpenseData.js` (copy this shape exactly for the 3 new mutators):
```js
const setCurrency = useCallback((currency) => {
  setState(prev => {
    const settings = { ...prev.settings, currency };
    const next = { ...prev, settings };
    persistProfile(next).catch(err => console.error("Failed to save currency setting:", err));
    return next;
  });
}, [persistProfile]);
```

---

### Task 1: Add `displayName`/`budgetAlertsEnabled`/`weeklySummaryEnabled` to `useExpenseData.js`

**Files:**
- Modify: `src/hooks/useExpenseData.js`

**Interfaces:**
- Extends `DEFAULT_STATE.settings` and the load-time settings merge with 3 new defaulted fields: `displayName: ""`, `budgetAlertsEnabled: true`, `weeklySummaryEnabled: false`.
- Produces 3 new mutators: `setDisplayName(name)`, `setBudgetAlertsEnabled(enabled)`, `setWeeklySummaryEnabled(enabled)`.

- [ ] **Step 1: Extend `DEFAULT_STATE`**

Change:
```js
const DEFAULT_STATE = {
  expenses: [],
  budgets: {},
  categories: [...DEFAULT_CATEGORIES],
  settings: { currency: "$", theme: "dark", totalBudget: 0 },
};
```
to:
```js
const DEFAULT_STATE = {
  expenses: [],
  budgets: {},
  categories: [...DEFAULT_CATEGORIES],
  settings: { currency: "$", theme: "dark", totalBudget: 0, displayName: "", budgetAlertsEnabled: true, weeklySummaryEnabled: false },
};
```

- [ ] **Step 2: Extend the load-time settings merge**

Change:
```js
settings: { currency: "$", theme: "dark", totalBudget: 0, ...(data.settings || {}) },
```
to:
```js
settings: { currency: "$", theme: "dark", totalBudget: 0, displayName: "", budgetAlertsEnabled: true, weeklySummaryEnabled: false, ...(data.settings || {}) },
```

- [ ] **Step 3: Add the 3 mutators**

Immediately after the existing `setCurrency` callback, add:

```js
const setDisplayName = useCallback((displayName) => {
  setState(prev => {
    const settings = { ...prev.settings, displayName };
    const next = { ...prev, settings };
    persistProfile(next).catch(err => console.error("Failed to save display name:", err));
    return next;
  });
}, [persistProfile]);

const setBudgetAlertsEnabled = useCallback((budgetAlertsEnabled) => {
  setState(prev => {
    const settings = { ...prev.settings, budgetAlertsEnabled };
    const next = { ...prev, settings };
    persistProfile(next).catch(err => console.error("Failed to save budget alerts setting:", err));
    return next;
  });
}, [persistProfile]);

const setWeeklySummaryEnabled = useCallback((weeklySummaryEnabled) => {
  setState(prev => {
    const settings = { ...prev.settings, weeklySummaryEnabled };
    const next = { ...prev, settings };
    persistProfile(next).catch(err => console.error("Failed to save weekly summary setting:", err));
    return next;
  });
}, [persistProfile]);
```

- [ ] **Step 4: Add the 3 mutators to the returned object**

Change the final `return { ... };` to insert the 3 new mutators after `setCurrency`:
```js
return { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, addCategory, removeCategory, setBudget, setCurrency, setDisplayName, setBudgetAlertsEnabled, setWeeklySummaryEnabled, setTotalBudget, setThemePreference, clearAll };
```

- [ ] **Step 5: Verify and commit**

```bash
npm run build && npm run lint
git add src/hooks/useExpenseData.js
git commit -m "Add displayName/budgetAlertsEnabled/weeklySummaryEnabled settings fields and mutators"
```

---

### Task 2: Extend `Select.jsx` to support `{ value, label }` options

**Files:**
- Modify: `src/components/ui/Select.jsx`

**Why:** The currency picker needs "$" to display as "$ USD" — today's `Select` renders each option string as both its own `value` and its own display text, which can't produce that. Every existing caller (`ExpensesPage.jsx`'s sort dropdown) passes plain strings where value and label are the same, so this change must be backward-compatible.

**Interfaces:** `options` now accepts `Array<string | { value: string, label: string }>`. No change to `label`/`value`/`onChange`/`className` props.

- [ ] **Step 1: Update the options rendering**

Change:
```jsx
{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
```
to:
```jsx
{options.map(opt => {
  const optValue = typeof opt === "object" ? opt.value : opt;
  const optLabel = typeof opt === "object" ? opt.label : opt;
  return <option key={optValue} value={optValue}>{optLabel}</option>;
})}
```

- [ ] **Step 2: Verify and commit**

Trace by hand: `ExpensesPage.jsx`'s `SORT_OPTIONS` (plain strings) still render identically (`typeof opt === "object"` is false for a string, so `optValue`/`optLabel` both equal `opt`, exactly the old behavior).

```bash
npm run build && npm run lint
git add src/components/ui/Select.jsx
git commit -m "Extend Select to support {value, label} options, for the currency picker's distinct display text"
```

---

### Task 3: Remove Export from `TopBar`/`Shell`; wire `App.jsx` for the Settings page

**Files:**
- Modify: `src/components/shell/TopBar.jsx`, `src/components/shell/Shell.jsx`, `src/App.jsx`

**Interfaces:**
- `TopBar` drops the `onExport` prop and its Export button entirely (keeps search, theme toggle, notifications bell, "Add expense").
- `Shell` drops the `onExport` prop it was forwarding to `TopBar`.
- `App.jsx` re-adds `setCurrency` to the hook destructuring, adds the 3 new mutators from Task 1, stops passing `onExport` to `<Shell>`, and produces `settingsProps`: `{ state, theme, toggleTheme, setCurrency, setDisplayName, setBudgetAlertsEnabled, setWeeklySummaryEnabled, handleExport }`.
- Replaces the `/settings` route's `<ComingSoonPage title="Settings" />` with `<SettingsPage {...settingsProps} />`.

- [ ] **Step 1: Remove the Export button and prop from `TopBar.jsx`**

Remove the `Download` import (no longer used elsewhere in this file — confirm with a quick re-read before deleting the import), remove `onExport` from the destructured props, and delete this block entirely:
```jsx
<button onClick={onExport} className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-pr-default text-sm font-medium text-pr-primary bg-pr-subtle hover:bg-pr-border-default transition-colors cursor-pointer">
  <Download size={16} /> Export
</button>
```

- [ ] **Step 2: Remove `onExport` from `Shell.jsx`**

Remove `onExport` from `Shell`'s destructured props and from the `<TopBar ... onExport={onExport} ... />` call (just drop that one attribute; keep everything else on `TopBar` as-is).

- [ ] **Step 3: Re-add `setCurrency` and the 3 new mutators to `App.jsx`'s hook destructuring**

Change:
```jsx
const { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, addCategory, removeCategory, setBudget, setTotalBudget, setThemePreference } = useExpenseData(user?.uid);
```
to:
```jsx
const { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, addCategory, removeCategory, setBudget, setCurrency, setDisplayName, setBudgetAlertsEnabled, setWeeklySummaryEnabled, setTotalBudget, setThemePreference } = useExpenseData(user?.uid);
```

- [ ] **Step 4: Remove `onExport` from the `<Shell>` call, import `SettingsPage`, add `settingsProps`, swap the route**

Remove `onExport={handleExport}` from the `<Shell ...>` JSX (this does NOT remove the `handleExport` function itself — it's still used by the new Settings page).

Add the import alongside the other page imports:
```jsx
import SettingsPage from "./pages/SettingsPage.jsx";
```
Add, right after `analyticsProps` is built:
```jsx
const settingsProps = { state, theme, toggleTheme, setCurrency, setDisplayName, setBudgetAlertsEnabled, setWeeklySummaryEnabled, handleExport };
```
Change:
```jsx
<Route path="/settings" element={<ComingSoonPage title="Settings" />} />
```
to:
```jsx
<Route path="/settings" element={<SettingsPage {...settingsProps} />} />
```

- [ ] **Step 5: Verify and commit (together with Task 4 — this task's build only succeeds once `SettingsPage.jsx` exists)**

Proceed to Task 4, then build/lint/commit all three files together:
```bash
npm run build && npm run lint
git add src/components/shell/TopBar.jsx src/components/shell/Shell.jsx src/App.jsx
git commit -m "Remove global Export button from TopBar/Shell; wire Settings page into App.jsx"
```

---

### Task 4: Build `SettingsPage.jsx`

**Files:**
- Create: `src/pages/SettingsPage.jsx`

**Interfaces:**
- Consumes: `state, theme, toggleTheme, setCurrency, setDisplayName, setBudgetAlertsEnabled, setWeeklySummaryEnabled, handleExport` (Task 3's `settingsProps`).
- Consumes: `Input`, `Select`, `Switch`, `Button` (Phase 1/2 primitives).

- [ ] **Step 1: Write the component**

```jsx
import { Download } from "lucide-react";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Switch from "../components/ui/Switch.jsx";
import Button from "../components/ui/Button.jsx";

const CURRENCY_OPTIONS = [
  { value: "$", label: "$ USD" },
  { value: "€", label: "€ EUR" },
  { value: "£", label: "£ GBP" },
  { value: "₹", label: "₹ INR" },
];

export default function SettingsPage({ state, theme, toggleTheme, setCurrency, setDisplayName, setBudgetAlertsEnabled, setWeeklySummaryEnabled, handleExport }) {
  const { settings } = state;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-2xl">
      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-pr-primary">Profile</h2>
        <Input
          label="Display Name" placeholder="Your name" maxLength={60}
          defaultValue={settings.displayName || ""}
          onBlur={e => setDisplayName(e.target.value.trim())}
        />
        <Select
          label="Currency"
          value={settings.currency}
          onChange={e => setCurrency(e.target.value)}
          options={CURRENCY_OPTIONS}
        />
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-pr-primary">Preferences</h2>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-pr-primary">Dark Mode</p>
            <p className="text-xs text-pr-tertiary">Switch between light and dark themes.</p>
          </div>
          <Switch checked={theme === "dark"} onChange={() => toggleTheme()} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-pr-primary">Budget Alerts</p>
            <p className="text-xs text-pr-tertiary">Show a warning when a category goes over budget.</p>
          </div>
          <Switch checked={settings.budgetAlertsEnabled} onChange={setBudgetAlertsEnabled} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-pr-primary">Weekly Summary</p>
            <p className="text-xs text-pr-tertiary">Preference only — no email is sent yet.</p>
          </div>
          <Switch checked={settings.weeklySummaryEnabled} onChange={setWeeklySummaryEnabled} />
        </div>
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-pr-primary">Export Data</h2>
        <p className="text-xs text-pr-tertiary">Download all your expenses as a CSV file.</p>
        <Button icon={Download} onClick={handleExport} className="self-start">Export CSV</Button>
      </div>
    </div>
  );
}
```

Note on the "Budget Alerts" copy ("Show a warning when a category goes over budget"): this describes the Dashboard's existing over-budget `Alert` banner (Phase 3), which today is **unconditional** — it has no on/off check against `budgetAlertsEnabled` at all. Per the Global Constraints, this phase adds ONLY the persisted toggle, not the wiring that makes it affect the Dashboard banner (that would be new conditional-rendering logic in `DashboardPage.jsx`, out of this phase's stated scope: "zero email/push infrastructure," but this is a UI-conditional, not infrastructure — still, it's a cross-page change this plan never scoped or reviewed). **Do not wire it in this task.** If accurate copy matters more than scope discipline here, soften the copy instead: `"Currently a saved preference only — doesn't yet hide/show the Dashboard's over-budget banner."` Use the softened copy, not the implying-it-works version, so the page never claims a behavior it doesn't have.

- [ ] **Step 2: Use the accurate (softened) copy from the note above**

Replace the Budget Alerts helper text with:
```jsx
<p className="text-xs text-pr-tertiary">Saved preference only — doesn't affect the Dashboard's over-budget banner yet.</p>
```

- [ ] **Step 3: Full verification (build/lint + code-trace)**

```bash
npm run build && npm run lint
```

Trace by hand: changing the currency `Select` calls `setCurrency` with the new symbol and every page reading `state.settings.currency` (Dashboard/Expenses/Budgets/Categories/Analytics) picks it up on next render, since it's the same `state` object threaded everywhere; toggling Dark Mode flips `theme` exactly like the old TopBar toggle did; clicking "Export CSV" produces the same CSV download `handleExport` always has; the Display Name input keeps its uncontrolled `defaultValue`/`onBlur` pattern (consistent with Budgets page) rather than firing a write on every keystroke.

- [ ] **Step 4: Commit (together with Task 3)**

```bash
git add src/pages/SettingsPage.jsx src/App.jsx src/components/shell/TopBar.jsx src/components/shell/Shell.jsx
git commit -m "Add SettingsPage: profile (display name, currency), preference switches, and CSV export"
```

---

### Final phase review

- [ ] Confirm via `git diff <phase-8-base>..HEAD --stat` that the only modified files are `src/hooks/useExpenseData.js`, `src/components/ui/Select.jsx`, `src/components/shell/TopBar.jsx`, `src/components/shell/Shell.jsx`, and `src/App.jsx` — `src/pages/SettingsPage.jsx` is new.
- [ ] Confirm the currency picker works from Settings and is genuinely gone from everywhere else (it was never anywhere else after Phase 3 — this confirms the gap is closed, not that a duplicate was left behind).
- [ ] Confirm the Export button is gone from `TopBar` (visible on every page) and present only on `/settings`.
- [ ] Confirm no email/push/notification infrastructure was added — `budgetAlertsEnabled`/`weeklySummaryEnabled` are persisted booleans with no other effect, per the Global Constraints.
- [ ] `npm run build` and `npm run lint` clean.
- [ ] Merge into `main`, push, then pause and report to the user before starting Phase 9 (Cleanup — the final phase), per the established phase-by-phase operating mode.
