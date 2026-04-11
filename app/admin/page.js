'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import '../styles/dashboard.css';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    pendingAssets: 0,
    pendingExpenses: 0,
    presentToday: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get current user from cookie
      const res = await fetch('/api/users/getData', { method: 'GET', credentials: 'include' });
      const raw = await res.json();
      const data = JSON.parse(raw);
      if (res.status !== 200) { router.push('/'); return; }
      setUser(data.user);
      setEmployee(data.employee);

      const companyId = data.user.companyId;

      // Parallel fetch: employees, leaves, assets, expenses
      const [usersRes, leavesRes, assetsRes, expensesRes] = await Promise.all([
        fetch(`/api/admin/users?companyId=${companyId}`, { credentials: 'include' }),
        fetch(`/api/admin/leaves?companyId=${companyId}`, { credentials: 'include' }),
        fetch(`/api/admin/assets?companyId=${companyId}`, { credentials: 'include' }),
        fetch(`/api/admin/expenses?companyId=${companyId}`, { credentials: 'include' }),
      ]);

      let totalEmployees = 0, pendingLeaves = 0, approvedLeaves = 0,
          pendingAssets = 0, pendingExpenses = 0;
      let pendingLeavesList = [];
      let pendingExpensesList = [];

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const arr = Array.isArray(usersData) ? usersData : usersData.data || [];
        totalEmployees = arr.length;
      }

      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        const arr = Array.isArray(leavesData) ? leavesData : leavesData.data || [];
        pendingLeaves = arr.filter((l) => l.status === 'PENDING').length;
        approvedLeaves = arr.filter((l) => l.status === 'APPROVED').length;
        pendingLeavesList = arr.filter((l) => l.status === 'PENDING').slice(0, 5);
      }

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json();
        const requests = assetsData.requests || [];
        pendingAssets = requests.filter((r) => r.status === 'PENDING').length;
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        const arr = Array.isArray(expensesData) ? expensesData : expensesData.data || [];
        pendingExpenses = arr.filter((e) => e.status === 'PENDING').length;
        pendingExpensesList = arr.filter((e) => e.status === 'PENDING').slice(0, 5);
      }

      setStats({ totalEmployees, pendingLeaves, approvedLeaves, pendingAssets, pendingExpenses });
      setRecentLeaves(pendingLeavesList);
      setRecentExpenses(pendingExpensesList);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
      setMessage({ text: 'Failed to load dashboard data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const res = await fetch('/api/admin/leaves/approve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, companyId: user.companyId }),
      });
      if (res.ok) {
        setMessage({ text: 'Leave approved.', type: 'success' });
        loadData();
      } else {
        setMessage({ text: 'Failed to approve leave.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error: ' + err.message, type: 'error' });
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      const res = await fetch('/api/admin/leaves/reject', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, companyId: user.companyId, reason: 'Rejected by admin' }),
      });
      if (res.ok) {
        setMessage({ text: 'Leave rejected.', type: 'success' });
        loadData();
      } else {
        setMessage({ text: 'Failed to reject leave.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error: ' + err.message, type: 'error' });
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
          <AdminSidebar activePath="/admin" />
          <main className="main-content">
            <div className="loading"><div className="spinner" /></div>
          </main>
        </div>
      </div>
    );
  }

  const emp = employee || {};

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={emp.name || user?.email}
        userInitial={(emp.name || user?.email || 'A')[0].toUpperCase()}
      />
      <div className="app-body">
        <AdminSidebar activePath="/admin" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Admin Dashboard</h1>
              <p className="page-subtitle">Company-wide overview and quick actions</p>
            </div>
            <span className="admin-role-badge">ADMIN</span>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {message.text}
            </div>
          )}

          {/* Stats Row */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Total Employees</span>
              <span className="stat-tile-value">{stats.totalEmployees}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Pending Leaves</span>
              <span className="stat-tile-value stat-amber">{stats.pendingLeaves}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Approved Leaves</span>
              <span className="stat-tile-value stat-green">{stats.approvedLeaves}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Pending Assets</span>
              <span className="stat-tile-value stat-amber">{stats.pendingAssets}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Pending Expenses</span>
              <span className="stat-tile-value stat-amber">{stats.pendingExpenses}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="HRM-card HRM-card-full">
            <div className="HRM-card-header">
              <span className="HRM-card-title">Quick Actions</span>
            </div>
            <div className="admin-quick-actions">
              <button className="admin-quick-btn" onClick={() => router.push('/admin/users')}>
                <span className="admin-quick-icon">👥</span>
                <span className="admin-quick-label">Manage Employees</span>
                <span className="admin-quick-count">{stats.totalEmployees}</span>
              </button>
              <button className="admin-quick-btn" onClick={() => router.push('/admin/leaves')}>
                <span className="admin-quick-icon">📅</span>
                <span className="admin-quick-label">Leave Requests</span>
                {stats.pendingLeaves > 0 && (
                  <span className="admin-quick-count admin-quick-count-amber">{stats.pendingLeaves} pending</span>
                )}
              </button>
              <button className="admin-quick-btn" onClick={() => router.push('/admin/attendance')}>
                <span className="admin-quick-icon">⏱️</span>
                <span className="admin-quick-label">Attendance</span>
              </button>
              <button className="admin-quick-btn" onClick={() => router.push('/admin/assets')}>
                <span className="admin-quick-icon">🖥️</span>
                <span className="admin-quick-label">Assets</span>
                {stats.pendingAssets > 0 && (
                  <span className="admin-quick-count admin-quick-count-amber">{stats.pendingAssets} pending</span>
                )}
              </button>
              <button className="admin-quick-btn" onClick={() => router.push('/admin/expenses')}>
                <span className="admin-quick-icon">💰</span>
                <span className="admin-quick-label">Expenses</span>
                {stats.pendingExpenses > 0 && (
                  <span className="admin-quick-count admin-quick-count-amber">{stats.pendingExpenses} pending</span>
                )}
              </button>
            </div>
          </div>

          {/* Two-column bottom section */}
          <div className="admin-dashboard-grid">

            {/* Pending Leave Requests */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Pending Leave Requests</span>
                <button className="btn-link-sm" onClick={() => router.push('/admin/leaves')}>
                  View all →
                </button>
              </div>
              {recentLeaves.length > 0 ? (
                <div className="admin-list">
                  {recentLeaves.map((leave) => (
                    <div key={leave.id} className="admin-list-item">
                      <div className="admin-list-info">
                        <span className="admin-list-name">{leave.employeeName}</span>
                        <span className="admin-list-meta">
                          {leave.leaveTypeName} &middot;{' '}
                          {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {' – '}
                          {new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn-approve"
                          onClick={() => handleApproveLeave(leave.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleRejectLeave(leave.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No pending leave requests.</p>
              )}
            </div>

            {/* Pending Expense Claims */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Pending Expense Claims</span>
                <button className="btn-link-sm" onClick={() => router.push('/admin/expenses')}>
                  View all →
                </button>
              </div>
              {recentExpenses.length > 0 ? (
                <div className="admin-list">
                  {recentExpenses.map((expense) => (
                    <div key={expense.id || expense.expenseId} className="admin-list-item">
                      <div className="admin-list-info">
                        <span className="admin-list-name">{expense.employeeName}</span>
                        <span className="admin-list-meta">
                          {expense.category || expense.expenseType} &middot; ₹{expense.amount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="status-badge status-pending">Pending</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No pending expense claims.</p>
              )}
            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
