'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

const CATEGORY_ICONS = {
  Travel:        '✈️',
  Food:          '🍽️',
  Accommodation: '🏨',
  Medical:       '🏥',
  Equipment:     '🖥️',
  Training:      '📚',
  Other:         '📦',
};

function categoryIcon(cat) {
  return CATEGORY_ICONS[cat] || '📦';
}

export default function AdminExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // { expenseId, reason }
  const [detailModal, setDetailModal] = useState(null); // expense object
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/getData', { method: 'GET', credentials: 'include' });
      const raw = await res.json();
      const data = JSON.parse(raw);
      if (res.status !== 200) { router.push('/'); return; }
      setUser(data.user);
      setEmployee(data.employee);

      const expRes = await fetch(
        `/api/admin/expenses?companyId=${data.user.companyId}`,
        { credentials: 'include' }
      );
      if (expRes.ok) {
        const expData = await expRes.json();
        const arr = Array.isArray(expData) ? expData : expData.data || [];
        setExpenses(arr);
      }
    } catch (err) {
      console.error('Error loading expenses:', err);
      setMessage({ text: 'Failed to load expenses.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const flash = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleApprove = async (expenseId) => {
    setActionLoading(expenseId);
    try {
      const res = await fetch('/api/admin/expenses/approve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenseId, companyId: user.companyId }),
      });
      if (res.ok) { flash('Expense approved.'); loadData(); }
      else flash('Failed to approve expense.', 'error');
    } catch (err) {
      flash('Error: ' + err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.expenseId);
    try {
      const res = await fetch('/api/admin/expenses/reject', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId: rejectModal.expenseId,
          companyId: user.companyId,
          reason: rejectModal.reason || 'Rejected by admin',
        }),
      });
      if (res.ok) { flash('Expense rejected.'); setRejectModal(null); loadData(); }
      else flash('Failed to reject expense.', 'error');
    } catch (err) {
      flash('Error: ' + err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const count = (s) => expenses.filter((e) => e.status === s).length;

  const totalPendingAmount = expenses
    .filter((e) => e.status === 'PENDING')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const filtered = expenses.filter((e) => {
    const matchFilter = filter === 'all' || e.status === filter;
    const matchSearch = !search ||
      (e.employeeName || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.category || e.expenseType || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/expenses" />
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
        <AdminSidebar activePath="/admin/expenses" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Expense Claims</h1>
              <p className="page-subtitle">Review and approve employee expense requests</p>
            </div>
            <span className="admin-role-badge">ADMIN</span>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {message.text}
            </div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Total Claims</span>
              <span className="stat-tile-value">{expenses.length}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Pending</span>
              <span className="stat-tile-value stat-amber">{count('PENDING')}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Approved</span>
              <span className="stat-tile-value stat-green">{count('APPROVED')}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Rejected</span>
              <span className="stat-tile-value stat-red">{count('REJECTED')}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Pending Amount</span>
              <span className="stat-tile-value stat-amber">
                ₹{totalPendingAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Table card */}
          <div className="HRM-card HRM-card-full">

            {/* Filters row */}
            <div className="admin-filters-row" style={{ marginBottom: '0.75rem' }}>
              <div className="filter-tabs" style={{ margin: 0, flex: 1 }}>
                {[
                  { key: 'all',      label: 'All',      count: expenses.length },
                  { key: 'PENDING',  label: 'Pending',  count: count('PENDING') },
                  { key: 'APPROVED', label: 'Approved', count: count('APPROVED') },
                  { key: 'REJECTED', label: 'Rejected', count: count('REJECTED') },
                ].map((t) => (
                  <button
                    key={t.key}
                    className={`filter-tab ${filter === t.key ? 'active' : ''}`}
                    onClick={() => setFilter(t.key)}
                  >
                    {t.label}
                    <span className="filter-tab-count">{t.count}</span>
                  </button>
                ))}
              </div>
              <div className="admin-search-wrap" style={{ width: 220 }}>
                <span className="admin-search-icon">🔍</span>
                <input
                  type="text"
                  className="form-control admin-search-input"
                  placeholder="Search employee…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            {filtered.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((expense, i) => {
                      const isPending = expense.status === 'PENDING';
                      const isActioning = actionLoading === (expense.id || expense.expenseId);
                      const statusCls =
                        expense.status === 'APPROVED' ? 'status-approved'
                        : expense.status === 'REJECTED' ? 'status-rejected'
                        : 'status-pending';
                      const expId = expense.id || expense.expenseId;
                      const category = expense.category || expense.expenseType || 'Other';
                      return (
                        <tr key={expId || i}>
                          <td>
                            <div className="admin-emp-cell">
                              <div className="admin-emp-avatar">
                                {(expense.employeeName || 'E')[0].toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {expense.employeeName || '—'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="admin-emp-cell">
                              <span>{categoryIcon(category)}</span>
                              <span>{category}</span>
                            </div>
                          </td>
                          <td style={{ maxWidth: 200, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                            {expense.description || expense.title || '—'}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            ₹{(expense.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            {expense.date || expense.submittedAt
                              ? new Date(expense.date || expense.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>
                          <td>
                            <span className={`status-badge ${statusCls}`}>{expense.status}</span>
                          </td>
                          <td>
                            {isPending && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  className="btn-approve"
                                  disabled={isActioning}
                                  onClick={() => handleApprove(expId)}
                                >
                                  {isActioning ? '…' : 'Approve'}
                                </button>
                                <button
                                  className="btn-reject"
                                  disabled={isActioning}
                                  onClick={() => setRejectModal({ expenseId: expId, reason: '' })}
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {expense.status === 'REJECTED' && expense.adminNote && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {expense.adminNote}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">
                No {filter !== 'all' ? filter.toLowerCase() : ''} expense claims found.
              </p>
            )}
          </div>

          {/* Reject Modal */}
          {rejectModal && (
            <div className="modal-overlay" onClick={() => setRejectModal(null)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">Reject Expense</h3>
                <p className="modal-subtitle">Provide a reason for rejecting this expense claim.</p>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Reason for rejection (optional but recommended)"
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal((m) => ({ ...m, reason: e.target.value }))}
                  style={{ marginTop: '0.75rem' }}
                />
                <div className="modal-actions">
                  <button
                    className="btn-reject"
                    disabled={actionLoading === rejectModal.expenseId}
                    onClick={handleReject}
                  >
                    {actionLoading === rejectModal.expenseId ? 'Rejecting…' : 'Confirm Reject'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
