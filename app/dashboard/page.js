"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import authAPI from "../../lib/authAPI";
import Navbar from "../../components/Navbar";

export default function Dashboard() {
  const router = useRouter();
  // Temporary dev flag: set to false or remove to re-enable auth redirects
  // const DEV_BYPASS = true;
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [clockStatus, setClockStatus] = useState("not-clocked-in");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // if (DEV_BYPASS) {
    //   loadDashboardData();
    //   return;
    // }

    // if (!authAPI.isAuthenticated()) {
    //   router.push('/');
    //   return;
    // }

    // if (authAPI.isAdmin()) {
    //   router.push('/admin');
    //   return;
    // }

    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      // Fetch user data from the API route
      const userdata = await fetch("/api/users/getData", {
        method: "GET",
        credentials: "include", // IMPORTANT
      });

      const RecivedCokieData = await userdata.json();
      const userDataJson = JSON.parse(RecivedCokieData);

      const userId = userDataJson.user.userId;
      const companyId = userDataJson.user.companyId;

      if (userdata.status === 200) {
        setUser(userDataJson.Employee);
      }

      // Load leaves
      const LeaveData = await fetch(
        `/api/users/leaves/leaveTypes?userId=${userId}&companyId=${companyId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const leavesData = await LeaveData.json();
      if (LeaveData.status === 200) {
        console.log("Leaves Data:", leavesData);
        setLeaves(leavesData);
      }

      // Load leave balance

      // const balanceData = await authAPI.getLeaveBalance(companyId, userId);
      const LeaveBalanceData = await fetch(`/api/users/leaves/leaveBalance?userId=${userId}&companyId=${companyId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const leaveBalanceData = await LeaveBalanceData.json();

      if (LeaveBalanceData.status === 200) {
        console.log("Leave Balance Data:", leaveBalanceData);
        setLeaveBalance(leaveBalanceData);
      }

      // Load attendance
      // const attendanceData = await authAPI.getAttendance(companyId, userId);
      const GetAttendance = await fetch(`/api/users/attendance?userId=${userId}&companyId=${companyId}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const getAttendanceData = await GetAttendance.json();

      // const attendanceData = await authAPI.getAttendance(companyId, userId);
      if (GetAttendance.status === 200) {
        console.log("Attendance Data:", getAttendanceData);
        setAttendance(getAttendanceData);
        // Check clock status
        const today = new Date().toDateString();
        const todayRecord = getAttendanceData.find(
          (a) => new Date(a.date).toDateString() === today,
        );
        if (todayRecord?.clockOut) {
          setClockStatus("clocked-out");
        } else if (todayRecord?.clockIn) {
          setClockStatus("clocked-in");
        }
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setMessage("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const userId = authAPI.getUserId();
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.clockIn(companyId, userId);

      if (result.success) {
        setClockStatus("clocked-in");
        setMessage("Clocked in successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to clock in");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  const handleClockOut = async () => {
    try {
      const userId = authAPI.getUserId();
      const companyId = authAPI.getCompanyId();
      const result = await authAPI.clockOut(companyId, userId);

      if (result.success) {
        setClockStatus("clocked-out");
        setMessage("Clocked out successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to clock out");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar onLogout={() => router.push("/")} />
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar onLogout={() => router.push("/")} />
      <div className="dashboard-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">keka</div>
          <ul className="sidebar-menu">
            <li className="active">Home</li>
            <li>Inbox</li>
            <li>My Team</li>
            <li>My Finances</li>
            <li>Org</li>
            <li>Engage</li>
            <li>Performance</li>
          </ul>
        </aside>
        <main className="dashboard-container">
          {message && <div className="alert">{message}</div>}

          <div className="welcome-section">
            <h1>Welcome, {user?.name || user?.email}!</h1>
            <p>Your HR Dashboard</p>
          </div>

          <div className="dashboard-content">
            {/* Attendance Card */}
            <div className="card">
              <h3>Attendance</h3>
              <div className="attendance-info">
                <p>
                  Status: <strong>{clockStatus}</strong>
                </p>
                {clockStatus === "not-clocked-in" && (
                  <button className="btn btn-primary" onClick={handleClockIn}>
                    Clock In
                  </button>
                )}
                {clockStatus === "clocked-in" && (
                  <button className="btn btn-warning" onClick={handleClockOut}>
                    Clock Out
                  </button>
                )}
              </div>
            </div>

            {/* Leave Balance Card */}
            <div className="card">
              <h3>Leave Balance</h3>
              {leaves && Object.keys(leaves).length > 0 ? (
                <div className="leave-balance-items">
                  {Object.entries(leaves).map(([key, value]) => (
                    <div key={value.leaveTypeId} className="balance-item">
                      <span>{value.name}:</span>
                      <strong>{value.maxDaysPerYear - (leaveBalance.filter(t => t.leaveTypeId === value.leaveTypeId).length || 0)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No leave balance data</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => router.push("/leave/apply")}
                >
                  Apply Leave
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => router.push("/leave")}
                >
                  View Leaves
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => router.push("/attendance")}
                >
                  Attendance
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => router.push("/assets")}
                >
                  Assets
                </button>
              </div>
            </div>
          </div>

          {/* Recent Leaves */}
          {leaveBalance.length > 0 && (
            <div className="card full-width">
              <h3>Recent Leave Applications</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveBalance.slice(0, 5).map((leave) => (
                      <tr key={leave.leaveRequestId}>
                        <td>{leaves.find((l) => l.leaveTypeId === leave.leaveTypeId)?.name}</td>
                        <td>
                          {new Date(leave.startDate).toLocaleDateString()}
                        </td>
                        <td>{new Date(leave.endDate).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`status status-${leave.status?.toLowerCase()}`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td>{leave.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
