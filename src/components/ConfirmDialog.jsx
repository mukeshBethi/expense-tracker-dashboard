export default function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-sm bg-surface shadow-soft rounded-card p-6">
        <p className="text-sm text-text mb-5">{message}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onConfirm}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-pill px-4 py-2.5 text-sm font-semibold">
            Confirm
          </button>
          <button type="button" onClick={onCancel}
                  className="flex-1 bg-transparent hover:bg-surface-2 text-text border border-border-dim rounded-pill px-4 py-2.5 text-sm font-medium transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
