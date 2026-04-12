'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import AdminSidebar from '../../../../components/AdminSidebar';
import '../../../styles/dashboard.css';

const CYCLE_TYPES = ['QUARTERLY', 'HALF_YEARLY', 'ANNUALLY', 'CUSTOM'];
const STATUSES    = ['DRAFT', 'ACTIVE', 'CLOSED'];

const RATING_SCALES = [
  { value: '5', label: '1–5 Scale' },
  { value: '10', label: '1–10 Scale' },
  { value: 'ABC', label: 'A / B / C Grade' },
];

const EMPTY_FORM = {
  name: '', type: 'QUARTERLY', startDate: '', endDate: '',
  selfReview: true, managerReview: true, peerReview: false,
  ratingScale: '5', description: '',
};

export default function PerformanceCyclesPage() {
  const router = useRouter();
  const [user,       setUser]       = useState(null);
  const [employee,   setEmployee]   = useState(null);
  const [cycles,     setCycles]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [message,    setMessage]    = useState({ text: '', type: '' });

  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saveLoading, setSaveLoading] = useState(false);

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

      const cr = await fetch(`/api/admin/performance/cycles?companyId=${data.user.companyId}`, { credentials: 'include' });
      if (cr.ok) { const cd = await cr.json(); setCycles(Array.isArray(cd) ? cd : cd.data || []); }
    } catch {
      flash('Failed to load review cycles.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true); };
  const openEdit   = (c) => {
    setForm({
      name: c.name || '', type: c.type || 'QUARTERLY',
      startDate: c.startDate?.split('T')[0] || '', endDate: c.endDate?.split('T')[0] || '',
      selfReview: c.selfReview !== false, managerReview: c.managerReview !== false,
      peerReview: c.peerReview || false, ratingScale: c.ratingScale || '5',
      description: c.description || '',
    });
    setEditTarget(c);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate) { flash('Name, start and end dates are required.', 'error'); return; }
    setSaveLoading(true);
    try {
      const method = editTarget ? 'PUT' : 'POST';
      const body   = { ...form, companyId: user.companyId, ...(editTarget ? { cycleId: editTarget.id } : {}) };
      const res = await fetch('/api/admin/performance/cycles', {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) { flash(editTarget ? 'Cycle updated.' : 'Review cycle created.'); setShowModal(false); loadData(); }
      else { const err = await res.json(); flash(err.error || 'Failed to save cycle.', 'error'); }
    } catch {
      flash('Error saving cycle.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const cycleDuration = (c) => {
    if (!c.startDate || !c.endDate) return null;
    const days = Math.round((new Date(c.endDate) - new Date(c.startDate)) / 86400000);
    return `${days} days`;
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/performance/cycles" />
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
        <AdminSidebar activePath="/admin/performance/cycles" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Review Cycles</h1>
              <p className="page-subtitle">Create and manage quarterly, half-yearly, and annual performance reviews</p>
            </div>
            <button className="btn btn-primary" onClick={openCreate}>+ New Cycle</button>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* Stats */}
          <div className="stats-row">
            {STATUSES.map((s) => (
              <div className="stat-tile" key={s}>
                <span className="stat-tile-label">{s}</span>
                <span className={`stat-tile-value ${s === 'ACTIVE' ? 'stat-green' : ''}`}>
                  {cycles.filter((c) => c.status === s || (!c.status && s === 'DRAFT')).length}
                </span>
              </div>
            ))}
          </div>

          {/* Cycles list */}
          {cycles.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {cycles.map((c, i) => {
                const status    = c.status || 'DRAFT';
                const statusCls = status === 'ACTIVE' ? 'status-approved' : status === 'CLOSED' ? 'status-rejected' : 'status-pending';
                return (
                  <div className="HRM-card HRM-card-full" key={c.id || i}>
                    <div className="HRM-card-header">
                      <div>
                        <span className="HRM-card-title">{c.name}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                          <span className="admin-role-chip">{c.type}</span>
                          <span className={`status-badge ${statusCls}`}>{status}</span>
                        </div>
                      </div>
                      <button className="btn-table-edit" onClick={() => openEdit(c)}>✏ Edit</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginTop: '0.85rem' }}>
                      {[
                        { label: 'Start Date', value: c.startDate ? new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                        { label: 'End Date',   value: c.endDate   ? new Date(c.endDate).toLocaleDateString('en-IN',   { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                        { label: 'Duration',   value: cycleDuration(c) || '—' },
                        { label: 'Rating Scale', value: c.ratingScale ? `1–${c.ratingScale}` : '—' },
                        { label: 'Reviews', value: [c.selfReview && 'Self', c.managerReview && 'Manager', c.peerReview && 'Peer'].filter(Boolean).join(' · ') || '—' },
                        { label: 'Participants', value: c.participantCount ? `${c.participantCount} employees` : 'All active' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'var(--surface-secondary)', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {c.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>{c.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="HRM-card HRM-card-full">
              <div className="no-data">
                <p>No review cycles created yet.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Create a cycle to begin performance evaluations.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>+ Create First Cycle</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">{editTarget ? 'Edit' : 'New'} Review Cycle</h3>
                <p className="modal-subtitle">Configure the review window, type, and evaluation criteria</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className="onboard-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Cycle Name <span className="required-star">*</span></label>
                  <input className="form-control" placeholder="e.g. Q1 2026 Review"
                    value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cycle Type</label>
                  <select className="form-control" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    {CYCLE_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Start Date <span className="required-star">*</span></label>
                  <input className="form-control" type="date"
                    value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date <span className="required-star">*</span></label>
                  <input className="form-control" type="date"
                    value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rating Scale</label>
                <select className="form-control" value={form.ratingScale} onChange={(e) => setForm((f) => ({ ...f, ratingScale: e.target.value }))}>
                  {RATING_SCALES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                {[
                  { key: 'selfReview',    label: 'Self Review' },
                  { key: 'managerReview', label: 'Manager Review' },
                  { key: 'peerReview',    label: 'Peer Review' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} />
                    {label}
                  </label>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="2" placeholder="Instructions or notes for this cycle"
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Cycle'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
