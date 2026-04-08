"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "../styles/dashboard.css";

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [clockStatus, setClockStatus] = useState("not-clocked-in");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [clockInTime, setClockInTime] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userdata = await fetch("/api/users/getData", {
        method: "GET",
        credentials: "include",
      });

      const RecivedCokieData = await userdata.json();
      const userDataJson = JSON.parse(RecivedCokieData);
      const userId = userDataJson.user.userId;
      const companyId = userDataJson.user.companyId;

      if (userdata.status === 200) {
        setRole(userDataJson.roles);
        setUser(userDataJson.user);
        setEmployee(userDataJson.Employee);
      }

      const LeaveData = await fetch(
        `/api/users/leaves/leaveTypes?userId=${userId}&companyId=${companyId}`,
        { method: "GET", credentials: "include" }
      );
      const leavesData = await LeaveData.json();
      if (LeaveData.status === 200) setLeaves(leavesData);

      const LeaveBalanceData = await fetch(
        `/api/users/leaves/leaveBalance?userId=${userId}&companyId=${companyId}`,
        { method: "GET", credentials: "include" }
      );
      const leaveBalanceData = await LeaveBalanceData.json();
      if (LeaveBalanceData.status === 200) setLeaveBalance(leaveBalanceData);

      if (userDataJson.Employee?.employeeId) {
        const GetAttendance = await fetch(
          `/api/users/attendance?companyId=${companyId}&employeeId=${userDataJson.Employee.employeeId}`,
          { method: "GET", credentials: "include" }
        );
        const getAttendanceData = await GetAttendance.json();
        if (GetAttendance.status === 200) {
          const today = new Date().toDateString();
          const todayRecords = getAttendanceData
            .filter((a) => new Date(a.eventTime).toDateString() === today)
            .sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));

          const lastEvent = todayRecords[0];
          if (lastEvent?.eventType === "CLOCK_OUT") {
            setClockStatus("clocked-out");
          } else if (lastEvent?.eventType === "CLOCK_IN") {
            setClockStatus("clocked-in");
            setClockInTime(new Date(lastEvent.eventTime));
          }
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
      const res = await fetch(
        `/api/users/attendance/clockIn?companyId=${employee.companyId}&employeeId=${employee.employeeId}`,
        { method: "GET", credentials: "include" }
      );
      if (res.status === 200) {
        setClockStatus("clocked-in");
        setClockInTime(new Date());
        setMessage("Clocked in successfully!");
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
      const res = await fetch(
        `/api/users/attendance/clockOut?companyId=${employee.companyId}&employeeId=${employee.employeeId}`,
        { method: "GET", credentials: "include" }
      );
      if (res.status === 200) {
        setClockStatus("clocked-out");
        setMessage("Clocked out successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to clock out");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    router.push("/");
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/dashboard" />
          <main className="main-content">
            <div className="loading"><div className="spinner"></div></div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={employee?.name || user?.email}
        userInitial={(employee?.name || user?.email || "U")[0].toUpperCase()}
      />
      <div className="app-body">
        <Sidebar activePath="/dashboard" />

        <main className="main-content">
          {message && <div className="alert">{message}</div>}

          {/* Welcome Banner */}
          <div className="page-header">
            <div>
              <h1 className="page-title">
                Good {today.getHours() < 12 ? "Morning" : today.getHours() < 17 ? "Afternoon" : "Evening"},{" "}
                {employee?.name?.split(" ")[0] || "there"}!
              </h1>
              <p className="page-subtitle">{dateStr}</p>
            </div>
            {role === "COMPANY_ADMIN" && (
              <button className="btn btn-primary btn-sm" onClick={() => router.push("/admin")}>
                Admin Dashboard →
              </button>
            )}
          </div>

          {role === "USER" && (
            <>
              {/* Top Row Cards */}
              <div className="card-grid-3">
                {/* Clock In/Out Card */}
                <div className="HRM-card attendance-card">
                  <div className="HRM-card-header">
                    <span className="HRM-card-title">Today's Attendance</span>
                    <span
                      className={`clock-badge ${
                        clockStatus === "clocked-in"
                          ? "badge-in"
                          : clockStatus === "clocked-out"
                          ? "badge-out"
                          : "badge-idle"
                      }`}
                    >
                      {clockStatus === "clocked-in"
                        ? "● Working"
                        : clockStatus === "clocked-out"
                        ? "✓ Done"
                        : "○ Not Started"}
                    </span>
                  </div>

                  {clockInTime && (
                    <p className="clock-time-label">
                      In: {clockInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}

                  <div className="clock-actions">
                    {clockStatus === "not-clocked-in" && (
                      <button className="btn btn-clock-in" onClick={handleClockIn}>
                        Clock In
                      </button>
                    )}
                    {clockStatus === "clocked-in" && (
                      <button className="btn btn-clock-out" onClick={handleClockOut}>
                        Clock Out
                      </button>
                    )}
                    {clockStatus === "clocked-out" && (
                      <p className="clock-done-text">You've completed your shift today.</p>
                    )}
                    <button
                      className="btn btn-link-sm"
                      onClick={() => router.push("/me/attendance")}
                    >
                      View full attendance →
                    </button>
                  </div>
                </div>

                {/* Leave Balance Card */}
                <div className="HRM-card">
                  <div className="HRM-card-header">
                    <span className="HRM-card-title">Leave Balance</span>
                    <button
                      className="btn btn-link-sm"
                      onClick={() => router.push("/me/leave")}
                    >
                      Apply →
                    </button>
                  </div>
                  {leaves && Object.keys(leaves).length > 0 ? (
                    <div className="leave-balance-list">
                      {Object.entries(leaves).map(([, value]) => {
                        const used = leaveBalance.filter(
                          (t) => t.leaveTypeId === value.leaveTypeId
                        ).length;
                        const available = value.maxDaysPerYear - used;
                        return (
                          <div key={value.leaveTypeId} className="leave-balance-row">
                            <span className="leave-type-name">{value.name}</span>
                            <div className="leave-balance-bar-wrap">
                              <div
                                className="leave-balance-bar"
                                style={{ width: `${(available / value.maxDaysPerYear) * 100}%` }}
                              />
                            </div>
                            <span className="leave-balance-count">
                              {available}/{value.maxDaysPerYear}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="no-data">No leave types configured</p>
                  )}
                </div>

                {/* Quick Actions Card */}
                <div className="HRM-card">
                  <div className="HRM-card-header">
                    <span className="HRM-card-title">Quick Actions</span>
                  </div>
                  <div className="quick-action-grid">
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/me/leave")}
                    >
                      <span className="qa-icon">📋</span>
                      <span>Apply Leave</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/me/attendance")}
                    >
                      <span className="qa-icon">🕐</span>
                      <span>Attendance</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/assets")}
                    >
                      <span className="qa-icon">💼</span>
                      <span>My Assets</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/me/leave")}
                    >
                      <span className="qa-icon">📅</span>
                      <span>My Leaves</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Leave Applications */}
              {leaveBalance.length > 0 && (
                <div className="HRM-card HRM-card-full">
                  <div className="HRM-card-header">
                    <span className="HRM-card-title">Recent Leave Applications</span>
                    <button
                      className="btn btn-link-sm"
                      onClick={() => router.push("/me/leave")}
                    >
                      View all →
                    </button>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>From</th>
                          <th>To</th>
                          <th>Days</th>
                          <th>Reason</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveBalance.slice(0, 5).reverse().map((leave) => {
                          const start = new Date(leave.startDate);
                          const end = new Date(leave.endDate);
                          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                          const typeName = Object.values(leaves).find(
                            (l) => l.leaveTypeId === leave.leaveTypeId
                          )?.name || "—";
                          return (
                            <tr key={leave.leaveRequestId}>
                              <td>{typeName}</td>
                              <td>{start.toLocaleDateString("en-IN")}</td>
                              <td>{end.toLocaleDateString("en-IN")}</td>
                              <td>{days}</td>
                              <td>{leave.reason}</td>
                              <td>
                                <span className={`status-badge status-${leave.status?.toLowerCase()}`}>
                                  {leave.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {role === "COMPANY_ADMIN" && (
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Admin Panel</span>
              </div>
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                You have administrative privileges. Manage your company from the admin dashboard.
              </p>
              <button className="btn btn-primary" onClick={() => router.push("/admin")}>
                Go to Admin Dashboard →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
