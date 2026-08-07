# Procura Redesign — Phase 2: More Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the remaining Procura component primitives (KpiCard, StatCard, ProgressBar, Switch, Modal, Alert, a Procura-styled Toast, DataTable with selection/pagination, and restyled chart wrappers). None of these are wired into any page yet — that starts in Phase 3. Every component is new; nothing existing is modified except possibly `src/index.css` if a new token mapping is needed.

**Architecture:** All new primitives live in `src/components/ui/`, alongside Phase 1's Button/Input/Select/IconButton, using only `pr-*` tokens already established. Charts continue using `react-chartjs-2`/`chart.js` (already installed) — new wrapper components, not modifications to the existing `CategoryChart.jsx`/`TrendChart.jsx` (those stay serving `DashboardPage` unchanged until Phase 3 replaces that page).

**Tech Stack:** `react-chartjs-2`/`chart.js` (already installed), `lucide-react` (already installed). No new dependencies.

## Global Constraints

- No existing component, hook, or page is modified in this phase (verify via `git diff --stat` before committing each task — only new files under `src/components/ui/` should appear, plus `src/index.css` only if a genuinely new token mapping is required).
- Every interactive element (buttons, switches, table rows if clickable, modal close button) gets `cursor-pointer` explicitly — this project's established convention, since Tailwind Preflight resets buttons to `cursor: default`.
- DataTable pagination is real (client-side slicing), not decorative.
- Verify every new `pr-*` Tailwind class compiles by checking `dist/assets/*.css` after a scratch-mount build, same pattern as Phase 1.

---

### Task 1: KpiCard and StatCard

**Files:**
- Create: `src/components/ui/KpiCard.jsx`, `src/components/ui/StatCard.jsx`, `src/components/ui/Sparkline.jsx`.

**Interfaces:**
- `KpiCard({ label, value, delta, trend, icon: Icon, accentClass })` — `trend` is `"up" | "down" | undefined`; `accentClass` is a Tailwind color class for the icon (e.g. `"text-pr-accent"`) so callers control the per-card accent color without needing arbitrary inline styles.
- `StatCard({ label, value, delta, trend, spark, accentClass })` — same as `KpiCard` plus a `spark: number[]` array rendered via `Sparkline`.
- `Sparkline({ data, className })` — a minimal inline SVG line, no charting library overhead for something this small.

- [ ] **Step 1: Write `src/components/ui/Sparkline.jsx`**

```jsx
export default function Sparkline({ data, className = "" }) {
  if (!data || data.length < 2) return null;
  const width = 100, height = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-7 ${className}`} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
```

- [ ] **Step 2: Write `src/components/ui/KpiCard.jsx`**

```jsx
import { ArrowUp, ArrowDown } from "lucide-react";

export default function KpiCard({ label, value, delta, trend, icon: Icon, accentClass = "text-pr-accent" }) {
  return (
    <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        {Icon && <Icon size={18} className={accentClass} />}
        {delta && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trend === "down" ? "text-pr-success" : trend === "up" ? "text-pr-danger" : "text-pr-secondary"}`}>
            {trend === "up" && <ArrowUp size={12} />}
            {trend === "down" && <ArrowDown size={12} />}
            {delta}
          </span>
        )}
      </div>
      <span className="text-2xl font-semibold text-pr-primary tabular-nums font-mono truncate">{value}</span>
      <span className="text-sm text-pr-secondary">{label}</span>
    </div>
  );
}
```

Note: `trend === "down"` maps to `text-pr-success` (green) — matching this app's existing "less spending is good" semantics established for the emerald dashboard's delta badge (Phase 2 of the earlier redesign), not a generic "up=good" revenue-dashboard convention. Keep this consistent.

- [ ] **Step 3: Write `src/components/ui/StatCard.jsx`**

```jsx
import { ArrowUp, ArrowDown } from "lucide-react";
import Sparkline from "./Sparkline.jsx";

export default function StatCard({ label, value, delta, trend, spark, accentClass = "text-pr-accent" }) {
  return (
    <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-semibold text-pr-primary tabular-nums font-mono truncate">{value}</span>
        {delta && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold flex-shrink-0 ${trend === "down" ? "text-pr-success" : trend === "up" ? "text-pr-danger" : "text-pr-secondary"}`}>
            {trend === "up" && <ArrowUp size={12} />}
            {trend === "down" && <ArrowDown size={12} />}
            {delta}
          </span>
        )}
      </div>
      <span className="text-sm text-pr-secondary">{label}</span>
      {spark && <Sparkline data={spark} className={accentClass} />}
    </div>
  );
}
```

- [ ] **Step 4: Verify and commit**

Scratch-mount both (temporarily, in `App.jsx`, removed before commit) with representative props including a `spark` array like `[3,5,2,8,6,9,7]`. Run `npm run build`, confirm no errors, confirm `git diff src/App.jsx` is empty after removing the scratch code.

```bash
npm run build && npm run lint
git add src/components/ui/KpiCard.jsx src/components/ui/StatCard.jsx src/components/ui/Sparkline.jsx
git commit -m "Add KpiCard, StatCard, and Sparkline primitives"
```

---

### Task 2: ProgressBar and Switch

**Files:**
- Create: `src/components/ui/ProgressBar.jsx`, `src/components/ui/Switch.jsx`.

**Interfaces:**
- `ProgressBar({ label, value, tone, showValue })` — `value` is 0-100, `tone` is `"success" | "warning" | "danger"` controlling the fill color.
- `Switch({ checked, onChange, defaultChecked })` — a controlled or uncontrolled toggle (support both, matching the prototype's mix of `checked`+`onChange` and bare `default-checked` usages).

- [ ] **Step 1: Write `src/components/ui/ProgressBar.jsx`**

```jsx
const TONE_CLASS = {
  success: "bg-pr-success",
  warning: "bg-pr-warning",
  danger: "bg-pr-danger",
};

export default function ProgressBar({ label, value, tone = "success", showValue = false }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-pr-primary truncate">{label}</span>
        {showValue && <span className="text-xs font-medium text-pr-secondary flex-shrink-0">{pct}%</span>}
      </div>
      <div className="h-1.5 rounded-pr-pill bg-pr-subtle overflow-hidden">
        <div className={`h-full rounded-pr-pill transition-all ${TONE_CLASS[tone] || TONE_CLASS.success}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/ui/Switch.jsx`**

```jsx
import { useState } from "react";

export default function Switch({ checked, onChange, defaultChecked = false }) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const value = isControlled ? checked : internalChecked;

  function toggle() {
    const next = !value;
    if (isControlled) onChange?.(next);
    else setInternalChecked(next);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={toggle}
      className={`relative inline-flex w-11 h-6 rounded-pr-pill transition-colors cursor-pointer ${value ? "bg-pr-accent" : "bg-pr-border-strong"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}
```

Note: `bg-pr-border-strong` must already be mapped in `@theme` (it should be, from Phase 1's `--color-pr-border-strong`) — verify via the compiled-CSS check in Step 3, don't assume.

- [ ] **Step 3: Verify and commit**

Scratch-mount both with representative props (a controlled `Switch` with local `useState` in the scratch code, and an uncontrolled one with just `defaultChecked`). Confirm clicking toggles visually (if you have any way to check — otherwise trace the logic by hand: `toggle()` correctly flips `value` and calls `onChange` only when controlled). Remove scratch code before committing.

```bash
npm run build && npm run lint
git add src/components/ui/ProgressBar.jsx src/components/ui/Switch.jsx
git commit -m "Add ProgressBar and Switch primitives"
```

---

### Task 3: Modal and Alert

**Files:**
- Create: `src/components/ui/Modal.jsx`, `src/components/ui/Alert.jsx`.

**Interfaces:**
- `Modal({ open, title, onClose, footer, children, width })` — `width` is an optional max-width in px (default 480); `footer` is a rendered React node (buttons row), `children` is the body content. Closes on Escape key and on backdrop click (a real UX improvement over this project's existing `ConfirmDialog`, which a prior review flagged as missing this — build it correctly from the start here).
- `Alert({ tone, title, children })` — `tone` is `"warning" | "danger" | "info" | "success"`, `children` is the description text.

- [ ] **Step 1: Write `src/components/ui/Modal.jsx`**

```jsx
import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, onClose, footer, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(evt) {
      if (evt.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }} className="w-full bg-pr-card rounded-pr-modal shadow-pr-lg">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-pr-border-subtle">
          <h3 className="text-base font-semibold text-pr-primary">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-pr-default text-pr-secondary hover:bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-pr-border-subtle">{footer}</div>}
      </div>
    </div>
  );
}
```

Note: unlike this project's existing `ConfirmDialog.jsx` (a prior final review flagged it as missing `role="dialog"`/Escape-to-close/backdrop-click-to-close as a deferred, non-blocking gap) — `Modal` gets all three correctly from the start, since it's new. This does NOT mean go back and fix `ConfirmDialog.jsx` in this task — that component is untouched in this phase; only `Modal.jsx` is new and correct.

- [ ] **Step 2: Write `src/components/ui/Alert.jsx`**

```jsx
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

const TONE = {
  warning: { icon: AlertTriangle, bg: "bg-pr-warning-soft", text: "text-pr-warning" },
  danger: { icon: AlertCircle, bg: "bg-pr-danger-soft", text: "text-pr-danger" },
  info: { icon: Info, bg: "bg-pr-subtle", text: "text-pr-accent" },
  success: { icon: CheckCircle, bg: "bg-pr-success-soft", text: "text-pr-success" },
};

export default function Alert({ tone = "info", title, children }) {
  const { icon: Icon, bg, text } = TONE[tone] || TONE.info;
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-pr-default ${bg}`}>
      <Icon size={18} className={`${text} flex-shrink-0 mt-0.5`} />
      <div className="flex flex-col gap-0.5 min-w-0">
        {title && <span className={`text-sm font-semibold ${text}`}>{title}</span>}
        {children && <span className="text-sm text-pr-secondary">{children}</span>}
      </div>
    </div>
  );
}
```

Note: `text-pr-success` needs to already be mapped — Phase 1 mapped `--color-pr-success` but check whether it mapped a TEXT-usable alias or only `--color-pr-success-soft`/`--color-pr-success-text`. If `text-pr-success` doesn't compile, use `text-pr-success-text` instead (the AA-contrast-safe text variant Phase 1 actually defined) — verify via the compiled-CSS check, don't guess.

- [ ] **Step 3: Verify and commit**

Scratch-mount `Modal` with `open=true` temporarily to visually/structurally verify it renders (title, close button, body, footer), and all 4 `Alert` tones. Confirm Escape-key and backdrop-click handlers are wired (trace by hand if no browser: `onMouseDown` checks `e.target === e.currentTarget`, which is true only for the backdrop itself, not the modal card — correct). Remove scratch code before committing.

```bash
npm run build && npm run lint
git add src/components/ui/Modal.jsx src/components/ui/Alert.jsx
git commit -m "Add Modal and Alert primitives"
```

---

### Task 4: Procura-styled Toast

**Files:**
- Create: `src/components/ui/Toast.jsx` (new — this does NOT replace or modify the existing `src/components/Toast.jsx`, which stays serving `DashboardPage` unchanged until Phase 3).

**Interfaces:**
- `Toast({ tone, title, description, onClose })` — `tone` is `"success" | "danger" | "info" | "warning"`. Unlike the existing simple `Toast.jsx` (message-only, self-dismisses via its own internal timer), this version takes structured tone/title/description and an explicit `onClose` — the AUTO-DISMISS TIMER LOGIC stays with whatever calls this component (Phase 3+ decides how it's driven), this component itself is presentational only, matching the prototype's `ProcuraDesignSystem_0d5903.Toast` usage (`tone`, `title`, `description`, `onClose` props, no built-in timer of its own visible in the prototype's usage).

- [ ] **Step 1: Write `src/components/ui/Toast.jsx`**

```jsx
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const TONE = {
  success: { icon: CheckCircle, text: "text-pr-success" },
  danger: { icon: AlertCircle, text: "text-pr-danger" },
  info: { icon: Info, text: "text-pr-accent" },
  warning: { icon: AlertTriangle, text: "text-pr-warning" },
};

export default function Toast({ tone = "success", title, description, onClose }) {
  const { icon: Icon, text } = TONE[tone] || TONE.success;
  return (
    <div role="status" className="flex items-start gap-3 w-full max-w-sm bg-pr-card shadow-pr-lg rounded-pr-card p-4">
      <Icon size={18} className={`${text} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {title && <span className="text-sm font-semibold text-pr-primary">{title}</span>}
        {description && <span className="text-sm text-pr-secondary">{description}</span>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="w-6 h-6 flex items-center justify-center rounded-pr-default text-pr-tertiary hover:text-pr-primary transition-colors cursor-pointer flex-shrink-0">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify and commit**

Scratch-mount all 4 tones temporarily, confirm each renders the right icon/color, remove scratch code before committing.

```bash
npm run build && npm run lint
git add src/components/ui/Toast.jsx
git commit -m "Add Procura-styled Toast primitive (new, does not replace the existing Toast.jsx)"
```

---

### Task 5: DataTable with selection and pagination

**Files:**
- Create: `src/components/ui/DataTable.jsx`.

**Interfaces:**
- `DataTable({ columns, rows, selectable, rowsPerPage, resultLabel, selectionBar })` —
  - `columns: Array<{ key: string, label: string, width?: number, align?: "left"|"right", render?: (row) => ReactNode, strong?: boolean }>`
  - `rows: any[]` — already filtered/sorted by the caller (this component does NOT filter or sort, only paginates and optionally selects).
  - `selectable: boolean` — adds a checkbox column.
  - `rowsPerPage: number` — real client-side pagination.
  - `resultLabel: string` — text shown above/below the table (e.g. "Showing 6 of 20 entries").
  - `selectionBar: (selectedIds, clearSelection) => ReactNode` — rendered in place of the normal toolbar area when 1+ rows are selected (matches the prototype's `selection-bar` prop, a render-prop function).

- [ ] **Step 1: Write `src/components/ui/DataTable.jsx`**

```jsx
import { useState, useMemo } from "react";

export default function DataTable({ columns, rows, selectable = false, rowsPerPage = 10, resultLabel, selectionBar }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const pageRows = useMemo(() => rows.slice(page * rowsPerPage, (page + 1) * rowsPerPage), [rows, page, rowsPerPage]);

  function toggleRow(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected = pageRows.every(r => next.has(r.id));
      pageRows.forEach(r => { if (allSelected) next.delete(r.id); else next.add(r.id); });
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && selectionBar ? (
        selectionBar(Array.from(selected), clearSelection)
      ) : (
        resultLabel && <p className="text-xs text-pr-secondary px-1">{resultLabel}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pr-border-subtle">
              {selectable && (
                <th className="w-10 px-2 py-2.5">
                  <input type="checkbox" checked={pageRows.length > 0 && pageRows.every(r => selected.has(r.id))} onChange={toggleAllOnPage} className="cursor-pointer" />
                </th>
              )}
              {columns.map(col => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined} className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-pr-tertiary ${col.align === "right" ? "text-right" : "text-left"}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={row.id ?? i} className={`${i % 2 === 1 ? "bg-pr-subtle/40" : ""} hover:bg-pr-subtle transition-colors`}>
                {selectable && (
                  <td className="w-10 px-2 py-2.5">
                    <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="cursor-pointer" />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className={`px-3 py-2.5 ${col.align === "right" ? "text-right" : ""} ${col.strong ? "font-medium text-pr-primary" : "text-pr-secondary"}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-pr-tertiary">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 rounded-pr-default text-xs font-medium text-pr-primary bg-pr-subtle hover:bg-pr-border-default disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">Previous</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 rounded-pr-default text-xs font-medium text-pr-primary bg-pr-subtle hover:bg-pr-border-default disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

Note: when `rows` changes (e.g. the caller applies a new filter), `page` is NOT automatically reset to 0 in this implementation — if the caller filters down to fewer rows than the current page offset, `pageRows` would correctly become an empty slice (², `.slice()` on an out-of-range start just returns `[]`, no crash), but the user would see an empty table with pagination still showing a stale page number. This is a real, worth-fixing UX gap: add a `useEffect` that resets `page` to 0 whenever `rows` changes size in a way that makes the current page invalid (e.g. `if (page > 0 && page * rowsPerPage >= rows.length) setPage(0);` — implement this as a `useEffect` watching `rows.length`, don't skip it).

- [ ] **Step 2: Add the page-reset effect**

Add near the top of the component body, after the `useState` calls:

```jsx
import { useState, useMemo, useEffect } from "react";
```
```jsx
useEffect(() => {
  if (page > 0 && page * rowsPerPage >= rows.length) setPage(0);
}, [rows.length, page, rowsPerPage]);
```

- [ ] **Step 3: Verify and commit**

Scratch-mount with representative columns/rows (5-6 fake expense-like rows), `selectable=true`, `rowsPerPage=3` (so pagination actually activates with test data), and a simple `selectionBar` function. Trace by hand: selecting a row shows the selection bar instead of `resultLabel`; clicking "Next"/"Previous" changes `pageRows`; changing the fake `rows` array to fewer items than the current page offset resets to page 0 (verify this specific edge case by hand since it's the exact bug Step 1's note flagged). Remove scratch code before committing.

```bash
npm run build && npm run lint
git add src/components/ui/DataTable.jsx
git commit -m "Add DataTable primitive with selection and real client-side pagination"
```

---

### Task 6: Restyled chart wrappers (LineChart, PieChart, BarChart)

**Files:**
- Create: `src/components/ui/LineChart.jsx`, `src/components/ui/PieChart.jsx`, `src/components/ui/BarChart.jsx`.

**Interfaces:**
- `LineChart({ series, xLabels, height, theme })` — `series: Array<{ label: string, color: string, points: number[] }>` (supports multiple lines, matching the prototype's `series` array shape), gradient fill under the FIRST series only (matching the existing `TrendChart.jsx`'s single-series gradient pattern from the earlier redesign — don't over-build multi-series gradients if the data this app actually has is single-series in practice).
- `PieChart({ data, size, theme })` — `data: Array<{ label: string, value: number, color: string }>`.
- `BarChart({ data, height, theme })` — `data: Array<{ label: string, value: number, color: string }>`.
- All three accept `theme: "light" | "dark"` for tooltip/gridline/legend text color, following the EXACT theme-aware-chart-text pattern already established and reviewed in this project's `CategoryChart.jsx`/`TrendChart.jsx` (same `textColor = theme === "light" ? "#475569" : "#cbd5e1"` values) — reuse that exact pattern, don't invent new colors.

- [ ] **Step 1: Write `src/components/ui/LineChart.jsx`**

```jsx
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

function gradientFill(ctx, chartArea, color) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, `${color}59`);
  gradient.addColorStop(1, `${color}00`);
  return gradient;
}

export default function LineChart({ series, xLabels, height = 240, theme = "dark" }) {
  const textColor = theme === "light" ? "#475569" : "#cbd5e1";
  const gridColor = theme === "light" ? "rgba(100, 116, 139, 0.35)" : "rgba(148, 163, 184, 0.12)";

  return (
    <div style={{ height }} className="relative">
      <Line
        data={{
          labels: xLabels,
          datasets: series.map((s, i) => ({
            label: s.label,
            data: s.points,
            borderColor: s.color,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.35,
            fill: i === 0,
            backgroundColor: i === 0 ? (context) => {
              const { ctx, chartArea } = context.chart;
              if (!chartArea) return "transparent";
              return gradientFill(ctx, chartArea, s.color);
            } : undefined,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: series.length > 1, labels: { color: textColor, font: { size: 11 } } },
            tooltip: { backgroundColor: "#1a1e25", padding: 10, cornerRadius: 8, titleFont: { size: 12, weight: "600" }, bodyFont: { size: 12 } },
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          },
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/ui/PieChart.jsx`**

```jsx
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data, size = 200, theme = "dark" }) {
  const textColor = theme === "light" ? "#475569" : "#cbd5e1";
  return (
    <div style={{ height: size }} className="relative">
      <Doughnut
        data={{
          labels: data.map(d => d.label),
          datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => d.color), borderWidth: 0 }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 11 } } },
            tooltip: { backgroundColor: "#1a1e25", padding: 10, cornerRadius: 8, titleFont: { size: 12, weight: "600" }, bodyFont: { size: 12 } },
          },
          cutout: "62%",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/ui/BarChart.jsx`**

```jsx
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function BarChart({ data, height = 220, theme = "dark" }) {
  const textColor = theme === "light" ? "#475569" : "#cbd5e1";
  const gridColor = theme === "light" ? "rgba(100, 116, 139, 0.35)" : "rgba(148, 163, 184, 0.12)";
  return (
    <div style={{ height }} className="relative">
      <Bar
        data={{
          labels: data.map(d => d.label),
          datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => d.color), borderRadius: 6, maxBarThickness: 40 }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: "#1a1e25", padding: 10, cornerRadius: 8, titleFont: { size: 12, weight: "600" }, bodyFont: { size: 12 } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          },
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify chart.js registration correctness**

Same rigor this project has applied every time a chart component was added: independently check (don't assume) that `LineController`/`DoughnutController`/`BarController` self-register via `react-chartjs-2`'s `createTypedChart` (read `node_modules/react-chartjs-2/dist/index.js` directly to confirm, the same way earlier phases of this project verified this), and that `Filler` is genuinely required for `fill: true` (it is — `LineChart` uses `fill: true` on the first series).

- [ ] **Step 5: Verify and commit**

Scratch-mount all three with representative fake data (2-3 categories/points each), confirm `npm run build` succeeds with no chart.js registration errors surfaced at runtime if you have any way to check (no browser tool is expected — code-tracing plus the registration check in Step 4 is the verification bar, same as every prior chart task in this project). Remove scratch code before committing.

```bash
npm run build && npm run lint
git add src/components/ui/LineChart.jsx src/components/ui/PieChart.jsx src/components/ui/BarChart.jsx
git commit -m "Add restyled LineChart, PieChart, BarChart wrappers"
```
