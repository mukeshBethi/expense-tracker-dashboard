import { AlertTriangle } from "lucide-react";

export default function AlertBanner({ categories, budgets, expensesThisMonth }) {
  const spentByCat = {};
  for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
  const over = categories.filter(c => {
    const limit = Number(budgets[c]) || 0;
    return limit > 0 && (spentByCat[c] || 0) > limit;
  });
  if (over.length === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-card px-4 py-3 mx-4 sm:mx-6 lg:mx-9 mt-4">
      <div className="w-8 h-8 rounded-pill bg-red-500/15 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-red-500" />
      </div>
      <p className="text-sm text-text">
        <strong className="font-semibold">Over budget this month:</strong> {over.join(", ")}.
      </p>
    </div>
  );
}
