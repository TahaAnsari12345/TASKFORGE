import Modal from "./Modal";

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  isLoading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner" /> : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
        <div style={{ 
          width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(240, 82, 82, 0.1)', 
          color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
        }}>
          ⚠️
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{message}</p>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
