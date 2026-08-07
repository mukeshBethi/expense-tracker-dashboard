import { useState, useMemo, useCallback } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth.js";
import { useExpenseData } from "./hooks/useExpenseData.js";
import { useTheme } from "./hooks/useTheme.js";
import AuthScreen from "./components/AuthScreen.jsx";
import Header from "./components/Header.jsx";
import ExpenseForm from "./components/ExpenseForm.jsx";
import CategoryManager from "./components/CategoryManager.jsx";
import BudgetList from "./components/BudgetList.jsx";
import SummaryCards from "./components/SummaryCards.jsx";
import AlertBanner from "./components/AlertBanner.jsx";
import ExpenseTable from "./components/ExpenseTable.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import TrendChart from "./components/TrendChart.jsx";
import Toast from "./components/Toast.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function monthKey(iso) { return iso.slice(0, 7); }

export default function App() {
  const { user, authLoading, signIn, signUp, signOutUser, authError, clearAuthError } = useAuth();
  const { state, loading, loadError, addExpense, updateExpense, deleteExpense, addCategory, removeCategory, setBudget, setCurrency, setTotalBudget, setThemePreference, clearAll } = useExpenseData(user?.uid);
  const { theme, toggleTheme } = useTheme(state.settings.theme, setThemePreference);

  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmRemoveCategory, setConfirmRemoveCategory] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  const monthK = todayISO().slice(0, 7);
  const expensesThisMonth = useMemo(
    () => state.expenses.filter(e => monthKey(e.date) === monthK),
    [state.expenses, monthK]
  );

  const filteredExpenses = useMemo(() => {
    let rows = state.expenses.filter(e => {
      if (filterCategory && e.category !== filterCategory) return false;
      if (search && !(e.note || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    rows.sort((a, b) => {
      const cmp = sort.key === "amount" ? a.amount - b.amount : (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [state.expenses, filterCategory, search, sort]);

  function handleFormSubmit(expense) {
    if (editingExpense) updateExpense(editingExpense.id, expense);
    else addExpense(expense);
    setToastMessage(editingExpense ? "Expense updated." : "Expense added.");
  }

  function handleExport() {
    if (filteredExpenses.length === 0) { setToastMessage("No expenses to export for the current filter."); return; }
    const header = ["Date", "Category", "Note", "Amount"];
    const esc = v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [header.join(","), ...filteredExpenses.map(e => [esc(e.date), esc(e.category), esc(e.note || ""), esc(e.amount.toFixed(2))].join(","))];
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `expenses-${todayISO()}.csv` });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (authLoading) return null;
  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} authError={authError} clearAuthError={clearAuthError} />;
  }
  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-text font-medium">Couldn't load your data</p>
        <p className="text-sm text-muted">Please refresh the page to try again.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" role="status">
        <Loader2 className="w-6 h-6 text-primary animate-spin" aria-hidden="true" />
        <p className="text-sm text-muted">Loading your data…</p>
      </div>
    );
  }

  return (
    <div>
      <Header
        email={user.email}
        currency={state.settings.currency}
        theme={theme}
        onCurrencyChange={setCurrency}
        onToggleTheme={toggleTheme}
        onExport={handleExport}
        onSignOut={signOutUser}
      />
      <AlertBanner categories={state.categories} budgets={state.budgets} expensesThisMonth={expensesThisMonth} />
      <main className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 px-4 sm:px-6 lg:px-9 py-7 pb-14">
        <section className="flex flex-col gap-6">
          <div className="bg-surface shadow-soft rounded-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-text mb-3">{editingExpense ? "Edit Expense" : "Add Expense"}</h2>
            <ExpenseForm
              categories={state.categories}
              onSubmit={handleFormSubmit}
              editingExpense={editingExpense}
              onCancelEdit={() => setEditingExpense(null)}
            />
          </div>
          <div className="bg-surface shadow-soft rounded-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-text mb-3">Categories</h2>
            <CategoryManager
              categories={state.categories}
              expenses={state.expenses}
              onAddCategory={addCategory}
              onRequestRemoveCategory={setConfirmRemoveCategory}
            />
          </div>
          <div className="card">
            <h2>Monthly Budgets</h2>
            <BudgetList
              categories={state.categories}
              budgets={state.budgets}
              expensesThisMonth={expensesThisMonth}
              currency={state.settings.currency}
              onSetBudget={setBudget}
              totalBudget={state.settings.totalBudget || 0}
              onSetTotalBudget={setTotalBudget}
            />
          </div>
        </section>
        <section className="flex flex-col gap-6">
          <SummaryCards expenses={state.expenses} currency={state.settings.currency} />
          <div className="charts-grid">
            <div className="bg-surface shadow-soft rounded-card p-5 flex flex-col gap-3"><h2 className="text-sm font-semibold text-text mb-1">By Category</h2><CategoryChart expenses={filteredExpenses} currency={state.settings.currency} theme={theme} /></div>
            <div className="bg-surface shadow-soft rounded-card p-5 flex flex-col gap-3"><h2 className="text-sm font-semibold text-text mb-1">Spending Trend</h2><TrendChart expenses={filteredExpenses} currency={state.settings.currency} theme={theme} /></div>
          </div>
          <div className="card">
            <div className="table-toolbar">
              <h2>Expenses</h2>
              <div className="filters">
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="">All categories</option>
                  {state.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="search" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <ExpenseTable
              expenses={filteredExpenses}
              budgets={state.budgets}
              expensesThisMonth={expensesThisMonth}
              currency={state.settings.currency}
              onEdit={setEditingExpense}
              onDelete={setConfirmDeleteId}
              sort={sort}
              onSortChange={setSort}
            />
          </div>
        </section>
      </main>
      <footer className="app-footer">
        <button type="button" className="link-btn" onClick={() => setConfirmClearAll(true)}>
          Clear all data
        </button>
      </footer>
      <Toast message={toastMessage} onDismiss={dismissToast} />
      <ConfirmDialog
        open={confirmDeleteId !== null}
        message="Delete this expense? This cannot be undone."
        onConfirm={() => { deleteExpense(confirmDeleteId); setConfirmDeleteId(null); setToastMessage("Expense deleted."); }}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <ConfirmDialog
        open={confirmRemoveCategory !== null}
        message={confirmRemoveCategory ? `Remove category "${confirmRemoveCategory}"? This cannot be undone.` : ""}
        onConfirm={() => { removeCategory(confirmRemoveCategory); setConfirmRemoveCategory(null); setToastMessage("Category removed."); }}
        onCancel={() => setConfirmRemoveCategory(null)}
      />
      <ConfirmDialog
        open={confirmClearAll}
        message="Clear all expenses, categories, and budgets? This cannot be undone."
        onConfirm={() => { clearAll(); setConfirmClearAll(false); setToastMessage("All data cleared."); }}
        onCancel={() => setConfirmClearAll(false)}
      />
    </div>
  );
}
