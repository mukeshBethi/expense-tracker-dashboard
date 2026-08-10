import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, onClose, footer, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(evt) {
      if (evt.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }} className="w-full bg-pr-card rounded-pr-modal shadow-pr-lg border border-pr-border-default">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-pr-border-subtle">
          <h3 className="text-base font-semibold text-pr-primary">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-pr-default text-pr-secondary hover:bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-pr-border-subtle">{footer}</div>}
      </div>
    </div>
  );
}
