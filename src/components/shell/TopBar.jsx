import { Search, Bell, Plus, Sun, Moon } from "lucide-react";

export default function TopBar({ title, subtitle, onOpenAdd, theme, toggleTheme }) {
  return (
    <header className="flex items-center gap-3.5 px-6 lg:px-8 py-4 bg-pr-card border-b border-pr-border-default flex-wrap">
      <div className="flex-1 min-w-[180px] flex flex-col gap-0.5">
        <h1 className="text-[19px] font-semibold text-pr-primary leading-tight">{title}</h1>
        <p className="text-[12.5px] text-pr-secondary leading-tight">{subtitle}</p>
      </div>
      <div className="relative hidden md:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-pr-tertiary pointer-events-none" />
        <input
          type="search"
          placeholder="Search expenses…"
          className="w-60 bg-pr-subtle border border-pr-border-default rounded-pr-default pl-9 pr-3 py-2.5 text-sm text-pr-primary placeholder:text-pr-tertiary focus:outline-none focus:ring-2 focus:ring-pr-accent/30"
        />
      </div>
      <button onClick={toggleTheme} title={theme === "dark" ? "Switch to light" : "Switch to dark"} className="w-10 h-10 flex items-center justify-center rounded-pr-default text-pr-secondary bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer">
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <button title="Notifications" className="w-10 h-10 flex items-center justify-center rounded-pr-default text-pr-secondary bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer">
        <Bell size={17} />
      </button>
      <button onClick={onOpenAdd} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-pr-default text-sm font-semibold text-white bg-pr-accent hover:bg-pr-accent-hover transition-colors cursor-pointer">
        <Plus size={16} /> Add expense
      </button>
    </header>
  );
}
