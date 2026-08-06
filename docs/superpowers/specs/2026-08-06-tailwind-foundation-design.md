# Tailwind Foundation (Phase 1 of the Premium Dashboard Redesign)

## Context

The user asked for a "premium SaaS" redesign of the dashboard (stat cards, charts, layout) matching apps like Linear/Vercel/Stripe, written against a Tailwind CSS assumption this project doesn't currently meet — the app is plain React with hand-written CSS custom properties in `src/index.css`. The user chose to adopt Tailwind fully (not just for the dashboard), and to phase the work: **Phase 1** (this spec) is pure tooling/token setup with zero visual change, so it can be verified in isolation before any component is restyled. Phase 2 (dashboard redesign) and Phase 3 (rest-of-app migration) are separate specs to follow.

## Approach

**Tailwind v4 via `@tailwindcss/vite`** — the current recommended integration for Vite projects. No `tailwind.config.js`/PostCSS config needed; Tailwind v4 is configured in CSS itself via `@import` and `@theme` directives inside `src/index.css`.

**Dark mode stays wired to the existing mechanism.** `useTheme.js` already sets `document.documentElement.dataset.theme = "dark" | "light"`, persisted to Firestore + a `localStorage` fallback. Tailwind's `dark:` variant will be redefined via `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` so it activates under that same attribute — no changes to `useTheme.js`, no new theme-switching logic.

**Tokens map to existing CSS variables, not new hardcoded values.** Tailwind v4's `@theme` block will define entries like `--color-primary: var(--primary);`, `--color-border: var(--border);`, etc., pointing at the custom properties already defined in `:root` / `:root[data-theme="light"]`. This keeps exactly one source of truth for colors — both the legacy hand-written CSS rules and any new Tailwind utility classes (`bg-primary`, `border-border`, etc.) resolve to the same value and update together when the theme variables are edited (e.g. in Phase 2's "elevate the palette" work).

## Scope

**Changes:**
- `package.json` — add `tailwindcss` and `@tailwindcss/vite` as dev dependencies.
- `vite.config.js` — register the `@tailwindcss/vite` plugin.
- `src/index.css` — add, near the top (before the existing `:root` blocks):
  - `@import "tailwindcss";`
  - `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));`
  - An `@theme` block mapping token names to `var(--...)` references for at least: `--color-bg`, `--color-text`, `--color-muted`, `--color-primary`, `--color-primary-light`, `--color-primary-text`, `--color-danger`, `--color-warn`, `--color-border`, `--color-border-dim`.

**Explicitly out of scope for this phase:** no component `className` changes, no new visual behavior, no new npm UI dependencies beyond Tailwind itself, no changes to `useTheme.js` or any hook/data logic.

## Verification

1. `npm run build` succeeds with no errors, and the built app is visually unchanged (no component markup touched).
2. A temporary scratch element with a Tailwind-only class (e.g. `className="hidden"` on a throwaway `<div>` in `App.jsx`, removed before the final commit) is used during implementation to confirm Tailwind is actually generating/applying utility classes — not just that the build doesn't error.
3. `npm run dev`: toggle light/dark in the running app and confirm nothing about the toggle's existing behavior changed (still persists via Firestore/localStorage as before) — this phase must not touch that code path at all.
