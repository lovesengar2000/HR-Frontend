"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "../styles/dashboard.css";

/* ─── helpers ─────────────────────────────────────────────── */
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#5b8dee,#a855f7)",
  "linear-gradient(135deg,#22c55e,#14b8a6)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#a855f7,#ec4899)",
  "linear-gradient(135deg,#14b8a6,#5b8dee)",
  "linear-gradient(135deg,#ef4444,#f59e0b)",
];

function avatarGradient(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function initials(name = "") {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] || "?").toUpperCase();
}

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function buildCalendar(year, month) {
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = first - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, month: month - 1, year: month === 0 ? year - 1 : year, other: true });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, month, year, other: false });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++)
    cells.push({ day: d, month: month + 1, year: month === 11 ? year + 1 : year, other: true });
  return cells;
}

/* ─── sub-components ──────────────────────────────────────── */
function PersonCard({ person }) {
  const statusMap = {
    on_time:    { label: "On Time",   cls: "badge-green"  },
    late:       { label: "Late",      cls: "badge-amber"  },
    off:        { label: "Off",       cls: "badge-red"    },
    remote:     { label: "Remote",    cls: "badge-blue"   },
    not_signed: { label: "Not In",    cls: "badge-muted"  },
  };
  const s = statusMap[person.todayStatus] || {};

  return (
    <div className="team-person-card">
      <div className="team-person-avatar" style={{ background: avatarGradient(person.name) }}>
        {initials(person.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="team-person-name">{person.name}</div>
        <div className="team-person-meta">{person.jobTitle || person.department || "—"}</div>
        {person.clockIn && (
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
            In {person.clockIn}{person.clockOut ? ` · Out ${person.clockOut}` : ""}
          </div>
        )}
      </div>
      {s.label && <span className={`team-person-badge ${s.cls}`}>{s.label}</span>}
    </div>
  );
}

function SectionBlock({ icon, title, people, emptyMsg }) {
  return (
    <div className="team-section">
      <div className="team-section-header">
        <span style={{ fontSize: "1.1rem" }}>{icon}</span>
        <span className="team-section-title">{title}</span>
        <span className="team-section-count">{people.length}</span>
      </div>
      {people.length === 0 ? (
        <p className="team-empty">{emptyMsg}</p>
      ) : (
        <div className="team-people-grid">
          {people.map((p, i) => <PersonCard key={p.employeeId || i} person={p} />)}
        </div>
      )}
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────── */
export default function MyTeamPage() {
  const router = useRouter();
  const [user,     setUser]     = useState(null);
  const [employee, setEmployee] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeSection, setActiveSection] = useState(null); // null = show all

  // calendar state
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw = await res.json();
      const data = JSON.parse(raw);
      if (res.status !== 200) { router.push("/"); return; }
      setUser(data.user);
      setEmployee(data.employee);

      const teamRes = await fetch(
        `/api/my-team?companyId=${data.user.companyId}&employeeId=${data.employee?.employeeId}&managerId=${data.employee?.managerId || ""}`,
        { method: "GET", credentials: "include" }
      );
      if (teamRes.ok) {
        const td = await teamRes.json();
        setTeamData(td);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  /* ── derive sections from teamData ── */
  const peers       = teamData?.peers       ?? [];
  const attendance  = teamData?.attendance  ?? [];
  const leaves      = teamData?.leaves      ?? [];

  // Build per-employee today status by merging leaves + attendance
  const peopleMap = useMemo(() => {
    const map = {};
    peers.forEach(p => { map[p.employeeId] = { ...p, todayStatus: "not_signed" }; });

    // Mark off (leave)
    const todayStr = new Date().toDateString();
    leaves.forEach(l => {
      if (map[l.employeeId]) map[l.employeeId].todayStatus = "off";
    });

    // Mark from attendance
    attendance.forEach(a => {
      if (!map[a.employeeId]) return;
      if (a.workMode === "remote") {
        map[a.employeeId].todayStatus = "remote";
      } else if (a.isLate) {
        map[a.employeeId].todayStatus = "late";
      } else if (a.clockIn) {
        map[a.employeeId].todayStatus = "on_time";
      }
      if (a.clockIn)  map[a.employeeId].clockIn  = a.clockIn;
      if (a.clockOut) map[a.employeeId].clockOut = a.clockOut;
    });

    return Object.values(map);
  }, [peers, attendance, leaves]);

  const offToday     = peopleMap.filter(p => p.todayStatus === "off");
  const notSignedIn  = peopleMap.filter(p => p.todayStatus === "not_signed");
  const onTime       = peopleMap.filter(p => p.todayStatus === "on_time");
  const lateEmployees= peopleMap.filter(p => p.todayStatus === "late");
  const remoteWorkers= peopleMap.filter(p => p.todayStatus === "remote");

  /* ── calendar leave dots ── */
  const calCells = useMemo(() => buildCalendar(calYear, calMonth), [calYear, calMonth]);

  // Build a map: "YYYY-M-D" -> [{ name, color }]
  const leaveByDay = useMemo(() => {
    const map = {};
    (teamData?.calendarEvents ?? []).forEach(ev => {
      const d = new Date(ev.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push({ name: ev.employeeName || ev.name, color: avatarGradient(ev.employeeName || ev.name) });
    });
    return map;
  }, [teamData]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  /* ── summary tiles config ── */
  const tiles = [
    { id: "off",     icon: "🏖️",  label: "Off Today",    count: offToday.length      },
    { id: "notsign", icon: "⏳",  label: "Not Signed In",count: notSignedIn.length   },
    { id: "ontime",  icon: "✅",  label: "On Time",       count: onTime.length        },
    { id: "late",    icon: "⚠️",  label: "Late",          count: lateEmployees.length },
    { id: "remote",  icon: "🌐",  label: "Remote",        count: remoteWorkers.length },
    { id: "peers",   icon: "👥",  label: "Peers",         count: peers.length         },
  ];

  const emp = employee || {};

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/my-team" />
        <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
      </div>
    </div>
  );

  const showSection = (id) => activeSection === null || activeSection === id;

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={emp.name || user?.email}
        userInitial={(emp.name || user?.email || "U")[0].toUpperCase()}
      />
      <div className="app-body">
        <Sidebar activePath="/my-team" />

        <main className="main-content">

          {/* ── Header ── */}
          <div className="page-header">
            <div>
              <h1 className="page-title">My Team</h1>
              <p className="page-subtitle">
                {emp.managerName ? `Team under ${emp.managerName}` : "Your peers and their status today"}
              </p>
            </div>
            <button className="btn btn-ghost" onClick={loadData} style={{ fontSize: "0.8rem" }}>
              ↺ Refresh
            </button>
          </div>

          {/* ── Summary tiles ── */}
          <div className="team-summary-grid">
            {tiles.map(t => (
              <div
                key={t.id}
                className={`team-summary-tile ${activeSection === t.id ? "active" : ""}`}
                onClick={() => setActiveSection(prev => prev === t.id ? null : t.id)}
              >
                <span className="team-tile-icon">{t.icon}</span>
                <span className="team-tile-count">{t.count}</span>
                <span className="team-tile-label">{t.label}</span>
              </div>
            ))}
          </div>

          {/* ── Sections ── */}
          {showSection("off") && (
            <SectionBlock
              icon="🏖️"
              title="Who is Off Today"
              people={offToday}
              emptyMsg="No one is on leave today."
            />
          )}

          {showSection("notsign") && (
            <SectionBlock
              icon="⏳"
              title="Not Signed In Yet"
              people={notSignedIn}
              emptyMsg="Everyone has signed in."
            />
          )}

          {showSection("ontime") && (
            <SectionBlock
              icon="✅"
              title="On Time"
              people={onTime}
              emptyMsg="No on-time sign-ins recorded yet."
            />
          )}

          {showSection("late") && (
            <SectionBlock
              icon="⚠️"
              title="Late Employees"
              people={lateEmployees}
              emptyMsg="No late sign-ins today."
            />
          )}

          {showSection("remote") && (
            <SectionBlock
              icon="🌐"
              title="Remote Workers"
              people={remoteWorkers}
              emptyMsg="No one is working remotely today."
            />
          )}

          {/* ── Team Calendar ── */}
          {(activeSection === null || activeSection === "calendar") && (
            <div className="team-calendar-card">
              {/* Calendar header */}
              <div className="team-cal-header">
                <span className="team-cal-title">
                  📅 Team Calendar — {MONTHS[calMonth]} {calYear}
                </span>
                <div className="team-cal-nav">
                  <button className="team-cal-nav-btn" onClick={prevMonth}>‹</button>
                  <button
                    className="team-cal-nav-btn"
                    onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); }}
                    style={{ width: "auto", padding: "0 0.5rem", fontSize: "0.72rem" }}
                  >
                    Today
                  </button>
                  <button className="team-cal-nav-btn" onClick={nextMonth}>›</button>
                </div>
              </div>

              {/* Day labels */}
              <div className="team-cal-grid">
                {DAYS.map(d => (
                  <div key={d} className="team-cal-day-label">{d}</div>
                ))}

                {/* Calendar cells */}
                {calCells.map((cell, i) => {
                  const isToday =
                    !cell.other &&
                    cell.day   === today.getDate() &&
                    cell.month === today.getMonth() &&
                    cell.year  === today.getFullYear();
                  const key = `${cell.year}-${cell.month}-${cell.day}`;
                  const dots = leaveByDay[key] || [];

                  return (
                    <div
                      key={i}
                      className={`team-cal-cell${cell.other ? " other-month" : ""}${isToday ? " today" : ""}`}
                    >
                      <span className="team-cal-date">{cell.day}</span>
                      {dots.length > 0 && (
                        <div className="team-cal-dot-row">
                          {dots.slice(0, 5).map((dot, j) => (
                            <div
                              key={j}
                              className="team-cal-dot"
                              style={{ background: dot.color }}
                              data-name={dot.name}
                            >
                              {dot.name[0]?.toUpperCase()}
                            </div>
                          ))}
                          {dots.length > 5 && (
                            <div
                              className="team-cal-dot"
                              style={{ background: "rgba(255,255,255,0.15)", color: "var(--text-muted)", fontSize: "0.5rem" }}
                            >
                              +{dots.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Dots = team members on leave</span>
                {peers.slice(0, 6).map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: avatarGradient(p.name), flexShrink: 0 }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{p.name?.split(" ")[0]}</span>
                  </div>
                ))}
                {peers.length > 6 && <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>+{peers.length - 6} more</span>}
              </div>
            </div>
          )}

          {/* ── All Peers ── */}
          {showSection("peers") && (
            <div className="team-section">
              <div className="team-section-header">
                <span style={{ fontSize: "1.1rem" }}>👥</span>
                <span className="team-section-title">All Peers</span>
                <span className="team-section-count">{peers.length}</span>
                {emp.managerName && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>
                    · reporting to {emp.managerName}
                  </span>
                )}
              </div>

              {peers.length === 0 ? (
                <p className="team-empty">No peers found under the same manager.</p>
              ) : (
                <div className="team-people-grid">
                  {peers.map((p, i) => (
                    <div key={p.employeeId || i} className="team-person-card">
                      <div
                        className="team-person-avatar"
                        style={{ background: avatarGradient(p.name) }}
                      >
                        {initials(p.name)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="team-person-name">{p.name}</div>
                        <div className="team-person-meta">{p.jobTitle || "—"}</div>
                        {p.department && (
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                            {p.department}
                          </div>
                        )}
                      </div>
                      {p.email && (
                        <a
                          href={`mailto:${p.email}`}
                          style={{ fontSize: "0.9rem", color: "var(--text-muted)", flexShrink: 0 }}
                          onClick={e => e.stopPropagation()}
                          title={p.email}
                        >
                          ✉️
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
