"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

const STANDARD_START_HOUR = 9;   // 9:00 AM
const STANDARD_START_MIN  = 30;  // 9:30 AM = late threshold

function fmtHM(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function avgTimeLabel(totalMinutes, count) {
  if (!count) return "—";
  const avg = Math.round(totalMinutes / count);
  const h = Math.floor(avg / 60);
  const m = avg % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [workingDays, setWorkingDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0); // ms since clock-in today

  const [stats, setStats] = useState({
    presentDays: 0,
    leaveDays: 0,
    totalHours: 0,
    averageHours: 0,
    onTimeDays: 0,
    lateDays: 0,
    avgInMinutes: 0,
    avgOutMinutes: 0,
    inCount: 0,
    outCount: 0,
  });

  const [today, setToday] = useState({
    status: "not-started", // not-started | clocked-in | clocked-out
    inTime: null,
    outTime: null,
    hours: 0,
  });

  const timerRef = useRef(null);

  useEffect(() => {
    loadAttendanceData();
    return () => clearInterval(timerRef.current);
  }, []);

  // Live timer when clocked in
  useEffect(() => {
    clearInterval(timerRef.current);
    if (today.status === "clocked-in" && today.inTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - today.inTime.getTime());
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [today.status, today.inTime]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      const userdata = await fetch("/api/users/getData", {
        method: "GET",
        credentials: "include",
      });
      const ReceivedData = await userdata.json();
      const userDataJson = JSON.parse(ReceivedData);
      const companyId = userDataJson.user.companyId;

      if (userdata.status === 200) {
        setUser(userDataJson.user);
        setEmployee(userDataJson.Employee);
      }

      const GetAttendance = await fetch(
        `/api/users/attendance?employeeId=${userDataJson.Employee.employeeId}&companyId=${companyId}`,
        { method: "GET", credentials: "include" }
      );
      const attendanceData = await GetAttendance.json();
      if (GetAttendance.status === 200) {
        processAttendance(attendanceData);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAttendance = (records) => {
    const nowDate = new Date();
    const todayStr = nowDate.toDateString();

    // Use last 7 days for the table / stats
    const recent = records
      .filter((r) => (nowDate - new Date(r.eventTime)) / (1000 * 3600) < 24 * 7)
      .sort((a, b) => new Date(a.eventTime) - new Date(b.eventTime));

    let totalHours = 0;
    let presentDays = 0;
    let leaveDays = 0;
    let onTimeDays = 0;
    let lateDays = 0;
    let totalInMinutes = 0;  // sum of (h*60+m) for each clock-in
    let totalOutMinutes = 0;
    let inCount = 0;
    let outCount = 0;

    const AllWorkingDays = [];
    let clockInTime = null;
    let clockOutTime = null;

    // Today tracking
    let todayIn = null;
    let todayOut = null;

    recent.forEach((record) => {
      const isToday = new Date(record.eventTime).toDateString() === todayStr;

      if (record.eventType === "CLOCK_IN") {
        if (clockInTime) {
          // orphan clock-in (no clock-out before next clock-in)
          AllWorkingDays.push({
            date: clockInTime.toDateString(),
            intime: clockInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            outtime: "—",
            hours: null,
          });
        }
        clockInTime = new Date(record.eventTime);
        if (isToday) todayIn = clockInTime;

        // timing stats
        const inMin = clockInTime.getHours() * 60 + clockInTime.getMinutes();
        totalInMinutes += inMin;
        inCount++;

        // on-time check
        const lateThreshold = STANDARD_START_HOUR * 60 + STANDARD_START_MIN;
        if (inMin <= lateThreshold) onTimeDays++;
        else lateDays++;
      }

      if (record.eventType === "CLOCK_OUT") {
        clockOutTime = new Date(record.eventTime);
        if (isToday) todayOut = clockOutTime;
      }

      if (clockInTime && clockOutTime) {
        if (!AllWorkingDays.some((d) => d.date === clockInTime.toDateString())) {
          presentDays++;
        }
        const hours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
        totalHours += hours;

        const outMin = clockOutTime.getHours() * 60 + clockOutTime.getMinutes();
        totalOutMinutes += outMin;
        outCount++;

        AllWorkingDays.push({
          date: clockInTime.toDateString(),
          intime: clockInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          outtime: clockOutTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          hours,
        });
        clockInTime = null;
        clockOutTime = null;
      } else if (record.status === "leave") {
        leaveDays++;
      }
    });

    // handle open shift (clocked in, not yet clocked out)
    if (clockInTime) {
      AllWorkingDays.push({
        date: clockInTime.toDateString(),
        intime: clockInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        outtime: "—",
        hours: null,
      });
    }

    setWorkingDays(AllWorkingDays);
    setStats({
      presentDays,
      leaveDays,
      totalHours: totalHours.toFixed(2),
      averageHours: (totalHours / (presentDays || 1)).toFixed(2),
      onTimeDays,
      lateDays,
      avgInMinutes: totalInMinutes,
      avgOutMinutes: totalOutMinutes,
      inCount,
      outCount,
    });

    // Today card
    if (todayIn && todayOut) {
      setToday({
        status: "clocked-out",
        inTime: todayIn,
        outTime: todayOut,
        hours: (todayOut - todayIn) / (1000 * 60 * 60),
      });
    } else if (todayIn) {
      setToday({ status: "clocked-in", inTime: todayIn, outTime: null, hours: 0 });
      setElapsed(Date.now() - todayIn.getTime());
    } else {
      setToday({ status: "not-started", inTime: null, outTime: null, hours: 0 });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    router.push("/");
  };

  const onTimePercent =
    stats.inCount > 0 ? Math.round((stats.onTimeDays / stats.inCount) * 100) : 0;

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/me/attendance" />
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
        <Sidebar activePath="/me/attendance" />

        <main className="main-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Attendance</h1>
              <p className="page-subtitle">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* ── Top Row: Today + Timing Insights ─────────────────── */}
          <div className="attn-top-grid">

            {/* Today's Timing Card */}
            <div className="HRM-card today-timing-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Today's Timing</span>
                <span className={`clock-badge ${
                  today.status === "clocked-in" ? "badge-in"
                  : today.status === "clocked-out" ? "badge-out"
                  : "badge-idle"
                }`}>
                  {today.status === "clocked-in" ? "● Working"
                   : today.status === "clocked-out" ? "✓ Done"
                   : "○ Not Started"}
                </span>
              </div>

              {today.status === "clocked-in" && (
                <>
                  <div className="today-elapsed">{fmtElapsed(elapsed)}</div>
                  <p className="today-elapsed-label">Time elapsed since clock-in</p>
                  <div className="today-time-row">
                    <div className="today-time-block">
                      <span className="today-time-label">Clocked In</span>
                      <span className="today-time-value today-in">
                        {today.inTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="today-time-sep">→</div>
                    <div className="today-time-block">
                      <span className="today-time-label">Expected Out</span>
                      <span className="today-time-value">
                        {new Date(today.inTime.getTime() + 9 * 3600 * 1000)
                          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {today.status === "clocked-out" && (
                <>
                  <div className="today-elapsed">{fmtHM(today.hours)}</div>
                  <p className="today-elapsed-label">Total hours worked today</p>
                  <div className="today-time-row">
                    <div className="today-time-block">
                      <span className="today-time-label">Clocked In</span>
                      <span className="today-time-value today-in">
                        {today.inTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="today-time-sep">→</div>
                    <div className="today-time-block">
                      <span className="today-time-label">Clocked Out</span>
                      <span className="today-time-value today-out">
                        {today.outTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {today.status === "not-started" && (
                <p className="today-not-started">You haven't clocked in today.</p>
              )}
            </div>

            {/* Timing Insights */}
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Timing Insights</span>
                <span className="insight-period">Last 7 days</span>
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
                  <span className="ti-value ti-green">{stats.onTimeDays} day{stats.onTimeDays !== 1 ? "s" : ""}</span>
                </div>
                <div className="timing-insight-item">
                  <span className="ti-label">Late Arrivals</span>
                  <span className={`ti-value ${stats.lateDays > 0 ? "ti-red" : "ti-green"}`}>
                    {stats.lateDays} day{stats.lateDays !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* On-time rate bar */}
              <div className="ontime-bar-wrap">
                <div className="ontime-bar-header">
                  <span className="ontime-bar-label">Punctuality</span>
                  <span className="ontime-bar-pct">{onTimePercent}% on time</span>
                </div>
                <div className="ontime-bar-track">
                  <div
                    className="ontime-bar-fill"
                    style={{ width: `${onTimePercent}%` }}
                  />
                </div>
                <div className="ontime-bar-note">
                  Standard start: {STANDARD_START_HOUR}:{String(STANDARD_START_MIN).padStart(2, "0")} AM
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Row ─────────────────────────────────────────── */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Present</span>
              <span className="stat-tile-value stat-green">{stats.presentDays}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">On Leave</span>
              <span className="stat-tile-value stat-amber">{stats.leaveDays}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Total Hours</span>
              <span className="stat-tile-value">{stats.totalHours}h</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Avg Hours/Day</span>
              <span className="stat-tile-value">{stats.averageHours}h</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">On Time Days</span>
              <span className="stat-tile-value stat-green">{stats.onTimeDays}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Late Days</span>
              <span className={`stat-tile-value ${stats.lateDays > 0 ? "stat-red" : "stat-green"}`}>
                {stats.lateDays}
              </span>
            </div>
          </div>

          {/* ── Attendance Records Table ──────────────────────────── */}
          <div className="HRM-card HRM-card-full">
            <div className="HRM-card-header">
              <span className="HRM-card-title">Attendance Records</span>
              <span className="insight-period">Last 7 days</span>
            </div>
            {workingDays.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Clock In</th>
                      <th>Clock Out</th>
                      <th>Hours Worked</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workingDays
                      .slice()
                      .reverse()
                      .map((record, index) => {
                        const hasOut = record.outtime !== "—";
                        const hoursNum = hasOut ? parseFloat(record.hours) : 0;
                        const barPct = Math.min((hoursNum / 9) * 100, 100);
                        return (
                          <tr key={index}>
                            <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                              {record.date}
                            </td>
                            <td className="time-cell time-in">{record.intime}</td>
                            <td className="time-cell time-out">{record.outtime}</td>
                            <td>
                              {hasOut ? (
                                <div className="hours-bar-wrap">
                                  <div
                                    className="hours-bar"
                                    style={{ width: `${barPct}%` }}
                                    title={`${hoursNum.toFixed(2)}h of 9h target`}
                                  />
                                </div>
                              ) : (
                                <div className="hours-bar-wrap">
                                  <div className="hours-bar hours-bar-active" style={{ width: "30%" }} />
                                </div>
                              )}
                            </td>
                            <td style={{ color: "var(--text-secondary)" }}>
                              {hasOut ? fmtHM(hoursNum) : "—"}
                            </td>
                            <td>
                              <span className={`status-badge ${
                                hasOut ? "status-present" : "status-pending"
                              }`}>
                                {hasOut ? "Present" : "In Progress"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No attendance records found for the last 7 days</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
