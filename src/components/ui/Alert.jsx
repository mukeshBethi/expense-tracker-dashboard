import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";

const TONE = {
  warning: { icon: AlertTriangle, bg: "bg-pr-warning-soft", text: "text-pr-warning" },
  danger: { icon: AlertCircle, bg: "bg-pr-danger-soft", text: "text-pr-danger" },
  info: { icon: Info, bg: "bg-pr-subtle", text: "text-pr-accent" },
  success: { icon: CheckCircle, bg: "bg-pr-success-soft", text: "text-pr-success-text" },
};

export default function Alert({ tone = "info", title, children }) {
  const { icon: Icon, bg, text } = TONE[tone] || TONE.info;
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-pr-default ${bg}`}>
      <Icon size={18} className={`${text} flex-shrink-0 mt-0.5`} />
      <div className="flex flex-col gap-0.5 min-w-0">
        {title && <span className={`text-sm font-semibold ${text}`}>{title}</span>}
        {children && <span className="text-sm text-pr-secondary">{children}</span>}
      </div>
    </div>
  );
}
