'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import AdminSidebar from '../../../../components/AdminSidebar';
import '../../../styles/dashboard.css';

const COMPONENT_TYPES = ['EARNING', 'DEDUCTION'];

const EMPTY_COMPONENT = { name: '', type: 'EARNING', percentage: '', fixedAmount: '', taxable: true, description: '' };

const DEFAULT_COMPONENTS = [
  { name: 'Basic Salary',    type: 'EARNING',   percentage: '40', fixedAmount: '', taxable: true,  description: 'Base pay (40% of CTC)' },
  { name: 'HRA',             type: 'EARNING',   percentage: '20', fixedAmount: '', taxable: false, description: 'House Rent Allowance' },
  { name: 'Special Allowance', type: 'EARNING', percentage: '20', fixedAmount: '', taxable: true,  description: 'Special performance allowance' },
  { name: 'PF (Employee)',   type: 'DEDUCTION', percentage: '12', fixedAmount: '', taxable: false, description: 'Provident Fund - Employee contribution' },
  { name: 'Professional Tax', type: 'DEDUCTION', percentage: '', fixedAmount: '200', taxable: false, description: 'State professional tax' },
];

export default function SalaryStructurePage() {
  const router = useRouter();
  const [user,       setUser]       = useState(null);
  const [employee,   setEmployee]   = useState(null);
  const [structures, setStructures] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [message,    setMessage]    = useState({ text: '', type: '' });

  const [showCreate,   setShowCreate]   = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [saveLoading,  setSaveLoading]  = useState(false);

  const EMPTY_STRUCTURE = { name: '', description: '', ctc: '', components: DEFAULT_COMPONENTS };
  const [form, setForm] = useState(EMPTY_STRUCTURE);

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

      const sr = await fetch(`/api/admin/payroll/salary-structure?companyId=${data.user.companyId}`, { credentials: 'include' });
      if (sr.ok) {
        const sd = await sr.json();
        setStructures(Array.isArray(sd) ? sd : sd.data || []);
      }
    } catch {
      flash('Failed to load salary structures.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const openCreate = () => {
    setForm(EMPTY_STRUCTURE);
    setEditTarget(null);
    setShowCreate(true);
  };

  const openEdit = (s) => {
    setForm({ name: s.name, description: s.description || '', ctc: s.ctc || '', components: s.components || DEFAULT_COMPONENTS });
    setEditTarget(s);
    setShowCreate(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { flash('Structure name is required.', 'error'); return; }
    setSaveLoading(true);
    try {
      const method = editTarget ? 'PUT' : 'POST';
      const body   = { ...form, companyId: user.companyId, ...(editTarget ? { structureId: editTarget.id } : {}) };
      const res = await fetch('/api/admin/payroll/salary-structure', {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        flash(editTarget ? 'Structure updated.' : 'Structure created.');
        setShowCreate(false);
        loadData();
      } else {
        const err = await res.json();
        flash(err.error || 'Failed to save structure.', 'error');
      }
    } catch {
      flash('Error saving structure.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const updateComponent = (index, field, value) => {
    setForm((f) => {
      const comps = [...f.components];
      comps[index] = { ...comps[index], [field]: value };
      return { ...f, components: comps };
    });
  };

  const addComponent = () => {
    setForm((f) => ({ ...f, components: [...f.components, { ...EMPTY_COMPONENT }] }));
  };

  const removeComponent = (index) => {
    setForm((f) => ({ ...f, components: f.components.filter((_, i) => i !== index) }));
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/payroll/salary-structure" />
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
        <AdminSidebar activePath="/admin/payroll/salary-structure" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Salary Structure</h1>
              <p className="page-subtitle">Configure CTC components — earnings, deductions, PF, taxes</p>
            </div>
            <button className="btn btn-primary" onClick={openCreate}>+ New Structure</button>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* Structures list */}
          {structures.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {structures.map((s, i) => (
                <div className="HRM-card HRM-card-full" key={s.id || i}>
                  <div className="HRM-card-header">
                    <div>
                      <span className="HRM-card-title">{s.name}</span>
                      {s.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.description}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {s.ctc && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CTC: ₹{Number(s.ctc).toLocaleString('en-IN')}</span>}
                      <button className="btn-table-edit" onClick={() => openEdit(s)}>✏ Edit</button>
                    </div>
                  </div>
                  {s.components && s.components.length > 0 && (
                    <div className="table-container" style={{ marginTop: '0.75rem' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Component</th>
                            <th>Type</th>
                            <th>Percentage</th>
                            <th>Fixed Amount</th>
                            <th>Taxable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.components.map((c, j) => (
                            <tr key={j}>
                              <td style={{ fontWeight: 600 }}>{c.name}</td>
                              <td>
                                <span className={`status-badge ${c.type === 'EARNING' ? 'status-approved' : 'status-rejected'}`}>{c.type}</span>
                              </td>
                              <td>{c.percentage ? `${c.percentage}%` : '—'}</td>
                              <td>{c.fixedAmount ? `₹${Number(c.fixedAmount).toLocaleString('en-IN')}` : '—'}</td>
                              <td>{c.taxable ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="HRM-card HRM-card-full">
              <div className="no-data">
                <p>No salary structures defined yet.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Create a structure with CTC components like Basic, HRA, PF, etc.
                </p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>
                  + Create First Structure
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create / Edit Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card modal-large" style={{ maxWidth: 780, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">{editTarget ? 'Edit' : 'New'} Salary Structure</h3>
                <p className="modal-subtitle">Define earnings, deductions, and compliance components</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Structure Name <span className="required-star">*</span></label>
                  <input className="form-control" placeholder="e.g. Standard Engineer CTC"
                    value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual CTC (₹)</label>
                  <input className="form-control" type="number" placeholder="e.g. 1200000"
                    value={form.ctc} onChange={(e) => setForm((f) => ({ ...f, ctc: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-control" placeholder="Short description (optional)"
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Components */}
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Salary Components</span>
                  <button type="button" className="btn-outline-accent" onClick={addComponent}>+ Add Component</button>
                </div>

                {form.components.map((c, idx) => (
                  <div key={idx} style={{ background: 'var(--surface-secondary)', borderRadius: 10, padding: '0.9rem', marginBottom: '0.7rem', border: '1px solid var(--border)' }}>
                    <div className="form-row-2" style={{ marginBottom: '0.5rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Name</label>
                        <input className="form-control" placeholder="e.g. Basic Salary"
                          value={c.name} onChange={(e) => updateComponent(idx, 'name', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Type</label>
                        <select className="form-control" value={c.type} onChange={(e) => updateComponent(idx, 'type', e.target.value)}>
                          {COMPONENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-row-2">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">% of CTC</label>
                        <input className="form-control" type="number" placeholder="e.g. 40"
                          value={c.percentage} onChange={(e) => updateComponent(idx, 'percentage', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Fixed Amount (₹)</label>
                        <input className="form-control" type="number" placeholder="e.g. 200"
                          value={c.fixedAmount} onChange={(e) => updateComponent(idx, 'fixedAmount', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={c.taxable} onChange={(e) => updateComponent(idx, 'taxable', e.target.checked)} />
                        Taxable component
                      </label>
                      <button type="button" className="btn-reject" style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem' }} onClick={() => removeComponent(idx)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Structure'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
