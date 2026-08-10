import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChart({ data, size = 200, theme = "dark" }) {
  const textColor = theme === "light" ? "#475569" : "#cbd5e1";
  const tooltipBg = theme === "light" ? "#FFFFFF" : "#121A2B";
  const tooltipText = theme === "light" ? "#0F172A" : "#EDF1F9";
  const tooltipBorder = theme === "light" ? "#D9E1EF" : "#25314C";
  return (
    <div style={{ height: size }} className="relative">
      <Doughnut
        data={{
          labels: data.map(d => d.label),
          datasets: [{ data: data.map(d => d.value), backgroundColor: data.map(d => d.color), borderWidth: 0 }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { color: textColor, boxWidth: 10, boxHeight: 10, padding: 12, font: { size: 11 } } },
            tooltip: {
              backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText,
              borderColor: tooltipBorder, borderWidth: 1,
              padding: 10, cornerRadius: 8, titleFont: { size: 12, weight: "600" }, bodyFont: { size: 12 },
            },
          },
          cutout: "62%",
        }}
      />
    </div>
  );
}
