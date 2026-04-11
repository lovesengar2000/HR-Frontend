'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function calcDuration(clockIn, clockOut) {
  if (!clockIn || !clockOut) return '—';
  const diff = new Date(clockOut) - new Date(clockIn);
  if (diff <= 0) return '—';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default function AdminAttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(() => new Date().toISOString().split('T')[0]); // today
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => { loadData(); }, [dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/getData', { method: 'GET', credentials: 'include' });
      const raw = await res.json();
      const data = JSON.parse(raw);
      if (res.status !== 200) { router.push('/'); return; }
      setUser(data.user);
      setEmployee(data.employee);

      const params = new URLSearchParams({ companyId: data.user.companyId });
      if (dateFilter) params.set('date', dateFilter);

      const attRes = await fetch(`/api/admin/attendance?${params.toString()}`, { credentials: 'include' });
      if (attRes.ok) {
        const attData = await attRes.json();
        const arr = Array.isArray(attData) ? attData : attData.data || [];
        setRecords(arr);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
      setMessage({ text: 'Failed to load attendance records.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const filtered = records.filter((r) => {
    const name = (r.employeeName || r.name || '').toLowerCase();
    return !search || name.includes(search.toLowerCase());
  });

  const presentCount = filtered.filter((r) => r.clockIn || r.status === 'PRESENT').length;
  const absentCount  = filtered.filter((r) => r.status === 'ABSENT').length;
  const lateCount    = filtered.filter((r) => r.status === 'LATE').length;

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/attendance" />
          <main className="main-content">
            <div className="loading"><div className="spinner" /></div>
          </main>
        </div>
      </div>
    );
  }

  const emp = employee || {};

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={emp.name || user?.email}
        userInitial={(emp.name || user?.email || 'A')[0].toUpperCase()}
      />
      <div className="app-body">
        <AdminSidebar activePath="/admin/attendance" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Attendance</h1>
              <p className="page-subtitle">Company-wide attendance records</p>
            </div>
            <span className="admin-role-badge">ADMIN</span>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {message.text}
            </div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Total Records</span>
              <span className="stat-tile-value">{filtered.length}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Present</span>
              <span className="stat-tile-value stat-green">{presentCount}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Absent</span>
              <span className="stat-tile-value stat-red">{absentCount}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Late</span>
              <span className="stat-tile-value stat-amber">{lateCount}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="HRM-card HRM-card-full">
            <div className="admin-filters-row">
              <div className="admin-search-wrap">
                <span className="admin-search-icon">🔍</span>
                <input
                  type="text"
                  className="form-control admin-search-input"
                  placeholder="Search employee…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Date:</span>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 160 }}
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="HRM-card HRM-card-full">
            {filtered.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((record, i) => {
                      const statusCls =
                        record.status === 'PRESENT' ? 'status-approved'
                        : record.status === 'ABSENT'  ? 'status-rejected'
                        : record.status === 'LATE'    ? 'status-pending'
                        : record.clockIn              ? 'status-approved'
                        : 'status-pending';
                      const displayStatus = record.status || (record.clockIn ? 'PRESENT' : 'UNKNOWN');
                      return (
                        <tr key={record.id || record.attendanceId || i}>
                          <td>
                            <div className="admin-emp-cell">
                              <div className="admin-emp-avatar">
                                {(record.employeeName || record.name || 'E')[0].toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {record.employeeName || record.name || '—'}
                              </span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {formatDate(record.date || record.clockIn)}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {formatTime(record.clockIn || record.clockInTime)}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {formatTime(record.clockOut || record.clockOutTime)}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {calcDuration(
                              record.clockIn || record.clockInTime,
                              record.clockOut || record.clockOutTime
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${statusCls}`}>{displayStatus}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No attendance records found for this date.</p>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
