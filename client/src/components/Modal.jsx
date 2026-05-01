import { useEffect } from "react";

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-premium" onClick={onClose}>
      <div className="modal-card-premium" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header-premium">
          <h3 style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'Syne' }}>{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body-premium">{children}</div>
        {footer ? <div className="modal-footer-premium">{footer}</div> : null}
      </div>
    </div>
  );
}

export default Modal;
