'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

export default function AnalyticsPage() {
  const router = useRouter();
  const [user,       setUser]       = useState(null);
  const [employee,   setEmployee]   = useState(null);
  const [analytics,  setAnalytics]  = useState(null);
  const [employees,  setEmployees]  = useState([]);
  const [leaves,     setLeaves]     = useState([]);
  const [assets,     setAssets]     = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [message,    setMessage]    = useState({ text: '', type: '' });

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

      const cid = data.user.companyId;
      const [ar, ur, lr, asr, er] = await Promise.all([
        fetch(`/api/admin/analytics?companyId=${cid}`, { credentials: 'include' }),
        fetch(`/api/admin/users?companyId=${cid}`,     { credentials: 'include' }),
        fetch(`/api/admin/leaves?companyId=${cid}`,    { credentials: 'include' }),
        fetch(`/api/admin/assets?companyId=${cid}`,    { credentials: 'include' }),
        fetch(`/api/admin/expenses?companyId=${cid}`,  { credentials: 'include' }),
      ]);

      if (ar.ok)  { const ad = await ar.json();  setAnalytics(ad); }
      if (ur.ok)  { const ud = await ur.json();  setEmployees(Array.isArray(ud) ? ud : ud.data || []); }
      if (lr.ok)  { const ld = await lr.json();  setLeaves(Array.isArray(ld) ? ld : ld.data || []); }
      if (asr.ok) { const asd = await asr.json(); setAssets(asd.requests || []); }
      if (er.ok)  { const ed = await er.json();  setExpenses(Array.isArray(ed) ? ed : ed.data || []); }
    } catch {
      flash('Failed to load analytics.', 'error');
    } finally {
      setLoading(false);
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
          <AdminSidebar activePath="/admin/analytics" />
          <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
        </div>
      </div>
    );
  }

  const emp = employee || {};

  // ── Derived metrics ──────────────────────────────────────────────
  const totalEmp      = employees.length;
  const activeEmp     = employees.filter((e) => e.status !== 'INACTIVE').length;
  const inactiveEmp   = totalEmp - activeEmp;
  const newThisMonth  = employees.filter((e) => {
    const d = new Date(e.createdAt || e.dateOfJoining);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  // Department breakdown
  const deptCounts = employees.reduce((acc, e) => {
    const d = e.departmentName || e.department || 'Unassigned';
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const deptSorted = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  const maxDeptCount = deptSorted[0]?.[1] || 1;

  // Leave metrics
  const pendingLeaves  = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedLeaves = leaves.filter((l) => l.status === 'REJECTED').length;

  // Leave type distribution
  const leaveTypeCounts = leaves.reduce((acc, l) => {
    const t = l.leaveTypeName || 'Unknown';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  // Expense metrics
  const totalExpenseAmt   = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingExpenses   = expenses.filter((e) => e.status === 'PENDING').length;
  const approvedExpenses  = expenses.filter((e) => e.status === 'APPROVED').length;
  const approvedExpAmt    = expenses.filter((e) => e.status === 'APPROVED').reduce((s, e) => s + (e.amount || 0), 0);

  // Asset metrics
  const pendingAssets     = assets.filter((a) => a.status === 'PENDING').length;
  const assignedAssets    = assets.filter((a) => a.status === 'ASSIGNED' || a.status === 'APPROVED').length;

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || 'A')[0].toUpperCase()} />
      <div className="app-body">
        <AdminSidebar activePath="/admin/analytics" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Analytics</h1>
              <p className="page-subtitle">Workforce insights, leave trends, expense reports, and asset utilization</p>
            </div>
            <span className="admin-role-badge">ADMIN</span>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* ── Workforce Overview ── */}
          <div className="HRM-card HRM-card-full">
            <div className="HRM-card-header">
              <span className="HRM-card-title">Workforce Overview</span>
            </div>
            <div className="stats-row" style={{ margin: '0.75rem 0 0 0' }}>
              {[
                { label: 'Total Employees', value: totalEmp, cls: '' },
                { label: 'Active',          value: activeEmp, cls: 'stat-green' },
                { label: 'Inactive',        value: inactiveEmp, cls: inactiveEmp ? 'stat-red' : '' },
                { label: 'Joined This Month', value: newThisMonth, cls: newThisMonth ? 'stat-green' : '' },
                { label: 'Departments',     value: deptSorted.length, cls: '' },
              ].map(({ label, value, cls }) => (
                <div className="stat-tile" key={label}>
                  <span className="stat-tile-label">{label}</span>
                  <span className={`stat-tile-value ${cls}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Department Breakdown + Leave Distribution ── */}
          <div className="admin-dashboard-grid">

            {/* Department Breakdown */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Headcount by Department</span>
              </div>
              {deptSorted.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.75rem' }}>
                  {deptSorted.map(([dept, count]) => (
                    <div key={dept}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{dept}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count} ({Math.round((count / totalEmp) * 100)}%)</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${(count / maxDeptCount) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="no-data" style={{ marginTop: '0.5rem' }}>No department data.</p>}
            </div>

            {/* Leave Distribution */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Leave Analytics</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.75rem' }}>
                {[
                  { label: 'Total Requests', value: leaves.length, cls: '' },
                  { label: 'Pending',        value: pendingLeaves, cls: 'stat-amber' },
                  { label: 'Approved',       value: approvedLeaves, cls: 'stat-green' },
                  { label: 'Rejected',       value: rejectedLeaves, cls: 'stat-red' },
                ].map(({ label, value, cls }) => (
                  <div key={label} style={{ background: 'var(--surface-secondary)', borderRadius: 10, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                    <div className={`stat-tile-value ${cls}`} style={{ marginTop: '0.2rem' }}>{value}</div>
                  </div>
                ))}
              </div>

              {Object.keys(leaveTypeCounts).length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>By Leave Type</div>
                  {Object.entries(leaveTypeCounts).map(([type, count]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '0.25rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{type}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Expense & Asset ── */}
          <div className="admin-dashboard-grid">

            {/* Expense Summary */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Expense Summary</span>
                <button className="btn-link-sm" onClick={() => router.push('/admin/expenses')}>View all →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.75rem' }}>
                {[
                  { label: 'Total Claims',    value: expenses.length, cls: '' },
                  { label: 'Pending Review',  value: pendingExpenses, cls: 'stat-amber' },
                  { label: 'Approved',        value: approvedExpenses, cls: 'stat-green' },
                  { label: 'Total Amount',    value: `₹${totalExpenseAmt.toLocaleString('en-IN')}`, cls: '' },
                  { label: 'Approved Amount', value: `₹${approvedExpAmt.toLocaleString('en-IN')}`, cls: 'stat-green' },
                ].map(({ label, value, cls }) => (
                  <div key={label} style={{ background: 'var(--surface-secondary)', borderRadius: 10, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                    <div className={`stat-tile-value ${cls}`} style={{ marginTop: '0.2rem', fontSize: '1.1rem' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Asset Summary */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Asset Requests</span>
                <button className="btn-link-sm" onClick={() => router.push('/admin/assets')}>View all →</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.75rem' }}>
                {[
                  { label: 'Total Requests', value: assets.length, cls: '' },
                  { label: 'Pending',        value: pendingAssets, cls: 'stat-amber' },
                  { label: 'Assigned',       value: assignedAssets, cls: 'stat-green' },
                ].map(({ label, value, cls }) => (
                  <div key={label} style={{ background: 'var(--surface-secondary)', borderRadius: 10, padding: '0.75rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{label}</div>
                    <div className={`stat-tile-value ${cls}`} style={{ marginTop: '0.2rem' }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <button className="btn-outline-accent" style={{ width: '100%' }} onClick={() => router.push('/admin/assets/inventory')}>
                  View Asset Inventory →
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
