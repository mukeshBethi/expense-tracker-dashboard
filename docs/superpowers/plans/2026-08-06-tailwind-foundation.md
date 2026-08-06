# Tailwind Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Tailwind v4 tooling and a design-token layer mapped to the app's existing CSS custom properties, with zero visual change and zero changes to any component or hook — the pure foundation for the follow-up dashboard redesign phases.

**Architecture:** `@tailwindcss/vite` plugin registered in `vite.config.js`; Tailwind's CSS-first config (`@import`, `@theme`, `@custom-variant`) added at the top of `src/index.css`, above all existing rules, which remain untouched.

**Tech Stack:** Tailwind CSS v4, `@tailwindcss/vite`. No `tailwind.config.js`, no PostCSS config, no new UI/animation libraries.

## Global Constraints

- No component `.jsx` file changes except a temporary, self-removed scratch verification element (spec: Scope / Verification).
- No changes to `useTheme.js` or any hook/data logic (spec: Approach — dark mode).
- Tailwind color tokens must reference the existing CSS custom properties via `var(--...)`, not new hardcoded hex values (spec: Approach — tokens).
- `dark:` variant must activate under the existing `[data-theme="dark"]` attribute on `<html>`, not Tailwind's default `.dark` class or `prefers-color-scheme` (spec: Approach — dark mode).

---

### Task 1: Tailwind v4 tooling + design tokens

**Files:**
- Modify: `package.json` (new devDependencies)
- Modify: `vite.config.js`
- Modify: `src/index.css` (new content prepended; existing rules unchanged below it)
- Modify (temporarily, for verification only — revert before final commit): `src/App.jsx`

**Interfaces:**
- Produces: Tailwind utility classes (e.g. `hidden`, `bg-primary`, `dark:bg-primary`) usable in any component starting with the next phase. No function signatures change.

- [ ] **Step 1: Install Tailwind v4 and its Vite plugin**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Register the plugin in `vite.config.js`**

Read the current `vite.config.js` first (it has the existing `@vitejs/plugin-react` setup — add to the `plugins` array, don't replace it). Add:

```js
import tailwindcss from "@tailwindcss/vite";
```

and add `tailwindcss()` to the `plugins: [...]` array alongside the existing `react()` plugin call.

- [ ] **Step 3: Add Tailwind's CSS-first config to the top of `src/index.css`**

Insert this block as the very first lines of the file, before the existing `:root { ... }` block:

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme {
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
}
```

Do not modify anything else in `src/index.css` — the existing `:root` / `:root[data-theme="light"]` blocks and every rule below stay exactly as they are.

- [ ] **Step 4: Verify Tailwind is actually generating and applying utility classes**

Temporarily add a throwaway element to `src/App.jsx`'s signed-in render output, e.g. right after the opening `<div>` in the final `return`:

```jsx
<div id="tailwind-smoke-test" className="hidden bg-primary text-white p-4">
  Tailwind smoke test — should never be visible
</div>
```

Run `npm run dev`, open the app (sign in), and in browser devtools confirm: (a) the element exists in the DOM with `display: none` from the `hidden` utility (proving Tailwind's base utilities compiled), and (b) temporarily removing `hidden` in devtools (do not edit the file for this check) shows the element with the emerald primary-color background (proving the `@theme` token mapping resolved `bg-primary` to the actual `--primary` CSS variable's value, not a fallback/unstyled state). If you don't have browser devtools access, instead inspect the built CSS output (`npm run build`, then check `dist/assets/*.css` for compiled `.hidden` and `.bg-primary` rules referencing `var(--primary)`) and state clearly in your report that this was verified via build output inspection, not live devtools.

- [ ] **Step 5: Verify dark mode variant wiring without touching `useTheme.js`**

Still with the temporary test element from Step 4, change its className to `className="block bg-white dark:bg-primary p-4"` temporarily. In the running app, use the existing theme toggle (in the header) to switch to dark mode, and confirm via devtools (or build-output inspection, same fallback as Step 4) that the element's background changes — proving `dark:` activates from the app's real theme toggle (which sets `data-theme="dark"` on `<html>`), not from Tailwind's default class-based or media-query dark mode.

- [ ] **Step 6: Remove the temporary test element and verify the build is otherwise unchanged**

Delete the `#tailwind-smoke-test` div from `src/App.jsx` entirely — `git diff src/App.jsx` must show zero changes before committing. Run `npm run build` and `npm run lint`; both must succeed with no new errors (the existing pre-known chunk-size advisory and the one pre-existing lint warning in `useExpenseData.js` are expected and not new).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.js src/index.css
git commit -m "Add Tailwind v4 tooling and design tokens mapped to existing CSS variables"
```
