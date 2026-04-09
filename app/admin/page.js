'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authAPI from '../../lib/authAPI';
import Navbar from '../../components/Navbar';
import '../styles/dashboard.css';

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLeaves: 0,
    approvedLeaves: 0,
    pendingLeaves: 0,
  });

  useEffect(() => {
    if (!authAPI.isAuthenticated() || !authAPI.isAdmin()) {
      router.push('/');
      return;
    }

    loadAdminData();
  }, [router]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const companyId = authAPI.getCompanyId();

      // Load all users
      const usersData = await authAPI.getAllUsers(companyId);
      if (usersData.success) {
        setUsers(usersData.data);
      }

      // Load all leaves
      const leavesData = await authAPI.getAllLeaveRequestsAdmin(companyId);
      if (leavesData.success) {
        setLeaves(leavesData.data);
        const approved = leavesData.data.filter((l) => l.status === 'APPROVED').length;
        const pending = leavesData.data.filter((l) => l.status === 'PENDING').length;
        setStats({
          totalUsers: usersData.data.length,
          totalLeaves: leavesData.data.length,
          approvedLeaves: approved,
          pendingLeaves: pending,
        });
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      setMessage('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.approveLeave(leaveId, companyId);
      if (result.success) {
        setMessage('Leave approved successfully');
        loadAdminData();
      } else {
        setMessage('Failed to approve leave');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.rejectLeave(leaveId, companyId, 'Rejected by admin');
      if (result.success) {
        setMessage('Leave rejected successfully');
        loadAdminData();
      } else {
        setMessage('Failed to reject leave');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar onLogout={() => router.push('/')} />
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onLogout={() => router.push('/')} />
      <div className="dashboard-container">
        {message && <div className="alert">{message}</div>}

        <div className="welcome-section">
          <h1>Admin Dashboard</h1>
          <p>Company Management & Oversight</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <h4>Total Users</h4>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h4>Total Leaves</h4>
            <p className="stat-number">{stats.totalLeaves}</p>
          </div>
          <div className="stat-card">
            <h4>Approved</h4>
            <p className="stat-number">{stats.approvedLeaves}</p>
          </div>
          <div className="stat-card">
            <h4>Pending</h4>
            <p className="stat-number">{stats.pendingLeaves}</p>
          </div>
        </div>

        {/* Users Management */}
        {users.length > 0 && (
          <div className="card full-width">
            <h3>Manage Users</h3>
            <button className="btn btn-primary" onClick={() => router.push('/admin/users')}>
              View All Users
            </button>
          </div>
        )}

        {/* Asset Management */}
        <div className="card full-width">
          <h3>Asset Management</h3>
          <p style={{ color: '#8d9ab5', marginBottom: '1rem', fontSize: '0.875rem' }}>
            Review pending asset requests and process employee returns.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/admin/assets')}>
            Manage Assets →
          </button>
        </div>

        {/* Leave Requests */}
        {leaves.length > 0 && (
          <div className="card full-width">
            <h3>Leave Requests</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.slice(0, 10).map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.employeeName}</td>
                      <td>{leave.leaveTypeName}</td>
                      <td>{new Date(leave.startDate).toLocaleDateString()}</td>
                      <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status status-${leave.status?.toLowerCase()}`}>
                          {leave.status}
                        </span>
                      </td>
                      <td>
                        {leave.status === 'PENDING' && (
                          <div className="action-buttons">
                            <button
                              className="btn btn-small btn-success"
                              onClick={() => handleApproveLeave(leave.id)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => handleRejectLeave(leave.id)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
