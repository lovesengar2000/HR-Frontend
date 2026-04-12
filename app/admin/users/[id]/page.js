'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import AdminSidebar from '../../../../components/AdminSidebar';
import '../../../styles/dashboard.css';

/* ─────────────────────────────────────────────────────────────
   ManagerPicker — searchable employee selector
───────────────────────────────────────────────────────────── */
function ManagerPicker({ employees, currentId, excludeId, onChange }) {
  const [query,    setQuery]    = useState('');
  const [open,     setOpen]     = useState(false);
  const wrapRef = useRef(null);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = employees.find(
    (e) => (e.id || e.employeeId) === currentId
  );

  const filtered = employees.filter((e) => {
    if ((e.id || e.employeeId) === excludeId) return false; // can't be own manager
    const name = `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || e.email || '';
    const dept = e.departmentName || e.department || '';
    const q    = query.toLowerCase();
    return (
      name.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      dept.toLowerCase().includes(q)
    );
  });

  const handleSelect = (emp) => {
    onChange(emp.id || emp.employeeId);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div className="manager-picker" ref={wrapRef}>
      {/* Trigger */}
      <div
        className={`manager-picker-trigger ${open ? 'open' : ''}`}
        onClick={() => { setOpen((v) => !v); }}
      >
        {selected ? (
          <div className="manager-picker-selected">
            <div className="manager-picker-avatar">
              {((selected.firstName || selected.name || selected.email || '?')[0]).toUpperCase()}
            </div>
            <div className="manager-picker-info">
              <span className="manager-picker-name">
                {`${selected.firstName || ''} ${selected.lastName || ''}`.trim() || selected.name || selected.email}
              </span>
              <span className="manager-picker-sub">
                {selected.jobTitle || selected.designation || 'Employee'}
                {(selected.departmentName || selected.department) ? ` · ${selected.departmentName || selected.department}` : ''}
              </span>
            </div>
            <button className="manager-picker-clear" onClick={handleClear} title="Clear manager">✕</button>
          </div>
        ) : (
          <span className="manager-picker-placeholder">Search and select a manager…</span>
        )}
        <span className="manager-picker-chevron">{open ? '▲' : '▼'}</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="manager-picker-dropdown">
          <div className="manager-picker-search-wrap">
            <span className="manager-picker-search-icon">🔍</span>
            <input
              className="manager-picker-search-input"
              type="text"
              placeholder="Type name, email or department…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="manager-picker-list">
            {filtered.length === 0 ? (
              <div className="manager-picker-empty">No employees match "{query}"</div>
            ) : (
              filtered.map((emp) => {
                const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || emp.email || '—';
                const isActive = (emp.id || emp.employeeId) === currentId;
                return (
                  <button
                    key={emp.id || emp.employeeId}
                    className={`manager-picker-item ${isActive ? 'selected' : ''}`}
                    onClick={() => handleSelect(emp)}
                  >
                    <div className="manager-picker-item-avatar">
                      {(name[0] || '?').toUpperCase()}
                    </div>
                    <div className="manager-picker-item-info">
                      <div className="manager-picker-item-name">{name}</div>
                      <div className="manager-picker-item-sub">
                        {emp.jobTitle || emp.designation || 'Employee'}
                        {(emp.departmentName || emp.department) ? ` · ${emp.departmentName || emp.department}` : ''}
                      </div>
                    </div>
                    {isActive && <span className="manager-picker-item-check">✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'personal',    label: 'Personal Info',   icon: '👤' },
  { id: 'employment',  label: 'Employment',       icon: '💼' },
  { id: 'bank',        label: 'Bank & Finance',   icon: '🏦' },
  { id: 'salary',      label: 'Salary',           icon: '💰' },
  { id: 'system',      label: 'Account & Access', icon: '🔐' },
];

const GENDER_OPTIONS        = ['', 'MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];
const EMPLOYMENT_TYPE_OPT   = ['', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT'];
const ROLE_OPTIONS          = ['EMPLOYEE', 'MANAGER', 'COMPANY_ADMIN'];
const STATUS_OPTIONS        = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED'];
const WORK_LOCATION_OPT     = ['', 'OFFICE', 'REMOTE', 'HYBRID'];
const BLOOD_GROUP_OPT       = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ACCOUNT_TYPE_OPT      = ['', 'SAVINGS', 'CURRENT'];

export default function EditEmployeePage() {
  const router   = useRouter();
  const { id }   = useParams();

  const [adminUser,     setAdminUser]     = useState(null);
  const [adminEmp,      setAdminEmp]      = useState(null);
  const [allEmployees,  setAllEmployees]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [activeTab,     setActiveTab]     = useState('personal');
  const [message,       setMessage]       = useState({ text: '', type: '' });

  /* ── form state split by section ── */
  const [personal,   setPersonal]   = useState({
    firstName: '', lastName: '', phoneMobile: '', phoneWork: '',
    dateOfBirth: '', gender: '', bloodGroup: '',
    address: '', city: '', state: '', pincode: '', country: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
  });

  const [employment, setEmployment] = useState({
    employeeCode: '', department: '', jobTitle: '', designation: '',
    dateOfJoining: '', dateOfConfirmation: '', employmentType: '',
    workLocation: '', managerEmployeeId: '', probationPeriod: '',
  });

  const [bank, setBank] = useState({
    bankName: '', accountNumber: '', accountHolderName: '',
    ifscCode: '', bankBranch: '', accountType: '',
    pan: '', uan: '', pfNumber: '', esiNumber: '',
  });

  const [salary, setSalary] = useState({
    ctc: '', basicSalary: '', hra: '', specialAllowance: '',
    pfContribution: '', professionalTax: '', salaryStructureId: '',
    paymentMode: '', paymentCycle: '',
  });

  const [system, setSystem] = useState({
    email: '', role: 'EMPLOYEE', status: 'ACTIVE',
  });

  /* ──────────────────────────────────────────────── */
  const flash = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      /* Verify admin session */
      const sessionRes  = await fetch('/api/users/getData', { credentials: 'include' });
      const sessionRaw  = await sessionRes.json();
      const sessionData = JSON.parse(sessionRaw);
      if (sessionRes.status !== 200) { router.push('/'); return; }
      setAdminUser(sessionData.user);
      setAdminEmp(sessionData.employee);

      /* Fetch all employees (for manager picker) + target employee in parallel */
      const [empRes, allRes] = await Promise.all([
        fetch(`/api/admin/users/${id}`, { credentials: 'include' }),
        fetch(`/api/admin/users?companyId=${sessionData.user.companyId}`, { credentials: 'include' }),
      ]);
      if (!empRes.ok) { flash('Employee not found.', 'error'); return; }
      const emp    = await empRes.json();
      const allRaw = allRes.ok ? await allRes.json() : [];
      setAllEmployees(Array.isArray(allRaw) ? allRaw : allRaw.data || []);
      hydrateForms(emp);
    } catch (err) {
      flash('Failed to load employee data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hydrateForms = (emp) => {
    setPersonal({
      firstName:                  emp.firstName                  || '',
      lastName:                   emp.lastName                   || '',
      phoneMobile:                emp.phoneMobile                || emp.phone || '',
      phoneWork:                  emp.phoneWork                  || '',
      dateOfBirth:                emp.dateOfBirth                ? emp.dateOfBirth.split('T')[0] : '',
      gender:                     emp.gender                     || '',
      bloodGroup:                 emp.bloodGroup                 || '',
      address:                    emp.address                    || '',
      city:                       emp.city                       || '',
      state:                      emp.state                      || '',
      pincode:                    emp.pincode                    || '',
      country:                    emp.country                    || 'India',
      emergencyContactName:       emp.emergencyContactName       || '',
      emergencyContactPhone:      emp.emergencyContactPhone      || '',
      emergencyContactRelation:   emp.emergencyContactRelation   || '',
    });

    setEmployment({
      employeeCode:       emp.employeeCode       || emp.employeeId   || '',
      department:         emp.departmentName     || emp.department   || '',
      jobTitle:           emp.jobTitle           || '',
      designation:        emp.designation        || '',
      dateOfJoining:      emp.dateOfJoining      ? emp.dateOfJoining.split('T')[0]      : '',
      dateOfConfirmation: emp.dateOfConfirmation ? emp.dateOfConfirmation.split('T')[0] : '',
      employmentType:     emp.employmentType     || '',
      workLocation:       emp.workLocation       || '',
      managerEmployeeId:          emp.managerEmployeeId          || '',
      probationPeriod:    emp.probationPeriod    || '',
    });

    setBank({
      bankName:            emp.bankName            || '',
      accountNumber:       emp.accountNumber       || '',
      accountHolderName:   emp.accountHolderName   || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      ifscCode:            emp.ifscCode            || '',
      bankBranch:          emp.bankBranch          || '',
      accountType:         emp.accountType         || '',
      pan:                 emp.pan                 || '',
      uan:                 emp.uan                 || '',
      pfNumber:            emp.pfNumber            || '',
      esiNumber:           emp.esiNumber           || '',
    });

    setSalary({
      ctc:                emp.ctc                || '',
      basicSalary:        emp.basicSalary        || '',
      hra:                emp.hra                || '',
      specialAllowance:   emp.specialAllowance   || '',
      pfContribution:     emp.pfContribution     || '',
      professionalTax:    emp.professionalTax    || '',
      salaryStructureId:  emp.salaryStructureId  || '',
      paymentMode:        emp.paymentMode        || '',
      paymentCycle:       emp.paymentCycle       || 'MONTHLY',
    });

    setSystem({
      email:  emp.email  || '',
      role:   emp.role   || 'EMPLOYEE',
      status: emp.status || 'ACTIVE',
    });
  };

  /* ── Save current tab ── */
  const handleSave = async () => {
    setSaving(true);
    const payload = {
      companyId:  adminUser.companyId,
      employeeId: id,
      ...personal,
      ...employment,
      ...bank,
      ...salary,
      ...system,
    };
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        flash('Employee updated successfully.');
      } else {
        const err = await res.json();
        flash(err.error || 'Failed to update employee.', 'error');
      }
    } catch {
      flash('Error saving changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/users" />
          <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
        </div>
      </div>
    );
  }

  const adminName = adminEmp
    ? `${adminEmp.firstName || ''} ${adminEmp.lastName || ''}`.trim() || adminUser?.email
    : adminUser?.email;
  const fullName = `${personal.firstName} ${personal.lastName}`.trim() || system.email || 'Employee';

  /* ── Field helpers ── */
  const F = ({ label, required, children }) => (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span className="required-star"> *</span>}
      </label>
      {children}
    </div>
  );

  const inp = (state, setState, key, type = 'text', extra = {}) => (
    <input
      className="form-control"
      type={type}
      value={state[key]}
      onChange={(e) => setState((p) => ({ ...p, [key]: e.target.value }))}
      {...extra}
    />
  );

  const sel = (state, setState, key, options) => (
    <select
      className="form-control"
      value={state[key]}
      onChange={(e) => setState((p) => ({ ...p, [key]: e.target.value }))}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o || '— Select —'}</option>
      ))}
    </select>
  );

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={adminName}
        userInitial={(adminName || 'A')[0].toUpperCase()}
      />
      <div className="app-body">
        <AdminSidebar activePath="/admin/users" />

        <main className="main-content">

          {/* ── Header ── */}
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                className="btn-ghost"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                onClick={() => router.push('/admin/users')}
              >
                ← Back
              </button>
              <div>
                <h1 className="page-title">Edit Employee</h1>
                <p className="page-subtitle">{fullName} · {system.email}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button className="btn-ghost" onClick={() => router.push('/admin/users')}>Discard</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {message.text}
            </div>
          )}

          {/* ── Employee hero strip ── */}
          <div className="HRM-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {(personal.firstName?.[0] || system.email?.[0] || 'E').toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{fullName}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                {employment.jobTitle || employment.designation || 'Employee'}
                {employment.department ? ` · ${employment.department}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="admin-role-chip">{system.role}</span>
              <span className={`status-badge ${system.status === 'ACTIVE' ? 'status-approved' : 'status-rejected'}`}>
                {system.status}
              </span>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="emp-edit-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`emp-edit-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════
              TAB: PERSONAL INFO
          ════════════════════════════════════ */}
          {activeTab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">Basic Details</span></div>
                <div className="form-row-2" style={{ marginTop: '1rem' }}>
                  <F label="First Name" required>{inp(personal, setPersonal, 'firstName')}</F>
                  <F label="Last Name">{inp(personal, setPersonal, 'lastName')}</F>
                </div>
                <div className="form-row-2">
                  <F label="Mobile Phone">{inp(personal, setPersonal, 'phoneMobile', 'tel')}</F>
                  <F label="Work Phone">{inp(personal, setPersonal, 'phoneWork', 'tel')}</F>
                </div>
                <div className="form-row-2">
                  <F label="Date of Birth">{inp(personal, setPersonal, 'dateOfBirth', 'date')}</F>
                  <F label="Gender">{sel(personal, setPersonal, 'gender', GENDER_OPTIONS)}</F>
                </div>
                <div className="form-row-2">
                  <F label="Blood Group">{sel(personal, setPersonal, 'bloodGroup', BLOOD_GROUP_OPT)}</F>
                </div>
              </div>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">Address</span></div>
                <div style={{ marginTop: '1rem' }}>
                  <F label="Street Address">
                    <textarea
                      className="form-control"
                      rows={2}
                      value={personal.address}
                      onChange={(e) => setPersonal((p) => ({ ...p, address: e.target.value }))}
                    />
                  </F>
                </div>
                <div className="form-row-2">
                  <F label="City">{inp(personal, setPersonal, 'city')}</F>
                  <F label="State">{inp(personal, setPersonal, 'state')}</F>
                </div>
                <div className="form-row-2">
                  <F label="Pincode">{inp(personal, setPersonal, 'pincode')}</F>
                  <F label="Country">{inp(personal, setPersonal, 'country')}</F>
                </div>
              </div>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">Emergency Contact</span></div>
                <div className="form-row-2" style={{ marginTop: '1rem' }}>
                  <F label="Contact Name">{inp(personal, setPersonal, 'emergencyContactName')}</F>
                  <F label="Relationship">{inp(personal, setPersonal, 'emergencyContactRelation')}</F>
                </div>
                <div className="form-row-2">
                  <F label="Contact Phone">{inp(personal, setPersonal, 'emergencyContactPhone', 'tel')}</F>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB: EMPLOYMENT
          ════════════════════════════════════ */}
          {activeTab === 'employment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">Job Details</span></div>
                <div className="form-row-2" style={{ marginTop: '1rem' }}>
                  <F label="Employee Code">{inp(employment, setEmployment, 'employeeCode')}</F>
                  <F label="Department">{inp(employment, setEmployment, 'department')}</F>
                </div>
                <div className="form-row-2">
                  <F label="Job Title">{inp(employment, setEmployment, 'jobTitle')}</F>
                  <F label="Designation">{inp(employment, setEmployment, 'designation')}</F>
                </div>
                <div className="form-row-2">
                  <F label="Employment Type">{sel(employment, setEmployment, 'employmentType', EMPLOYMENT_TYPE_OPT)}</F>
                  <F label="Work Location">{sel(employment, setEmployment, 'workLocation', WORK_LOCATION_OPT)}</F>
                </div>
                <div className="form-row-2">
                  <F label="Manager">
                    <ManagerPicker
                      employees={allEmployees}
                      currentId={employment.managerEmployeeId}
                      excludeId={id}
                      onChange={(val) => setEmployment((p) => ({ ...p, managerEmployeeId: val }))}
                    />
                  </F>
                  <F label="Probation Period (days)">{inp(employment, setEmployment, 'probationPeriod', 'number')}</F>
                </div>
              </div>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">Key Dates</span></div>
                <div className="form-row-2" style={{ marginTop: '1rem' }}>
                  <F label="Date of Joining">{inp(employment, setEmployment, 'dateOfJoining', 'date')}</F>
                  <F label="Date of Confirmation">{inp(employment, setEmployment, 'dateOfConfirmation', 'date')}</F>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB: BANK & FINANCE
          ════════════════════════════════════ */}
          {activeTab === 'bank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">Bank Account</span></div>
                <div className="form-row-2" style={{ marginTop: '1rem' }}>
                  <F label="Bank Name">{inp(bank, setBank, 'bankName')}</F>
                  <F label="Branch">{inp(bank, setBank, 'bankBranch')}</F>
                </div>
                <div className="form-row-2">
                  <F label="Account Holder Name">{inp(bank, setBank, 'accountHolderName')}</F>
                  <F label="Account Type">{sel(bank, setBank, 'accountType', ACCOUNT_TYPE_OPT)}</F>
                </div>
                <div className="form-row-2">
                  <F label="Account Number">{inp(bank, setBank, 'accountNumber')}</F>
                  <F label="IFSC Code">{inp(bank, setBank, 'ifscCode')}</F>
                </div>
              </div>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">Tax & Statutory</span></div>
                <div className="form-row-2" style={{ marginTop: '1rem' }}>
                  <F label="PAN Number">{inp(bank, setBank, 'pan')}</F>
                  <F label="UAN (PF)">{inp(bank, setBank, 'uan')}</F>
                </div>
                <div className="form-row-2">
                  <F label="PF Number">{inp(bank, setBank, 'pfNumber')}</F>
                  <F label="ESI Number">{inp(bank, setBank, 'esiNumber')}</F>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB: SALARY
          ════════════════════════════════════ */}
          {activeTab === 'salary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">CTC Breakdown</span></div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.5rem 0 1rem' }}>
                  All amounts are annual figures in INR (₹).
                </p>
                <div className="form-row-2">
                  <F label="Annual CTC (₹)">{inp(salary, setSalary, 'ctc', 'number', { placeholder: '1200000' })}</F>
                  <F label="Basic Salary (₹)">{inp(salary, setSalary, 'basicSalary', 'number')}</F>
                </div>
                <div className="form-row-2">
                  <F label="HRA (₹)">{inp(salary, setSalary, 'hra', 'number')}</F>
                  <F label="Special Allowance (₹)">{inp(salary, setSalary, 'specialAllowance', 'number')}</F>
                </div>
                <div className="form-row-2">
                  <F label="PF Contribution (₹)">{inp(salary, setSalary, 'pfContribution', 'number')}</F>
                  <F label="Professional Tax (₹)">{inp(salary, setSalary, 'professionalTax', 'number')}</F>
                </div>
              </div>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">Payment Settings</span></div>
                <div className="form-row-2" style={{ marginTop: '1rem' }}>
                  <F label="Payment Mode">
                    {sel(salary, setSalary, 'paymentMode', ['', 'BANK_TRANSFER', 'CHEQUE', 'CASH'])}
                  </F>
                  <F label="Payment Cycle">
                    {sel(salary, setSalary, 'paymentCycle', ['', 'MONTHLY', 'BI_MONTHLY', 'WEEKLY'])}
                  </F>
                </div>
                <div className="form-row-2">
                  <F label="Salary Structure ID">
                    {inp(salary, setSalary, 'salaryStructureId', 'text', { placeholder: 'Leave blank to use default' })}
                  </F>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB: SYSTEM / ACCESS
          ════════════════════════════════════ */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="HRM-card">
                <div className="HRM-card-header"><span className="HRM-card-title">Login & Access</span></div>
                <div className="form-row-2" style={{ marginTop: '1rem' }}>
                  <F label="Work Email" required>{inp(system, setSystem, 'email', 'email')}</F>
                  <F label="Role">{sel(system, setSystem, 'role', ROLE_OPTIONS)}</F>
                </div>
                <div className="form-row-2">
                  <F label="Status">{sel(system, setSystem, 'status', STATUS_OPTIONS)}</F>
                </div>

                <div style={{
                  marginTop: '1.25rem', padding: '0.85rem 1rem',
                  background: 'rgba(255,180,0,0.07)', border: '1px solid rgba(255,180,0,0.25)',
                  borderRadius: 10, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5,
                }}>
                  <strong style={{ color: 'var(--amber)' }}>Note:</strong> Changing the role to{' '}
                  <code>COMPANY_ADMIN</code> grants full admin access. Setting status to{' '}
                  <code>TERMINATED</code> or <code>INACTIVE</code> will prevent the employee from logging in.
                </div>
              </div>
            </div>
          )}

          {/* ── Bottom save bar ── */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
            marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)',
          }}>
            <button className="btn-ghost" onClick={() => router.push('/admin/users')}>Discard</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}
