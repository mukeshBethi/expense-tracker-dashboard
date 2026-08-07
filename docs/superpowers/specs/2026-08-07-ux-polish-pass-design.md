# UX Polish Pass (Phase A of pre-deployment QA)

## Context

Pre-deployment UI/UX review request covering: mobile responsiveness at specific breakpoints, searchable category dropdowns, proactive amount-digit-limiting, cursor consistency, and a real favicon. This is Phase A of three (Phase B = micro-interactions/animations, Phase C = onboarding tour — separate specs). Everything here is UX-only — no validation rules, data shapes, or business logic change; digit-limiting becomes proactive instead of reactive, but the underlying rule (max 10 integer digits) is unchanged.

## Decisions

**Cursor consistency root cause**: Tailwind's Preflight reset sets `<button>` elements to `cursor: default` (this is normal browser/reset behavior — only `<a href>` gets `pointer` for free). Every native `<button>` in this app needs an explicit `cursor-pointer` class. This is why the request calls out theme toggle, export, sign out, edit/delete, etc. — literally every button in the app is affected, not a handful.

**Favicon**: replace the default Vite-placeholder `public/favicon.svg` with a small SVG reusing the app's own brand mark (solid emerald square, white "$"), plus a `theme-color` meta tag pair (`media="(prefers-color-scheme: light)"` / `dark`) so the browser's own chrome (address bar tint on mobile, etc.) matches. Scope note: generating additional raster formats (apple-touch-icon PNG, multi-size .ico) isn't achievable without image-generation tooling this session doesn't have — the SVG favicon covers all modern browsers, which is the overwhelming majority of real traffic; call this out as a known limitation rather than silently skipping it.

**Amount digit-limiting**: `src/lib/format.js`'s `formatAmountInput` gets a hard cap — once the integer part reaches 10 digits, additional typed digits are silently ignored (not appended, not erroring) rather than relying on `validateAmount`'s existing post-hoc error message. `validateAmount` itself is untouched (still the source of truth if a value somehow arrives some other way, e.g. an edited expense with a pre-existing over-limit value — extremely unlikely given the same cap has existed since the field's introduction, but validation stays as the backstop). Apply the same input-side cap to `BudgetList.jsx`'s two numeric budget inputs (per the request's "review the entire application for similar opportunities").

**Searchable category dropdown**: new reusable `src/components/Combobox.jsx` — a text input that shows a filtered, click-to-select dropdown list instead of a native `<select>`. Replaces the category picker in `ExpenseForm.jsx` and the category-filter dropdown in `App.jsx`'s Expenses toolbar (the two places users choose from the category list). Does NOT replace the currency `<select>` (4 fixed options, no search need) or the mobile card-list markup (unaffected). Filtering is case-insensitive substring match, updates on every keystroke, and the currently-selected value is always shown as the input's value when closed. Supports basic keyboard interaction (Arrow Up/Down to move highlight, Enter to select, Escape to close) and closes on blur/outside click, with `role="combobox"`/`aria-expanded`/`aria-controls` for accessibility.

**Mobile responsiveness audit**: reasoned against Tailwind's actual compiled breakpoints (`sm`=640, `md`=768, `lg`=1024, `xl`=1280) at the specific pixel widths requested (320, 375, 390, 414, 768), the same method that caught the real overflow bug in the previous phase's final review — not a literal device-lab pass, since no browser tool is available this session. Any overflow/cramping found gets fixed as part of this same plan.

## Scope (files)

- `public/favicon.svg` (replaced), `index.html` (theme-color meta tags added).
- Every `.jsx` file with a `<button>` element gets `cursor-pointer` added to its className (App.jsx, AuthScreen.jsx, CategoryManager.jsx, ConfirmDialog.jsx, ExpenseForm.jsx, ExpenseTable.jsx, Header.jsx — verified via grep, not assumption).
- `src/lib/format.js` (`formatAmountInput` digit cap).
- `src/components/ExpenseForm.jsx`, `src/components/BudgetList.jsx` (benefit from the format.js change automatically since both already call `formatAmountInput` — verify this, don't assume).
- New: `src/components/Combobox.jsx`.
- `src/components/ExpenseForm.jsx` (category picker → `Combobox`), `src/App.jsx` (category-filter → `Combobox`).
- Mobile audit: any file where a real issue is found (can't be enumerated in advance — that's the point of an audit).

## Verification

- `npm run build`/`npm run lint` clean after every task.
- Manual trace: typing an 11th digit into the amount field does nothing (cursor stays, no new character appears) rather than showing an error after the fact; the category Combobox filters as you type and lets you select via click or keyboard; every button visibly uses a hand cursor on hover (verify via reading, since no browser — confirm the class is present, not just "should work").
- Full click-through re-run (same as prior phases) to confirm zero functional regressions from the Combobox swap — `category`/`setCategory` and the filter's `filterCategory`/`setFilterCategory` state must behave identically to the native selects they replace.
