export default function Header({ email, currency, theme, onCurrencyChange, onToggleTheme, onExport, onSignOut }) {
  return (
    <header className="app-header">
      <div className="brand"><span className="brand-mark">$</span><h1>Expense Tracker</h1></div>
      <div className="header-actions">
        <button className="btn btn-ghost" onClick={onToggleTheme}>{theme === "dark" ? "☀️ Light" : "🌙 Dark"}</button>
        <label className="currency-picker">
          Currency
          <select value={currency} onChange={e => onCurrencyChange(e.target.value)}>
            <option value="$">$ USD</option>
            <option value="€">€ EUR</option>
            <option value="£">£ GBP</option>
            <option value="₹">₹ INR</option>
          </select>
        </label>
        <button className="btn btn-ghost" onClick={onExport}>⭳ Export CSV</button>
        <div className="user-section">
          <span className="user-avatar">{(email || "?").charAt(0).toUpperCase()}</span>
          <span className="user-email">{email}</span>
          <button className="btn btn-ghost btn-sm" onClick={onSignOut}>Sign Out</button>
        </div>
      </div>
    </header>
  );
}
