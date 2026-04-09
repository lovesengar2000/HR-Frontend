"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

const PRIORITY_COLORS = {
  HIGH:   { bg: "rgba(239,68,68,0.1)",   text: "#ef4444", label: "High"   },
  MEDIUM: { bg: "rgba(245,158,11,0.1)",  text: "#f59e0b", label: "Medium" },
  LOW:    { bg: "rgba(34,197,94,0.1)",   text: "#22c55e", label: "Low"    },
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "MEDIUM", pinned: false });
  const [submitting, setSubmitting] = useState(false);

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

      const aRes = await fetch(
        `/api/engage/announcements?companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (aRes.ok) {
        const d = await aRes.json();
        setAnnouncements(Array.isArray(d) ? d : []);
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

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/engage/announcements", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyId: user.companyId, authorId: employee?.employeeId }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: "", content: "", priority: "MEDIUM", pinned: false });
        await loadData();
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const isAdmin = user?.role === "COMPANY_ADMIN";
  const pinned = announcements.filter(a => a.pinned);
  const rest = announcements.filter(a => !a.pinned);
  const sorted = [...pinned, ...rest];
  const filtered = filter === "all" ? sorted : sorted.filter(a => a.priority === filter);
  const emp = employee || {};

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/engage/announcements" />
        <main className="main-content"><div className="loading"><div className="spinner"></div></div></main>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || "U")[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/engage/announcements" />
        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Announcements</h1>
              <p className="page-subtitle">Company-wide updates and notices</p>
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                + New Announcement
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="filter-tabs">
            {[["all","All"], ["HIGH","High Priority"], ["MEDIUM","Medium"], ["LOW","Low"]].map(([val, label]) => (
              <button key={val} className={`filter-tab ${filter === val ? "active" : ""}`} onClick={() => setFilter(val)}>
                {label}
                <span className="filter-tab-count">
                  {val === "all" ? announcements.length : announcements.filter(a => a.priority === val).length}
                </span>
              </button>
            ))}
          </div>

          {/* Announcements feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {filtered.length === 0 ? (
              <div className="HRM-card org-empty">
                <span>📢</span>
                <p>No announcements yet.</p>
              </div>
            ) : filtered.map((a, i) => {
              const pMeta = PRIORITY_COLORS[a.priority] || PRIORITY_COLORS.MEDIUM;
              const isOpen = expanded === (a.id || i);
              return (
                <div key={a.id || i} className="HRM-card" style={{ padding: 0, overflow: "hidden" }}>
                  {/* Header row */}
                  <div
                    style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "1rem" }}
                    onClick={() => setExpanded(isOpen ? null : (a.id || i))}
                  >
                    {/* Priority stripe */}
                    <div style={{ width: "3px", borderRadius: "2px", alignSelf: "stretch", background: pMeta.text, flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                        {a.pinned && (
                          <span style={{ fontSize: "0.7rem", background: "rgba(91,141,238,0.15)", color: "var(--accent)", padding: "0.1rem 0.45rem", borderRadius: "999px", fontWeight: 600 }}>
                            📌 Pinned
                          </span>
                        )}
                        <span style={{ fontSize: "0.7rem", background: pMeta.bg, color: pMeta.text, padding: "0.1rem 0.45rem", borderRadius: "999px", fontWeight: 600 }}>
                          {pMeta.label}
                        </span>
                      </div>
                      <h3 style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.2rem" }}>{a.title}</h3>
                      <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {a.author && <span>{a.author}</span>}
                        <span>{timeAgo(a.createdAt)}</span>
                      </div>
                    </div>

                    <span style={{ color: "var(--text-muted)", fontSize: "1rem", transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "none", flexShrink: 0 }}>›</span>
                  </div>

                  {/* Expanded content */}
                  {isOpen && (
                    <div style={{ padding: "0 1.25rem 1.25rem 2.75rem", borderTop: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7, paddingTop: "1rem", whiteSpace: "pre-wrap" }}>
                        {a.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </main>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card" style={{ maxWidth: "540px" }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>New Announcement</h3>

            <div className="docs-form-group">
              <label className="docs-form-label">Title</label>
              <input className="form-control" placeholder="Announcement title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Content</label>
              <textarea className="form-control" rows={5} placeholder="Write your announcement…" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="docs-form-group">
                <label className="docs-form-label">Priority</label>
                <select className="docs-form-select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="docs-form-group" style={{ justifyContent: "flex-end" }}>
                <label className="docs-form-label">Pin to top</label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "0.35rem" }}>
                  <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} />
                  <span style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>Pinned</span>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={submitting || !form.title.trim() || !form.content.trim()}>
                {submitting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
