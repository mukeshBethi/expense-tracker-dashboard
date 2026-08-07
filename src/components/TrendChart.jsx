import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler } from "chart.js";
import { TrendingUp } from "lucide-react";
import { formatMoney } from "../lib/format.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

function gradientFill(ctx, chartArea) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, "rgba(16, 185, 129, 0.35)");
  gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
  return gradient;
}

export default function TrendChart({ expenses, currency }) {
  const byKey = {};
  for (const e of expenses) byKey[e.date] = (byKey[e.date] || 0) + e.amount;
  const labels = Object.keys(byKey).sort();
  const data = labels.map(k => byKey[k]);

  if (labels.length === 0) {
    return (
      <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-center">
        <TrendingUp className="w-6 h-6 text-muted" />
        <p className="text-sm text-muted">No data for this filter yet.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[260px]">
      <Line
        data={{
          labels,
          datasets: [{
            label: "Spent",
            data,
            borderColor: "#10b981",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: "#10b981",
            tension: 0.35,
            fill: true,
            backgroundColor: (context) => {
              const { ctx, chartArea } = context.chart;
              if (!chartArea) return "rgba(16, 185, 129, 0)";
              return gradientFill(ctx, chartArea);
            },
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: { label: c => formatMoney(c.parsed.y, currency) },
              backgroundColor: "#1a1e25",
              padding: 10,
              cornerRadius: 8,
              titleFont: { size: 12, weight: "600" },
              bodyFont: { size: 12 },
            },
          },
          scales: {
            x: { grid: { color: "rgba(148, 163, 184, 0.12)" }, ticks: { font: { size: 11 } } },
            y: { grid: { color: "rgba(148, 163, 184, 0.12)" }, ticks: { callback: v => formatMoney(v, currency), font: { size: 11 } } },
          },
        }}
      />
    </div>
  );
}
