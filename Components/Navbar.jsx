'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar({ onLogout, userName, userInitial }) {
  const router = useRouter();
  const initial     = userInitial || userName?.[0]?.toUpperCase() || 'U';
  const displayName = userName || 'User';
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [navOpen,    setNavOpen]    = useState(false); // mobile sidebar drawer
  const menuRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync body class for mobile sidebar drawer
  useEffect(() => {
    if (navOpen) {
      document.body.classList.add('mobile-nav-open');
    } else {
      document.body.classList.remove('mobile-nav-open');
    }
    return () => document.body.classList.remove('mobile-nav-open');
  }, [navOpen]);

  // Close drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setNavOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNav = (path) => {
    setMenuOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    setMenuOpen(false);
    setNavOpen(false);
    onLogout?.();
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">

          {/* Hamburger — mobile only */}
          <button
            className="nav-hamburger"
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setNavOpen((p) => !p)}
          >
            <span className={`nav-hamburger-bar ${navOpen ? 'open' : ''}`} />
            <span className={`nav-hamburger-bar ${navOpen ? 'open' : ''}`} />
            <span className={`nav-hamburger-bar ${navOpen ? 'open' : ''}`} />
          </button>

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
            <button className="nav-icon-btn nav-icon-btn--hide-xs" title="Help">
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

      {/* Mobile overlay — clicking closes the drawer */}
      {navOpen && (
        <div className="mobile-nav-overlay" onClick={() => setNavOpen(false)} />
      )}
    </>
  );
}
