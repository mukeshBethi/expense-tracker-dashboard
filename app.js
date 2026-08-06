/* =========================================================================
   Expense Tracker — Firebase Auth + Firestore edition
   ========================================================================= */

import {
  auth, db,
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  doc, getDoc, setDoc,
} from "./firebase-config.js";

// ─── App constants ────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  "Food", "Rent", "Transport", "Utilities",
  "Entertainment", "Health", "Shopping", "Other",
];

const PALETTE = [
  "#6c8cff", "#34d399", "#fbbf24", "#f87171",
  "#a78bfa", "#22d3ee", "#fb923c", "#f472b6",
  "#4ade80", "#60a5fa", "#facc15", "#c084fc",
];

// ─── App state ────────────────────────────────────────────────────────────────
let state = {
  expenses:   [],
  budgets:    {},
  categories: [...DEFAULT_CATEGORIES],
  settings:   { currency: "$" },
};

let sort = { key: "date", dir: "desc" };
let currentUid = null;

// ─── Firestore data layer ──────────────────────────────────────────────────────
// Everything for a user lives in a single doc: users/{uid}
function userDocRef() {
  return doc(db, "users", currentUid);
}

async function loadUserData() {
  const snap = await getDoc(userDocRef());
  const data = snap.exists() ? snap.data() : {};
  state.settings   = data.settings   || { currency: "$" };
  state.categories = Array.isArray(data.categories) && data.categories.length
    ? data.categories : [...DEFAULT_CATEGORIES];
  state.budgets  = data.budgets || {};
  state.expenses = Array.isArray(data.expenses) ? data.expenses : [];
}

function persistExpenses() {
  return setDoc(userDocRef(), { expenses: state.expenses }, { merge: true });
}

function saveUserProfile() {
  return setDoc(userDocRef(), {
    settings:   state.settings,
    categories: state.categories,
    budgets:    state.budgets,
  }, { merge: true });
}

function saveExpense(expense) {
  return persistExpenses();
}

function removeExpenseFromDB(id) {
  return persistExpenses();
}

// ─── Auth UI state helpers ────────────────────────────────────────────────────
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showAuthScreen() { $("#auth-overlay").hidden = false; }
function hideAuthScreen() { $("#auth-overlay").hidden = true;  }

function showMainApp() {
  $(".app-header").hidden = false;
  $("main.layout").hidden = false;
  $(".app-footer").hidden = false;
}
function hideMainApp() {
  $(".app-header").hidden = true;
  $("main.layout").hidden = true;
  $(".app-footer").hidden = true;
}

function updateUserDisplay(email) {
  const section = $("#user-section");
  if (section) section.hidden = false;
  const avatar  = $("#user-avatar");
  if (avatar) avatar.textContent = (email || "?").charAt(0).toUpperCase();
  const label   = $("#user-email-display");
  if (label) label.textContent = email || "";
}

function setAuthError(message) {
  const box = $("#auth-error");
  if (!box) return;
  box.hidden = !message;
  box.textContent = message || "";
}

function setAuthMode(mode) {
  authMode = mode;
  $("#auth-tab-signin").classList.toggle("active", mode === "signin");
  $("#auth-tab-signup").classList.toggle("active", mode === "signup");
  $("#auth-submit-btn").textContent = mode === "signin" ? "Sign In" : "Create Account";
  $("#auth-password").setAttribute("autocomplete", mode === "signin" ? "current-password" : "new-password");
  setAuthError("");
}

// ─── Auth handlers ────────────────────────────────────────────────────────────
let authMode = "signin";

async function handleAuthSubmit(evt) {
  evt.preventDefault();
  const email    = $("#auth-email").value.trim();
  const password = $("#auth-password").value;
  const btn      = $("#auth-submit-btn");

  setAuthError("");
  btn.disabled = true;
  try {
    if (authMode === "signin") {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    // onAuthStateChanged handles the rest (loading data, showing the app).
  } catch (err) {
    setAuthError(friendlyAuthError(err));
  } finally {
    btn.disabled = false;
  }
}

function friendlyAuthError(err) {
  switch (err.code) {
    case "auth/invalid-email":        return "That email address doesn't look right.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":   return "Incorrect email or password.";
    case "auth/email-already-in-use": return "An account with that email already exists — try signing in instead.";
    case "auth/weak-password":        return "Password must be at least 6 characters.";
    default:                          return "Something went wrong. Please try again.";
  }
}

async function handleAuthStateChanged(user) {
  if (user) {
    currentUid = user.uid;
    await loadUserData();
    hideAuthScreen();
    updateUserDisplay(user.email);
    $("#currency-select").value = state.settings.currency;
    $("#exp-date").value        = todayISO();
    showMainApp();
    render();
  } else {
    currentUid = null;
    state = { expenses: [], budgets: {}, categories: [...DEFAULT_CATEGORIES], settings: { currency: "$" } };
    if (categoryChart) { categoryChart.destroy(); categoryChart = null; }
    if (trendChart)    { trendChart.destroy();    trendChart    = null; }
    hideMainApp();
    $("#auth-form").reset();
    setAuthMode("signin");
    showAuthScreen();
    exitEditMode();
  }
}

function handleSignOut() {
  signOut(auth);
}

// ─── Value helpers ────────────────────────────────────────────────────────────
function colorFor(category) {
  const idx = state.categories.indexOf(category);
  const i = idx >= 0 ? idx : Math.abs(hashStr(category));
  return PALETTE[i % PALETTE.length];
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

function fmtMoney(n) {
  const sign = n < 0 ? "-" : "";
  const abs  = Math.abs(n);
  return `${sign}${state.settings.currency}${abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function monthKey(iso)     { return iso.slice(0, 7); }
function currentMonthKey() { return todayISO().slice(0, 7); }

// ─── Filtering ────────────────────────────────────────────────────────────────
function activeRange() {
  const range = $("#filter-range").value;
  const today = todayISO();
  const [y, m] = today.split("-").map(Number);
  const pad     = n => String(n).padStart(2, "0");
  const lastDay = (yy, mm) => new Date(yy, mm, 0).getDate();

  if (range === "this-month") return { from: `${y}-${pad(m)}-01`,  to: `${y}-${pad(m)}-${pad(lastDay(y, m))}` };
  if (range === "last-month") {
    const lm = m === 1 ? 12 : m - 1, ly = m === 1 ? y - 1 : y;
    return { from: `${ly}-${pad(lm)}-01`, to: `${ly}-${pad(lm)}-${pad(lastDay(ly, lm))}` };
  }
  if (range === "this-year") return { from: `${y}-01-01`, to: `${y}-12-31` };
  if (range === "custom")    return { from: $("#filter-from").value || "0000-01-01", to: $("#filter-to").value || "9999-12-31" };
  return { from: "0000-01-01", to: "9999-12-31" };
}

function getFiltered() {
  const cat    = $("#filter-category").value;
  const search = $("#filter-search").value.trim().toLowerCase();
  const { from, to } = activeRange();

  let rows = state.expenses.filter(e => {
    if (cat && e.category !== cat) return false;
    if (e.date < from || e.date > to) return false;
    if (search && !(e.note || "").toLowerCase().includes(search)) return false;
    return true;
  });

  rows.sort((a, b) => {
    let cmp = sort.key === "amount"
      ? a.amount - b.amount
      : (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
    if (cmp === 0) cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    return sort.dir === "asc" ? cmp : -cmp;
  });

  return rows;
}

// ─── Rendering ────────────────────────────────────────────────────────────────
let categoryChart = null;
let trendChart    = null;

function render() {
  renderCategoryOptions();
  renderCategoryChips();
  renderSummary();
  renderTable();
  renderBudgets();
  renderCharts();
  renderAlertBanner();
}

function renderCategoryOptions() {
  const formSel   = $("#exp-category");
  const prevForm  = formSel.value;
  formSel.innerHTML = state.categories
    .map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (state.categories.includes(prevForm)) formSel.value = prevForm;

  const filterSel  = $("#filter-category");
  const prevFilter = filterSel.value;
  filterSel.innerHTML = `<option value="">All categories</option>` +
    state.categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (prevFilter === "" || state.categories.includes(prevFilter)) filterSel.value = prevFilter;
}

function renderCategoryChips() {
  $("#category-chips").innerHTML = state.categories.map(c => `
    <span class="chip">
      <span class="dot" style="background:${colorFor(c)}"></span>
      ${escapeHtml(c)}
      <button type="button" title="Remove category" data-remove-cat="${escapeHtml(c)}">×</button>
    </span>`).join("");
}

function renderSummary() {
  const monthK     = currentMonthKey();
  const today      = todayISO();
  let monthTotal   = 0, todayTotal = 0;
  const byCatMonth = {};

  for (const e of state.expenses) {
    if (monthKey(e.date) === monthK) {
      monthTotal += e.amount;
      byCatMonth[e.category] = (byCatMonth[e.category] || 0) + e.amount;
    }
    if (e.date === today) todayTotal += e.amount;
  }

  let topCat = "—", topVal = 0;
  for (const [c, v] of Object.entries(byCatMonth)) {
    if (v > topVal) { topVal = v; topCat = c; }
  }

  $("#stat-month").textContent = fmtMoney(monthTotal);
  $("#stat-today").textContent = fmtMoney(todayTotal);
  $("#stat-top").textContent   = topCat;
  $("#stat-top").title         = topCat === "—" ? "" : `${topCat}: ${fmtMoney(topVal)}`;
  $("#stat-count").textContent = String(state.expenses.length);
}

function renderTable() {
  const rows  = getFiltered();
  const tbody = $("#expense-tbody");
  const empty = $("#empty-state");

  // Monthly spend per category (all expenses, not just filtered)
  const monthK     = currentMonthKey();
  const spentByCat = {};
  for (const e of state.expenses) {
    if (monthKey(e.date) === monthK) {
      spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
    }
  }

  if (rows.length === 0) {
    tbody.innerHTML = "";
    empty.hidden    = false;
  } else {
    empty.hidden    = true;
    tbody.innerHTML = rows.map(e => {
      const limit  = Number(state.budgets[e.category]) || 0;
      const spent  = spentByCat[e.category] || 0;

      let budgetCell    = `<td class="num muted">—</td>`;
      let remainingCell = `<td class="num muted">—</td>`;

      if (limit > 0) {
        const remaining = limit - spent;
        const remClass  = remaining < 0 ? "remaining-over"
                        : remaining <= limit * 0.1 ? "remaining-warn"
                        : "remaining-ok";
        budgetCell    = `<td class="num">${fmtMoney(limit)}</td>`;
        remainingCell = `<td class="num ${remClass}">${fmtMoney(remaining)}</td>`;
      }

      return `
        <tr>
          <td>${formatDateDisplay(e.date)}</td>
          <td>
            <span class="cat-pill">
              <span class="dot" style="background:${colorFor(e.category)}"></span>
              ${escapeHtml(e.category)}
            </span>
          </td>
          <td>${escapeHtml(e.note || "")}</td>
          <td class="num">${fmtMoney(e.amount)}</td>
          ${budgetCell}
          ${remainingCell}
          <td class="actions-col">
            <div class="row-actions">
              <button class="icon-btn" data-edit="${e.id}" title="Edit">✎</button>
              <button class="icon-btn danger" data-delete="${e.id}" title="Delete">🗑</button>
            </div>
          </td>
        </tr>`;
    }).join("");
  }

  const total = rows.reduce((s, e) => s + e.amount, 0);
  $("#filtered-total").textContent = fmtMoney(total);
}

function renderBudgets() {
  const monthK     = currentMonthKey();
  const spentByCat = {};
  for (const e of state.expenses) {
    if (monthKey(e.date) === monthK) {
      spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
    }
  }

  $("#budget-list").innerHTML = state.categories.map(c => {
    const limit = Number(state.budgets[c]) || 0;
    const spent = spentByCat[c] || 0;
    const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    const cls   = limit > 0 && spent > limit ? "over"
                : limit > 0 && spent >= limit * 0.9 ? "warn" : "";
    const meta  = limit > 0
      ? `${fmtMoney(spent)} of ${fmtMoney(limit)}${spent > limit ? " — over budget!" : ""}`
      : `${fmtMoney(spent)} spent · no budget set`;

    return `
      <div class="budget-row">
        <div class="budget-head">
          <span class="b-cat">
            <span class="dot" style="background:${colorFor(c)};width:10px;height:10px;border-radius:50%;display:inline-block"></span>
            ${escapeHtml(c)}
          </span>
          <input type="number" min="0" step="1" placeholder="—"
                 value="${limit > 0 ? limit : ""}" data-budget="${escapeHtml(c)}" />
        </div>
        <div class="bar ${cls}"><span style="width:${pct}%"></span></div>
        <div class="budget-meta ${spent > limit && limit > 0 ? "over" : ""}">${meta}</div>
      </div>`;
  }).join("");
}

function renderAlertBanner() {
  const monthK     = currentMonthKey();
  const spentByCat = {};
  for (const e of state.expenses) {
    if (monthKey(e.date) === monthK) {
      spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
    }
  }
  const over = state.categories.filter(c => {
    const limit = Number(state.budgets[c]) || 0;
    return limit > 0 && (spentByCat[c] || 0) > limit;
  });

  const banner = $("#alert-banner");
  if (over.length === 0) {
    banner.hidden      = true;
    banner.textContent = "";
  } else {
    banner.hidden    = false;
    banner.innerHTML = `⚠️ <strong>Over budget this month:</strong> ${over.map(escapeHtml).join(", ")}.`;
  }
}

function renderCharts() {
  if (typeof Chart === "undefined") return;
  const rows = getFiltered();
  renderCategoryChart(rows);
  renderTrendChart(rows);
}

function renderCategoryChart(rows) {
  const totals = {};
  for (const e of rows) totals[e.category] = (totals[e.category] || 0) + e.amount;
  const labels = Object.keys(totals);
  const data   = labels.map(l => totals[l]);
  const colors = labels.map(colorFor);

  const ctx = $("#category-chart");
  if (categoryChart) {
    categoryChart.data.labels                      = labels;
    categoryChart.data.datasets[0].data            = data;
    categoryChart.data.datasets[0].backgroundColor = colors;
    categoryChart.update();
    return;
  }
  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: "#1e2342", borderWidth: 2 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend:  { position: "bottom", labels: { color: "#9aa0c7", boxWidth: 12, padding: 12 } },
        tooltip: { callbacks: { label: c => `${c.label}: ${fmtMoney(c.parsed)}` } },
      },
      cutout: "60%",
    },
  });
}

function renderTrendChart(rows) {
  const byKey = {};
  for (const e of rows) byKey[e.date] = (byKey[e.date] || 0) + e.amount;
  const keys  = Object.keys(byKey).sort();

  let labels, data;
  if (keys.length > 70) {
    const byMonth = {};
    for (const e of rows) {
      const k = monthKey(e.date);
      byMonth[k] = (byMonth[k] || 0) + e.amount;
    }
    labels = Object.keys(byMonth).sort();
    data   = labels.map(k => byMonth[k]);
  } else {
    labels = keys;
    data   = keys.map(k => byKey[k]);
  }

  const ctx = $("#trend-chart");
  if (trendChart) {
    trendChart.data.labels           = labels;
    trendChart.data.datasets[0].data = data;
    trendChart.update();
    return;
  }
  trendChart = new Chart(ctx, {
    type: "bar",
    data: { labels, datasets: [{ label: "Spent", data, backgroundColor: "#6c8cff", borderRadius: 6, maxBarThickness: 34 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend:  { display: false },
        tooltip: { callbacks: { label: c => fmtMoney(c.parsed.y) } },
      },
      scales: {
        x: { ticks: { color: "#9aa0c7", maxRotation: 0, autoSkip: true }, grid: { display: false } },
        y: { ticks: { color: "#9aa0c7", callback: v => fmtMoney(v) }, grid: { color: "#2e3460" } },
      },
    },
  });
}

// ─── Date / HTML utils ────────────────────────────────────────────────────────
function formatDateDisplay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

// ─── Mutations ────────────────────────────────────────────────────────────────
function addOrUpdateExpense(evt) {
  evt.preventDefault();
  const editId   = $("#edit-id").value;
  const date     = $("#exp-date").value;
  const amount   = parseFloat($("#exp-amount").value);
  const category = $("#exp-category").value;
  const note     = $("#exp-note").value.trim();

  if (!date)         return alert("Please pick a date.");
  if (!(amount > 0)) return alert("Amount must be greater than zero.");
  if (!category)     return alert("Please choose a category.");

  if (editId) {
    const exp = state.expenses.find(e => e.id === editId);
    if (exp) {
      Object.assign(exp, { date, amount, category, note });
      saveExpense(exp);
    }
    exitEditMode();
  } else {
    const newExp = {
      id: crypto.randomUUID(),
      date, amount, category, note,
    };
    state.expenses.push(newExp);
    saveExpense(newExp);
  }

  $("#expense-form").reset();
  $("#exp-date").value = todayISO();
  render();
}

function enterEditMode(id) {
  const exp = state.expenses.find(e => e.id === id);
  if (!exp) return;
  $("#edit-id").value       = exp.id;
  $("#exp-date").value      = exp.date;
  $("#exp-amount").value    = exp.amount;
  $("#exp-category").value  = exp.category;
  $("#exp-note").value      = exp.note || "";
  $("#form-title").textContent     = "Edit Expense";
  $("#submit-btn").textContent     = "Save";
  $("#cancel-edit-btn").hidden     = false;
  $("#exp-amount").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function exitEditMode() {
  $("#edit-id").value              = "";
  $("#form-title").textContent     = "Add Expense";
  $("#submit-btn").textContent     = "Add";
  $("#cancel-edit-btn").hidden     = true;
  $("#expense-form").reset();
  $("#exp-date").value             = todayISO();
}

function deleteExpense(id) {
  const exp = state.expenses.find(e => e.id === id);
  if (!exp) return;
  if (!confirm(`Delete this ${fmtMoney(exp.amount)} expense?`)) return;
  state.expenses = state.expenses.filter(e => e.id !== id);
  if ($("#edit-id").value === id) exitEditMode();
  removeExpenseFromDB(id);
  render();
}

function addCategory(evt) {
  evt.preventDefault();
  const input = $("#new-category");
  const name  = input.value.trim();
  if (!name) return;
  if (state.categories.some(c => c.toLowerCase() === name.toLowerCase())) {
    alert("That category already exists.");
    return;
  }
  state.categories.push(name);
  input.value = "";
  saveUserProfile();
  render();
}

function removeCategory(name) {
  if (state.expenses.some(e => e.category === name)) {
    alert(`"${name}" is used by existing expenses and can't be removed.\nReassign or delete those expenses first.`);
    return;
  }
  if (!confirm(`Remove category "${name}"?`)) return;
  state.categories = state.categories.filter(c => c !== name);
  delete state.budgets[name];
  saveUserProfile();
  render();
}

function setBudget(category, value) {
  const num = parseFloat(value);
  if (!value || isNaN(num) || num <= 0) delete state.budgets[category];
  else state.budgets[category] = num;
  saveUserProfile();
  renderBudgets();
  renderTable();
  renderAlertBanner();
}

// ─── Export ───────────────────────────────────────────────────────────────────
function exportCSV() {
  const rows = getFiltered();
  if (rows.length === 0) { alert("No expenses to export for the current filter."); return; }

  const header = ["Date", "Category", "Note", "Amount", "Budget (Monthly)", "Remaining Budget"];
  const esc    = v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

  const monthK     = currentMonthKey();
  const spentByCat = {};
  for (const e of state.expenses) {
    if (monthKey(e.date) === monthK) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
  }

  const lines = [header.join(",")];
  for (const e of rows) {
    const limit        = Number(state.budgets[e.category]) || 0;
    const budgetVal    = limit > 0 ? limit.toFixed(2) : "";
    const remainingVal = limit > 0 ? (limit - (spentByCat[e.category] || 0)).toFixed(2) : "";
    lines.push([esc(e.date), esc(e.category), esc(e.note || ""), esc(e.amount.toFixed(2)), esc(budgetVal), esc(remainingVal)].join(","));
  }

  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `expenses-${todayISO()}.csv` });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function clearAll() {
  if (!confirm("This will permanently delete ALL your expenses, budgets and custom categories.\nThis cannot be undone. Continue?")) return;

  state = { expenses: [], budgets: {}, categories: [...DEFAULT_CATEGORIES], settings: state.settings };
  exitEditMode();
  render();
  persistExpenses();
  saveUserProfile();
}

// ─── Event wiring ─────────────────────────────────────────────────────────────
function wireEvents() {
  // Auth
  $("#auth-form").addEventListener("submit", handleAuthSubmit);
  $("#auth-tab-signin").addEventListener("click", () => setAuthMode("signin"));
  $("#auth-tab-signup").addEventListener("click", () => setAuthMode("signup"));
  $("#logout-btn").addEventListener("click", handleSignOut);

  // Expense form
  $("#expense-form").addEventListener("submit", addOrUpdateExpense);
  $("#cancel-edit-btn").addEventListener("click", exitEditMode);

  // Category form
  $("#category-form").addEventListener("submit", addCategory);

  // Header actions
  $("#export-btn").addEventListener("click", exportCSV);
  $("#clear-all-btn").addEventListener("click", clearAll);

  // Currency
  const curSel = $("#currency-select");
  curSel.addEventListener("change", () => {
    state.settings.currency = curSel.value;
    saveUserProfile();
    render();
  });

  // Filters
  $("#filter-category").addEventListener("change", render);
  $("#filter-search").addEventListener("input", render);
  $("#filter-range").addEventListener("change", () => {
    const custom = $("#filter-range").value === "custom";
    $("#filter-from").hidden = !custom;
    $("#filter-to").hidden   = !custom;
    render();
  });
  $("#filter-from").addEventListener("change", render);
  $("#filter-to").addEventListener("change", render);

  // Column sorting
  $$("th.sortable").forEach(th => th.addEventListener("click", () => {
    const key = th.dataset.sort;
    sort = sort.key === key
      ? { key, dir: sort.dir === "asc" ? "desc" : "asc" }
      : { key, dir: "desc" };
    renderTable();
  }));

  // Delegated: edit / delete rows + remove category chips
  document.body.addEventListener("click", e => {
    const editBtn = e.target.closest("[data-edit]");
    if (editBtn) return enterEditMode(editBtn.dataset.edit);
    const delBtn  = e.target.closest("[data-delete]");
    if (delBtn)  return deleteExpense(delBtn.dataset.delete);
    const rmCat   = e.target.closest("[data-remove-cat]");
    if (rmCat)   return removeCategory(rmCat.dataset.removeCat);
  });

  // Budget inputs
  $("#budget-list").addEventListener("change", e => {
    const input = e.target.closest("[data-budget]");
    if (input) setBudget(input.dataset.budget, input.value);
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────
wireEvents();
showAuthScreen();
onAuthStateChanged(auth, handleAuthStateChanged);
