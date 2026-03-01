"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import "../../styles/dashboard.css";

export default function LeavePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all"); // all, accepted, rejected, pending

  useEffect(() => {
    loadLeaveData();
  }, []);

  const loadLeaveData = async () => {
    setLoading(true);
    try {
      const userdata = await fetch("/api/users/getData", {
        method: "GET",
        credentials: "include",
      });

      const ReceivedData = await userdata.json();
      const userDataJson = JSON.parse(ReceivedData);
      const userId = userDataJson.user.userId;
      const companyId = userDataJson.user.companyId;

      if (userdata.status === 200) {
        setUser(userDataJson.user);
        setEmployee(userDataJson.Employee);
      }

      // Load leave types
      const LeaveData = await fetch(
        `/api/users/leaves/leaveTypes?userId=${userId}&companyId=${companyId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const leavesData = await LeaveData.json();
      if (LeaveData.status === 200) {
        setLeaves(leavesData);
        if (Object.keys(leavesData).length > 0) {
          const firstKey = Object.keys(leavesData)[0];
          setSelectedLeaveType(leavesData[firstKey].leaveTypeId);
        }
      }

      // Load leave balance (past applications)
      const LeaveBalanceData = await fetch(
        `/api/users/leaves/leaveBalance?userId=${userId}&companyId=${companyId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const leaveBalanceData = await LeaveBalanceData.json();
      if (LeaveBalanceData.status === 200) {
        setLeaveBalance(leaveBalanceData);
      }
    } catch (error) {
      console.error("Error loading leave data:", error);
      setMessage("Failed to load leave data");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();

    if (!selectedLeaveType || !startDate || !endDate || !reason) {
      setMessage("Please fill in all fields");
      return;
    }

    setApplying(true);
    try {
      const response = await fetch("/api/users/leaves/applyLeave", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveTypeId: selectedLeaveType,
          startDate,
          endDate,
          reason,
        }),
      });

      if (response.status === 200) {
        setMessage("Leave applied successfully!");
        setSelectedLeaveType("");
        setStartDate("");
        setEndDate("");
        setReason("");
        setTimeout(() => {
          loadLeaveData();
          setMessage("");
        }, 2000);
      } else {
        setMessage("Failed to apply leave");
      }
    } catch (error) {
      console.error("Error applying leave:", error);
      setMessage("Error applying leave: " + error.message);
    } finally {
      setApplying(false);
    }
  };

  const getFilteredLeaves = () => {
    if (filter === "all") return leaveBalance;
    return leaveBalance.filter(
      (leave) => leave.status?.toLowerCase() === filter
    );
  };

  const getLeaveTypeName = (leaveTypeId) => {
    const leaveType = Object.values(leaves).find(
      (l) => l.leaveTypeId === leaveTypeId
    );
    return leaveType ? leaveType.name : "Unknown";
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
            <li onClick={() => router.push("/dashboard")}>Home</li>
            <li className="menu-item-with-submenu">
              <div className="menu-item-header">
                Me
                <span className="arrow">›</span>
              </div>
              <ul className="submenu">
                <li onClick={() => router.push("/me/attendance")}>
                  Attendance
                </li>
                <li onClick={() => router.push("/me/leave")}>Leave</li>
              </ul>
            </li>
            <li>Inbox</li>
            <li>My Team</li>
            <li>My Finances</li>
            <li>Org</li>
            <li>Engage</li>
            <li>Performance</li>
          </ul>
        </aside>

        <main className="dashboard-container">
          <div className="welcome-section">
            <h1>Leave Management</h1>
            <p>Apply for leave and view your leave history</p>
          </div>

          {message && <div className="alert">{message}</div>}

          {/* Apply Leave Card */}
          <div className="card">
            <h3>Apply for Leave</h3>
            <form onSubmit={handleApplyLeave} className="leave-form">
              <div className="form-group">
                <label>Leave Type</label>
                <select
                  value={selectedLeaveType}
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select Leave Type</option>
                  {Object.entries(leaves).map(([key, value]) => (
                    <option key={value.leaveTypeId} value={value.leaveTypeId}>
                      {value.name} ({value.maxDaysPerYear - (leaveBalance.filter(l => l.leaveTypeId === value.leaveTypeId).length || 0)} days available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="form-input"
                  rows="3"
                  placeholder="Enter reason for leave"
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={applying}
              >
                {applying ? "Applying..." : "Apply Leave"}
              </button>
            </form>
          </div>

          {/* Leave History Card */}
          <div className="card full-width">
            <h3>Leave History</h3>

            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All ({leaveBalance.length})
              </button>
              <button
                className={`filter-btn ${filter === "accepted" ? "active" : ""}`}
                onClick={() => setFilter("accepted")}
              >
                Accepted (
                {leaveBalance.filter(
                  (l) => l.status?.toLowerCase() === "accepted"
                ).length}
                )
              </button>
              <button
                className={`filter-btn ${filter === "rejected" ? "active" : ""}`}
                onClick={() => setFilter("rejected")}
              >
                Rejected (
                {leaveBalance.filter(
                  (l) => l.status?.toLowerCase() === "rejected"
                ).length}
                )
              </button>
              <button
                className={`filter-btn ${filter === "pending" ? "active" : ""}`}
                onClick={() => setFilter("pending")}
              >
                Pending (
                {leaveBalance.filter(
                  (l) => l.status?.toLowerCase() === "pending"
                ).length}
                )
              </button>
            </div>

            {getFilteredLeaves().length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredLeaves()
                      .slice()
                      .reverse()
                      .map((leave) => {
                        const startDate = new Date(leave.startDate);
                        const endDate = new Date(leave.endDate);
                        const days = Math.ceil(
                          (endDate - startDate) / (1000 * 60 * 60 * 24)
                        ) + 1;

                        return (
                          <tr key={leave.leaveRequestId}>
                            <td>{getLeaveTypeName(leave.leaveTypeId)}</td>
                            <td>{startDate.toLocaleDateString()}</td>
                            <td>{endDate.toLocaleDateString()}</td>
                            <td>{days}</td>
                            <td>{leave.reason}</td>
                            <td>
                              <span
                                className={`status status-${leave.status?.toLowerCase()}`}
                              >
                                {leave.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No leave records found</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}