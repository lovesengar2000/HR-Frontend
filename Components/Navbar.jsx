'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar({ onLogout, userName, userInitial }) {
  const router = useRouter();
  const initial = userInitial || userName?.[0]?.toUpperCase() || 'U';
  const displayName = userName || 'User';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (path) => {
    setMenuOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout?.();
  };

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

          {/* Profile dropdown */}
          <div className="nav-profile-wrapper" ref={menuRef}>
            <button
              className="nav-profile-trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Open profile menu"
            >
              <div className="nav-avatar">{initial}</div>
              <span className="nav-username">{displayName}</span>
              <span className={`nav-profile-chevron ${menuOpen ? 'open' : ''}`}>›</span>
            </button>

            {menuOpen && (
              <div className="nav-profile-menu">
                <div className="nav-profile-menu-header">
                  <div className="nav-profile-menu-avatar">{initial}</div>
                  <div>
                    <div className="nav-profile-menu-name">{displayName}</div>
                    <div className="nav-profile-menu-role">Employee</div>
                  </div>
                </div>

                <div className="nav-profile-menu-divider" />

                <button className="nav-profile-menu-item" onClick={() => handleNav('/profile')}>
                  <span>👤</span>
                  <span>View Profile</span>
                </button>
                <button className="nav-profile-menu-item" onClick={() => handleNav('/profile/change-password')}>
                  <span>🔑</span>
                  <span>Change Password</span>
                </button>

                <div className="nav-profile-menu-divider" />

                <button className="nav-profile-menu-item nav-profile-menu-logout" onClick={handleLogout}>
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
