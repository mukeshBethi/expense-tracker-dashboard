import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function BarChart({ data, height = 220, theme = "dark" }) {
  const textColor = theme === "light" ? "#475569" : "#cbd5e1";
  const gridColor = theme === "light" ? "rgba(100, 116, 139, 0.35)" : "rgba(148, 163, 184, 0.12)";
  return (
    <div style={{ height }} className="relative">
      <Bar
        data={{
          labels: data.map(d => d.label),
          datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => d.color), borderRadius: 6, maxBarThickness: 40 }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: "#1a1e25", padding: 10, cornerRadius: 8, titleFont: { size: 12, weight: "600" }, bodyFont: { size: 12 } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          },
        }}
      />
    </div>
  );
}
