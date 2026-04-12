'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSidebar({ activePath = '' }) {
  const router = useRouter();

  const [peopleExpanded,      setPeopleExpanded]      = useState(activePath.startsWith('/admin/users') || activePath.startsWith('/admin/attendance'));
  const [leaveExpanded,       setLeaveExpanded]       = useState(activePath.startsWith('/admin/leaves'));
  const [financeExpanded,     setFinanceExpanded]     = useState(activePath.startsWith('/admin/expenses') || activePath.startsWith('/admin/payroll'));
  const [assetsExpanded,      setAssetsExpanded]      = useState(activePath.startsWith('/admin/assets'));
  const [performanceExpanded, setPerformanceExpanded] = useState(activePath.startsWith('/admin/performance'));
  const [engageExpanded,      setEngageExpanded]      = useState(activePath.startsWith('/admin/surveys') || activePath.startsWith('/admin/engage'));
  const [settingsExpanded,    setSettingsExpanded]    = useState(activePath.startsWith('/admin/settings'));

  const nav = (path) => router.push(path);
  const is   = (path) => activePath === path ? 'active' : '';

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">

          <li className="sidebar-section-label">ADMIN</li>

          {/* Dashboard */}
          <li className={`sidebar-item ${is('/admin')}`} onClick={() => nav('/admin')}>
            <span className="sidebar-icon">⊞</span>
            <span>Dashboard</span>
          </li>

          {/* Analytics */}
          <li className={`sidebar-item ${is('/admin/analytics')}`} onClick={() => nav('/admin/analytics')}>
            <span className="sidebar-icon">📊</span>
            <span>Analytics</span>
          </li>

          {/* ── People ── */}
          <li className="sidebar-item sidebar-item-group">
            <div className="sidebar-item-header" onClick={() => setPeopleExpanded(!peopleExpanded)}>
              <span className="sidebar-icon">👥</span>
              <span>People</span>
              <span className={`sidebar-arrow ${peopleExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {peopleExpanded && (
              <ul className="sidebar-submenu">
                <li className={`sidebar-subitem ${is('/admin/users')}`}        onClick={() => nav('/admin/users')}>Employees</li>
                <li className={`sidebar-subitem ${is('/admin/attendance')}`}   onClick={() => nav('/admin/attendance')}>Attendance</li>
              </ul>
            )}
          </li>

          {/* ── Leave ── */}
          <li className="sidebar-item sidebar-item-group">
            <div className="sidebar-item-header" onClick={() => setLeaveExpanded(!leaveExpanded)}>
              <span className="sidebar-icon">📅</span>
              <span>Leave</span>
              <span className={`sidebar-arrow ${leaveExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {leaveExpanded && (
              <ul className="sidebar-submenu">
                <li className={`sidebar-subitem ${is('/admin/leaves')}`}           onClick={() => nav('/admin/leaves')}>Leave Requests</li>
                <li className={`sidebar-subitem ${is('/admin/leaves/policies')}`}  onClick={() => nav('/admin/leaves/policies')}>Leave Policies</li>
                <li className={`sidebar-subitem ${is('/admin/leaves/holidays')}`}  onClick={() => nav('/admin/leaves/holidays')}>Holiday Calendar</li>
              </ul>
            )}
          </li>

          {/* ── Assets ── */}
          <li className="sidebar-item sidebar-item-group">
            <div className="sidebar-item-header" onClick={() => setAssetsExpanded(!assetsExpanded)}>
              <span className="sidebar-icon">🖥️</span>
              <span>Assets</span>
              <span className={`sidebar-arrow ${assetsExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {assetsExpanded && (
              <ul className="sidebar-submenu">
                <li className={`sidebar-subitem ${is('/admin/assets')}`}           onClick={() => nav('/admin/assets')}>Asset Requests</li>
                <li className={`sidebar-subitem ${is('/admin/assets/inventory')}`} onClick={() => nav('/admin/assets/inventory')}>Inventory</li>
              </ul>
            )}
          </li>

          {/* ── Finance ── */}
          <li className="sidebar-item sidebar-item-group">
            <div className="sidebar-item-header" onClick={() => setFinanceExpanded(!financeExpanded)}>
              <span className="sidebar-icon">💰</span>
              <span>Finance</span>
              <span className={`sidebar-arrow ${financeExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {financeExpanded && (
              <ul className="sidebar-submenu">
                <li className={`sidebar-subitem ${is('/admin/expenses')}`}                    onClick={() => nav('/admin/expenses')}>Expenses</li>
                <li className={`sidebar-subitem ${is('/admin/payroll')}`}                     onClick={() => nav('/admin/payroll')}>Payroll</li>
                <li className={`sidebar-subitem ${is('/admin/payroll/salary-structure')}`}    onClick={() => nav('/admin/payroll/salary-structure')}>Salary Structure</li>
              </ul>
            )}
          </li>

          {/* ── Performance ── */}
          <li className="sidebar-item sidebar-item-group">
            <div className="sidebar-item-header" onClick={() => setPerformanceExpanded(!performanceExpanded)}>
              <span className="sidebar-icon">📈</span>
              <span>Performance</span>
              <span className={`sidebar-arrow ${performanceExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {performanceExpanded && (
              <ul className="sidebar-submenu">
                <li className={`sidebar-subitem ${is('/admin/performance/cycles')}`} onClick={() => nav('/admin/performance/cycles')}>Review Cycles</li>
              </ul>
            )}
          </li>

          {/* ── Engagement ── */}
          <li className="sidebar-item sidebar-item-group">
            <div className="sidebar-item-header" onClick={() => setEngageExpanded(!engageExpanded)}>
              <span className="sidebar-icon">🎯</span>
              <span>Engagement</span>
              <span className={`sidebar-arrow ${engageExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {engageExpanded && (
              <ul className="sidebar-submenu">
                <li className={`sidebar-subitem ${is('/admin/surveys')}`} onClick={() => nav('/admin/surveys')}>Surveys</li>
              </ul>
            )}
          </li>

          {/* Exit */}
          <li className={`sidebar-item ${is('/admin/exit')}`} onClick={() => nav('/admin/exit')}>
            <span className="sidebar-icon">🚪</span>
            <span>Exit & Offboarding</span>
          </li>

          {/* Audit Logs */}
          <li className={`sidebar-item ${is('/admin/audit-logs')}`} onClick={() => nav('/admin/audit-logs')}>
            <span className="sidebar-icon">🔍</span>
            <span>Audit Logs</span>
          </li>

          {/* ── Settings ── */}
          <li className="sidebar-item sidebar-item-group">
            <div className="sidebar-item-header" onClick={() => setSettingsExpanded(!settingsExpanded)}>
              <span className="sidebar-icon">⚙️</span>
              <span>Settings</span>
              <span className={`sidebar-arrow ${settingsExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {settingsExpanded && (
              <ul className="sidebar-submenu">
                <li className={`sidebar-subitem ${is('/admin/settings')}`}                       onClick={() => nav('/admin/settings')}>Company Profile</li>
                <li className={`sidebar-subitem ${is('/admin/settings/notifications')}`}         onClick={() => nav('/admin/settings/notifications')}>Notifications</li>
              </ul>
            )}
          </li>

          <li className="sidebar-divider" />

          <li className="sidebar-item" onClick={() => nav('/dashboard')}>
            <span className="sidebar-icon">↩</span>
            <span>Employee View</span>
          </li>

        </ul>
      </nav>
    </aside>
  );
}
