import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import MobileBottomNav from "./MobileBottomNav.jsx";

export default function Shell({ children, title, subtitle, email, onSignOut, theme, toggleTheme, onOpenAdd, monthTotal, totalBudgetShort, budgetUsedPct }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-pr-page font-[Inter,sans-serif]">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        email={email}
        onSignOut={onSignOut}
        monthTotal={monthTotal}
        totalBudgetShort={totalBudgetShort}
        budgetUsedPct={budgetUsedPct}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} subtitle={subtitle} onOpenAdd={onOpenAdd} theme={theme} toggleTheme={toggleTheme} />
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7 pb-24 lg:pb-12">
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
