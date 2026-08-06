# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm install       # install dependencies
npm run dev        # Vite dev server (required for local testing — ES module imports don't work via file://)
npm run build       # production build to dist/
npm run preview      # serve the production build locally
npm run lint          # oxlint
```

There is no test suite/runner configured in this project — verification is manual (`npm run dev` + click through) and `npm run build`/`npm run lint` for static checks. Don't add a test framework unless asked.

Deploy: `vercel --prod` from the project root (Vercel auto-detects Vite, no `vercel.json` needed). The Firebase web config in `src/firebase.js` is safe to commit — it's a public client identifier, not a secret; access control is enforced by Firestore security rules, not by hiding the config.

## Architecture

Single-page Expense Tracker dashboard: React 19 + Vite frontend, Firebase (Auth + Firestore) as the only backend — no custom server.

**Data model:** each signed-in user has exactly one Firestore document at `users/{uid}` containing `{ expenses: [], budgets: {}, categories: [], settings: { currency, theme } }`. There is no real-time sync (`onSnapshot`) — the document is read once on login and the whole relevant slice is rewritten with `setDoc(..., { merge: true })` on every mutation. Firestore security rules restrict each document to its owning `uid`.

**State flow (`src/App.jsx` is the composition root):**
- `useAuth()` (`src/hooks/useAuth.js`) wraps `onAuthStateChanged`/sign-in/sign-up/sign-out, returning `{ user, authLoading, signIn, signUp, signOutUser, authError, clearAuthError }`.
- `useExpenseData(uid)` (`src/hooks/useExpenseData.js`) owns the Firestore document and exposes mutators (`addExpense`, `updateExpense`, `deleteExpense`, `addCategory`, `removeCategory`, `setBudget`, `setCurrency`, `setThemePreference`, `clearAll`) plus `{ state, loading, loadError }`. Each mutator does an optimistic local `setState` and fires the Firestore write in the background (write failures are logged, not surfaced to the UI). A failed *load*, by contrast, is surfaced via `loadError` and blocks the entire dashboard from rendering — this is deliberate: rendering the dashboard on top of a failed load would show empty default state, and any edit would then overwrite the user's real saved data with that empty state. If you touch the load effect in `useExpenseData.js`, keep `loadError` checked independently of `loading` in `App.jsx` (not nested inside it) — this was a data-loss bug once already.
- `useTheme(themeFromData, setThemePreference)` (`src/hooks/useTheme.js`) manages light/dark mode, persisted to `settings.theme` in Firestore with a `localStorage` (`et_theme`) fallback for before the Firestore doc loads. Sets `data-theme` on `<html>`; CSS variables in `src/index.css` are duplicated for `:root` (dark, default) and `:root[data-theme="light"]`. Not every dark-mode color has a light override yet — check `src/index.css` for hardcoded literals when adding new UI, rather than assuming variable overrides cover everything.
- Filter/sort/edit/confirm-dialog UI state (`filterCategory`, `search`, `sort`, `editingExpense`, `confirmDeleteId`, `confirmRemoveCategory`, `confirmClearAll`, `toastMessage`) lives directly in `App.jsx` as plain `useState`, not in a hook — it's view-local, not persisted.

**Components** (`src/components/`) are presentational and receive all data/callbacks as props from `App.jsx` — none of them talk to Firebase or `useExpenseData` directly. `ExpenseTable.jsx` renders both a desktop `<table>` and a mobile card list in the same DOM tree; which one is visible is controlled purely by a CSS media query (`@media (max-width: 700px)`) in `src/index.css`, not by JS.

**Shared logic** lives in `src/lib/`: `format.js` (money formatting with thousands separators, and comma-formatting for the amount input as it's typed) and `validation.js` (field validation — amount must be `>0` and ≤10 integer digits, date can't be in the future, category name required/≤24 chars/unique). All validated/formatted fields across `ExpenseForm`, `BudgetList`, and `CategoryManager` route through these two files — don't reimplement formatting or validation locally in a component.

**Destructive actions** (delete expense, remove category, clear all data) go through the shared `ConfirmDialog` component, driven by state in `App.jsx` — never a raw `confirm()`/`alert()`. `Toast` gives transient feedback after an action; its `onDismiss` prop must be a stable reference (e.g. `useCallback`) or its auto-dismiss timer resets on every unrelated re-render.

## History

This was originally a vanilla HTML/CSS/JS app storing data in `localStorage` with no real auth. It was migrated in two stages: first Firebase Auth + Firestore were added to the vanilla JS version, then the whole frontend was rewritten in React/Vite (current state). The rewrite deliberately dropped the original's date-range filter (this month/last month/custom) and the >70-day monthly rollup on the trend chart — the current filtering is category + free-text search only, and the trend chart always buckets by day.
