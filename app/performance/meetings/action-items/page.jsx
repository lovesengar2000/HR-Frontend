"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import Sidebar from "../../../../components/Sidebar";
import "../../../styles/dashboard.css";

const PRIORITY_META = {
  HIGH:   { label: "High",   color: "stat-red"   },
  MEDIUM: { label: "Medium", color: "stat-amber"  },
  LOW:    { label: "Low",    color: "stat-green"  },
};

export default function ActionItemsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", priority: "MEDIUM", dueDate: "", assignee: "" });
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
        `/api/performance/meetings/action-items?companyId=${data.user.companyId}&employeeId=${data.employee?.employeeId}`,
        { method: "GET", credentials: "include" }
      );
      if (aRes.ok) {
        const d = await aRes.json();
        setItems(Array.isArray(d) ? d : []);
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
      const res = await fetch("/api/performance/meetings/action-items", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyId: user.companyId, employeeId: employee?.employeeId, status: "OPEN" }),
      });
      if (res.ok) { setShowAdd(false); setForm({ title: "", priority: "MEDIUM", dueDate: "", assignee: "" }); await loadData(); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const filtered = filter === "all" ? items : items.filter(i => i.status?.toLowerCase() === filter);
  const emp = employee || {};

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/performance/meetings/action-items" />
        <main className="main-content"><div className="loading"><div className="spinner"></div></div></main>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || "U")[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/performance/meetings/action-items" />
        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Action Items</h1>
              <p className="page-subtitle">Follow-up tasks from 1:1 meetings</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Action Item</button>
          </div>

          <div className="filter-tabs">
            {[["open","Open"],["completed","Completed"],["all","All"]].map(([val, label]) => (
              <button key={val} className={`filter-tab ${filter === val ? "active" : ""}`} onClick={() => setFilter(val)}>
                {label}
                <span className="filter-tab-count">
                  {val === "all" ? items.length : items.filter(i => i.status?.toLowerCase() === val).length}
                </span>
              </button>
            ))}
          </div>

          <div className="HRM-card" style={{ padding: 0, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div className="org-empty">
                <span>✅</span>
                <p>No action items found.</p>
              </div>
            ) : (
              filtered.map((item, i) => {
                const pMeta = PRIORITY_META[item.priority] || PRIORITY_META.MEDIUM;
                const isDone = item.status?.toLowerCase() === "completed";
                return (
                  <div key={item.id || i} style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isDone ? "var(--green)" : "var(--amber)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 500, fontSize: "0.875rem", color: isDone ? "var(--text-muted)" : "var(--text-primary)", textDecoration: isDone ? "line-through" : "none" }}>
                        {item.title}
                      </span>
                      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                        {item.assignee && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.assignee}</span>}
                        {item.dueDate && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Due {new Date(item.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <span className={pMeta.color} style={{ fontSize: "0.72rem", flexShrink: 0, fontWeight: 500 }}>{pMeta.label}</span>
                  </div>
                );
              })
            )}
          </div>

        </main>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>New Action Item</h3>
            <div className="docs-form-group">
              <label className="docs-form-label">Title</label>
              <input className="form-control" placeholder="e.g. Share Q2 report with team" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Assignee (optional)</label>
              <input className="form-control" placeholder="Name or email" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))} />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Priority</label>
              <select className="docs-form-select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Due Date</label>
              <input className="form-control" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={submitting || !form.title.trim()}>
                {submitting ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
