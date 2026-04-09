"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import Sidebar from "../../../../components/Sidebar";
import "../../../styles/dashboard.css";

export default function MyMeetingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", withEmployee: "", date: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);

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

      const mRes = await fetch(
        `/api/performance/meetings?companyId=${data.user.companyId}&employeeId=${data.employee?.employeeId}`,
        { method: "GET", credentials: "include" }
      );
      if (mRes.ok) {
        const d = await mRes.json();
        setMeetings(Array.isArray(d) ? d : []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/performance/meetings", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyId: user.companyId, employeeId: employee?.employeeId }),
      });
      if (res.ok) { setShowAdd(false); setForm({ title: "", withEmployee: "", date: "", notes: "" }); await loadData(); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const now = new Date();
  const filtered = meetings.filter(m => {
    if (filter === "upcoming") return m.date ? new Date(m.date) >= now : true;
    if (filter === "past") return m.date ? new Date(m.date) < now : false;
    return true;
  });

  const emp = employee || {};

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/performance/meetings/my" />
        <main className="main-content"><div className="loading"><div className="spinner"></div></div></main>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || "U")[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/performance/meetings/my" />
        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">My 1:1 Meetings</h1>
              <p className="page-subtitle">Scheduled and past one-on-one sessions</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Schedule Meeting</button>
          </div>

          <div className="filter-tabs">
            {[["upcoming","Upcoming"],["past","Past"],["all","All"]].map(([val, label]) => (
              <button key={val} className={`filter-tab ${filter === val ? "active" : ""}`} onClick={() => setFilter(val)}>
                {label}
                <span className="filter-tab-count">
                  {val === "all" ? meetings.length : val === "upcoming" ? meetings.filter(m => m.date ? new Date(m.date) >= now : true).length : meetings.filter(m => m.date ? new Date(m.date) < now : false).length}
                </span>
              </button>
            ))}
          </div>

          <div className="HRM-card" style={{ padding: 0, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div className="org-empty">
                <span>📅</span>
                <p>No meetings found.</p>
              </div>
            ) : (
              filtered.map((m, i) => (
                <div
                  key={m.id || i}
                  style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.12s" }}
                  onClick={() => setSelected(m)}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-card-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem", display: "block" }}>{m.title}</span>
                      {m.withEmployee && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>with {m.withEmployee}</span>}
                    </div>
                    {m.date && (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", flexShrink: 0 }}>
                        {new Date(m.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </main>
      </div>

      {/* Schedule modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>Schedule 1:1 Meeting</h3>
            <div className="docs-form-group">
              <label className="docs-form-label">Title / Topic</label>
              <input className="form-control" placeholder="e.g. Q2 Check-in" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Meeting With</label>
              <input className="form-control" placeholder="Employee name or email" value={form.withEmployee} onChange={e => setForm(p => ({ ...p, withEmployee: e.target.value }))} />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Date & Time</label>
              <input className="form-control" type="datetime-local" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Notes / Agenda (optional)</label>
              <textarea className="form-control" rows={3} placeholder="Agenda items or notes…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: "vertical" }} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={submitting || !form.title.trim()}>
                {submitting ? "Scheduling…" : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1rem" }}>{selected.title}</h3>
            <div className="member-detail-info">
              {selected.withEmployee && (
                <div className="member-detail-row">
                  <span className="member-detail-label">With</span>
                  <span className="member-detail-value">{selected.withEmployee}</span>
                </div>
              )}
              {selected.date && (
                <div className="member-detail-row">
                  <span className="member-detail-label">Date</span>
                  <span className="member-detail-value">{new Date(selected.date).toLocaleString()}</span>
                </div>
              )}
              {selected.notes && (
                <div className="member-detail-row">
                  <span className="member-detail-label">Notes</span>
                  <span className="member-detail-value" style={{ whiteSpace: "pre-wrap" }}>{selected.notes}</span>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
