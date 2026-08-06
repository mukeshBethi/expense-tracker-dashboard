export default function AlertBanner({ categories, budgets, expensesThisMonth }) {
  const spentByCat = {};
  for (const e of expensesThisMonth) spentByCat[e.category] = (spentByCat[e.category] || 0) + e.amount;
  const over = categories.filter(c => {
    const limit = Number(budgets[c]) || 0;
    return limit > 0 && (spentByCat[c] || 0) > limit;
  });
  if (over.length === 0) return null;
  return <div className="alert-banner">⚠️ <strong>Over budget this month:</strong> {over.join(", ")}.</div>;
}
