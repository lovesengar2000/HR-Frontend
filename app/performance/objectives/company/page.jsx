"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import Sidebar from "../../../../components/Sidebar";
import "../../../styles/dashboard.css";

const STATUS_META = {
  ON_TRACK:   { label: "On Track",   color: "stat-green" },
  AT_RISK:    { label: "At Risk",    color: "stat-amber" },
  OFF_TRACK:  { label: "Off Track",  color: "stat-red"   },
  COMPLETED:  { label: "Completed",  color: "stat-blue"  },
  NOT_STARTED:{ label: "Not Started",color: ""           },
};

export default function CompanyObjectivesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", owner: "" });
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

      const objRes = await fetch(
        `/api/performance/objectives?companyId=${data.user.companyId}&scope=company`,
        { method: "GET", credentials: "include" }
      );
      if (objRes.ok) {
        const d = await objRes.json();
        setObjectives(Array.isArray(d) ? d : []);
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

  const isAdmin = user?.role === "COMPANY_ADMIN";

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/performance/objectives", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyId: user.companyId, scope: "company" }),
      });
      if (res.ok) { setShowAdd(false); setForm({ title: "", description: "", dueDate: "", owner: "" }); await loadData(); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const filtered = filter === "all" ? objectives : objectives.filter(o => o.status === filter);
  const emp = employee || {};

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/performance/objectives/company" />
        <main className="main-content"><div className="loading"><div className="spinner"></div></div></main>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || "U")[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/performance/objectives/company" />
        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Company Objectives</h1>
              <p className="page-subtitle">Organization-wide goals and strategic targets</p>
            </div>
            {isAdmin && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Objective</button>}
          </div>

          {/* Filter tabs */}
          <div className="filter-tabs">
            {["all", "NOT_STARTED", "ON_TRACK", "AT_RISK", "OFF_TRACK", "COMPLETED"].map(f => (
              <button key={f} className={`filter-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : STATUS_META[f]?.label}
                <span className="filter-tab-count">
                  {f === "all" ? objectives.length : objectives.filter(o => o.status === f).length}
                </span>
              </button>
            ))}
          </div>

          <div className="HRM-card" style={{ padding: 0, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div className="org-empty">
                <span>🏆</span>
                <p>No company objectives found.</p>
              </div>
            ) : (
              filtered.map((obj, i) => {
                const meta = STATUS_META[obj.status] || STATUS_META.NOT_STARTED;
                const progress = obj.progress ?? 0;
                return (
                  <div key={obj.id || i} style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{obj.title}</span>
                          <span className={`status-badge ${meta.color}`} style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(255,255,255,0.06)" }}>
                            {meta.label}
                          </span>
                          {obj.owner && (
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>· {obj.owner}</span>
                          )}
                        </div>
                        {obj.description && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{obj.description}</p>}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.07)", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", borderRadius: "999px" }} />
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>{progress}%</span>
                        </div>
                      </div>
                      {obj.dueDate && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", flexShrink: 0 }}>
                          Due {new Date(obj.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
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
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>New Company Objective</h3>
            <div className="docs-form-group">
              <label className="docs-form-label">Title</label>
              <input className="form-control" placeholder="e.g. Expand into APAC markets" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Description (optional)</label>
              <input className="form-control" placeholder="Brief description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Owner (optional)</label>
              <input className="form-control" placeholder="e.g. Leadership Team" value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} />
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
