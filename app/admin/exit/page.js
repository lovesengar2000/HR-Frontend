'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

const CHECKLIST_ITEMS = [
  'Resignation letter received',
  'Notice period confirmed',
  'Knowledge transfer completed',
  'Laptop & accessories returned',
  'Access cards & keys returned',
  'Email / system access revoked',
  'Exit interview conducted',
  'Full & final settlement calculated',
  'Experience letter issued',
  'Relieving letter issued',
];

const EXIT_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function ExitManagementPage() {
  const router = useRouter();
  const [user,       setUser]       = useState(null);
  const [employee,   setEmployee]   = useState(null);
  const [exits,      setExits]      = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [message,    setMessage]    = useState({ text: '', type: '' });
  const [filter,     setFilter]     = useState('all');

  const [detailExit,  setDetailExit]  = useState(null);
  const [checklist,   setChecklist]   = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const [showInitiate,    setShowInitiate]    = useState(false);
  const [initiateForm,    setInitiateForm]    = useState({ employeeId: '', lastWorkingDay: '', reason: '', exitType: 'RESIGNATION' });
  const [initiateLoading, setInitiateLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

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

      const [er, ur] = await Promise.all([
        fetch(`/api/admin/exit?companyId=${data.user.companyId}`, { credentials: 'include' }),
        fetch(`/api/admin/users?companyId=${data.user.companyId}`, { credentials: 'include' }),
      ]);

      if (er.ok) { const ed = await er.json(); setExits(Array.isArray(ed) ? ed : ed.data || []); }
      if (ur.ok) { const ud = await ur.json(); setEmployees(Array.isArray(ud) ? ud : ud.data || []); }
    } catch {
      flash('Failed to load exit requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const openDetail = (exit) => {
    setDetailExit(exit);
    const cl = {};
    CHECKLIST_ITEMS.forEach((item) => { cl[item] = exit.checklist?.[item] || false; });
    setChecklist(cl);
  };

  const handleSaveChecklist = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch('/api/admin/exit', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitId: detailExit.id, companyId: user.companyId, checklist }),
      });
      if (res.ok) { flash('Checklist updated.'); loadData(); setDetailExit(null); }
      else flash('Failed to update checklist.', 'error');
    } catch {
      flash('Error updating checklist.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleInitiate = async (e) => {
    e.preventDefault();
    if (!initiateForm.employeeId || !initiateForm.lastWorkingDay) { flash('Employee and last working day are required.', 'error'); return; }
    setInitiateLoading(true);
    try {
      const res = await fetch('/api/admin/exit', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...initiateForm, companyId: user.companyId }),
      });
      if (res.ok) { flash('Exit process initiated.'); setShowInitiate(false); setInitiateForm({ employeeId: '', lastWorkingDay: '', reason: '', exitType: 'RESIGNATION' }); loadData(); }
      else { const err = await res.json(); flash(err.error || 'Failed to initiate exit.', 'error'); }
    } catch {
      flash('Error initiating exit.', 'error');
    } finally {
      setInitiateLoading(false);
    }
  };

  const doneCount = (exit) => {
    if (!exit.checklist) return 0;
    return Object.values(exit.checklist).filter(Boolean).length;
  };

  const filtered = filter === 'all' ? exits : exits.filter((e) => e.status === filter);

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/exit" />
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
        <AdminSidebar activePath="/admin/exit" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Exit & Offboarding</h1>
              <p className="page-subtitle">Manage resignations, notice periods, checklists, and F&F settlements</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowInitiate(true)}>+ Initiate Exit</button>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-tile"><span className="stat-tile-label">Total</span><span className="stat-tile-value">{exits.length}</span></div>
            {EXIT_STATUSES.map((s) => (
              <div className="stat-tile" key={s}>
                <span className="stat-tile-label">{s.replace('_', ' ')}</span>
                <span className={`stat-tile-value ${s === 'COMPLETED' ? 'stat-green' : s === 'IN_PROGRESS' ? 'stat-amber' : ''}`}>
                  {exits.filter((e) => e.status === s).length}
                </span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="HRM-card HRM-card-full">
            <div className="filter-tabs" style={{ margin: 0 }}>
              {[{ key: 'all', label: 'All' }, ...EXIT_STATUSES.map((s) => ({ key: s, label: s.replace('_', ' ') }))].map((t) => (
                <button key={t.key} className={`filter-tab ${filter === t.key ? 'active' : ''}`} onClick={() => setFilter(t.key)}>
                  {t.label}
                </button>
              ))}
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
                      <th>Exit Type</th>
                      <th>Last Working Day</th>
                      <th>Notice Period</th>
                      <th>Checklist</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((exit, i) => {
                      const done  = doneCount(exit);
                      const total = CHECKLIST_ITEMS.length;
                      const pct   = Math.round((done / total) * 100);
                      const statusCls = exit.status === 'COMPLETED' ? 'status-approved' : exit.status === 'IN_PROGRESS' ? 'status-pending' : exit.status === 'CANCELLED' ? 'status-rejected' : '';
                      return (
                        <tr key={exit.id || i}>
                          <td>
                            <div className="admin-emp-cell">
                              <div className="admin-emp-avatar">{(exit.employeeName || 'E')[0].toUpperCase()}</div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{exit.employeeName || '—'}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exit.department || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="admin-role-chip">{exit.exitType || 'RESIGNATION'}</span></td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {exit.lastWorkingDay ? new Date(exit.lastWorkingDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ fontSize: '0.82rem' }}>{exit.noticePeriodDays ? `${exit.noticePeriodDays} days` : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--green)' : 'var(--accent)', borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{done}/{total}</span>
                            </div>
                          </td>
                          <td><span className={`status-badge ${statusCls}`}>{exit.status || 'PENDING'}</span></td>
                          <td>
                            <button className="btn-table-edit" onClick={() => openDetail(exit)}>Checklist</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No exit requests {filter !== 'all' ? `with status "${filter}"` : ''}.</p>
            )}
          </div>
        </main>
      </div>

      {/* Initiate Exit Modal */}
      {showInitiate && (
        <div className="modal-overlay" onClick={() => setShowInitiate(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Initiate Exit Process</h3>
              <button className="modal-close-btn" onClick={() => setShowInitiate(false)}>✕</button>
            </div>
            <form onSubmit={handleInitiate} className="onboard-form">
              <div className="form-group">
                <label className="form-label">Employee <span className="required-star">*</span></label>
                <select className="form-control" value={initiateForm.employeeId} onChange={(e) => setInitiateForm((f) => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">Select employee…</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.departmentName || e.designation}</option>
                  ))}
                </select>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Exit Type</label>
                  <select className="form-control" value={initiateForm.exitType} onChange={(e) => setInitiateForm((f) => ({ ...f, exitType: e.target.value }))}>
                    {['RESIGNATION', 'TERMINATION', 'RETIREMENT', 'CONTRACT_END'].map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Last Working Day <span className="required-star">*</span></label>
                  <input className="form-control" type="date"
                    value={initiateForm.lastWorkingDay} onChange={(e) => setInitiateForm((f) => ({ ...f, lastWorkingDay: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason / Notes</label>
                <textarea className="form-control" rows="2" placeholder="Reason for exit (optional)"
                  value={initiateForm.reason} onChange={(e) => setInitiateForm((f) => ({ ...f, reason: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={initiateLoading}>
                  {initiateLoading ? 'Initiating…' : 'Initiate Exit'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowInitiate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Checklist Detail Modal */}
      {detailExit && (
        <div className="modal-overlay" onClick={() => setDetailExit(null)}>
          <div className="modal-card modal-large" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">Offboarding Checklist</h3>
                <p className="modal-subtitle">{detailExit.employeeName} — Last day: {detailExit.lastWorkingDay ? new Date(detailExit.lastWorkingDay).toLocaleDateString('en-IN') : '—'}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setDetailExit(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
              {CHECKLIST_ITEMS.map((item) => (
                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.85rem', background: checklist[item] ? 'var(--surface-secondary)' : 'transparent', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}>
                  <input
                    type="checkbox"
                    checked={checklist[item] || false}
                    onChange={(e) => setChecklist((c) => ({ ...c, [item]: e.target.checked }))}
                    style={{ width: 16, height: 16, flexShrink: 0 }}
                  />
                  <span style={{ color: checklist[item] ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: checklist[item] ? 'line-through' : 'none', fontSize: '0.9rem' }}>
                    {item}
                  </span>
                  {checklist[item] && <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: '0.85rem' }}>✓</span>}
                </label>
              ))}
            </div>

            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--surface-secondary)', borderRadius: 10 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Progress: <strong>{Object.values(checklist).filter(Boolean).length} / {CHECKLIST_ITEMS.length}</strong> tasks completed
              </span>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" disabled={saveLoading} onClick={handleSaveChecklist}>
                {saveLoading ? 'Saving…' : 'Save Checklist'}
              </button>
              <button className="btn-ghost" onClick={() => setDetailExit(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
