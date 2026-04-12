'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function AdminPayrollPage() {
  const router = useRouter();
  const [user,        setUser]        = useState(null);
  const [employee,    setEmployee]    = useState(null);
  const [payrollData, setPayrollData] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [runLoading,  setRunLoading]  = useState(false);
  const [message,     setMessage]     = useState({ text: '', type: '' });
  const [showConfirm, setShowConfirm] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());

  useEffect(() => { loadData(); }, [selectedMonth, selectedYear]);

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

      const month = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      const pr    = await fetch(`/api/admin/payroll?companyId=${data.user.companyId}&month=${month}`, { credentials: 'include' });
      if (pr.ok) {
        const pd = await pr.json();
        setPayrollData(Array.isArray(pd) ? pd : pd.data || []);
      }
    } catch {
      flash('Failed to load payroll data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async () => {
    setRunLoading(true);
    try {
      const month = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
      const res = await fetch('/api/admin/payroll', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: user.companyId, month }),
      });
      if (res.ok) {
        flash(`Payroll for ${MONTHS[selectedMonth]} ${selectedYear} processed successfully.`);
        setShowConfirm(false);
        loadData();
      } else {
        const err = await res.json();
        flash(err.error || 'Failed to run payroll.', 'error');
      }
    } catch {
      flash('Error running payroll.', 'error');
    } finally {
      setRunLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const totalGross    = payrollData.reduce((s, e) => s + (e.grossPay   || 0), 0);
  const totalNet      = payrollData.reduce((s, e) => s + (e.netPay     || 0), 0);
  const totalDeduct   = payrollData.reduce((s, e) => s + (e.deductions || 0), 0);

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/payroll" />
          <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
        </div>
      </div>
    );
  }

  const emp = employee || {};
  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || 'A')[0].toUpperCase()} />
      <div className="app-body">
        <AdminSidebar activePath="/admin/payroll" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Payroll</h1>
              <p className="page-subtitle">Process and review monthly employee salaries</p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button className="btn-outline-accent" onClick={() => router.push('/admin/payroll/salary-structure')}>
                ⚙ Salary Structure
              </button>
              <button className="btn btn-primary" onClick={() => setShowConfirm(true)}>
                ▶ Run Payroll
              </button>
            </div>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* Month / Year picker */}
          <div className="HRM-card HRM-card-full">
            <div className="admin-filters-row">
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Period:</label>
                <select className="form-control admin-filter-select" value={selectedMonth} onChange={(e) => setSelectedMonth(+e.target.value)}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select className="form-control admin-filter-select" value={selectedYear} onChange={(e) => setSelectedYear(+e.target.value)}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Summary tiles */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Employees</span>
              <span className="stat-tile-value">{payrollData.length}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Total Gross Pay</span>
              <span className="stat-tile-value">₹{totalGross.toLocaleString('en-IN')}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Total Deductions</span>
              <span className="stat-tile-value stat-amber">₹{totalDeduct.toLocaleString('en-IN')}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Total Net Pay</span>
              <span className="stat-tile-value stat-green">₹{totalNet.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payroll table */}
          <div className="HRM-card HRM-card-full">
            <div className="HRM-card-header">
              <span className="HRM-card-title">
                Payroll — {MONTHS[selectedMonth]} {selectedYear}
              </span>
            </div>

            {payrollData.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Basic Pay</th>
                      <th>Allowances</th>
                      <th>Deductions</th>
                      <th>LOP Days</th>
                      <th>Gross Pay</th>
                      <th>Net Pay</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.map((row, i) => (
                      <tr key={row.employeeId || i}>
                        <td>
                          <div className="admin-emp-cell">
                            <div className="admin-emp-avatar">{(row.employeeName || 'E')[0].toUpperCase()}</div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.employeeName || '—'}</span>
                          </div>
                        </td>
                        <td>{row.department || '—'}</td>
                        <td>₹{(row.basicPay || 0).toLocaleString('en-IN')}</td>
                        <td>₹{(row.allowances || 0).toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--red)' }}>₹{(row.deductions || 0).toLocaleString('en-IN')}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{row.lopDays ?? 0}</td>
                        <td style={{ fontWeight: 600 }}>₹{(row.grossPay || 0).toLocaleString('en-IN')}</td>
                        <td style={{ fontWeight: 700, color: 'var(--green)' }}>₹{(row.netPay || 0).toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`status-badge ${row.status === 'PAID' ? 'status-approved' : row.status === 'PROCESSING' ? 'status-pending' : 'status-rejected'}`}>
                            {row.status || 'DRAFT'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                <p>No payroll data for {MONTHS[selectedMonth]} {selectedYear}.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Click "Run Payroll" to process salaries for this month.
                </p>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Run Payroll Confirm Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 className="modal-title">Run Payroll</h3>
              <button className="modal-close-btn" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              You are about to process payroll for <strong>{MONTHS[selectedMonth]} {selectedYear}</strong>.
              This will calculate net pay for all active employees based on their salary structure, attendance, and leave data.
            </p>
            <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
              Make sure attendance and leave records are finalised before running payroll.
            </div>
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary" disabled={runLoading} onClick={handleRunPayroll}>
                {runLoading ? 'Processing…' : `Confirm & Run Payroll`}
              </button>
              <button className="btn-ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
