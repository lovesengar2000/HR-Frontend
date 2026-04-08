'use client';

export default function Navbar({ onLogout, userName, userInitial }) {
  const initial = userInitial || userName?.[0]?.toUpperCase() || 'U';
  const displayName = userName || 'User';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="HRM-wordmark">HRM</span>
        </div>

        <div className="nav-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="nav-search-input"
            placeholder="Search people, modules..."
          />
        </div>

        <div className="nav-right">
          <button className="nav-icon-btn" title="Notifications">
            <span>🔔</span>
          </button>
          <button className="nav-icon-btn" title="Help">
            <span>❓</span>
          </button>
          <div className="nav-user">
            <div className="nav-avatar">{initial}</div>
            <span className="nav-username">{displayName}</span>
          </div>
          <button className="nav-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
