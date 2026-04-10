"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
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
  const [message, setMessage] = useState({ text: "", type: "" });
  const [filter, setFilter] = useState("all");

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
        setEmployee(userDataJson.employee);
      }

      const LeaveData = await fetch(
        `/api/users/leaves/leaveTypes?userId=${userId}&companyId=${companyId}`,
        { method: "GET", credentials: "include" }
      );
      const leavesData = await LeaveData.json();
      if (LeaveData.status === 200) {
        setLeaves(leavesData);
        if (Object.keys(leavesData).length > 0) {
          setSelectedLeaveType(Object.values(leavesData)[0].leaveTypeId);
        }
      }

      const LeaveBalanceData = await fetch(
        `/api/users/leaves/leaveBalance?userId=${userId}&companyId=${companyId}`,
        { method: "GET", credentials: "include" }
      );
      const leaveBalanceData = await LeaveBalanceData.json();
      if (LeaveBalanceData.status === 200) {
        setLeaveBalance(leaveBalanceData);
      }
    } catch (error) {
      console.error("Error loading leave data:", error);
      setMessage({ text: "Failed to load leave data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!selectedLeaveType || !startDate || !endDate || !reason) {
      setMessage({ text: "Please fill in all fields", type: "error" });
      return;
    }

    setApplying(true);
    try {
      const response = await fetch("/api/users/leaves/applyLeave", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveTypeId: selectedLeaveType, startDate, endDate, reason }),
      });

      if (response.status === 200) {
        setMessage({ text: "Leave applied successfully!", type: "success" });
        setStartDate("");
        setEndDate("");
        setReason("");
        setTimeout(() => {
          loadLeaveData();
          setMessage({ text: "", type: "" });
        }, 2000);
      } else {
        setMessage({ text: "Failed to apply leave", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Error: " + error.message, type: "error" });
    } finally {
      setApplying(false);
    }
  };

  const getFilteredLeaves = () => {
    if (filter === "all") return leaveBalance;
    return leaveBalance.filter((l) => l.status?.toLowerCase() === filter);
  };

  const getLeaveTypeName = (leaveTypeId) => {
    return Object.values(leaves).find((l) => l.leaveTypeId === leaveTypeId)?.name || "—";
  };

  const countByStatus = (status) =>
    leaveBalance.filter((l) => l.status?.toLowerCase() === status).length;

  const calcUsedDays = (leaveTypeId) =>
    leaveBalance
      .filter(
        (t) =>
          t.leaveTypeId === leaveTypeId 
          // && t.status?.toLowerCase() === "accepted"
      )
      .reduce((sum, t) => {
        const start = new Date(t.startDate);
        const end = new Date(t.endDate);
        return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    router.push("/");
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/me/leave" />
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
        <Sidebar activePath="/me/leave" />

        <main className="main-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Leave Management</h1>
              <p className="page-subtitle">Apply for leave and track your requests</p>
            </div>
          </div>

          {message.text && (
            <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
              {message.text}
            </div>
          )}

          {/* Leave Balance Summary */}
          {Object.keys(leaves).length > 0 && (
            <div className="leave-quota-row">
              {Object.entries(leaves).map(([, value]) => {
                const used = calcUsedDays(value.leaveTypeId);
                const available = value.maxDaysPerYear - used;
                return (
                  <div key={value.leaveTypeId} className="leave-quota-card">
                    <span className="leave-quota-type">{value.name}</span>
                    <span className="leave-quota-available">{available}</span>
                    <span className="leave-quota-label">of {value.maxDaysPerYear} available</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="leave-main-grid">
            {/* Apply Leave Form */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Apply for Leave</span>
              </div>
              <form onSubmit={handleApplyLeave} className="leave-form">
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select
                    value={selectedLeaveType}
                    onChange={(e) => setSelectedLeaveType(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select leave type</option>
                    {Object.entries(leaves).map(([, value]) => {
                      const used = calcUsedDays(value.leaveTypeId);
                      const available = value.maxDaysPerYear - used;
                      return (
                        <option key={value.leaveTypeId} value={value.leaveTypeId}>
                          {value.name} ({available} days left)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="form-control"
                    rows="3"
                    placeholder="Briefly describe the reason for leave"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={applying}>
                  {applying ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>

            {/* Leave History */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Leave History</span>
              </div>

              <div className="filter-tabs">
                {[
                  { key: "all", label: "All", count: leaveBalance.length },
                  { key: "accepted", label: "Approved", count: countByStatus("accepted") },
                  { key: "pending", label: "Pending", count: countByStatus("pending") },
                  { key: "rejected", label: "Rejected", count: countByStatus("rejected") },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    className={`filter-tab ${filter === tab.key ? "active" : ""}`}
                    onClick={() => setFilter(tab.key)}
                  >
                    {tab.label}
                    <span className="filter-tab-count">{tab.count}</span>
                  </button>
                ))}
              </div>

              {getFilteredLeaves().length > 0 ? (
                <div className="leave-history-list">
                  {getFilteredLeaves()
                    .slice()
                    .reverse()
                    .map((leave) => {
                      const start = new Date(leave.startDate);
                      const end = new Date(leave.endDate);
                      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <div key={leave.leaveRequestId} className="leave-history-item">
                          <div className="leave-history-info">
                            <span className="leave-history-type">
                              {getLeaveTypeName(leave.leaveTypeId)}
                            </span>
                            <span className="leave-history-dates">
                              {start.toLocaleDateString("en-IN")} → {end.toLocaleDateString("en-IN")} · {days} day{days !== 1 ? "s" : ""}
                            </span>
                            <span className="leave-history-reason">{leave.reason}</span>
                          </div>
                          <span className={`status-badge status-${leave.status?.toLowerCase()}`}>
                            {leave.status}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="no-data">No {filter !== "all" ? filter : ""} leave records found</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
