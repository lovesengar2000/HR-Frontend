"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

const STANDARD_START_HOUR = 9;
const STANDARD_START_MIN  = 30;
const DAYS_TO_SHOW        = 30;

function fmtHM(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
}

function fmtTime(date) {
  if (!date) return "—";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function avgTimeLabel(totalMinutes, count) {
  if (!count) return "—";
  const avg = Math.round(totalMinutes / count);
  const h   = Math.floor(avg / 60);
  const m   = avg % 60;
  return `${h % 12 || 12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
}

const REGULARIZE_REASONS = [
  'Forgot to clock in',
  'Forgot to clock out',
  'Biometric failure',
  'Working from home',
  'On-site client visit',
  'System error',
  'Other',
];

/* ── Build a sorted list of the last N calendar days ── */
function buildDateRange(n) {
  const days = [];
  const now  = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

/* ── Pair clock-in/out events within one day's sorted records ── */
function pairSessions(dayRecords) {
  const sessions = [];
  let pendingIn  = null;

  dayRecords.forEach((r) => {
    if (r.eventType === "CLOCK_IN") {
      if (pendingIn) {
        // orphan clock-in — record as incomplete session
        sessions.push({ inTime: pendingIn, outTime: null, hours: 0, active: false });
      }
      pendingIn = r.time;
    } else if (r.eventType === "CLOCK_OUT") {
      if (pendingIn) {
        const hours = (r.time - pendingIn) / (1000 * 60 * 60);
        sessions.push({ inTime: pendingIn, outTime: r.time, hours, active: false });
        pendingIn = null;
      }
      // orphan clock-out — ignore
    }
  });

  // Active (open) session
  if (pendingIn) {
    sessions.push({ inTime: pendingIn, outTime: null, hours: 0, active: true });
  }

  return sessions;
}

export default function AttendancePage() {
  const router = useRouter();
  const [user,       setUser]       = useState(null);
  const [employee,   setEmployee]   = useState(null);
  const [days,       setDays]       = useState([]);   // array of day objects (newest first)
  const [loading,    setLoading]    = useState(true);
  const [elapsed,    setElapsed]    = useState(0);    // ms for live timer
  const [clockInLoading,  setClockInLoading]  = useState(false);
  const [clockOutLoading, setClockOutLoading] = useState(false);
  const [actionMsg,  setActionMsg]  = useState({ text: "", type: "" });
  const [expanded,   setExpanded]   = useState(new Set()); // expanded row dates

  /* Regularization */
  const [showReg,  setShowReg]  = useState(false);
  const [regForm,  setRegForm]  = useState({ date: "", clockIn: "", clockOut: "", reason: "", notes: "" });
  const [regLoading, setRegLoading] = useState(false);

  const [stats, setStats] = useState({
    presentDays: 0, absentDays: 0, totalHours: 0,
    averageHours: 0, onTimeDays: 0, lateDays: 0,
    avgInMinutes: 0, avgOutMinutes: 0, inCount: 0, outCount: 0,
  });

  /* today — derived from days array */
  const todayDay = days.find((d) => d.isToday) || null;

  const timerRef = useRef(null);

  useEffect(() => { loadData(); return () => clearInterval(timerRef.current); }, []);

  /* Live timer for active session */
  useEffect(() => {
    clearInterval(timerRef.current);
    const activeIn = todayDay?.activeInTime;
    if (activeIn) {
      timerRef.current = setInterval(() => setElapsed(Date.now() - activeIn.getTime()), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [todayDay?.activeInTime?.getTime()]);

  const flash = (text, type = "success") => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: "", type: "" }), 5000);
  };

  /* ── Load ─────────────────────────────────────────────────── */
  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/users/getData", { credentials: "include" });
      const raw  = await res.json();
      const data = JSON.parse(raw);
      if (res.status !== 200) { router.push("/"); return; }
      setUser(data.user);
      setEmployee(data.employee);

      const attnRes = await fetch(
        `/api/users/attendance?employeeId=${data.employee.employeeId}&companyId=${data.user.companyId}`,
        { credentials: "include" }
      );
      if (attnRes.ok) processAttendance(await attnRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Process records into per-day objects ─────────────────── */
  const processAttendance = (records) => {
    const todayStr = new Date().toDateString();

    /* Group raw records by calendar day */
    const byDay = {};
    records.forEach((r) => {
      const t   = new Date(r.eventTime);
      const key = t.toDateString();
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push({ ...r, time: t });
    });

    /* Build structured day objects for the display range */
    const dateRange = buildDateRange(DAYS_TO_SHOW);
    const result    = [];

    let totalHours = 0, presentDays = 0, absentDays = 0;
    let onTimeDays = 0, lateDays = 0;
    let totalInMinutes = 0, totalOutMinutes = 0, inCount = 0, outCount = 0;

    dateRange.forEach((dayDate) => {
      const dayStr    = dayDate.toDateString();
      const isToday   = dayStr === todayStr;
      const rawRecs   = (byDay[dayStr] || []).sort((a, b) => a.time - b.time);
      const sessions  = rawRecs.length > 0 ? pairSessions(rawRecs) : [];

      const completed      = sessions.filter((s) => s.outTime !== null);
      const activeSession  = sessions.find((s) => s.active) || null;
      const dayTotalHours  = completed.reduce((sum, s) => sum + s.hours, 0);
      const firstIn        = sessions[0]?.inTime  || null;
      const lastOut        = completed.length > 0 ? completed[completed.length - 1].outTime : null;
      const hasActivity    = sessions.length > 0;

      /* Status */
      let status;
      if (activeSession)           status = "in-progress";
      else if (completed.length)   status = "present";
      else if (isToday)            status = "not-started";
      else                         status = "absent";

      /* Stats — only count first clock-in per day for on-time check */
      if (status === "present" || status === "in-progress") {
        if (completed.length > 0) {
          presentDays++;
          totalHours += dayTotalHours;
        }
        if (firstIn) {
          const inMin = firstIn.getHours() * 60 + firstIn.getMinutes();
          totalInMinutes += inMin;
          inCount++;
          const threshold = STANDARD_START_HOUR * 60 + STANDARD_START_MIN;
          if (inMin <= threshold) onTimeDays++; else lateDays++;
        }
        if (lastOut) {
          totalOutMinutes += lastOut.getHours() * 60 + lastOut.getMinutes();
          outCount++;
        }
      } else if (status === "absent") {
        absentDays++;
      }

      result.push({
        dateStr: dayStr, isToday,
        dateISO: dayDate.toISOString().split("T")[0],
        rawDate: dayDate,
        sessions,
        completed,
        activeSession,
        totalHours:     dayTotalHours,
        firstIn,
        lastOut,
        hasActivity,
        activeInTime:   activeSession?.inTime || null,
        status,
      });
    });

    /* newest first for table */
    setDays(result.slice().reverse());

    setStats({
      presentDays, absentDays,
      totalHours:    totalHours.toFixed(2),
      averageHours:  (totalHours / (presentDays || 1)).toFixed(2),
      onTimeDays, lateDays,
      avgInMinutes:  totalInMinutes,
      avgOutMinutes: totalOutMinutes,
      inCount, outCount,
    });
  };

  /* ── Clock In ─────────────────────────────────────────────── */
  const handleClockIn = async () => {
    setClockInLoading(true);
    try {
      const res = await fetch("/api/users/attendance/clockIn", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: user.companyId, employeeId: employee.employeeId }),
      });
      if (res.ok) { flash("Clocked in!"); await loadData(); }
      else { const e = await res.json(); flash(e.error || "Failed to clock in.", "error"); }
    } catch { flash("Error clocking in.", "error"); }
    finally { setClockInLoading(false); }
  };

  /* ── Clock Out ────────────────────────────────────────────── */
  const handleClockOut = async () => {
    setClockOutLoading(true);
    try {
      const res = await fetch("/api/users/attendance/clockOut", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: user.companyId, employeeId: employee.employeeId }),
      });
      if (res.ok) { flash("Clocked out!"); await loadData(); }
      else { const e = await res.json(); flash(e.error || "Failed to clock out.", "error"); }
    } catch { flash("Error clocking out.", "error"); }
    finally { setClockOutLoading(false); }
  };

  /* ── Regularization ───────────────────────────────────────── */
  const openReg = (dayObj) => {
    setRegForm({
      date:     dayObj?.dateISO || new Date().toISOString().split("T")[0],
      clockIn:  "",
      clockOut: "",
      reason:   "",
      notes:    "",
    });
    setShowReg(true);
  };

  const handleRegularize = async (e) => {
    e.preventDefault();
    if (!regForm.date)    { flash("Date is required.", "error"); return; }
    if (!regForm.clockIn) { flash("Clock-in time is required.", "error"); return; }
    if (!regForm.reason)  { flash("Please select a reason.", "error"); return; }
    setRegLoading(true);
    try {
      const res = await fetch("/api/users/attendance/regularize", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId:  user.companyId,
          employeeId: employee.employeeId,
          date:       regForm.date,
          clockIn:    regForm.clockIn,
          clockOut:   regForm.clockOut || null,
          reason:     regForm.reason,
          notes:      regForm.notes,
        }),
      });
      if (res.ok) { flash("Regularization request submitted."); setShowReg(false); }
      else { const e = await res.json(); flash(e.error || "Failed to submit.", "error"); }
    } catch { flash("Error submitting.", "error"); }
    finally { setRegLoading(false); }
  };

  /* ── Row expand toggle ────────────────────────────────────── */
  const toggleExpand = (dateStr) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  const onTimePercent = stats.inCount > 0
    ? Math.round((stats.onTimeDays / stats.inCount) * 100) : 0;

  const emp     = employee || {};
  const empName = emp.firstName
    ? `${emp.firstName} ${emp.lastName || ""}`.trim()
    : emp.name || user?.email;

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/me/attendance" />
          <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
        </div>
      </div>
    );
  }

  /* ── Today's accumulated hours from completed sessions ── */
  const todayAccumulatedMs = (todayDay?.completed || []).reduce(
    (sum, s) => sum + (s.outTime - s.inTime), 0
  );
  const todayTotalHours = todayAccumulatedMs / (1000 * 60 * 60);

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={empName} userInitial={(empName || "U")[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/me/attendance" />
        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">My Attendance</h1>
              <p className="page-subtitle">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <button className="btn-outline-accent" onClick={() => openReg(null)}>
              ✏ Regularize Attendance
            </button>
          </div>

          {actionMsg.text && (
            <div className={`alert ${actionMsg.type === "error" ? "alert-error" : "alert-success"}`}>
              {actionMsg.text}
            </div>
          )}

          {/* ── Top Row ───────────────────────────────────────── */}
          <div className="attn-top-grid">

            {/* Today card */}
            <div className="HRM-card today-timing-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Today's Timing</span>
                <span className={`clock-badge ${
                  todayDay?.status === "in-progress" ? "badge-in"
                  : todayDay?.status === "present"   ? "badge-out"
                  : "badge-idle"
                }`}>
                  {todayDay?.status === "in-progress" ? "● Working"
                   : todayDay?.status === "present"   ? "✓ Done"
                   : "○ Not Started"}
                </span>
              </div>

              {/* Active session live timer */}
              {todayDay?.activeSession && (
                <div style={{ textAlign: "center", margin: "0.5rem 0" }}>
                  <div className="today-elapsed">{fmtElapsed(elapsed)}</div>
                  <p className="today-elapsed-label">Current session</p>
                  <div className="today-time-row" style={{ justifyContent: "center" }}>
                    <div className="today-time-block">
                      <span className="today-time-label">Session start</span>
                      <span className="today-time-value today-in">
                        {fmtTime(todayDay.activeSession.inTime)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Accumulated from completed sessions */}
              {todayDay?.completed?.length > 0 && (
                <div style={{ margin: "0.5rem 0", padding: "0.5rem 0.75rem", background: "var(--surface-secondary)", borderRadius: 8 }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    Total accumulated today ({todayDay.completed.length} session{todayDay.completed.length !== 1 ? "s" : ""})
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--accent)" }}>
                    {fmtHM(todayTotalHours)}
                  </div>
                </div>
              )}

              {/* Session list */}
              {todayDay?.sessions?.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", margin: "0.5rem 0" }}>
                  {todayDay.sessions.map((s, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      fontSize: "0.8rem", padding: "0.3rem 0.6rem",
                      background: s.active ? "rgba(91,141,238,0.1)" : "var(--surface-secondary)",
                      borderRadius: 6, border: s.active ? "1px solid var(--accent)" : "none",
                    }}>
                      <span style={{ color: "var(--text-muted)", minWidth: 56 }}>Session {i + 1}</span>
                      <span className="today-in">{fmtTime(s.inTime)}</span>
                      <span style={{ color: "var(--text-muted)" }}>→</span>
                      <span className={s.active ? "" : "today-out"}>
                        {s.active ? "Active" : fmtTime(s.outTime)}
                      </span>
                      {!s.active && (
                        <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>
                          {fmtHM(s.hours)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Not started */}
              {(!todayDay || todayDay.status === "not-started") && (
                <p className="today-not-started">You haven't clocked in today.</p>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                {/* Clock In — always available unless currently in an active session */}
                {!todayDay?.activeSession && (
                  <button
                    className="attn-action-btn attn-clockin-btn"
                    style={{ flex: 1 }}
                    onClick={handleClockIn}
                    disabled={clockInLoading}
                  >
                    {clockInLoading ? "Clocking In…" : "▶ Clock In"}
                  </button>
                )}
                {/* Clock Out — only when active session exists */}
                {todayDay?.activeSession && (
                  <button
                    className="attn-action-btn attn-clockout-btn"
                    style={{ flex: 1 }}
                    onClick={handleClockOut}
                    disabled={clockOutLoading}
                  >
                    {clockOutLoading ? "Clocking Out…" : "⏹ Clock Out"}
                  </button>
                )}
              </div>

              {todayDay?.status === "present" && (
                <p className="attn-done-note">
                  All sessions ended.{" "}
                  <button className="btn-link-sm" onClick={() => openReg(todayDay)}>Regularize</button>
                  {" "}if times are wrong.
                </p>
              )}
            </div>

            {/* Timing Insights */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Timing Insights</span>
                <span className="insight-period">Last {DAYS_TO_SHOW} days</span>
              </div>
              <div className="timing-insights-grid">
                <div className="timing-insight-item">
                  <span className="ti-label">Avg Arrival</span>
                  <span className="ti-value">{avgTimeLabel(stats.avgInMinutes, stats.inCount)}</span>
                </div>
                <div className="timing-insight-item">
                  <span className="ti-label">Avg Departure</span>
                  <span className="ti-value">{avgTimeLabel(stats.avgOutMinutes, stats.outCount)}</span>
                </div>
                <div className="timing-insight-item">
                  <span className="ti-label">On Time</span>
                  <span className="ti-value ti-green">{stats.onTimeDays}d</span>
                </div>
                <div className="timing-insight-item">
                  <span className="ti-label">Late Arrivals</span>
                  <span className={`ti-value ${stats.lateDays > 0 ? "ti-red" : "ti-green"}`}>{stats.lateDays}d</span>
                </div>
              </div>
              <div className="ontime-bar-wrap">
                <div className="ontime-bar-header">
                  <span className="ontime-bar-label">Punctuality</span>
                  <span className="ontime-bar-pct">{onTimePercent}% on time</span>
                </div>
                <div className="ontime-bar-track">
                  <div className="ontime-bar-fill" style={{ width: `${onTimePercent}%` }} />
                </div>
                <div className="ontime-bar-note">
                  Standard start: {STANDARD_START_HOUR}:{String(STANDARD_START_MIN).padStart(2, "0")} AM
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Row ─────────────────────────────────────────── */}
          <div className="stats-row">
            {[
              { label: "Present",      value: stats.presentDays,  cls: "stat-green" },
              { label: "Absent",       value: stats.absentDays,   cls: stats.absentDays > 0 ? "stat-red" : "" },
              { label: "Total Hours",  value: `${stats.totalHours}h`,    cls: "" },
              { label: "Avg Hrs/Day",  value: `${stats.averageHours}h`,  cls: "" },
              { label: "On Time Days", value: stats.onTimeDays,   cls: "stat-green" },
              { label: "Late Days",    value: stats.lateDays,     cls: stats.lateDays > 0 ? "stat-red" : "stat-green" },
            ].map(({ label, value, cls }) => (
              <div className="stat-tile" key={label}>
                <span className="stat-tile-label">{label}</span>
                <span className={`stat-tile-value ${cls}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* ── Attendance Records Table ──────────────────────────── */}
          <div className="HRM-card HRM-card-full">
            <div className="HRM-card-header">
              <span className="HRM-card-title">Attendance Records</span>
              <span className="insight-period">Last {DAYS_TO_SHOW} days</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>First In</th>
                    <th>Last Out</th>
                    <th>Sessions</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day,index) => {
                    const isExpanded = expanded.has(day.dateStr);
                    const barPct     = Math.min((day.totalHours / 9) * 100, 100);
                    return (
                      <React.Fragment key={day.dateStr}>
                        <tr
                          style={{ cursor: day.sessions.length > 1 ? "pointer" : "default" }}
                          onClick={() => day.sessions.length > 1 && toggleExpand(day.dateStr)}
                        >
                          <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              {day.sessions.length > 1 && (
                                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                  {isExpanded ? "▾" : "▸"}
                                </span>
                              )}
                              {day.dateStr}
                              {day.isToday && (
                                <span style={{ fontSize: "0.7rem", background: "var(--accent)", color: "#fff", borderRadius: 4, padding: "1px 5px" }}>
                                  Today
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="time-cell time-in">{fmtTime(day.firstIn)}</td>
                          <td className="time-cell time-out">{fmtTime(day.lastOut)}</td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                            {day.sessions.length > 0
                              ? `${day.sessions.length} session${day.sessions.length !== 1 ? "s" : ""}`
                              : "—"}
                          </td>
                          <td>
                            {day.status === "absent" ? (
                              <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>—</span>
                            ) : day.status === "in-progress" ? (
                              <div className="hours-bar-wrap">
                                <div className="hours-bar hours-bar-active" style={{ width: "30%" }} />
                              </div>
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <div className="hours-bar-wrap" style={{ flex: 1 }}>
                                  <div className="hours-bar" style={{ width: `${barPct}%` }} />
                                </div>
                                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                  {fmtHM(day.totalHours)}
                                </span>
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${
                              day.status === "present"     ? "status-present"
                              : day.status === "in-progress" ? "status-pending"
                              : day.status === "absent"      ? "status-rejected"
                              : "status-pending"
                            }`}>
                              {day.status === "in-progress" ? "In Progress"
                               : day.status === "not-started" ? "Not Started"
                               : day.status.charAt(0).toUpperCase() + day.status.slice(1)}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {!day.isToday && (
                              <button
                                className="btn-table-edit"
                                style={{ fontSize: "0.75rem" }}
                                onClick={() => openReg(day)}
                              >
                                ✏ Regularize
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expanded session rows */}
                        {isExpanded && day.sessions.map((s, si) => (
                          <tr key={`${day.dateStr}-s${si}`} className="attn-session-row">
                            <td style={{ paddingLeft: "2.5rem", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                              Session {si + 1}
                            </td>
                            <td className="time-cell time-in" style={{ fontSize: "0.8rem" }}>{fmtTime(s.inTime)}</td>
                            <td className="time-cell time-out" style={{ fontSize: "0.8rem" }}>
                              {s.active ? <span style={{ color: "var(--accent)" }}>Active</span> : fmtTime(s.outTime)}
                            </td>
                            <td />
                            <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                              {s.active ? "—" : fmtHM(s.hours)}
                            </td>
                            <td colSpan={2} />
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>

      {/* ── Regularization Modal ── */}
      {showReg && (
        <div className="modal-overlay" onClick={() => setShowReg(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">Attendance Regularization</h3>
                <p className="modal-subtitle">Request a correction — pending manager approval</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowReg(false)}>✕</button>
            </div>

            <form onSubmit={handleRegularize} style={{ marginTop: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Date <span className="required-star">*</span></label>
                <input className="form-control" type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={regForm.date}
                  onChange={(e) => setRegForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Clock-In <span className="required-star">*</span></label>
                  <input className="form-control" type="time"
                    value={regForm.clockIn}
                    onChange={(e) => setRegForm((f) => ({ ...f, clockIn: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Clock-Out</label>
                  <input className="form-control" type="time"
                    value={regForm.clockOut}
                    onChange={(e) => setRegForm((f) => ({ ...f, clockOut: e.target.value }))} />
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginTop: 3 }}>
                    Leave blank if only correcting clock-in
                  </span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason <span className="required-star">*</span></label>
                <select className="form-control" value={regForm.reason}
                  onChange={(e) => setRegForm((f) => ({ ...f, reason: e.target.value }))}>
                  <option value="">Select a reason…</option>
                  {REGULARIZE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={3}
                  placeholder="Additional context for your manager…"
                  value={regForm.notes}
                  onChange={(e) => setRegForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ padding: "0.7rem 0.85rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                This request will be sent to your manager for approval.
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={regLoading}>
                  {regLoading ? "Submitting…" : "Submit Request"}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowReg(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
