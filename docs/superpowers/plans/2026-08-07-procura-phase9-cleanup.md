# Procura Redesign — Phase 9: Cleanup (Final Phase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the "full replacement, not an additive theme" decision made at the very start of this redesign (see the master spec's Decisions section) by (1) deleting every now-dead old-"emerald"-system component, and (2) removing the old design tokens from `src/index.css` entirely.

**Critical finding from the pre-phase audit — this changes the phase's scope:** the original plan for this phase was "just delete 12 dead files and remove dead tokens." A background audit found that **`AuthScreen.jsx` (the sign-in/sign-up screen) and `App.jsx`'s own loading/error fallback screens were never migrated to Procura at all** — they're still 100% on the old emerald tokens (`bg-surface`, `text-text`, `rounded-pill`, `shadow-soft`, etc.), and they are very much alive (`AuthScreen` renders for every unauthenticated visit; the loading/error screens render on every page load and on any Firestore read failure). This means the old tokens are NOT dead — deleting them first would break the sign-in screen. **This phase must migrate those two pieces to Procura BEFORE removing any old tokens.** This was never caught earlier because no phase's page-by-page mapping ever covered the auth screen or the top-level loading/error states — they sat outside every phase's scope by omission, not by decision.

**Architecture:** Six tasks, strictly ordered (each depends on the previous): migrate `AuthScreen.jsx` → migrate `App.jsx`'s fallback screens → delete the 12 dead files → update the remaining *raw* CSS rules in `index.css` that reference old tokens directly (not through Tailwind utilities, so a grep for class names won't find them) → delete the now-truly-dead old-system tokens and unused raw CSS classes → final whole-app QA.

**Tech Stack:** No new dependencies. No new components — this phase only touches existing files and deletes files.

## Global Constraints

- No behavior changes anywhere in this phase — every task is either a pure restyle (Tasks 1-2), a deletion of code with zero remaining references (Tasks 3, 5), or a color-token substitution in raw CSS that must produce the same visual result on the new dark/light Procura themes that the input/select/page-body elements already show elsewhere (Task 4).
- Before deleting ANY file or CSS block, re-grep for it — the pre-phase audit is trustworthy but this phase itself makes new changes (Tasks 1-2) that could shift what's still "live"; verify against the current tree state at deletion time, not just the audit's snapshot.
- Every interactive element retains `cursor-pointer` after restyling.

---

### Task 1: Migrate `AuthScreen.jsx` to Procura tokens

**Files:**
- Modify: `src/components/AuthScreen.jsx`

**Interfaces:** No prop or behavior change (`{ onSignIn, onSignUp, authError, clearAuthError }`) — pure restyle. Reuses `Input`/`Button` (Phase 1 primitives) for the email/password fields and submit button; the sign-in/sign-up segmented-tab toggle stays hand-rolled (no existing primitive matches a 2-way tab toggle) but with `pr-` classes.

- [ ] **Step 1: Rewrite the component**

```jsx
import { useState } from "react";
import Input from "./ui/Input.jsx";
import Button from "./ui/Button.jsx";

export default function AuthScreen({ onSignIn, onSignUp, authError, clearAuthError }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(evt) {
    evt.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signin") await onSignIn(email, password);
      else await onSignUp(email, password);
    } catch {
      // authError is already set by useAuth
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    clearAuthError();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pr-page px-4">
      <div className="w-full max-w-sm bg-pr-card shadow-pr-sm rounded-pr-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <span className="inline-grid place-items-center w-12 h-12 rounded-pr-default bg-pr-accent text-white font-bold text-2xl mb-4">$</span>
          <h1 className="text-xl font-semibold text-pr-primary mb-1">Expense Tracker</h1>
          <p className="text-sm text-pr-secondary">Track spending. Stay on budget.</p>
        </div>

        <div className="inline-flex w-full bg-pr-subtle rounded-pr-pill p-1 mb-5">
          <button
            type="button"
            className={`flex-1 rounded-pr-pill px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${mode === "signin" ? "bg-pr-card text-pr-primary shadow-pr-sm" : "text-pr-secondary hover:text-pr-primary"}`}
            onClick={() => switchMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-pr-pill px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${mode === "signup" ? "bg-pr-card text-pr-primary shadow-pr-sm" : "text-pr-secondary hover:text-pr-primary"}`}
            onClick={() => switchMode("signup")}
          >
            Create Account
          </button>
        </div>

        {authError && <p className="text-xs text-pr-danger bg-pr-danger-soft rounded-pr-default px-3 py-2 mb-4">{authError}</p>}

        <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
          <Input
            label="Email" id="auth-email" type="email" required autoComplete="email"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <Input
            label="Password" id="auth-password" type="password" required minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" disabled={submitting} className="w-full">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-xs text-pr-secondary mt-5">Your data is securely stored in the cloud.</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify and commit**

```bash
npm run build && npm run lint
git add src/components/AuthScreen.jsx
git commit -m "Migrate AuthScreen to Procura tokens (was missed by every prior page-by-page phase)"
```

---

### Task 2: Migrate `App.jsx`'s loading/error fallback screens to Procura tokens

**Files:**
- Modify: `src/App.jsx`

**Interfaces:** No behavior change — pure restyle of the two early-return JSX blocks.

- [ ] **Step 1: Restyle the `loadError` block**

Change:
```jsx
if (loadError) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <p className="text-text font-medium">Couldn't load your data</p>
      <p className="text-sm text-muted">Please refresh the page to try again.</p>
    </div>
  );
}
```
to:
```jsx
if (loadError) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6 bg-pr-page">
      <AlertCircle className="w-8 h-8 text-pr-danger" />
      <p className="text-pr-primary font-medium">Couldn't load your data</p>
      <p className="text-sm text-pr-secondary">Please refresh the page to try again.</p>
    </div>
  );
}
```

- [ ] **Step 2: Restyle the `loading` block**

Change:
```jsx
if (loading) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" role="status">
      <Loader2 className="w-6 h-6 text-primary animate-spin" aria-hidden="true" />
      <p className="text-sm text-muted">Loading your data…</p>
    </div>
  );
}
```
to:
```jsx
if (loading) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-pr-page" role="status">
      <Loader2 className="w-6 h-6 text-pr-accent animate-spin" aria-hidden="true" />
      <p className="text-sm text-pr-secondary">Loading your data…</p>
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
npm run build && npm run lint
git add src/App.jsx
git commit -m "Migrate App.jsx's loading/error fallback screens to Procura tokens"
```

---

### Task 3: Delete the 12 dead old-system files

**Files:**
- Delete: `src/components/Header.jsx`, `src/components/ConfirmDialog.jsx`, `src/components/ExpenseForm.jsx`, `src/components/CategoryManager.jsx`, `src/components/BudgetList.jsx`, `src/components/SummaryCards.jsx`, `src/components/AlertBanner.jsx`, `src/components/TrendChart.jsx`, `src/components/CategoryChart.jsx`, `src/components/ExpenseTable.jsx`, `src/components/Toast.jsx` (the OLD one — NOT `src/components/ui/Toast.jsx`, which is the new one, still in active use), `src/pages/ComingSoonPage.jsx`.

**Why now, not earlier:** each phase's convention (established in Phase 1) was to leave a component dead-but-in-place the moment its last caller was rewritten, and defer deletion to this final phase — so a mid-migration `git blame`/diff never had to explain "why is this file gone but nothing replaced it yet." All 12 have been zero-import dead code since the phase that replaced their last usage (Phase 3 for most; Phase 8 for `ComingSoonPage.jsx`, whose last route was replaced by `SettingsPage`).

- [ ] **Step 1: Re-verify each file has zero imports RIGHT NOW** (not just at audit time — Tasks 1-2 just touched `AuthScreen.jsx`/`App.jsx`, so re-confirm nothing in this phase accidentally revived one)

```bash
grep -rn "Header\.jsx\|ConfirmDialog\.jsx\|ExpenseForm\.jsx\|CategoryManager\.jsx\|BudgetList\.jsx\|SummaryCards\.jsx\|AlertBanner\.jsx\|TrendChart\.jsx\|CategoryChart\.jsx\|ExpenseTable\.jsx\|components/Toast\.jsx\|ComingSoonPage\.jsx" src/ --include="*.jsx" --include="*.js"
```
Expected: no matches (the grep pattern itself only matches import-path-shaped strings; if it matches something, stop and investigate before deleting).

- [ ] **Step 2: Delete the files**

```bash
git rm src/components/Header.jsx src/components/ConfirmDialog.jsx src/components/ExpenseForm.jsx src/components/CategoryManager.jsx src/components/BudgetList.jsx src/components/SummaryCards.jsx src/components/AlertBanner.jsx src/components/TrendChart.jsx src/components/CategoryChart.jsx src/components/ExpenseTable.jsx src/components/Toast.jsx src/pages/ComingSoonPage.jsx
```

- [ ] **Step 3: Verify and commit**

```bash
npm run build && npm run lint
git commit -m "Delete 12 dead pre-Procura components (zero imports since their replacement phase)"
```

---

### Task 4: Update raw CSS rules in `index.css` that reference old tokens directly

**Files:**
- Modify: `src/index.css`

**Why this is its own task, before token deletion:** a handful of rules in `index.css` are hand-written CSS (not Tailwind utility classes), so grepping `src/` for a Tailwind class name like `bg-surface` will never find them — they reference the old CSS custom properties (`var(--text)`, `var(--bg)`, `var(--option-bg)`) directly, and they apply globally (`html, body`, `select option`, `input:hover`). Two of them are currently live bugs on every Procura page and must not simply be deleted: `select option { ... }` styles the native dropdown popup for every `<select>` in the app, including the new `Select.jsx` primitive used on `/expenses` and `/settings` — deleting it would leave dropdown options unstyled (browser default) on those pages. `input:hover:not(:focus), select:hover:not(:focus)` currently paints a stray **emerald-green** hover border (`rgba(52, 211, 153, 0.32)`) on every input across the ENTIRE app, including all-Procura pages — this is a live, currently-shipping visual bug (an emerald color bleeding into the navy/blue design), not dead code; fix its color rather than deleting the rule (removing it would silently drop a hover affordance nobody asked to remove).

- [ ] **Step 1: Update `html, body`'s color/background**

Change:
```css
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  color: var(--text);
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--bg);
}
```
to:
```css
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  color: var(--pr-primary);
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
  background-color: var(--pr-page);
}
```

- [ ] **Step 2: Update `select option`'s colors**

Change:
```css
select option { background: var(--option-bg); color: var(--text); }
```
to:
```css
select option { background: var(--pr-card); color: var(--pr-primary); }
```

- [ ] **Step 3: Fix the input/select hover rule's color**

Change:
```css
input:hover:not(:focus),
select:hover:not(:focus) {
  border-color: rgba(52, 211, 153, 0.32);
  background: rgba(255, 255, 255, 0.07);
}
```
to:
```css
input:hover:not(:focus),
select:hover:not(:focus) {
  border-color: var(--pr-border-strong);
  background: var(--pr-subtle);
}
```

- [ ] **Step 4: Verify and commit**

Trace by hand: `select option`'s new colors match `Select.jsx`'s own container styling (`bg-pr-subtle` field, but the native OS-rendered dropdown popup itself should read as a card — `--pr-card`/`--pr-primary` is the same pairing `Modal.jsx` and `Combobox.jsx`'s listbox use); the hover rule's new colors are the same `--pr-border-strong`/`--pr-subtle` pairing already used elsewhere for a "hovered but not focused" affordance (e.g. `Switch.jsx`'s off-state track color, `DataTable.jsx`'s pagination button hover).

```bash
npm run build && npm run lint
git add src/index.css
git commit -m "Point index.css's raw select/hover/body rules at Procura tokens instead of the old emerald ones"
```

---

### Task 5: Delete the now-fully-dead old-system tokens and CSS classes

**Files:**
- Modify: `src/index.css`

**Interfaces:** None — this is deletion-only. After Tasks 1-4, nothing in `src/` references any old-system Tailwind utility (`bg-surface`, `text-text`, `rounded-card`, etc.) or the raw classes `.link-btn`/`.charts-grid`/`.app-footer`.

- [ ] **Step 1: Re-verify zero remaining usage of every old-system utility, right before deleting**

```bash
grep -rn "bg-bg\b\|bg-surface\b\|bg-surface-2\b\|text-text\b\|text-muted\b\|text-primary\b\|text-primary-text\b\|border-border-dim\b\|bg-danger\b\|text-danger\b\|bg-warn\b\|text-warn\b\|rounded-input\b\|rounded-card\b\|rounded-pill\b\|shadow-soft\b\|bg-primary\b\|hover:bg-primary-text\b" src/ --include="*.jsx"
grep -rn "app-footer\|charts-grid\|link-btn" src/ --include="*.jsx"
```
Expected: no matches. If anything matches, stop — that file needs its own migration first (treat it the way Tasks 1-2 treated `AuthScreen.jsx`/`App.jsx`), don't delete the token it depends on.

- [ ] **Step 2: Delete the old `@theme` mappings**

Remove these 16 lines from the `@theme` block (everything before the `/* ── Procura design system tokens ── */` comment):
```css
  --color-bg:            var(--bg);
  --color-text:          var(--text);
  --color-muted:         var(--muted);
  --color-primary:       var(--primary);
  --color-primary-light: var(--primary-l);
  --color-primary-text:  var(--primary-text);
  --color-danger:        var(--danger);
  --color-warn:          var(--warn);
  --color-border:        var(--border);
  --color-border-dim:    var(--border-dim);
  --color-surface:   var(--surface-1);
  --color-surface-2: var(--surface-2);
  --shadow-soft:      var(--shadow-soft);
  --radius-card:      var(--radius-card);
  --radius-pill:      var(--radius-pill);
  --radius-input:     var(--radius-input);
```

- [ ] **Step 3: Delete the old dark-mode `:root` palette block**

Remove the entire block from `/* ── Obsidian & Emerald palette ── */` through the closing `}` right before the Procura dark-tokens `:root` block (i.e., everything between the two `:root {` openers) — lines containing `--bg`, `--bg-soft`, `--glass`, `--glass-2`, `--border`, `--border-dim`, `--text`, `--muted`, `--primary`, `--primary-d`, `--primary-l`, `--danger`, `--warn`, `--glow`, `--glow-sm`, `--primary-text`, `--shadow`, `--radius`, `--blur`, `--header-bg`, `--surface-fill`, `--surface-fill-soft`, `--surface-fill-2`, `--placeholder-color`, `--option-bg`, `--danger-text`, `--surface-1`, `--surface-2`, `--shadow-soft`, `--radius-card`, `--radius-pill`, `--radius-input`, and their section-header comments. The two `:root {}` blocks merge into one (the Procura dark-tokens block that follows keeps its own `:root {` opener — do not create an empty leftover block).

- [ ] **Step 4: Delete the old light-mode override block**

Inside `:root[data-theme="light"] { ... }`, remove every line from `--bg: #f5f7fb;` through `--shadow-soft: 0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 20px rgba(15, 23, 42, 0.06);` (i.e., everything before the `/* ── Procura design system tokens (pr- prefixed) — light overrides ── */` comment), including the two explanatory comments above `--border` and `--warn` (they only make sense next to the lines they explain).

- [ ] **Step 5: Delete the 3 dead raw CSS classes**

Remove:
```css
.link-btn {
  background: none; border: none; color: var(--danger);
  cursor: pointer; text-decoration: underline; font: inherit; padding: 0;
}
```
```css
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
```
```css
.app-footer {
  text-align: center;
  color: var(--muted);
  font-size: 0.82rem;
  padding: 22px;
  border-top: 1px solid var(--border-dim);
  margin-top: 10px;
}
```
```css
.link-btn {
  transition: color 0.15s, opacity 0.15s;
}
.link-btn:hover { opacity: 0.8; }
```
And the responsive override:
```css
@media (max-width: 1100px) {
  .charts-grid { grid-template-columns: 1fr; }
}
```
If that `@media` block becomes empty after removing `.charts-grid` from it, delete the whole empty block too.

- [ ] **Step 6: Update the stale comment about removed selectors**

The comment above the `body, input, select` transition rule currently reads (in part) "Selector list trimmed to the remaining hand-authored/native elements — every other selector previously listed here ... no longer exists as a literal className anywhere in src/." This comment predates this phase's deletions; leave its substance but don't let it imply this is the last trimming pass — either update it or leave it (it's still accurate about that selector list specifically), your call, not worth a review cycle over wording.

- [ ] **Step 7: Full verification**

```bash
npm run build && npm run lint
```
Confirm the build's compiled CSS has zero remaining old-system custom properties:
```bash
grep -c "\-\-color-bg\|\-\-color-text\|\-\-color-muted\|\-\-color-primary\b\|\-\-color-danger\|\-\-color-warn\|\-\-color-border\|\-\-color-surface" dist/assets/*.css
```
Expected: `0` (or the grep reports no matches).

- [ ] **Step 8: Commit**

```bash
git add src/index.css
git commit -m "Remove the old emerald design tokens and dead .link-btn/.charts-grid/.app-footer classes from index.css"
```

---

### Task 6: Final whole-app QA

**Files:** none (verification only).

- [ ] **Step 1: Build and lint**

```bash
npm run build && npm run lint
```
Both must be clean (the one pre-existing unrelated `useExpenseData.js` unicorn warning is fine and predates this entire redesign — it is not part of this phase's scope).

- [ ] **Step 2: Full click-through** (via `npm run dev`, or trace-by-hand against the compiled output if no browser tool is available — same rigor as every prior phase)

- Sign out (or use an incognito/second session) and confirm the sign-in screen renders correctly in Procura navy/blue, not the old emerald look.
- Sign in, confirm the loading spinner (if visible) is Procura-styled.
- Visit all 6 routes (`/`, `/expenses`, `/budgets`, `/analytics`, `/categories`, `/settings`) directly by URL and via the sidebar — confirm every one renders (no missing-import crash from a deleted file).
- Toggle dark/light theme from Settings — confirm the sign-in screen (visit it once signed out again) and every page still look correct in both themes.
- Open a native `<select>` (the sort dropdown on `/expenses`, or the currency picker on `/settings`) and confirm its dropdown popup renders with dark-card styling, not browser-default white-on-white (this is exactly the regression Task 4 was written to prevent).
- Hover (don't focus) any text input — confirm the hover border is a subtle Procura gray/blue, not emerald green.

- [ ] **Step 3: Confirm the repo is fully clean of the old system**

```bash
grep -rn "bg-surface\b\|text-text\b\|text-muted\b\|rounded-card\b\|rounded-pill\b\|shadow-soft\b" src/ --include="*.jsx"
```
Expected: no matches anywhere in the entire `src/` tree.

- [ ] **Step 4: Merge into `main`, push**

Per the established phase-by-phase operating mode, this is the last phase of the Procura redesign — after this merges and pushes, report completion to the user summarizing the whole 9-phase migration, rather than pausing to ask about a "next phase" that doesn't exist.
