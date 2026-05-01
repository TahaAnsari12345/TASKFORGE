export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toInputDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toISOString().split("T")[0];
}

export function isOverdue(dateStr, status) {
  if (!dateStr || status === "done") return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function getPriorityOrder(priority) {
  return { high: 0, medium: 1, low: 2 }[priority] ?? 1;
}

export function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function truncate(str, maxLen = 80) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

export function getProjectColor(name) {
  const colors = [
    'var(--purple-core)',
    'var(--pink-core)',
    '#22c98a',
    '#5ba4f5',
    '#f0a429'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getAvatarBg(name) {
  const bgs = [
    { bg: 'rgba(139,127,232,0.25)', color: 'var(--purple-glow)' },
    { bg: 'rgba(196,82,122,0.22)', color: 'var(--pink-bright)' },
    { bg: 'rgba(34,201,138,0.18)', color: '#6effd0' },
    { bg: 'rgba(91,164,245,0.2)', color: '#a8d4ff' },
    { bg: 'rgba(240,164,41,0.18)', color: '#ffd07a' },
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgs[Math.abs(hash) % bgs.length];
}
