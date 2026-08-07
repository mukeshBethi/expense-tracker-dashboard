import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { PieChart } from "lucide-react";
import { formatMoney } from "../lib/format.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ["#10b981", "#6c8cff", "#f59e0b", "#f87171", "#a78bfa", "#22d3ee", "#fb923c", "#f472b6"];

export default function CategoryChart({ expenses, currency, theme }) {
  const textColor = theme === "light" ? "#475569" : "#cbd5e1";
  const totals = {};
  for (const e of expenses) totals[e.category] = (totals[e.category] || 0) + e.amount;
  const labels = Object.keys(totals);
  const data = labels.map(l => totals[l]);

  if (labels.length === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-center">
        <PieChart className="w-6 h-6 text-muted" aria-hidden="true" />
        <p className="text-sm text-muted">No data for this filter yet.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[260px]">
      <Doughnut
        data={{ labels, datasets: [{ data, backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]), borderWidth: 0 }] }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { boxWidth: 10, boxHeight: 10, padding: 16, font: { size: 12, family: "inherit" }, color: textColor },
            },
            tooltip: {
              callbacks: { label: c => `${c.label}: ${formatMoney(c.parsed, currency)}` },
              backgroundColor: "#1a1e25",
              padding: 10,
              cornerRadius: 8,
              titleFont: { size: 12, weight: "600" },
              bodyFont: { size: 12 },
              displayColors: true,
            },
          },
          cutout: "65%",
        }}
      />
    </div>
  );
}
