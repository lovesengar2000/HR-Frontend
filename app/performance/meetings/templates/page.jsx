"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../../components/Navbar";
import Sidebar from "../../../../components/Sidebar";
import "../../../styles/dashboard.css";

export default function AgendaTemplatesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", items: "" });
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

      const tRes = await fetch(
        `/api/performance/meetings/templates?companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (tRes.ok) {
        const d = await tRes.json();
        const list = Array.isArray(d) ? d : [];
        setTemplates(list);
        setExpanded(list.map(t => t.id));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  const isAdmin = user?.role === "COMPANY_ADMIN";

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const agendaItems = form.items.split("\n").map(s => s.trim()).filter(Boolean);
      const res = await fetch("/api/performance/meetings/templates", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description, items: agendaItems, companyId: user.companyId }),
      });
      if (res.ok) { setShowAdd(false); setForm({ name: "", description: "", items: "" }); await loadData(); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const toggleExpand = (id) => setExpanded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const emp = employee || {};

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/performance/meetings/templates" />
        <main className="main-content"><div className="loading"><div className="spinner"></div></div></main>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || "U")[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/performance/meetings/templates" />
        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Agenda Templates</h1>
              <p className="page-subtitle">Reusable meeting structures for 1:1 sessions</p>
            </div>
            {isAdmin && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ New Template</button>}
          </div>

          {templates.length === 0 ? (
            <div className="HRM-card org-empty" style={{ marginTop: "1.5rem" }}>
              <span>📝</span>
              <p>No agenda templates yet.{isAdmin ? " Create one to standardize 1:1 meetings." : ""}</p>
            </div>
          ) : (
            <div className="docs-type-grid">
              {templates.map((tpl, i) => {
                const isOpen = expanded.includes(tpl.id);
                const agendaItems = Array.isArray(tpl.items) ? tpl.items : [];
                return (
                  <div key={tpl.id || i} className="docs-type-card">
                    <div className="docs-type-header" onClick={() => toggleExpand(tpl.id)}>
                      <div className="docs-type-title-row">
                        <div className="docs-type-icon">📋</div>
                        <div>
                          <div className="docs-type-name">{tpl.name}</div>
                          {tpl.description && <div className="docs-type-count">{tpl.description}</div>}
                        </div>
                      </div>
                      <span className={`docs-type-chevron ${isOpen ? "open" : ""}`}>›</span>
                    </div>
                    {isOpen && (
                      <div className="docs-list">
                        {agendaItems.length === 0 ? (
                          <div className="docs-empty-type">No agenda items defined.</div>
                        ) : (
                          agendaItems.map((item, j) => (
                            <div key={j} className="docs-list-item">
                              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", minWidth: "1.2rem" }}>{j + 1}.</span>
                                <span className="docs-list-item-name">{item}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>New Agenda Template</h3>
            <div className="docs-form-group">
              <label className="docs-form-label">Template Name</label>
              <input className="form-control" placeholder="e.g. Weekly Check-in" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Description (optional)</label>
              <input className="form-control" placeholder="Brief description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Agenda Items (one per line)</label>
              <textarea
                className="form-control" rows={5}
                placeholder={"Wins & highlights\nBlockers & challenges\nPriorities for next week\nFeedback & career goals"}
                value={form.items}
                onChange={e => setForm(p => ({ ...p, items: e.target.value }))}
                style={{ resize: "vertical" }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={submitting || !form.name.trim()}>
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
