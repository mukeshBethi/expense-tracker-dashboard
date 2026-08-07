const TONE_CLASS = {
  success: "bg-pr-success",
  warning: "bg-pr-warning",
  danger: "bg-pr-danger",
};

export default function ProgressBar({ label, value, tone = "success", showValue = false }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col gap-1.5">
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-pr-primary truncate">{label}</span>
          {showValue && <span className="text-xs font-medium text-pr-secondary flex-shrink-0">{pct}%</span>}
        </div>
      )}
      <div className="h-1.5 rounded-pr-pill bg-pr-subtle overflow-hidden">
        <div className={`h-full rounded-pr-pill transition-all ${TONE_CLASS[tone] || TONE_CLASS.success}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
