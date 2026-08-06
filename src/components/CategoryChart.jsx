import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { formatMoney } from "../lib/format.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const PALETTE = ["#6c8cff", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#22d3ee", "#fb923c", "#f472b6"];

export default function CategoryChart({ expenses, currency }) {
  const totals = {};
  for (const e of expenses) totals[e.category] = (totals[e.category] || 0) + e.amount;
  const labels = Object.keys(totals);
  const data = labels.map(l => totals[l]);

  return (
    <div className="chart-wrap">
      <Doughnut
        data={{ labels, datasets: [{ data, backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]) }] }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            tooltip: { callbacks: { label: c => `${c.label}: ${formatMoney(c.parsed, currency)}` } },
          },
          cutout: "60%",
        }}
      />
    </div>
  );
}
