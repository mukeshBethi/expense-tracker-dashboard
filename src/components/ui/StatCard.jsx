import { ArrowUp, ArrowDown } from "lucide-react";
import Sparkline from "./Sparkline.jsx";

export default function StatCard({ label, value, delta, trend, spark, accentClass = "text-pr-accent" }) {
  return (
    <div className="bg-pr-card shadow-pr-sm rounded-pr-card border border-pr-border-subtle p-5 flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-2xl font-semibold text-pr-primary tabular-nums font-mono truncate">{value}</span>
        {delta && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold flex-shrink-0 ${trend === "down" ? "text-pr-success-text" : trend === "up" ? "text-pr-danger" : "text-pr-secondary"}`}>
            {trend === "up" && <ArrowUp size={12} />}
            {trend === "down" && <ArrowDown size={12} />}
            {delta}
          </span>
        )}
      </div>
      <span className="text-sm text-pr-secondary">{label}</span>
      {spark && <Sparkline data={spark} className={accentClass} />}
    </div>
  );
}
