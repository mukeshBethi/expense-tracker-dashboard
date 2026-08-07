import Header from "../components/Header.jsx";
import ExpenseForm from "../components/ExpenseForm.jsx";
import Combobox from "../components/Combobox.jsx";
import CategoryManager from "../components/CategoryManager.jsx";
import BudgetList from "../components/BudgetList.jsx";
import SummaryCards from "../components/SummaryCards.jsx";
import AlertBanner from "../components/AlertBanner.jsx";
import ExpenseTable from "../components/ExpenseTable.jsx";
import CategoryChart from "../components/CategoryChart.jsx";
import TrendChart from "../components/TrendChart.jsx";
import Toast from "../components/Toast.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

export default function DashboardPage({
  user, state, theme, toggleTheme, setCurrency, handleExport, signOutUser,
  expensesThisMonth, editingExpense, setEditingExpense, handleFormSubmit,
  addCategory, setConfirmRemoveCategory, setBudget, setTotalBudget,
  filteredExpenses, filterCategory, setFilterCategory, search, setSearch,
  setConfirmDeleteId, sort, setSort, setConfirmClearAll,
  toastMessage, dismissToast, confirmDeleteId, deleteExpense, setToastMessage,
  confirmRemoveCategory, removeCategory, confirmClearAll, clearAll,
}) {
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
          <div className="bg-surface shadow-soft rounded-card p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-text mb-3">Monthly Budgets</h2>
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
        <section className="flex flex-col gap-6 min-w-0">
          <SummaryCards expenses={state.expenses} currency={state.settings.currency} />
          <div className="charts-grid">
            <div className="bg-surface shadow-soft rounded-card p-5 flex flex-col gap-3"><h2 className="text-sm font-semibold text-text mb-1">By Category</h2><CategoryChart expenses={filteredExpenses} currency={state.settings.currency} theme={theme} /></div>
            <div className="bg-surface shadow-soft rounded-card p-5 flex flex-col gap-3"><h2 className="text-sm font-semibold text-text mb-1">Spending Trend</h2><TrendChart expenses={filteredExpenses} currency={state.settings.currency} theme={theme} /></div>
          </div>
          <div className="bg-surface shadow-soft rounded-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold text-text">Expenses</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="w-full sm:w-44">
                  <Combobox options={state.categories} value={filterCategory} onChange={setFilterCategory} allowClear clearLabel="All categories" placeholder="All categories" />
                </div>
                <input type="search" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)}
                       className="w-full sm:w-auto min-w-0 bg-surface-2 border border-border-dim rounded-input px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors" />
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
        <button type="button" className="link-btn cursor-pointer" onClick={() => setConfirmClearAll(true)}>
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
