'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

const ACTION_FILTERS = [
  'all', 'LOGIN', 'LOGOUT', 'CREATE_EMPLOYEE', 'UPDATE_EMPLOYEE',
  'APPROVE_LEAVE', 'REJECT_LEAVE', 'APPROVE_EXPENSE', 'REJECT_EXPENSE',
  'RUN_PAYROLL', 'ASSIGN_ASSET', 'INITIATE_EXIT', 'UPDATE_SETTINGS',
];

export default function AuditLogsPage() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [employee, setEmployee] = useState(null);
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [message,  setMessage]  = useState({ text: '', type: '' });

  const [search,   setSearch]   = useState('');
  const [action,   setAction]   = useState('all');
  const [page,     setPage]     = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => { loadData(); }, [action]);

  const flash = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/users/getData', { credentials: 'include' });
      const raw  = await res.json();
      const data = JSON.parse(raw);
      if (res.status !== 200) { router.push('/'); return; }
      setUser(data.user);
      setEmployee(data.employee);

      const actionParam = action !== 'all' ? action : '';
      const lr = await fetch(`/api/admin/audit-logs?companyId=${data.user.companyId}&action=${actionParam}&limit=200`, { credentials: 'include' });
      if (lr.ok) { const ld = await lr.json(); setLogs(Array.isArray(ld) ? ld : ld.data || []); }
    } catch {
      flash('Failed to load audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const actionColor = (a) => {
    if (!a) return '';
    if (a.includes('DELETE') || a.includes('REJECT') || a.includes('TERMINATE')) return 'status-rejected';
    if (a.includes('APPROVE') || a.includes('CREATE') || a.includes('ASSIGN'))   return 'status-approved';
    return 'status-pending';
  };

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return !search || (l.performedBy || '').toLowerCase().includes(q) || (l.action || '').toLowerCase().includes(q) || (l.details || '').toLowerCase().includes(q);
  });

  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/audit-logs" />
          <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
        </div>
      </div>
    );
  }

  const emp = employee || {};

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || 'A')[0].toUpperCase()} />
      <div className="app-body">
        <AdminSidebar activePath="/admin/audit-logs" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Audit Logs</h1>
              <p className="page-subtitle">Track all admin and employee actions across the system</p>
            </div>
            <span className="admin-role-badge">ADMIN</span>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* Filters */}
          <div className="HRM-card HRM-card-full">
            <div className="admin-filters-row">
              <div className="admin-search-wrap">
                <span className="admin-search-icon">🔍</span>
                <input className="form-control admin-search-input" placeholder="Search by user, action, details…"
                  value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <select className="form-control admin-filter-select" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
                {ACTION_FILTERS.map((a) => <option key={a} value={a}>{a === 'all' ? 'All Actions' : a.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="HRM-card HRM-card-full">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing {paginated.length} of {filtered.length} logs
              </span>
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button className="btn-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
                  <button className="btn-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
                </div>
              )}
            </div>

            {paginated.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Performed By</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Details</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((log, i) => (
                      <tr key={log.id || i}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.performedBy || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.performedByRole || ''}</div>
                        </td>
                        <td>
                          <span className={`status-badge ${actionColor(log.action)}`} style={{ fontSize: '0.72rem' }}>
                            {(log.action || '—').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.targetName || log.targetId || '—'}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 200 }}>{log.details || '—'}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.ipAddress || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">{search || action !== 'all' ? 'No logs match your filters.' : 'No audit logs available.'}</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
