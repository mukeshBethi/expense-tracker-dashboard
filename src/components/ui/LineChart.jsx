import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

function gradientFill(ctx, chartArea, color) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, `${color}59`);
  gradient.addColorStop(1, `${color}00`);
  return gradient;
}

export default function LineChart({ series, xLabels, height = 240, theme = "dark" }) {
  const textColor = theme === "light" ? "#475569" : "#cbd5e1";
  const gridColor = theme === "light" ? "rgba(100, 116, 139, 0.35)" : "rgba(148, 163, 184, 0.12)";
  const tooltipBg = theme === "light" ? "#FFFFFF" : "#121A2B";
  const tooltipText = theme === "light" ? "#0F172A" : "#EDF1F9";
  const tooltipBorder = theme === "light" ? "#D9E1EF" : "#25314C";

  return (
    <div style={{ height }} className="relative">
      <Line
        data={{
          labels: xLabels,
          datasets: series.map((s, i) => ({
            label: s.label,
            data: s.points,
            borderColor: s.color,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.35,
            fill: i === 0,
            backgroundColor: i === 0 ? (context) => {
              const { ctx, chartArea } = context.chart;
              if (!chartArea) return "transparent";
              return gradientFill(ctx, chartArea, s.color);
            } : undefined,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: series.length > 1, labels: { color: textColor, font: { size: 11 } } },
            tooltip: {
              backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText,
              borderColor: tooltipBorder, borderWidth: 1,
              padding: 10, cornerRadius: 8, titleFont: { size: 12, weight: "600" }, bodyFont: { size: 12 },
            },
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          },
        }}
      />
    </div>
  );
}
