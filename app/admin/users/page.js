'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [loading, setLoading] = useState(true);
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

      const empRes = await fetch(
        `/api/admin/users?companyId=${data.user.companyId}`,
        { credentials: 'include' }
      );
      if (empRes.ok) {
        const empData = await empRes.json();
        const arr = Array.isArray(empData) ? empData : empData.data || [];
        setEmployees(arr);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
      setMessage({ text: 'Failed to load employees.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  // Derive unique departments for filter
  const departments = ['all', ...new Set(employees.map((e) => e.department).filter(Boolean))];

  const filtered = employees.filter((e) => {
    const name = (e.name || e.email || '').toLowerCase();
    const dept = e.department || '';
    const matchSearch = name.includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || dept === deptFilter;
    return matchSearch && matchDept;
  });

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

  const emp = employee || {};

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={emp.name || user?.email}
        userInitial={(emp.name || user?.email || 'A')[0].toUpperCase()}
      />
      <div className="app-body">
        <AdminSidebar activePath="/admin/users" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Employees</h1>
              <p className="page-subtitle">{employees.length} total employees in this company</p>
            </div>
            <span className="admin-role-badge">ADMIN</span>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>
              {message.text}
            </div>
          )}

          {/* Filters */}
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
                  <option key={d} value={d}>
                    {d === 'all' ? 'All Departments' : d}
                  </option>
                ))}
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
                      <th>Employee</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Status</th>
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
                              {emp.name || '—'}
                            </span>
                          </div>
                        </td>
                        <td>{emp.email || '—'}</td>
                        <td>{emp.department || '—'}</td>
                        <td>{emp.designation || emp.jobTitle || '—'}</td>
                        <td>
                          <span className="admin-role-chip">
                            {emp.role || 'EMPLOYEE'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {emp.createdAt
                            ? new Date(emp.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                        <td>
                          <span className={`status-badge ${emp.status === 'INACTIVE' ? 'status-rejected' : 'status-approved'}`}>
                            {emp.status || 'Active'}
                          </span>
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
    </div>
  );
}
