"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

const LEVEL_META = {
  BEGINNER:     { label: "Beginner",     pct: 25 },
  INTERMEDIATE: { label: "Intermediate", pct: 50 },
  ADVANCED:     { label: "Advanced",     pct: 75 },
  EXPERT:       { label: "Expert",       pct: 100 },
};

const CATEGORY_ICONS = {
  Technical:   "💻",
  Leadership:  "🧭",
  Communication: "💬",
  Design:      "🎨",
  Management:  "📋",
  Other:       "🔧",
};

export default function SkillsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Technical", level: "INTERMEDIATE" });
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

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

      const sRes = await fetch(
        `/api/performance/skills?companyId=${data.user.companyId}&employeeId=${data.employee?.employeeId}`,
        { method: "GET", credentials: "include" }
      );
      if (sRes.ok) {
        const d = await sRes.json();
        setSkills(Array.isArray(d) ? d : []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/performance/skills", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, companyId: user.companyId, employeeId: employee?.employeeId }),
      });
      if (res.ok) { setShowAdd(false); setForm({ name: "", category: "Technical", level: "INTERMEDIATE" }); await loadData(); }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const categories = ["all", ...Array.from(new Set(skills.map(s => s.category).filter(Boolean)))];
  const filtered = activeCategory === "all" ? skills : skills.filter(s => s.category === activeCategory);
  const grouped = filtered.reduce((acc, s) => {
    const cat = s.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});
  const emp = employee || {};

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/performance/skills" />
        <main className="main-content"><div className="loading"><div className="spinner"></div></div></main>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || "U")[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/performance/skills" />
        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Skills</h1>
              <p className="page-subtitle">Your skill set and proficiency levels</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Skill</button>
          </div>

          {/* Summary tiles */}
          {skills.length > 0 && (
            <div className="stats-row">
              {Object.entries(LEVEL_META).map(([key, meta]) => (
                <div key={key} className="stat-tile">
                  <span className="stat-tile-label">{meta.label}</span>
                  <span className="stat-tile-value">{skills.filter(s => s.level === key).length}</span>
                </div>
              ))}
            </div>
          )}

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="filter-tabs">
              {categories.map(cat => (
                <button key={cat} className={`filter-tab ${activeCategory === cat ? "active" : ""}`} onClick={() => setActiveCategory(cat)}>
                  {cat === "all" ? "All" : cat}
                  <span className="filter-tab-count">
                    {cat === "all" ? skills.length : skills.filter(s => s.category === cat).length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {skills.length === 0 ? (
            <div className="HRM-card org-empty">
              <span>💡</span>
              <p>No skills added yet. Add your first skill to get started.</p>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="HRM-card org-empty"><span>💡</span><p>No skills in this category.</p></div>
          ) : (
            Object.entries(grouped).map(([cat, catSkills]) => (
              <div key={cat}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", marginTop: "0.5rem" }}>
                  <span>{CATEGORY_ICONS[cat] || CATEGORY_ICONS.Other}</span>
                  <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>{cat}</span>
                </div>
                <div className="HRM-card" style={{ padding: 0, overflow: "hidden", marginBottom: "1rem" }}>
                  {catSkills.map((skill, i) => {
                    const lMeta = LEVEL_META[skill.level] || LEVEL_META.INTERMEDIATE;
                    return (
                      <div key={skill.id || i} style={{ padding: "0.875rem 1.25rem", borderBottom: i < catSkills.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                          <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>{skill.name}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{lMeta.label}</span>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[25, 50, 75, 100].map(step => (
                            <div
                              key={step}
                              style={{
                                flex: 1, height: "5px", borderRadius: "2px",
                                background: lMeta.pct >= step ? "var(--accent)" : "rgba(255,255,255,0.07)",
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

        </main>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>Add Skill</h3>
            <div className="docs-form-group">
              <label className="docs-form-label">Skill Name</label>
              <input className="form-control" placeholder="e.g. React, Data Analysis, Public Speaking" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Category</label>
              <select className="docs-form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {Object.keys(CATEGORY_ICONS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Proficiency Level</label>
              <select className="docs-form-select" value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}>
                {Object.entries(LEVEL_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={submitting || !form.name.trim()}>
                {submitting ? "Adding…" : "Add Skill"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
