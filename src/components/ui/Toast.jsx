import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

const TONE = {
  success: { icon: CheckCircle, text: "text-pr-success-text" },
  danger: { icon: AlertCircle, text: "text-pr-danger" },
  info: { icon: Info, text: "text-pr-accent" },
  warning: { icon: AlertTriangle, text: "text-pr-warning" },
};

export default function Toast({ tone = "success", title, description, onClose }) {
  const { icon: Icon, text } = TONE[tone] || TONE.success;
  return (
    <div role="status" className="flex items-start gap-3 w-full max-w-sm bg-pr-card shadow-pr-lg rounded-pr-card p-4">
      <Icon size={18} className={`${text} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {title && <span className="text-sm font-semibold text-pr-primary">{title}</span>}
        {description && <span className="text-sm text-pr-secondary">{description}</span>}
      </div>
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" className="w-6 h-6 flex items-center justify-center rounded-pr-default text-pr-tertiary hover:text-pr-primary transition-colors cursor-pointer flex-shrink-0">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
