"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import "../../styles/dashboard.css";

const SHIFT_START = 9.5; // 9:30 AM
const SHIFT_END = 18.5;  // 6:30 PM
const TIMELINE_START = 7;
const TIMELINE_END = 22;

function formatHM(decimalHours) {
  if (decimalHours === null || decimalHours === undefined || isNaN(decimalHours)) return "—";
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return `${h}h ${m}m`;
}

function getMonthTabs() {
  const tabs = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    tabs.push({
      label: d.toLocaleString("default", { month: "short" }).toUpperCase(),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return tabs;
}

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [workingDays, setWorkingDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("log");
  const [activePeriod, setActivePeriod] = useState("30days");
  const [clockStatus, setClockStatus] = useState("not-clocked-in");
  const [clockMessage, setClockMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [use24h, setUse24h] = useState(false);
  const [stats, setStats] = useState({
    avgHours: 0,
    onTimePercent: 0,
    presentDays: 0,
    totalHours: 0,
  });

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const userRes = await fetch("/api/users/getData", {
        method: "GET",
        credentials: "include",
      });
      const rawData = await userRes.json();
      const userData = JSON.parse(rawData);

      if (userRes.status === 200) {
        setUser(userData.user);
        setEmployee(userData.Employee);
      }

      const companyId = userData.user.companyId;
      const employeeId = userData.Employee.employeeId;

      const attRes = await fetch(
        `/api/users/attendance?employeeId=${employeeId}&companyId=${companyId}`,
        { method: "GET", credentials: "include" }
      );

      if (attRes.status === 200) {
        const attData = await attRes.json();
        processAttendance(attData);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAttendance = (records) => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.eventTime) - new Date(b.eventTime)
    );

    // Group events by date
    const dayMap = {};
    sorted.forEach((record) => {
      const date = new Date(record.eventTime);
      const dateKey = date.toDateString();
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { dateKey, dateObj: date, clockIns: [], clockOuts: [] };
      }
      if (record.eventType === "CLOCK_IN") dayMap[dateKey].clockIns.push(date);
      if (record.eventType === "CLOCK_OUT") dayMap[dateKey].clockOuts.push(date);
    });

    const processedDays = Object.values(dayMap).map((day) => {
      const firstIn = day.clockIns[0] || null;
      const lastOut = day.clockOuts[day.clockOuts.length - 1] || null;

      let grossHours = null;
      if (firstIn && lastOut) {
        grossHours = (lastOut - firstIn) / (1000 * 60 * 60);
      }

      let arrival = null;
      let arrivalStatus = "on-time";
      if (firstIn) {
        const inDecimal = firstIn.getHours() + firstIn.getMinutes() / 60;
        const lateMinutes = Math.round((inDecimal - SHIFT_START) * 60);
        if (lateMinutes <= 0) {
          arrival = "On Time";
          arrivalStatus = "on-time";
        } else {
          const lh = Math.floor(lateMinutes / 60);
          const lm = lateMinutes % 60;
          arrival = lh > 0
            ? `${lh}:${String(lm).padStart(2, "0")}:00 late`
            : `0:${String(lm).padStart(2, "0")}:00 late`;
          arrivalStatus = "late";
        }
      }

      return {
        date: day.dateKey,
        dateObj: day.dateObj,
        firstIn,
        lastOut,
        grossHours,
        effectiveHours: grossHours,
        arrival,
        arrivalStatus,
      };
    });

    // Determine today's clock status
    const todayStr = new Date().toDateString();
    const todayRec = processedDays.find((d) => d.date === todayStr);
    if (todayRec) {
      if (todayRec.lastOut) setClockStatus("clocked-out");
      else if (todayRec.firstIn) setClockStatus("clocked-in");
      else setClockStatus("not-clocked-in");
    } else {
      setClockStatus("not-clocked-in");
    }

    const newestFirst = processedDays.reverse();
    setWorkingDays(newestFirst);

    // Stats from last 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recent = newestFirst.filter(
      (d) => d.dateObj >= cutoff && d.grossHours !== null
    );
    const presentDays = recent.length;
    const totalHours = recent.reduce((s, d) => s + (d.grossHours || 0), 0);
    const onTimeDays = recent.filter((d) => d.arrivalStatus === "on-time").length;

    setStats({
      avgHours: presentDays > 0 ? totalHours / presentDays : 0,
      onTimePercent: presentDays > 0 ? Math.round((onTimeDays / presentDays) * 100) : 0,
      presentDays,
      totalHours,
    });
  };

  const handleClockIn = async () => {
    if (!employee || !user) return;
    try {
      const res = await fetch(
        `/api/users/attendance/clockIn?employeeId=${employee.employeeId}&companyId=${user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (res.ok) {
        setClockStatus("clocked-in");
        setClockMessage("Clocked in successfully");
        setTimeout(() => { setClockMessage(""); loadAttendanceData(); }, 2000);
      } else {
        setClockMessage("Clock in failed");
      }
    } catch {
      setClockMessage("Clock in failed");
    }
  };

  const handleClockOut = async () => {
    if (!employee || !user) return;
    try {
      const res = await fetch(
        `/api/users/attendance/Clockout?employeeId=${employee.employeeId}&companyId=${user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (res.ok) {
        setClockStatus("clocked-out");
        setClockMessage("Clocked out successfully");
        setTimeout(() => { setClockMessage(""); loadAttendanceData(); }, 2000);
      } else {
        setClockMessage("Clock out failed");
      }
    } catch {
      setClockMessage("Clock out failed");
    }
  };

  const getFilteredDays = () => {
    if (activePeriod === "30days") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      return workingDays.filter((d) => d.dateObj >= cutoff);
    }
    const monthTabs = getMonthTabs();
    const tab = monthTabs.find((t) => t.label === activePeriod);
    if (tab) {
      return workingDays.filter(
        (d) => d.dateObj.getFullYear() === tab.year && d.dateObj.getMonth() === tab.month
      );
    }
    return workingDays;
  };

  const renderVisualBar = (day) => {
    if (!day.firstIn) return <div className="att-visual-empty">—</div>;

    const totalRange = TIMELINE_END - TIMELINE_START;
    const inDecimal = day.firstIn.getHours() + day.firstIn.getMinutes() / 60;
    const outDecimal = day.lastOut
      ? day.lastOut.getHours() + day.lastOut.getMinutes() / 60
      : null;

    const leftPct = Math.max(0, ((inDecimal - TIMELINE_START) / totalRange) * 100);
    const widthPct = outDecimal
      ? Math.min(((outDecimal - inDecimal) / totalRange) * 100, 100 - leftPct)
      : 4;

    return (
      <div className="att-visual-wrap">
        <div className="att-visual-track">
          <div
            className={`att-visual-bar${!day.lastOut ? " att-visual-active" : ""}`}
            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          />
        </div>
        <span className="att-visual-pin" title="Location">📍</span>
      </div>
    );
  };

  const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const todayDayIdx = (new Date().getDay() + 6) % 7;
  const monthTabs = getMonthTabs();
  const filteredDays = getFilteredDays();

  const timeStr = use24h
    ? currentTime.toLocaleTimeString("en-GB")
    : currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

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
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">keka</div>
          <ul className="sidebar-menu">
            <li onClick={() => router.push("/dashboard")}>Home</li>
            <li className="menu-item-with-submenu">
              <div className="menu-item-header">
                Me <span className="arrow">›</span>
              </div>
              <ul className="submenu">
                <li className="active" onClick={() => router.push("/me/attendance")}>
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
          {/* Top 3-panel grid */}
          <div className="att-top-grid">
            {/* Stats Panel */}
            <div className="card att-stats-panel">
              <div className="att-stat-row">
                <div className="att-stat-block">
                  <div className="att-stat-label">AVG HRS / DAY</div>
                  <div className="att-stat-value">{formatHM(stats.avgHours)}</div>
                </div>
                <div className="att-stat-block">
                  <div className="att-stat-label">ON TIME ARRIVAL</div>
                  <div className="att-stat-value">{stats.onTimePercent}%</div>
                </div>
              </div>
              <div className="att-stat-divider" />
              <div className="att-stat-row">
                <div className="att-stat-block">
                  <div className="att-stat-value-sm">{stats.presentDays}</div>
                  <div className="att-stat-label-sm">Days Present</div>
                </div>
                <div className="att-stat-block">
                  <div className="att-stat-value-sm">{formatHM(stats.totalHours)}</div>
                  <div className="att-stat-label-sm">Total Hours</div>
                </div>
              </div>
            </div>

            {/* Timings Panel */}
            <div className="card att-timings-panel">
              <div className="att-panel-title">Timings</div>
              <div className="att-week-row">
                {weekLabels.map((d, i) => (
                  <div
                    key={i}
                    className={`att-week-day${i === todayDayIdx ? " att-week-today" : ""}`}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="att-shift-label">Today (9:30 AM – 6:30 PM)</div>
              <div className="att-shift-track">
                <div className="att-shift-fill" />
              </div>
              <div className="att-shift-meta">
                <span>Duration: 9h 0m</span>
                <span className="att-break">☕ 0 min</span>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="card att-actions-panel">
              <div className="att-panel-title">Actions</div>
              <div className="att-live-time">{timeStr}</div>
              <div className="att-live-date">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              {clockMessage && (
                <div className="alert att-clock-msg">{clockMessage}</div>
              )}
              <div className="att-action-list">
                {clockStatus === "not-clocked-in" && (
                  <button className="att-action-primary" onClick={handleClockIn}>
                    🌐 Web Clock-In
                  </button>
                )}
                {clockStatus === "clocked-in" && (
                  <button className="att-action-primary att-action-out" onClick={handleClockOut}>
                    🌐 Web Clock-Out
                  </button>
                )}
                {clockStatus === "clocked-out" && (
                  <div className="att-clocked-done">✅ Clocked out for today</div>
                )}
                <button className="att-action-link">🏠 Work From Home</button>
                <button className="att-action-link">📋 On Duty</button>
                <button className="att-action-link">📄 Attendance Policy</button>
              </div>
            </div>
          </div>

          {/* Logs & Requests */}
          <div className="card full-width">
            <div className="att-logs-header">
              <span className="att-logs-title">Logs &amp; Requests</span>
              <label className="att-toggle-wrap">
                <div
                  className={`att-toggle${use24h ? " att-toggle-on" : ""}`}
                  onClick={() => setUse24h(!use24h)}
                >
                  <div className="att-toggle-thumb" />
                </div>
                <span className="att-toggle-label">24 hour format</span>
              </label>
            </div>

            {/* Tab bar */}
            <div className="att-tabs">
              {["log", "calendar", "requests"].map((tab) => (
                <button
                  key={tab}
                  className={`att-tab${activeTab === tab ? " att-tab-active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "log" && "Attendance Log"}
                  {tab === "calendar" && "Calendar"}
                  {tab === "requests" && "Attendance Requests"}
                </button>
              ))}
            </div>

            {activeTab === "log" && (
              <>
                {/* Period filter */}
                <div className="att-period-bar">
                  <button
                    className={`att-period-btn${activePeriod === "30days" ? " att-period-active" : ""}`}
                    onClick={() => setActivePeriod("30days")}
                  >
                    30 DAYS
                  </button>
                  {monthTabs.map((tab) => (
                    <button
                      key={tab.label + tab.year}
                      className={`att-period-btn${activePeriod === tab.label ? " att-period-active" : ""}`}
                      onClick={() => setActivePeriod(tab.label)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>DATE</th>
                        <th>ATTENDANCE VISUAL</th>
                        <th>EFFECTIVE HOURS</th>
                        <th>GROSS HOURS</th>
                        <th>ARRIVAL</th>
                        <th>LOG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDays.length > 0 ? (
                        filteredDays.map((day, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="att-date-primary">
                                {day.dateObj.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                })}
                              </span>
                            </td>
                            <td className="att-visual-cell">
                              {renderVisualBar(day)}
                            </td>
                            <td>
                              {day.effectiveHours !== null ? (
                                <span className="att-eff-hours">
                                  <span className="att-dot att-dot-full" />
                                  {formatHM(day.effectiveHours)}
                                </span>
                              ) : (
                                <span className="att-eff-hours att-eff-partial">
                                  <span className="att-dot att-dot-half" />
                                  {day.firstIn ? formatHM(0) : "—"}
                                </span>
                              )}
                            </td>
                            <td>
                              {day.grossHours !== null ? formatHM(day.grossHours) : "—"}
                            </td>
                            <td>
                              {day.arrival ? (
                                <span className={`att-arrival${day.arrivalStatus === "late" ? " att-late" : ""}`}>
                                  {day.arrivalStatus === "on-time" ? "✓" : "🚗"}{" "}
                                  {day.arrival}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <span className="att-log-check">✅</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="no-data">
                            No records for this period
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === "calendar" && (
              <div className="no-data" style={{ padding: "3rem" }}>
                Calendar view coming soon
              </div>
            )}
            {activeTab === "requests" && (
              <div className="no-data" style={{ padding: "3rem" }}>
                No attendance requests
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
