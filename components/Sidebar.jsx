'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ activePath = '' }) {
  const router = useRouter();
  const [meExpanded,      setMeExpanded]      = useState(activePath.startsWith('/me'));
  const [financeExpanded, setFinanceExpanded] = useState(activePath.startsWith('/finance'));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">HRM</span>
      </div>
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">

          {/* Home */}
          <li
            className={`sidebar-item ${activePath === '/dashboard' ? 'active' : ''}`}
            onClick={() => router.push('/dashboard')}
          >
            <span className="sidebar-icon">⊞</span>
            <span>Home</span>
          </li>

          {/* Me */}
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
                <li
                  className={`sidebar-subitem ${activePath === '/me/expense' ? 'active' : ''}`}
                  onClick={() => router.push('/me/expense')}
                >
                  Expense & Travel
                </li>
              </ul>
            )}
          </li>

          {/* Inbox */}
          <li className="sidebar-item">
            <span className="sidebar-icon">📥</span>
            <span>Inbox</span>
          </li>

          {/* My Team */}
          <li className="sidebar-item">
            <span className="sidebar-icon">👥</span>
            <span>My Team</span>
          </li>

          {/* My Finances */}
          <li className="sidebar-item sidebar-item-group">
            <div
              className="sidebar-item-header"
              onClick={() => setFinanceExpanded(!financeExpanded)}
            >
              <span className="sidebar-icon">💰</span>
              <span>My Finances</span>
              <span className={`sidebar-arrow ${financeExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {financeExpanded && (
              <ul className="sidebar-submenu">
                <li
                  className={`sidebar-subitem ${activePath === '/finance/summary' ? 'active' : ''}`}
                  onClick={() => router.push('/finance/summary')}
                >
                  Summary
                </li>
                <li
                  className={`sidebar-subitem ${activePath === '/finance/pay' ? 'active' : ''}`}
                  onClick={() => router.push('/finance/pay')}
                >
                  My Pay
                </li>
                <li
                  className={`sidebar-subitem ${activePath === '/finance/tax' ? 'active' : ''}`}
                  onClick={() => router.push('/finance/tax')}
                >
                  Manage Tax
                </li>
              </ul>
            )}
          </li>

          {/* Org */}
          <li className="sidebar-item">
            <span className="sidebar-icon">🏢</span>
            <span>Org</span>
          </li>

          {/* Engage */}
          <li className="sidebar-item">
            <span className="sidebar-icon">🎯</span>
            <span>Engage</span>
          </li>

          {/* Performance */}
          <li className="sidebar-item">
            <span className="sidebar-icon">📊</span>
            <span>Performance</span>
          </li>

        </ul>
      </nav>
    </aside>
  );
}
