import Modal from "./ui/Modal.jsx";
import Alert from "./ui/Alert.jsx";
import Button from "./ui/Button.jsx";

export default function ConfirmModal({ open, title = "Confirm", message, onConfirm, onCancel, confirmLabel = "Delete" }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1">{confirmLabel}</Button>
        </div>
      }
    >
      <Alert tone="danger">{message}</Alert>
    </Modal>
  );
}
