'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import AdminSidebar from '../../../../components/AdminSidebar';
import '../../../styles/dashboard.css';

const ASSET_TYPES     = ['LAPTOP', 'DESKTOP', 'MONITOR', 'MOBILE', 'TABLET', 'HEADSET', 'KEYBOARD', 'MOUSE', 'CHAIR', 'OTHER'];
const STATUS_OPTIONS  = ['AVAILABLE', 'ASSIGNED', 'IN_REPAIR', 'RETIRED', 'LOST'];
const CONDITION_OPTS  = ['NEW', 'GOOD', 'FAIR', 'POOR'];

const EMPTY_FORM = {
  name: '', assetTag: '', type: 'LAPTOP', serialNumber: '', brand: '', model: '',
  purchaseDate: '', purchaseCost: '', warrantyExpiry: '', location: '',
  condition: 'GOOD', status: 'AVAILABLE', notes: '',
};

export default function AssetInventoryPage() {
  const router = useRouter();
  const [user,      setUser]      = useState(null);
  const [employee,  setEmployee]  = useState(null);
  const [assets,    setAssets]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [message,   setMessage]   = useState({ text: '', type: '' });

  const [search,      setSearch]      = useState('');
  const [typeFilter,  setTypeFilter]  = useState('all');
  const [statusFilter,setStatusFilter]= useState('all');

  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
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

      const ar = await fetch(`/api/admin/assets/inventory?companyId=${data.user.companyId}`, { credentials: 'include' });
      if (ar.ok) {
        const ad = await ar.json();
        setAssets(Array.isArray(ad) ? ad : ad.data || []);
      }
    } catch {
      flash('Failed to load asset inventory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true); };
  const openEdit   = (a) => {
    setForm({
      name: a.name || '', assetTag: a.assetTag || '', type: a.type || 'LAPTOP',
      serialNumber: a.serialNumber || '', brand: a.brand || '', model: a.model || '',
      purchaseDate: a.purchaseDate?.split('T')[0] || '',
      purchaseCost: a.purchaseCost || '',
      warrantyExpiry: a.warrantyExpiry?.split('T')[0] || '',
      location: a.location || '', condition: a.condition || 'GOOD',
      status: a.status || 'AVAILABLE', notes: a.notes || '',
    });
    setEditTarget(a);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { flash('Asset name is required.', 'error'); return; }
    setSaveLoading(true);
    try {
      const method = editTarget ? 'PUT' : 'POST';
      const body   = { ...form, companyId: user.companyId, ...(editTarget ? { assetId: editTarget.id } : {}) };
      const res = await fetch('/api/admin/assets/inventory', {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) { flash(editTarget ? 'Asset updated.' : 'Asset added.'); setShowModal(false); loadData(); }
      else { const err = await res.json(); flash(err.error || 'Failed to save asset.', 'error'); }
    } catch {
      flash('Error saving asset.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (assetId) => {
    try {
      const res = await fetch(`/api/admin/assets/inventory?assetId=${assetId}&companyId=${user.companyId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) { flash('Asset deleted.'); loadData(); }
      else flash('Failed to delete asset.', 'error');
    } catch {
      flash('Error deleting asset.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const statusBadge = (s) => {
    if (s === 'AVAILABLE')  return 'status-approved';
    if (s === 'ASSIGNED')   return 'status-pending';
    if (s === 'IN_REPAIR')  return 'status-pending';
    if (s === 'RETIRED')    return 'status-rejected';
    if (s === 'LOST')       return 'status-rejected';
    return '';
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 90;
  };

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !search || (a.name || '').toLowerCase().includes(q) || (a.assetTag || '').toLowerCase().includes(q) || (a.serialNumber || '').toLowerCase().includes(q);
    const matchType   = typeFilter   === 'all' || a.type   === typeFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/assets/inventory" />
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
        <AdminSidebar activePath="/admin/assets/inventory" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Asset Inventory</h1>
              <p className="page-subtitle">Master registry of all company assets — laptops, devices, equipment</p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn-outline-accent" onClick={() => router.push('/admin/assets')}>
                📋 Asset Requests
              </button>
              <button className="btn btn-primary" onClick={openCreate}>+ Add Asset</button>
            </div>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Total Assets</span>
              <span className="stat-tile-value">{assets.length}</span>
            </div>
            {STATUS_OPTIONS.map((s) => (
              <div className="stat-tile" key={s}>
                <span className="stat-tile-label">{s.replace('_', ' ')}</span>
                <span className={`stat-tile-value ${s === 'AVAILABLE' ? 'stat-green' : s === 'IN_REPAIR' || s === 'LOST' ? 'stat-red' : ''}`}>
                  {assets.filter((a) => a.status === s).length}
                </span>
              </div>
            ))}
          </div>

          {/* Warranty alert */}
          {assets.filter((a) => isExpiringSoon(a.warrantyExpiry)).length > 0 && (
            <div className="alert alert-info">
              ⚠ {assets.filter((a) => isExpiringSoon(a.warrantyExpiry)).length} asset(s) have warranty expiring within 90 days.
            </div>
          )}

          {/* Filters */}
          <div className="HRM-card HRM-card-full">
            <div className="admin-filters-row">
              <div className="admin-search-wrap">
                <span className="admin-search-icon">🔍</span>
                <input className="form-control admin-search-input" placeholder="Search by name, tag, serial…"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="form-control admin-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select className="form-control admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="HRM-card HRM-card-full">
            {filtered.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Type</th>
                      <th>Tag / Serial</th>
                      <th>Brand / Model</th>
                      <th>Condition</th>
                      <th>Status</th>
                      <th>Assigned To</th>
                      <th>Warranty</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => (
                      <tr key={a.id || i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</td>
                        <td><span className="admin-role-chip">{a.type}</span></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <div>{a.assetTag || '—'}</div>
                          <div style={{ fontSize: '0.72rem' }}>{a.serialNumber || ''}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{[a.brand, a.model].filter(Boolean).join(' ') || '—'}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{a.condition || '—'}</td>
                        <td><span className={`status-badge ${statusBadge(a.status)}`}>{a.status?.replace('_', ' ')}</span></td>
                        <td style={{ fontSize: '0.82rem' }}>{a.assignedTo || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {a.warrantyExpiry ? (
                            <span style={{ color: isExpiringSoon(a.warrantyExpiry) ? 'var(--amber)' : 'var(--text-muted)' }}>
                              {new Date(a.warrantyExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {isExpiringSoon(a.warrantyExpiry) && ' ⚠'}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button className="btn-table-edit" onClick={() => openEdit(a)}>✏</button>
                            <button className="btn-reject" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => setDeleteId(a.id)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <p>{search || typeFilter !== 'all' || statusFilter !== 'all' ? 'No assets match your filters.' : 'No assets in inventory.'}</p>
                {!search && typeFilter === 'all' && statusFilter === 'all' && (
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>+ Add First Asset</button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card modal-large" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">{editTarget ? 'Edit' : 'Add'} Asset</h3>
                <p className="modal-subtitle">Fill in the asset details for the inventory</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className="onboard-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Asset Name <span className="required-star">*</span></label>
                  <input className="form-control" placeholder="e.g. MacBook Pro 14"
                    value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Asset Tag</label>
                  <input className="form-control" placeholder="e.g. ASSET-001"
                    value={form.assetTag} onChange={(e) => setForm((f) => ({ ...f, assetTag: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-control" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                    {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input className="form-control" placeholder="Manufacturer serial"
                    value={form.serialNumber} onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input className="form-control" placeholder="e.g. Apple"
                    value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input className="form-control" placeholder="e.g. MacBook Pro M2"
                    value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input className="form-control" type="date"
                    value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Purchase Cost (₹)</label>
                  <input className="form-control" type="number" placeholder="e.g. 150000"
                    value={form.purchaseCost} onChange={(e) => setForm((f) => ({ ...f, purchaseCost: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Warranty Expiry</label>
                  <input className="form-control" type="date"
                    value={form.warrantyExpiry} onChange={(e) => setForm((f) => ({ ...f, warrantyExpiry: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-control" placeholder="e.g. HQ - Floor 3"
                    value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select className="form-control" value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}>
                    {CONDITION_OPTS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows="2" placeholder="Any additional notes"
                  value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Asset'}
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
            <h3 className="modal-title">Delete Asset</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0' }}>
              Permanently remove this asset from inventory? This cannot be undone.
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
