'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ activePath = '' }) {
  const router = useRouter();
  const [meExpanded, setMeExpanded] = useState(activePath.startsWith('/me'));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">HRM</span>
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          <li
            className={`sidebar-item ${activePath === '/dashboard' ? 'active' : ''}`}
            onClick={() => router.push('/dashboard')}
          >
            <span className="sidebar-icon">⊞</span>
            <span>Home</span>
          </li>

          <li className="sidebar-item sidebar-item-group">
            <div
              className="sidebar-item-header"
              onClick={() => setMeExpanded(!meExpanded)}
            >
              <span className="sidebar-icon">👤</span>
              <span>Me</span>
              <span className={`sidebar-arrow ${meExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {meExpanded && (
              <ul className="sidebar-submenu">
                <li
                  className={`sidebar-subitem ${activePath === '/me/attendance' ? 'active' : ''}`}
                  onClick={() => router.push('/me/attendance')}
                >
                  Attendance
                </li>
                <li
                  className={`sidebar-subitem ${activePath === '/me/leave' ? 'active' : ''}`}
                  onClick={() => router.push('/me/leave')}
                >
                  Leave
                </li>
              </ul>
            )}
          </li>

          <li className="sidebar-item">
            <span className="sidebar-icon">📥</span>
            <span>Inbox</span>
          </li>
          <li className="sidebar-item">
            <span className="sidebar-icon">👥</span>
            <span>My Team</span>
          </li>
          <li className="sidebar-item">
            <span className="sidebar-icon">💰</span>
            <span>My Finances</span>
          </li>
          <li className="sidebar-item">
            <span className="sidebar-icon">🏢</span>
            <span>Org</span>
          </li>
          <li className="sidebar-item">
            <span className="sidebar-icon">🎯</span>
            <span>Engage</span>
          </li>
          <li className="sidebar-item">
            <span className="sidebar-icon">📊</span>
            <span>Performance</span>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
