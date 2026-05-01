function Skeleton({ width = "100%", height = "20px", borderRadius = "6px", style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <Skeleton width="60%" height="20px" style={{ marginBottom: "12px" }} />
      <Skeleton width="90%" height="14px" style={{ marginBottom: "8px" }} />
      <Skeleton width="85%" height="14px" style={{ marginBottom: "16px" }} />
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <Skeleton width="24px" height="24px" borderRadius="50%" />
        <Skeleton width="120px" height="12px" />
      </div>
    </div>
  );
}

export function SkeletonTaskRow() {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 0" }}>
      <Skeleton width="30%" height="16px" />
      <Skeleton width="15%" height="16px" />
      <Skeleton width="12%" height="16px" />
      <Skeleton width="10%" height="16px" />
      <Skeleton width="10%" height="16px" />
      <Skeleton width="10%" height="16px" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="card skeleton-stat">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <Skeleton width="50%" height="14px" style={{ marginBottom: "8px" }} />
          <Skeleton width="70%" height="28px" />
        </div>
        <Skeleton width="44px" height="44px" borderRadius="50%" />
      </div>
    </div>
  );
}

export function SkeletonKanbanCard() {
  return (
    <div className="card skeleton-kanban">
      <Skeleton width="80%" height="16px" style={{ marginBottom: "12px" }} />
      <Skeleton width="100%" height="12px" style={{ marginBottom: "8px" }} />
      <Skeleton width="60%" height="12px" style={{ marginBottom: "12px" }} />
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <Skeleton width="24px" height="24px" borderRadius="50%" />
        <Skeleton width="40%" height="12px" />
      </div>
    </div>
  );
}

export default Skeleton;
