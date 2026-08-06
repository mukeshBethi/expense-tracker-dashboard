import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
import { formatMoney } from "../lib/format.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function TrendChart({ expenses, currency }) {
  const byKey = {};
  for (const e of expenses) byKey[e.date] = (byKey[e.date] || 0) + e.amount;
  const labels = Object.keys(byKey).sort();
  const data = labels.map(k => byKey[k]);

  return (
    <div className="chart-wrap">
      <Bar
        data={{ labels, datasets: [{ label: "Spent", data, backgroundColor: "#6c8cff", borderRadius: 6 }] }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => formatMoney(c.parsed.y, currency) } },
          },
          scales: { y: { ticks: { callback: v => formatMoney(v, currency) } } },
        }}
      />
    </div>
  );
}
