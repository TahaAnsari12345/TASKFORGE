import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAvatarBg, getInitials } from "../utils/helpers";

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.8"/>
  </svg>
);

const ProjectsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1 4.5C1 3.67 1.67 3 2.5 3H6L7.5 4.5H13.5C14.33 4.5 15 5.17 15 6V12C15 12.83 14.33 13.5 13.5 13.5H2.5C1.67 13.5 1 12.83 1 12V4.5Z" fill="currentColor" opacity="0.8"/>
  </svg>
);

const TasksIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h2M2 8h2M2 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 2H2.5C2 2 1.5 2.5 1.5 3v8c0 .5.5 1 1 1H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M9.5 9.5L12.5 7 9.5 4.5M12.5 7H5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const navItems = [
  { to: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/projects", label: "Projects", icon: <ProjectsIcon /> },
  { to: "/tasks", label: "Tasks", icon: <TasksIcon /> },
];

const getBreadcrumb = (pathname) => {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) {
    return "taskforge / dashboard";
  }
  return `taskforge / ${parts.join(" / ")}`;
};

function Layout({ title, breadcrumb, action, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const avatarStyle = getAvatarBg(user?.name);

  const closeMobileNav = () => setMobileNavOpen(false);
  const toggleMobileNav = () => setMobileNavOpen((current) => !current);

  return (
    <div className="app-layout page-enter">
      <div className={`mobile-nav-backdrop ${mobileNavOpen ? "visible" : ""}`} onClick={closeMobileNav} />
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-logo-section">
          <div className="logo-row">
            <div className="logo-mark"></div>
            <span className="logo-text">TaskForge</span>
          </div>
          <div className="ops-tagline">Operations Center</div>
        </div>

        <nav className="sidebar-nav-section">
          <h4 className="nav-label">WORKSPACE</h4>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              onClick={closeMobileNav}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user-section">
          <div className="user-row">
            <div 
              className="avatar-circle" 
              style={{ background: avatarStyle.bg, color: avatarStyle.color }}
            >
              {getInitials(user?.name)}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || "Guest"}</span>
              <span className="badge badge-member" style={{ fontSize: '9px', padding: '1px 6px' }}>
                {user?.role || "member"}
              </span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={logout}>
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="top-header-bar">
          <button
            className={`mobile-nav-toggle ${mobileNavOpen ? "open" : ""}`}
            onClick={toggleMobileNav}
            aria-label="Toggle navigation"
            aria-expanded={mobileNavOpen}
          >
            <span />
            <span />
            <span />
          </button>
          <div>
            <h1>{title}</h1>
            <div className="breadcrumb">
              {breadcrumb || getBreadcrumb(location.pathname)}
            </div>
          </div>
          {action ? <div className="header-action">{action}</div> : null}
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
