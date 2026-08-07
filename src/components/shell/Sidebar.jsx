import { NavLink } from "react-router-dom";
import { Home, FileText, Package, TrendingUp, Grid, Settings, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/expenses", label: "Expenses", icon: FileText },
  { to: "/budgets", label: "Budgets", icon: Package },
  { to: "/analytics", label: "Analytics", icon: TrendingUp },
  { to: "/categories", label: "Categories", icon: Grid },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ collapsed, onToggleCollapse, email, displayName, onSignOut, monthTotal, totalBudgetShort, budgetUsedPct }) {
  const identityLabel = displayName || email;
  return (
    <aside className={`hidden lg:flex flex-col h-full bg-pr-card border-r border-pr-border-default transition-[width] duration-200 overflow-hidden ${collapsed ? "w-[72px]" : "w-[236px]"}`}>
      <div className={`flex items-center gap-3 px-4 pt-5 pb-4 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-[30px] h-[30px] rounded-pr-default bg-pr-accent flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">T</div>
        {!collapsed && (
          <div className="flex flex-col min-w-0 overflow-hidden whitespace-nowrap">
            <span className="text-pr-primary font-semibold text-[15px] leading-none">Tally</span>
            <span className="text-pr-tertiary text-[11px] leading-none">Personal finance</span>
          </div>
        )}
      </div>
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-pr-default text-[13.5px] font-medium transition-colors cursor-pointer ${collapsed ? "justify-center" : ""} ${
                isActive ? "text-pr-accent bg-pr-accent/10 shadow-[inset_3px_0_0_var(--pr-accent)]" : "text-pr-secondary hover:text-pr-primary hover:bg-pr-subtle"
              }`
            }
          >
            <Icon size={17} />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="m-3 p-3.5 rounded-pr-large bg-pr-subtle">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-pr-tertiary mb-2.5">This month</p>
          <div className="flex items-baseline gap-1.5 mb-2.5">
            <span className="text-pr-primary font-semibold text-[19px] font-mono tabular-nums">{monthTotal}</span>
            <span className="text-pr-tertiary text-[11px]">of {totalBudgetShort}</span>
          </div>
          <div className="h-[5px] rounded-full bg-pr-sunken overflow-hidden">
            <div className="h-full rounded-full bg-pr-accent transition-all" style={{ width: budgetUsedPct }} />
          </div>
        </div>
      )}
      <div className={`px-4 py-3.5 border-t border-pr-border-default flex items-center gap-2 ${collapsed ? "flex-col" : ""}`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? "" : "flex-1 min-w-0"}`}>
          <div className="w-[30px] h-[30px] rounded-full bg-pr-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {(identityLabel || "?").charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-pr-primary text-[12.5px] font-semibold truncate">{identityLabel}</span>
            </div>
          )}
        </div>
        <div className={`flex items-center gap-1 ${collapsed ? "flex-col" : ""}`}>
          <button onClick={onToggleCollapse} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="w-7 h-7 flex items-center justify-center rounded-lg text-pr-tertiary hover:text-pr-primary hover:bg-pr-subtle transition-colors cursor-pointer flex-shrink-0">
            <span className="text-xs">{collapsed ? "›" : "‹"}</span>
          </button>
          <button onClick={onSignOut} title="Log out" className="w-7 h-7 flex items-center justify-center rounded-lg text-pr-tertiary hover:text-pr-primary hover:bg-pr-subtle transition-colors cursor-pointer flex-shrink-0">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
