import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, onClose, footer, children, width = 480, sheet = false }) {
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
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center z-50 ${sheet ? "items-end lg:items-center px-0 lg:px-4" : "items-center px-4"}`}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: width }}
        className={`w-full bg-pr-card shadow-pr-lg border border-pr-border-default flex flex-col ${
          sheet
            ? "rounded-t-pr-modal lg:rounded-pr-modal max-h-[85vh] animate-[pr-sheet-up_0.25s_ease-out] lg:animate-none"
            : "rounded-pr-modal"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-pr-border-subtle flex-shrink-0">
          <h3 className="text-base font-semibold text-pr-primary">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-pr-default text-pr-secondary hover:bg-pr-subtle hover:text-pr-primary transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-pr-border-subtle flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
