export default function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-overlay">
      <div className="confirm-card">
        <p>{message}</p>
        <div className="form-actions">
          <button type="button" className="btn btn-primary" onClick={onConfirm}>Confirm</button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
