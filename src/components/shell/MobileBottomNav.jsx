import { NavLink } from "react-router-dom";
import { Home, FileText, TrendingUp, Settings } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/expenses", label: "Expenses", icon: FileText },
  { to: "/analytics", label: "Insights", icon: TrendingUp },
  { to: "/settings", label: "More", icon: Settings },
];

export default function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 gap-1 px-3 py-2.5 bg-pr-card border-t border-pr-border-subtle">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `flex flex-col items-center gap-1 py-2 cursor-pointer ${isActive ? "text-pr-accent" : "text-pr-tertiary"}`}>
          <Icon size={19} />
          <span className="text-[10.5px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
