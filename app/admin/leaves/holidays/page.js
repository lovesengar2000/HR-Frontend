'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import AdminSidebar from '../../../../components/AdminSidebar';
import '../../../styles/dashboard.css';

const HOLIDAY_TYPES = ['NATIONAL', 'REGIONAL', 'COMPANY', 'OPTIONAL'];
const MONTH_NAMES   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const EMPTY_FORM = { name: '', date: '', type: 'NATIONAL', description: '' };

export default function HolidayCalendarPage() {
  const router = useRouter();
  const [user,       setUser]       = useState(null);
  const [employee,   setEmployee]   = useState(null);
  const [holidays,   setHolidays]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [message,    setMessage]    = useState({ text: '', type: '' });
  const [year,       setYear]       = useState(new Date().getFullYear());

  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteId,    setDeleteId]    = useState(null);

  useEffect(() => { loadData(); }, [year]);

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

      const hr = await fetch(`/api/admin/leaves/holidays?companyId=${data.user.companyId}&year=${year}`, { credentials: 'include' });
      if (hr.ok) {
        const hd = await hr.json();
        setHolidays(Array.isArray(hd) ? hd : hd.data || []);
      }
    } catch {
      flash('Failed to load holidays.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) { flash('Name and date are required.', 'error'); return; }
    setSaveLoading(true);
    try {
      const res = await fetch('/api/admin/leaves/holidays', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, companyId: user.companyId }),
      });
      if (res.ok) { flash('Holiday added.'); setShowModal(false); setForm(EMPTY_FORM); loadData(); }
      else { const err = await res.json(); flash(err.error || 'Failed to add holiday.', 'error'); }
    } catch {
      flash('Error adding holiday.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (holidayId) => {
    try {
      const res = await fetch(`/api/admin/leaves/holidays?holidayId=${holidayId}&companyId=${user.companyId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) { flash('Holiday deleted.'); loadData(); }
      else flash('Failed to delete holiday.', 'error');
    } catch {
      flash('Error deleting holiday.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  // Group holidays by month
  const byMonth = Array.from({ length: 12 }, (_, m) =>
    holidays.filter((h) => new Date(h.date).getMonth() === m)
  );

  const typeColor = (t) => {
    if (t === 'NATIONAL') return 'status-approved';
    if (t === 'REGIONAL') return 'status-pending';
    if (t === 'OPTIONAL') return 'status-rejected';
    return 'admin-role-chip';
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/leaves/holidays" />
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
        <AdminSidebar activePath="/admin/leaves/holidays" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Holiday Calendar</h1>
              <p className="page-subtitle">Manage national, regional, and company holidays for {year}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <select className="form-control admin-filter-select" value={year} onChange={(e) => setYear(+e.target.value)}>
                {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>
                + Add Holiday
              </button>
            </div>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* Summary */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Total Holidays</span>
              <span className="stat-tile-value">{holidays.length}</span>
            </div>
            {HOLIDAY_TYPES.map((t) => (
              <div className="stat-tile" key={t}>
                <span className="stat-tile-label">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                <span className="stat-tile-value">{holidays.filter((h) => h.type === t).length}</span>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {MONTH_NAMES.map((month, m) => (
              <div className="HRM-card" key={m}>
                <div className="HRM-card-header">
                  <span className="HRM-card-title">{month} {year}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {byMonth[m].length} holiday{byMonth[m].length !== 1 ? 's' : ''}
                  </span>
                </div>
                {byMonth[m].length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {byMonth[m]
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((h, i) => (
                        <div key={h.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{h.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                            </div>
                            <span className={`status-badge ${typeColor(h.type)}`} style={{ fontSize: '0.68rem', marginTop: '0.2rem', display: 'inline-block' }}>{h.type}</span>
                          </div>
                          <button
                            className="btn-reject"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', flexShrink: 0 }}
                            onClick={() => setDeleteId(h.id)}
                          >✕</button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>No holidays</p>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Add Holiday</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAdd} className="onboard-form">
              <div className="form-group">
                <label className="form-label">Holiday Name <span className="required-star">*</span></label>
                <input className="form-control" placeholder="e.g. Republic Day"
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Date <span className="required-star">*</span></label>
                  <input className="form-control" type="date"
                    value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    {HOLIDAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-control" placeholder="Optional description"
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Adding…' : 'Add Holiday'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Remove Holiday</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0' }}>Remove this holiday from the calendar?</p>
            <div className="modal-actions">
              <button className="btn-reject" onClick={() => handleDelete(deleteId)}>Remove</button>
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
