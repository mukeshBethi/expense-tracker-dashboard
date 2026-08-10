import { useState } from "react";
import { Plus } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import TopBar from "./TopBar.jsx";
import MobileBottomNav from "./MobileBottomNav.jsx";

export default function Shell({ children, title, subtitle, email, displayName, onSignOut, theme, toggleTheme, onOpenAdd, monthTotal, totalBudgetShort, budgetUsedPct }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-pr-page font-[Inter,sans-serif]">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        email={email}
        displayName={displayName}
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
      {/* Mobile-only floating action button — the TopBar's "Add expense" button
          is hidden below lg (it doesn't fit the cramped mobile header), so this
          is its mobile replacement, not a duplicate. Sits above MobileBottomNav
          (which is ~64px tall) with clearance to spare, and below the "More"
          menu's z-index so an open More panel visually covers it instead of
          the FAB poking out over the panel. */}
      <button
        onClick={onOpenAdd}
        aria-label="Add expense"
        className="lg:hidden fixed bottom-20 right-4 z-[35] w-14 h-14 rounded-full bg-pr-accent hover:bg-pr-accent-hover text-white shadow-pr-lg flex items-center justify-center cursor-pointer transition-colors"
      >
        <Plus size={24} />
      </button>
      <MobileBottomNav email={email} displayName={displayName} onSignOut={onSignOut} />
    </div>
  );
}
