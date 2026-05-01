function EmptyState({ icon = "📭", title, subtitle, actionLabel, onAction }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: '32px', marginBottom: '16px' }}>{icon}</div>
      <h3 style={{ marginBottom: '8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', maxWidth: '400px', marginInline: 'auto' }}>
        {subtitle}
      </p>
      {actionLabel && onAction ? (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default EmptyState;
