import { useState, useMemo, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth.js";
import { useExpenseData } from "./hooks/useExpenseData.js";
import { useTheme } from "./hooks/useTheme.js";
import { formatMoney } from "./lib/format.js";
import AuthScreen from "./components/AuthScreen.jsx";
import Shell from "./components/shell/Shell.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ExpensesPage from "./pages/ExpensesPage.jsx";
import BudgetsPage from "./pages/BudgetsPage.jsx";
import CategoriesPage from "./pages/CategoriesPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import ComingSoonPage from "./pages/ComingSoonPage.jsx";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function monthKey(iso) { return iso.slice(0, 7); }

export default function App() {
  const { user, authLoading, signIn, signUp, signOutUser, authError, clearAuthError } = useAuth();
  const { state, loading, loadError, addExpense, updateExpense, deleteExpense, deleteExpenses, addCategory, removeCategory, setBudget, setTotalBudget, setThemePreference } = useExpenseData(user?.uid);
  const { theme, toggleTheme } = useTheme(state.settings.theme, setThemePreference);

  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const dismissToast = useCallback(() => setToastMessage(null), []);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const openExpenseModal = useCallback((expense = null) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  }, []);

  const closeExpenseModal = useCallback(() => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  }, []);

  const monthK = todayISO().slice(0, 7);
  const expensesThisMonth = useMemo(
    () => state.expenses.filter(e => monthKey(e.date) === monthK),
    [state.expenses, monthK]
  );

  function handleFormSubmit(expense) {
    if (editingExpense) updateExpense(editingExpense.id, expense);
    else addExpense(expense);
    setToastMessage(editingExpense ? "Expense updated." : "Expense added.");
  }

  function handleExport() {
    if (state.expenses.length === 0) { setToastMessage("No expenses to export."); return; }
    const sortedExpenses = [...state.expenses].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const header = ["Date", "Category", "Note", "Amount"];
    const esc = v => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const lines = [header.join(","), ...sortedExpenses.map(e => [esc(e.date), esc(e.category), esc(e.note || ""), esc(e.amount.toFixed(2))].join(","))];
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

  const sharedExpenseModalProps = {
    isExpenseModalOpen, openExpenseModal, closeExpenseModal, editingExpense, handleFormSubmit,
    confirmDeleteId, setConfirmDeleteId, deleteExpense,
    toastMessage, dismissToast, setToastMessage,
  };

  const dashboardProps = { state, theme, expensesThisMonth, ...sharedExpenseModalProps };
  const expensesProps = { state, expensesThisMonth, deleteExpenses, ...sharedExpenseModalProps };
  const budgetsProps = { state, expensesThisMonth, setBudget, setTotalBudget };
  const categoriesProps = { state, addCategory, removeCategory, toastMessage, dismissToast, setToastMessage };
  const analyticsProps = { state, theme, expensesThisMonth };

  const monthTotalRaw = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = state.settings.totalBudget || 0;
  const budgetUsedPct = `${totalBudget > 0 ? Math.min(100, Math.round((monthTotalRaw / totalBudget) * 100)) : 0}%`;

  return (
    <Shell
      title="Tally"
      subtitle="Personal finance"
      email={user.email}
      onSignOut={signOutUser}
      theme={theme}
      toggleTheme={toggleTheme}
      onExport={handleExport}
      onOpenAdd={() => openExpenseModal(null)}
      monthTotal={formatMoney(monthTotalRaw, state.settings.currency)}
      totalBudgetShort={formatMoney(totalBudget, state.settings.currency)}
      budgetUsedPct={budgetUsedPct}
    >
      <Routes>
        <Route path="/" element={<DashboardPage {...dashboardProps} />} />
        <Route path="/expenses" element={<ExpensesPage {...expensesProps} />} />
        <Route path="/budgets" element={<BudgetsPage {...budgetsProps} />} />
        <Route path="/analytics" element={<AnalyticsPage {...analyticsProps} />} />
        <Route path="/categories" element={<CategoriesPage {...categoriesProps} />} />
        <Route path="/settings" element={<ComingSoonPage title="Settings" />} />
      </Routes>
    </Shell>
  );
}
