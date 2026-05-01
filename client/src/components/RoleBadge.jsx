function RoleBadge({ role }) {
  const className = role === "admin" ? "badge badge-admin" : "badge badge-member";
  const label = role === "admin" ? "Admin" : "Member";

  return (
    <span className={className} style={{ fontSize: '10px' }}>
      {label}
    </span>
  );
}

export default RoleBadge;
