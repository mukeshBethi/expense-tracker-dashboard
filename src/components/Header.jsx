import { Sun, Moon, Download, LogOut } from "lucide-react";

export default function Header({ email, currency, theme, onCurrencyChange, onToggleTheme, onExport, onSignOut }) {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 sm:px-6 lg:px-9 py-3 sm:py-4 bg-surface/80 backdrop-blur-md border-b border-border-dim">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-9 h-9 rounded-input bg-primary text-white font-bold text-lg">$</span>
        <h1 className="text-lg font-semibold text-text">Expense Tracker</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
        <button
          className="p-2.5 rounded-pill hover:bg-surface-2 text-muted hover:text-text transition-colors cursor-pointer"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <select
          value={currency}
          onChange={e => onCurrencyChange(e.target.value)}
          aria-label="Currency"
          className="bg-surface-2 border border-border-dim rounded-input px-2.5 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          <option value="$">$ USD</option>
          <option value="€">€ EUR</option>
          <option value="£">£ GBP</option>
          <option value="₹">₹ INR</option>
        </select>
        <button
          className="inline-flex items-center gap-1.5 bg-transparent hover:bg-surface-2 text-text border border-border-dim rounded-pill px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer"
          onClick={onExport}
          aria-label="Export CSV"
          title="Export CSV"
        >
          <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
        </button>
        <div className="flex items-center gap-2 ml-1 sm:ml-2">
          <span className="grid place-items-center w-8 h-8 rounded-pill bg-primary/10 text-primary text-sm font-semibold">
            {(email || "?").charAt(0).toUpperCase()}
          </span>
          <span className="hidden md:inline text-sm text-muted max-w-[160px] truncate">{email}</span>
          <button
            className="p-2 rounded-pill hover:bg-surface-2 text-muted hover:text-text transition-colors cursor-pointer"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
