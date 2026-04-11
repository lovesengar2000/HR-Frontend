'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

// ── CSV template columns ──────────────────────────────────────
const CSV_HEADERS = ['name', 'email', 'department', 'designation', 'role', 'phone', 'dateOfJoining'];

const ROLE_OPTIONS   = ['EMPLOYEE', 'MANAGER', 'COMPANY_ADMIN'];
const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];

const EMPTY_FORM = {
  name: '', email: '', department: '', designation: '',
  role: 'EMPLOYEE', phone: '', dateOfJoining: '', status: 'ACTIVE',
};

// ── Parse a simple CSV (no quoted commas needed for our template) ─
function parseCSV(text) {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [], error: 'CSV has no data rows.' };

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const required = ['name', 'email'];
  const missing  = required.filter((r) => !headers.includes(r));
  if (missing.length) return { headers, rows: [], error: `Missing required columns: ${missing.join(', ')}` };

  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter((r) => r.name || r.email); // skip fully empty rows

  return { headers, rows, error: null };
}

export default function AdminUsersPage() {
  const router   = useRouter();
  const fileRef  = useRef(null);

  // ── Core state ────────────────────────────────────────────────
  const [user,      setUser]      = useState(null);
  const [employee,  setEmployee]  = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [message,   setMessage]   = useState({ text: '', type: '' });

  // ── Filters ───────────────────────────────────────────────────
  const [search,     setSearch]     = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // ── Add single employee modal ─────────────────────────────────
  const [showAdd,    setShowAdd]    = useState(false);
  const [addForm,    setAddForm]    = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  // ── Edit employee modal ───────────────────────────────────────
  const [editTarget,  setEditTarget]  = useState(null); // full employee object
  const [editForm,    setEditForm]    = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  // ── Bulk upload modal ─────────────────────────────────────────
  const [showBulk,     setShowBulk]     = useState(false);
  const [bulkRows,     setBulkRows]     = useState([]);   // parsed preview rows
  const [bulkError,    setBulkError]    = useState('');
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [bulkFileName, setBulkFileName] = useState('');

  // ─────────────────────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/users/getData', { method: 'GET', credentials: 'include' });
      const raw  = await res.json();
      const data = JSON.parse(raw);
      if (res.status !== 200) { router.push('/'); return; }
      setUser(data.user);
      setEmployee(data.employee);

      const empRes = await fetch(`/api/admin/users?companyId=${data.user.companyId}`, { credentials: 'include' });
      if (empRes.ok) {
        const empData = await empRes.json();
        console.log('Fetched employees:', empData);
        setEmployees(Array.isArray(empData) ? empData : empData.data || []);
      }
    } catch (err) {
      flash('Failed to load employees.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const flash = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  // ── CSV Template Download ─────────────────────────────────────
  const downloadTemplate = () => {
    const exampleRow = ['John Smith', 'john@company.com', 'Engineering', 'Software Engineer', 'EMPLOYEE', '+91-9876543210', '2025-04-11'];
    const csv = [CSV_HEADERS.join(','), exampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'employee_bulk_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── CSV File Pick ─────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkFileName(file.name);
    setBulkError('');
    setBulkRows([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const { rows, error } = parseCSV(evt.target.result);
      if (error) { setBulkError(error); return; }
      if (rows.length === 0) { setBulkError('No valid rows found in CSV.'); return; }
      setBulkRows(rows);
    };
    reader.readAsText(file);
  };

  // ── Add Single Employee ───────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim()) {
      flash('Name and Email are required.', 'error'); return;
    }
    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addForm, companyId: user.companyId }),
      });
      if (res.ok) {
        flash('Employee added successfully.');
        setShowAdd(false);
        setAddForm(EMPTY_FORM);
        loadData();
      } else {
        const err = await res.json();
        flash(err.error || 'Failed to add employee.', 'error');
      }
    } catch (err) {
      flash('Error: ' + err.message, 'error');
    } finally {
      setAddLoading(false);
    }
  };

  // ── Open Edit Modal ───────────────────────────────────────────
  const openEdit = (emp) => {
    setEditTarget(emp);
    setEditForm({
      name:          (emp.firstName + ' ' + emp.lastName)          || '',
      email:         emp.email         || '',
      department:    emp.department    || '',
      designation:   emp.designation   || emp.jobTitle || '',
      role:          emp.role          || 'EMPLOYEE',
      phone:         emp.phoneMobile   || '',
      dateOfJoining: emp.dateOfJoining || emp.createdAt?.split('T')[0] || '',
      status:        emp.status        || 'ACTIVE',
    });
  };

  // ── Save Edits ────────────────────────────────────────────────
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) {
      flash('Name and Email are required.', 'error'); return;
    }
    setEditLoading(true);
    const employeeId = editTarget.id || editTarget.employeeId;
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, employeeId, companyId: user.companyId }),
      });
      if (res.ok) {
        flash('Employee updated successfully.');
        setEditTarget(null);
        loadData();
      } else {
        const err = await res.json();
        flash(err.error || 'Failed to update employee.', 'error');
      }
    } catch (err) {
      flash('Error: ' + err.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Bulk Submit ───────────────────────────────────────────────
  const handleBulkSubmit = async () => {
    if (bulkRows.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: user.companyId, employees: bulkRows }),
      });
      if (res.ok) {
        const result = await res.json();
        const added  = result.added ?? bulkRows.length;
        flash(`${added} employee(s) added successfully.`);
        setShowBulk(false);
        setBulkRows([]);
        setBulkFileName('');
        if (fileRef.current) fileRef.current.value = '';
        loadData();
      } else {
        const err = await res.json();
        flash(err.error || 'Bulk upload failed.', 'error');
      }
    } catch (err) {
      flash('Error: ' + err.message, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────
  const departments = ['all', ...new Set(employees.map((e) => e.department).filter(Boolean))];

  const filtered = employees.filter((e) => {
    const name = (e.name || e.email || '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptFilter === 'all' || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  // ── Loading shell ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/users" />
          <main className="main-content">
            <div className="loading"><div className="spinner" /></div>
          </main>
        </div>
      </div>
    );
  }

  const currentAdmin = employee || {};

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={currentAdmin.name || user?.email}
        userInitial={(currentAdmin.name || user?.email || 'A')[0].toUpperCase()}
      />
      <div className="app-body">
        <AdminSidebar activePath="/admin/users" />

        <main className="main-content">

          {/* ── Header ── */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Employees</h1>
              <p className="page-subtitle">{employees.length} total employees in this company</p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button className="btn-outline-accent" onClick={() => setShowBulk(true)}>
                ⬆ Bulk Upload
              </button>
              <button className="btn btn-primary" onClick={() => { setAddForm(EMPTY_FORM); setShowAdd(true); }}>
                + Add Employee
              </button>
            </div>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {message.text}
            </div>
          )}

          {/* ── Filters ── */}
          <div className="HRM-card HRM-card-full">
            <div className="admin-filters-row">
              <div className="admin-search-wrap">
                <span className="admin-search-icon">🔍</span>
                <input
                  type="text"
                  className="form-control admin-search-input"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="form-control admin-filter-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="HRM-card HRM-card-full">
            {filtered.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((emp, i) => (
                      <tr key={emp.id || emp.employeeId || i}>
                        <td>
                          <div className="admin-emp-cell">
                            <div className="admin-emp-avatar">
                              {(emp.name || emp.email || 'E')[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {(emp.firstName + ' ' + emp.lastName) || '—'}
                            </span>
                          </div>
                        </td>
                        <td>{emp.email || '—'}</td>
                        <td>{emp.department || '—'}</td>
                        <td>{emp.designation || emp.jobTitle || '—'}</td>
                        <td><span className="admin-role-chip">{emp.role || 'EMPLOYEE'}</span></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {emp.createdAt
                            ? new Date(emp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                        <td>
                          <span className={`status-badge ${emp.status === 'INACTIVE' ? 'status-rejected' : 'status-approved'}`}>
                            {emp.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td>
                          <button className="btn-table-edit" onClick={() => openEdit(emp)}>
                            ✏ Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">
                {search || deptFilter !== 'all' ? 'No employees match your filters.' : 'No employees found.'}
              </p>
            )}
          </div>

        </main>
      </div>

      {/* ════════════════════════════════════════════════════════
          ADD EMPLOYEE MODAL
      ════════════════════════════════════════════════════════ */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">Onboard New Employee</h3>
                <p className="modal-subtitle">Fill in the details to create a new employee account.</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAdd(false)}>✕</button>
            </div>

            <form onSubmit={handleAdd} className="onboard-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required-star">*</span></label>
                  <input className="form-control" placeholder="e.g. Riya Sharma"
                    value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Work Email <span className="required-star">*</span></label>
                  <input className="form-control" type="email" placeholder="riya@company.com"
                    value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-control" placeholder="e.g. Engineering"
                    value={addForm.department} onChange={(e) => setAddForm((f) => ({ ...f, department: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-control" placeholder="e.g. Software Engineer"
                    value={addForm.designation} onChange={(e) => setAddForm((f) => ({ ...f, designation: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="+91-9876543210"
                    value={addForm.phoneMobile} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Joining</label>
                  <input className="form-control" type="date"
                    value={addForm.dateOfJoining} onChange={(e) => setAddForm((f) => ({ ...f, dateOfJoining: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control"
                    value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control"
                    value={addForm.status} onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={addLoading}>
                  {addLoading ? 'Adding…' : 'Add Employee'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          EDIT EMPLOYEE MODAL
      ════════════════════════════════════════════════════════ */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">Edit Employee</h3>
                <p className="modal-subtitle">Update details for <strong>{editTarget.name || editTarget.email}</strong></p>
              </div>
              <button className="modal-close-btn" onClick={() => setEditTarget(null)}>✕</button>
            </div>

            <form onSubmit={handleEdit} className="onboard-form">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required-star">*</span></label>
                  <input className="form-control" placeholder="Full name"
                    value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Work Email <span className="required-star">*</span></label>
                  <input className="form-control" type="email" placeholder="email@company.com"
                    value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-control" placeholder="Department"
                    value={editForm.department} onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-control" placeholder="Designation"
                    value={editForm.designation} onChange={(e) => setEditForm((f) => ({ ...f, designation: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="+91-XXXXXXXXXX"
                    value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Joining</label>
                  <input className="form-control" type="date"
                    value={editForm.dateOfJoining} onChange={(e) => setEditForm((f) => ({ ...f, dateOfJoining: e.target.value }))} />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control"
                    value={editForm.role} onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control"
                    value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setEditTarget(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          BULK UPLOAD MODAL
      ════════════════════════════════════════════════════════ */}
      {showBulk && (
        <div className="modal-overlay" onClick={() => { setShowBulk(false); setBulkRows([]); setBulkError(''); setBulkFileName(''); }}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">Bulk Upload Employees</h3>
                <p className="modal-subtitle">Upload a CSV file to add multiple employees at once.</p>
              </div>
              <button className="modal-close-btn" onClick={() => { setShowBulk(false); setBulkRows([]); setBulkError(''); setBulkFileName(''); }}>✕</button>
            </div>

            {/* Step 1 — Download template */}
            <div className="bulk-step">
              <div className="bulk-step-num">1</div>
              <div className="bulk-step-body">
                <p className="bulk-step-title">Download the template</p>
                <p className="bulk-step-desc">
                  Use the pre-formatted CSV template. Only add data rows — do not change the headers.
                </p>
                <button className="btn-outline-accent" style={{ marginTop: '0.5rem' }} onClick={downloadTemplate}>
                  ⬇ Download Template (CSV)
                </button>
                <div className="bulk-headers-preview">
                  {CSV_HEADERS.map((h) => (
                    <span key={h} className="bulk-header-chip">{h}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2 — Upload file */}
            <div className="bulk-step">
              <div className="bulk-step-num">2</div>
              <div className="bulk-step-body">
                <p className="bulk-step-title">Upload your filled CSV</p>
                <label className="bulk-drop-zone" htmlFor="bulk-csv-input">
                  <span className="bulk-drop-icon">📂</span>
                  <span className="bulk-drop-text">
                    {bulkFileName ? bulkFileName : 'Click to choose a CSV file'}
                  </span>
                  <span className="bulk-drop-hint">Only .csv files · UTF-8 encoding</span>
                  <input
                    id="bulk-csv-input"
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </label>

                {bulkError && (
                  <div className="alert alert-error" style={{ marginTop: '0.5rem' }}>{bulkError}</div>
                )}
              </div>
            </div>

            {/* Step 3 — Preview & submit */}
            {bulkRows.length > 0 && (
              <div className="bulk-step">
                <div className="bulk-step-num">3</div>
                <div className="bulk-step-body" style={{ width: '100%' }}>
                  <p className="bulk-step-title">
                    Preview — <span style={{ color: 'var(--green)' }}>{bulkRows.length} row(s) ready</span>
                  </p>
                  <div className="table-container bulk-preview-table">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          {CSV_HEADERS.map((h) => <th key={h}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.slice(0, 8).map((row, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{i + 1}</td>
                            {CSV_HEADERS.map((h) => (
                              <td key={h} style={{ fontSize: '0.82rem' }}>{row[h] || '—'}</td>
                            ))}
                          </tr>
                        ))}
                        {bulkRows.length > 8 && (
                          <tr>
                            <td colSpan={CSV_HEADERS.length + 1} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              …and {bulkRows.length - 8} more row(s)
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-actions">
              {bulkRows.length > 0 && (
                <button className="btn btn-primary" disabled={bulkLoading} onClick={handleBulkSubmit}>
                  {bulkLoading ? 'Uploading…' : `Upload ${bulkRows.length} Employee(s)`}
                </button>
              )}
              <button className="btn-ghost" onClick={() => { setShowBulk(false); setBulkRows([]); setBulkError(''); setBulkFileName(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
