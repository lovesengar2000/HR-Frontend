'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import AdminSidebar from '../../../../components/AdminSidebar';
import '../../../styles/dashboard.css';

const ACCRUAL_OPTIONS  = ['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'NONE'];
const GENDER_OPTIONS   = ['ALL', 'MALE', 'FEMALE'];

const EMPTY_POLICY = {
  name: '', code: '', description: '', maxDaysPerYear: '', accrual: 'MONTHLY',
  carryForward: false, maxCarryForward: '', encashable: false,
  genderSpecific: 'ALL', requiresApproval: true, paidLeave: true,
};

export default function LeavePoliciesPage() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [employee, setEmployee] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [message,  setMessage]  = useState({ text: '', type: '' });

  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(EMPTY_POLICY);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteId,    setDeleteId]    = useState(null);

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

      const pr = await fetch(`/api/admin/leaves/policies?companyId=${data.user.companyId}`, { credentials: 'include' });
      if (pr.ok) {
        const pd = await pr.json();
        setPolicies(Array.isArray(pd) ? pd : pd.data || []);
      }
    } catch {
      flash('Failed to load leave policies.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const openCreate = () => { setForm(EMPTY_POLICY); setEditTarget(null); setShowModal(true); };
  const openEdit   = (p) => {
    setForm({
      name: p.name || '', code: p.code || '', description: p.description || '',
      maxDaysPerYear: p.maxDaysPerYear || '', accrual: p.accrual || 'MONTHLY',
      carryForward: p.carryForward || false, maxCarryForward: p.maxCarryForward || '',
      encashable: p.encashable || false, genderSpecific: p.genderSpecific || 'ALL',
      requiresApproval: p.requiresApproval !== false, paidLeave: p.paidLeave !== false,
    });
    setEditTarget(p);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.maxDaysPerYear) { flash('Name and max days are required.', 'error'); return; }
    setSaveLoading(true);
    try {
      const method = editTarget ? 'PUT' : 'POST';
      const body   = { ...form, companyId: user.companyId, ...(editTarget ? { policyId: editTarget.id } : {}) };
      const res = await fetch('/api/admin/leaves/policies', {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        flash(editTarget ? 'Policy updated.' : 'Policy created.');
        setShowModal(false);
        loadData();
      } else {
        const err = await res.json();
        flash(err.error || 'Failed to save policy.', 'error');
      }
    } catch {
      flash('Error saving policy.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (policyId) => {
    try {
      const res = await fetch(`/api/admin/leaves/policies?policyId=${policyId}&companyId=${user.companyId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) { flash('Policy deleted.'); loadData(); }
      else flash('Failed to delete policy.', 'error');
    } catch {
      flash('Error deleting policy.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/leaves/policies" />
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
        <AdminSidebar activePath="/admin/leaves/policies" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Leave Policies</h1>
              <p className="page-subtitle">Configure leave types — CL, SL, PL, carry-forward, and encashment rules</p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn-outline-accent" onClick={() => router.push('/admin/leaves/holidays')}>
                📆 Holiday Calendar
              </button>
              <button className="btn btn-primary" onClick={openCreate}>+ New Policy</button>
            </div>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {policies.length > 0 ? (
            <div className="HRM-card HRM-card-full">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Code</th>
                      <th>Max Days/Year</th>
                      <th>Accrual</th>
                      <th>Carry Forward</th>
                      <th>Encashable</th>
                      <th>Paid</th>
                      <th>Approval</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((p, i) => (
                      <tr key={p.id || i}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="admin-role-chip">{p.code || '—'}</span></td>
                        <td>{p.maxDaysPerYear}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.accrual}</td>
                        <td>
                          {p.carryForward
                            ? <span className="status-badge status-approved">Yes {p.maxCarryForward ? `(max ${p.maxCarryForward})` : ''}</span>
                            : <span className="status-badge status-rejected">No</span>}
                        </td>
                        <td>
                          <span className={`status-badge ${p.encashable ? 'status-approved' : 'status-rejected'}`}>
                            {p.encashable ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${p.paidLeave !== false ? 'status-approved' : 'status-pending'}`}>
                            {p.paidLeave !== false ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.requiresApproval !== false ? 'Required' : 'Auto'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn-table-edit" onClick={() => openEdit(p)}>✏ Edit</button>
                            <button className="btn-reject" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setDeleteId(p.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="HRM-card HRM-card-full">
              <div className="no-data">
                <p>No leave policies configured yet.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Create policies for Casual Leave, Sick Leave, Privilege Leave, etc.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>+ Create First Policy</button>
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
                <h3 className="modal-title">{editTarget ? 'Edit' : 'New'} Leave Policy</h3>
                <p className="modal-subtitle">Set quota, accrual, carry-forward, and approval rules</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className="onboard-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Leave Type Name <span className="required-star">*</span></label>
                  <input className="form-control" placeholder="e.g. Casual Leave"
                    value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Short Code</label>
                  <input className="form-control" placeholder="e.g. CL"
                    value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Max Days / Year <span className="required-star">*</span></label>
                  <input className="form-control" type="number" min="1" placeholder="e.g. 12"
                    value={form.maxDaysPerYear} onChange={(e) => setForm((f) => ({ ...f, maxDaysPerYear: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Accrual Frequency</label>
                  <select className="form-control" value={form.accrual} onChange={(e) => setForm((f) => ({ ...f, accrual: e.target.value }))}>
                    {ACCRUAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-control" placeholder="Brief description (optional)"
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Applicable Gender</label>
                  <select className="form-control" value={form.genderSpecific} onChange={(e) => setForm((f) => ({ ...f, genderSpecific: e.target.value }))}>
                    {GENDER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Carry Forward Days</label>
                  <input className="form-control" type="number" min="0" placeholder="e.g. 5 (leave blank if no CF)"
                    value={form.maxCarryForward} onChange={(e) => setForm((f) => ({ ...f, maxCarryForward: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {[
                  { key: 'carryForward',     label: 'Allow Carry Forward' },
                  { key: 'encashable',       label: 'Encashable' },
                  { key: 'paidLeave',        label: 'Paid Leave' },
                  { key: 'requiresApproval', label: 'Requires Approval' },
                ].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} />
                    {label}
                  </label>
                ))}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Policy'}
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
            <h3 className="modal-title">Delete Policy</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0' }}>
              This will permanently delete this leave policy. Existing leave requests will not be affected.
            </p>
            <div className="modal-actions">
              <button className="btn-reject" onClick={() => handleDelete(deleteId)}>Delete</button>
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
