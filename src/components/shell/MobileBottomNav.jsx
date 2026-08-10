import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, FileText, TrendingUp, MoreHorizontal, Package, Grid, Settings, LogOut } from "lucide-react";

const PRIMARY_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/expenses", label: "Expenses", icon: FileText },
  { to: "/analytics", label: "Insights", icon: TrendingUp },
];

const MORE_ITEMS = [
  { to: "/budgets", label: "Budgets", icon: Package },
  { to: "/categories", label: "Categories", icon: Grid },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function MobileBottomNav({ email, displayName, onSignOut }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const containerRef = useRef(null);
  const isMoreActive = MORE_ITEMS.some(item => item.to === location.pathname);
  const identityLabel = displayName || email;

  useEffect(() => {
    function handleClickOutside(evt) {
      if (containerRef.current && !containerRef.current.contains(evt.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close the "More" menu automatically whenever navigation happens, whether
  // the user tapped an item inside it or navigated some other way (e.g. a
  // deep link) — avoids the menu staying open over a page it no longer maps to.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="lg:hidden">
      {open && (
        <div className="fixed bottom-16 left-0 right-0 z-40 mx-3 mb-2 rounded-pr-large bg-pr-card border border-pr-border-default shadow-pr-lg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-pr-border-subtle">
            <div className="w-8 h-8 rounded-full bg-pr-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {(identityLabel || "?").charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-pr-primary truncate min-w-0">{identityLabel}</span>
          </div>
          {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${
                  isActive ? "text-pr-accent bg-pr-accent/10" : "text-pr-primary hover:bg-pr-subtle"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-pr-danger hover:bg-pr-danger-soft transition-colors cursor-pointer w-full text-left border-t border-pr-border-subtle"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 gap-1 px-3 py-2.5 bg-pr-card border-t border-pr-border-subtle">
        {PRIMARY_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex flex-col items-center gap-1 py-2 cursor-pointer ${isActive ? "text-pr-accent" : "text-pr-tertiary"}`}>
            <Icon size={19} />
            <span className="text-[10.5px] font-medium">{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label="More navigation options"
          aria-expanded={open}
          className={`flex flex-col items-center gap-1 py-2 cursor-pointer ${isMoreActive || open ? "text-pr-accent" : "text-pr-tertiary"}`}
        >
          <MoreHorizontal size={19} />
          <span className="text-[10.5px] font-medium">More</span>
        </button>
      </nav>
    </div>
  );
}
