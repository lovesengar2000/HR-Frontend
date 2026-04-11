'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSidebar({ activePath = '' }) {
  const router = useRouter();
  const [peopleExpanded, setPeopleExpanded] = useState(
    activePath.startsWith('/admin/users') || activePath.startsWith('/admin/attendance')
  );
  const [leaveExpanded, setLeaveExpanded] = useState(
    activePath.startsWith('/admin/leaves')
  );
  const [financeExpanded, setFinanceExpanded] = useState(
    activePath.startsWith('/admin/expenses') || activePath.startsWith('/admin/payroll')
  );

  const nav = (path) => router.push(path);

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">

          {/* Admin label */}
          <li className="sidebar-section-label">ADMIN</li>

          {/* Dashboard */}
          <li
            className={`sidebar-item ${activePath === '/admin' ? 'active' : ''}`}
            onClick={() => nav('/admin')}
          >
            <span className="sidebar-icon">⊞</span>
            <span>Dashboard</span>
          </li>

          {/* People Management */}
          <li className="sidebar-item sidebar-item-group">
            <div
              className="sidebar-item-header"
              onClick={() => setPeopleExpanded(!peopleExpanded)}
            >
              <span className="sidebar-icon">👥</span>
              <span>People</span>
              <span className={`sidebar-arrow ${peopleExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {peopleExpanded && (
              <ul className="sidebar-submenu">
                <li
                  className={`sidebar-subitem ${activePath === '/admin/users' ? 'active' : ''}`}
                  onClick={() => nav('/admin/users')}
                >
                  Employees
                </li>
                <li
                  className={`sidebar-subitem ${activePath === '/admin/attendance' ? 'active' : ''}`}
                  onClick={() => nav('/admin/attendance')}
                >
                  Attendance
                </li>
              </ul>
            )}
          </li>

          {/* Leave Management */}
          <li className="sidebar-item sidebar-item-group">
            <div
              className="sidebar-item-header"
              onClick={() => setLeaveExpanded(!leaveExpanded)}
            >
              <span className="sidebar-icon">📅</span>
              <span>Leave</span>
              <span className={`sidebar-arrow ${leaveExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {leaveExpanded && (
              <ul className="sidebar-submenu">
                <li
                  className={`sidebar-subitem ${activePath === '/admin/leaves' ? 'active' : ''}`}
                  onClick={() => nav('/admin/leaves')}
                >
                  Leave Requests
                </li>
              </ul>
            )}
          </li>

          {/* Assets */}
          <li
            className={`sidebar-item ${activePath === '/admin/assets' ? 'active' : ''}`}
            onClick={() => nav('/admin/assets')}
          >
            <span className="sidebar-icon">🖥️</span>
            <span>Assets</span>
          </li>

          {/* Finance */}
          <li className="sidebar-item sidebar-item-group">
            <div
              className="sidebar-item-header"
              onClick={() => setFinanceExpanded(!financeExpanded)}
            >
              <span className="sidebar-icon">💰</span>
              <span>Finance</span>
              <span className={`sidebar-arrow ${financeExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {financeExpanded && (
              <ul className="sidebar-submenu">
                <li
                  className={`sidebar-subitem ${activePath === '/admin/expenses' ? 'active' : ''}`}
                  onClick={() => nav('/admin/expenses')}
                >
                  Expenses
                </li>
              </ul>
            )}
          </li>

          {/* Divider */}
          <li className="sidebar-divider" />

          {/* Switch to Employee View */}
          <li
            className="sidebar-item"
            onClick={() => nav('/dashboard')}
          >
            <span className="sidebar-icon">↩</span>
            <span>Employee View</span>
          </li>

        </ul>
      </nav>
    </aside>
  );
}
