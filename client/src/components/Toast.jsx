import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => {
      const updated = [...prev, { id, message, type }];
      return updated.slice(-4);
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast: addToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ message, type, onClose }) {
  const config = {
    success: { color: 'var(--green)', icon: '✓' },
    error: { color: 'var(--red)', icon: '✕' },
    warning: { color: 'var(--amber)', icon: '!' },
    info: { color: 'var(--blue)', icon: 'i' },
  };

  const theme = config[type] || config.success;

  return (
    <div className="toast-premium">
      <div className="toast-accent" style={{ background: theme.color }} />
      <div className="toast-icon-area" style={{ background: `${theme.color}20`, color: theme.color }}>
        {theme.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: theme.color }}>
          {type}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px' }}>
          {message}
        </div>
      </div>
      <button 
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
      >
        ×
      </button>
      <div className="toast-progress" style={{ background: theme.color }} />
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
