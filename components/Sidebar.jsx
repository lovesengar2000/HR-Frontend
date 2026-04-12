'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ activePath = '' }) {
  const router = useRouter();
  const [meExpanded,      setMeExpanded]      = useState(activePath.startsWith('/me'));
  const [financeExpanded, setFinanceExpanded] = useState(activePath.startsWith('/finance'));
  const [orgExpanded,     setOrgExpanded]     = useState(activePath.startsWith('/org'));
  const [engageExpanded,  setEngageExpanded]  = useState(activePath.startsWith('/engage'));
  const [perfExpanded,    setPerfExpanded]    = useState(activePath.startsWith('/performance'));
  const [objExpanded,     setObjExpanded]     = useState(activePath.startsWith('/performance/objectives'));
  const [meetExpanded,    setMeetExpanded]    = useState(activePath.startsWith('/performance/meetings'));

  return (
    <aside className="sidebar">
      {/* <div className="sidebar-logo">
        <span className="sidebar-logo-text">HRM</span>
      </div> */}
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
                <li
                  className={`sidebar-subitem ${activePath === '/assets' ? 'active' : ''}`}
                  onClick={() => router.push('/assets')}
                >
                  Assets
                </li>
                <li
                  className={`sidebar-subitem ${activePath === '/me/resign' ? 'active' : ''}`}
                  onClick={() => router.push('/me/resign')}
                  style={{ color: 'var(--red, #e05252)' }}
                >
                  Resign
                </li>
              </ul>
            )}
          </li>

          {/* Inbox */}
          <li
            className={`sidebar-item ${activePath === '/inbox' ? 'active' : ''}`}
            onClick={() => router.push('/inbox')}
          >
            <span className="sidebar-icon">📥</span>
            <span>Inbox</span>
          </li>

          {/* My Team */}
          <li
            className={`sidebar-item ${activePath === '/my-team' ? 'active' : ''}`}
            onClick={() => router.push('/my-team')}
          >
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
          <li className="sidebar-item sidebar-item-group">
            <div
              className="sidebar-item-header"
              onClick={() => setOrgExpanded(!orgExpanded)}
            >
              <span className="sidebar-icon">🏢</span>
              <span>Org</span>
              <span className={`sidebar-arrow ${orgExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {orgExpanded && (
              <ul className="sidebar-submenu">
                <li
                  className={`sidebar-subitem ${activePath === '/org' ? 'active' : ''}`}
                  onClick={() => router.push('/org')}
                >
                  Organization
                </li>
                <li
                  className={`sidebar-subitem ${activePath === '/org/documents' ? 'active' : ''}`}
                  onClick={() => router.push('/org/documents')}
                >
                  Documents
                </li>
              </ul>
            )}
          </li>

          {/* Engage */}
          <li className="sidebar-item sidebar-item-group">
            <div
              className="sidebar-item-header"
              onClick={() => setEngageExpanded(!engageExpanded)}
            >
              <span className="sidebar-icon">🎯</span>
              <span>Engage</span>
              <span className={`sidebar-arrow ${engageExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {engageExpanded && (
              <ul className="sidebar-submenu">
                <li
                  className={`sidebar-subitem ${activePath === '/engage/announcements' ? 'active' : ''}`}
                  onClick={() => router.push('/engage/announcements')}
                >
                  Announcements
                </li>
                <li
                  className={`sidebar-subitem ${activePath === '/engage/polls' ? 'active' : ''}`}
                  onClick={() => router.push('/engage/polls')}
                >
                  Polls
                </li>
                <li
                  className={`sidebar-subitem ${activePath === '/engage/posts' ? 'active' : ''}`}
                  onClick={() => router.push('/engage/posts')}
                >
                  Posts & Articles
                </li>
              </ul>
            )}
          </li>

          {/* Performance */}
          <li className="sidebar-item sidebar-item-group">
            <div
              className="sidebar-item-header"
              onClick={() => setPerfExpanded(!perfExpanded)}
            >
              <span className="sidebar-icon">📊</span>
              <span>Performance</span>
              <span className={`sidebar-arrow ${perfExpanded ? 'expanded' : ''}`}>›</span>
            </div>
            {perfExpanded && (
              <ul className="sidebar-submenu">

                {/* Objectives */}
                <li className="sidebar-subgroup">
                  <div
                    className={`sidebar-subgroup-header ${activePath.startsWith('/performance/objectives') ? 'active' : ''}`}
                    onClick={() => setObjExpanded(!objExpanded)}
                  >
                    <span>Objectives</span>
                    <span className={`sidebar-sub-arrow ${objExpanded ? 'expanded' : ''}`}>›</span>
                  </div>
                  {objExpanded && (
                    <ul className="sidebar-sub-submenu">
                      <li
                        className={`sidebar-sub-subitem ${activePath === '/performance/objectives/my' ? 'active' : ''}`}
                        onClick={() => router.push('/performance/objectives/my')}
                      >
                        My Objectives
                      </li>
                      <li
                        className={`sidebar-sub-subitem ${activePath === '/performance/objectives/company' ? 'active' : ''}`}
                        onClick={() => router.push('/performance/objectives/company')}
                      >
                        Company Objectives
                      </li>
                    </ul>
                  )}
                </li>

                {/* 1:1 Meetings */}
                <li className="sidebar-subgroup">
                  <div
                    className={`sidebar-subgroup-header ${activePath.startsWith('/performance/meetings') ? 'active' : ''}`}
                    onClick={() => setMeetExpanded(!meetExpanded)}
                  >
                    <span>1:1 Meetings</span>
                    <span className={`sidebar-sub-arrow ${meetExpanded ? 'expanded' : ''}`}>›</span>
                  </div>
                  {meetExpanded && (
                    <ul className="sidebar-sub-submenu">
                      <li
                        className={`sidebar-sub-subitem ${activePath === '/performance/meetings/my' ? 'active' : ''}`}
                        onClick={() => router.push('/performance/meetings/my')}
                      >
                        My Meetings
                      </li>
                      <li
                        className={`sidebar-sub-subitem ${activePath === '/performance/meetings/action-items' ? 'active' : ''}`}
                        onClick={() => router.push('/performance/meetings/action-items')}
                      >
                        Action Items
                      </li>
                      <li
                        className={`sidebar-sub-subitem ${activePath === '/performance/meetings/templates' ? 'active' : ''}`}
                        onClick={() => router.push('/performance/meetings/templates')}
                      >
                        Agenda Templates
                      </li>
                    </ul>
                  )}
                </li>

                {/* Skills */}
                <li
                  className={`sidebar-subitem ${activePath === '/performance/skills' ? 'active' : ''}`}
                  onClick={() => router.push('/performance/skills')}
                >
                  Skills
                </li>

              </ul>
            )}
          </li>

        </ul>
      </nav>
    </aside>
  );
}
