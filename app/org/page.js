"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "../styles/dashboard.css";

/* ─────────────────────────────────────────────────────────────────
   OrgCard — the individual node card
───────────────────────────────────────────────────────────────── */
function OrgCard({ member, onSelect, depth = 0 }) {
  const colors = [
    "#5b8dee", // root  — blue
    "#10b981", // L1    — green
    "#f59e0b", // L2    — amber
    "#a855f7", // L3    — purple
    "#ef4444", // L4+   — red
  ];
  const color = colors[Math.min(depth, colors.length - 1)];

  return (
    <div
      className="org-card"
      onClick={() => onSelect(member)}
      style={{ "--node-color": color }}
      title={`${member.name} — click for details`}
    >
      <div className="org-card-avatar" style={{ background: color }}>
        {(member.firstName?.[0] || member.name?.[0] || "?").toUpperCase()}
      </div>
      <div className="org-card-name">
        {member.firstName && member.lastName
          ? `${member.firstName} ${member.lastName}`
          : member.name || "—"}
      </div>
      <div className="org-card-title">{member.jobTitle || member.designation || "Employee"}</div>
      {member.departmentName || member.department ? (
        <div className="org-card-dept">{member.departmentName || member.department}</div>
      ) : null}
      {(member.directReports?.length > 0) && (
        <div className="org-card-reports">
          {member.directReports.length} report{member.directReports.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   OrgBranch — recursive tree node with connector lines
───────────────────────────────────────────────────────────────── */
function OrgBranch({ member, onSelect, expandedNodes, onToggle, depth = 0 }) {
  const hasChildren = member.directReports?.length > 0;
  const isExpanded  = expandedNodes.has(member.employeeId || member.id);

  return (
    <div className="org-branch">

      {/* ── The card itself ── */}
      <div className="org-card-wrap">
        <OrgCard member={member} onSelect={onSelect} depth={depth} />
        {hasChildren && (
          <button
            className="org-toggle-btn"
            onClick={() => onToggle(member.employeeId || member.id)}
            title={isExpanded ? "Collapse" : "Expand"}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "−" : "+"}
          </button>
        )}
      </div>

      {/* ── Vertical connector from card down to children row ── */}
      {hasChildren && isExpanded && (
        <>
          <div className="org-v-line" />
          <div className="org-children-row">
            {member.directReports.map((child) => (
              <div key={child.employeeId || child.id} className="org-child-slot">
                {/* Vertical line inside each slot (from h-line down to child) */}
                <div className="org-slot-v-line" />
                <OrgBranch
                  member={child}
                  onSelect={onSelect}
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────────── */
export default function OrgPage() {
  const router = useRouter();
  const [user,           setUser]           = useState(null);
  const [employee,       setEmployee]       = useState(null);
  const [orgRoot,        setOrgRoot]        = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [expandedNodes,  setExpandedNodes]  = useState(new Set());
  const [searchTerm,     setSearchTerm]     = useState("");
  const [searchResults,  setSearchResults]  = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw  = await res.json();
      const data = JSON.parse(raw);
      if (res.status !== 200) { router.push("/"); return; }
      setUser(data.user);
      setEmployee(data.employee);

      const orgRes = await fetch(
        `/api/org?companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (orgRes.ok) {
        const orgData = await orgRes.json();
        setOrgRoot(orgData);
        // Auto-expand root + level 1
        const ids = new Set();
        if (orgData?.employeeId || orgData?.id) {
          ids.add(orgData.employeeId || orgData.id);
          orgData.directReports?.forEach((c) => ids.add(c.employeeId || c.id));
        }
        setExpandedNodes(ids);
      }
    } catch (err) {
      console.error("Error loading org data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Expand / collapse all
  const collectAllIds = (node, ids = new Set()) => {
    if (!node) return ids;
    ids.add(node.employeeId || node.id);
    node.directReports?.forEach((c) => collectAllIds(c, ids));
    return ids;
  };
  const handleExpandAll  = () => setExpandedNodes(collectAllIds(orgRoot));
  const handleCollapseAll = () => {
    const rootId = orgRoot?.employeeId || orgRoot?.id;
    setExpandedNodes(rootId ? new Set([rootId]) : new Set());
  };

  // Flat search across the tree
  const flattenTree = (node, arr = []) => {
    if (!node) return arr;
    arr.push(node);
    node.directReports?.forEach((c) => flattenTree(c, arr));
    return arr;
  };
  useEffect(() => {
    if (!searchTerm.trim()) { setSearchResults([]); return; }
    const q    = searchTerm.toLowerCase();
    const all  = flattenTree(orgRoot);
    const hits = all.filter((m) =>
      (m.name  || `${m.firstName} ${m.lastName}`).toLowerCase().includes(q) ||
      (m.jobTitle || m.designation || "").toLowerCase().includes(q) ||
      (m.departmentName || m.department || "").toLowerCase().includes(q)
    );
    setSearchResults(hits);
  }, [searchTerm, orgRoot]);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  const emp = employee || {};

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/org" />
          <main className="main-content">
            <div className="loading"><div className="spinner" /></div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || user?.email}
        userInitial={(emp.name || emp.firstName || user?.email || "U")[0].toUpperCase()}
      />
      <div className="app-body">
        <Sidebar activePath="/org" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Organization Chart</h1>
              <p className="page-subtitle">Reporting hierarchy — click any card to see details</p>
            </div>
            {orgRoot && (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn-outline-accent" onClick={handleExpandAll}>Expand All</button>
                <button className="btn-ghost"          onClick={handleCollapseAll}>Collapse All</button>
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ marginBottom: "1.25rem", position: "relative", maxWidth: 400 }}>
            <div className="admin-search-wrap">
              <span className="admin-search-icon">🔍</span>
              <input
                type="text"
                className="form-control admin-search-input"
                placeholder="Search by name, title, or department…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="org-search-dropdown">
                {searchResults.map((m) => {
                  const name = m.name || `${m.firstName || ""} ${m.lastName || ""}`.trim();
                  return (
                    <button
                      key={m.employeeId || m.id}
                      className="org-search-result"
                      onClick={() => { setSelectedMember(m); setSearchTerm(""); }}
                    >
                      <div className="org-search-avatar">{(name[0] || "?").toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {m.jobTitle || m.designation || "Employee"} · {m.departmentName || m.department || "—"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {searchTerm && searchResults.length === 0 && (
              <div className="org-search-dropdown" style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No results for "{searchTerm}"
              </div>
            )}
          </div>

          {/* Org chart */}
          <div className="org-chart-scroll-wrap">
            {orgRoot ? (
              <div className="org-chart-root">
                <OrgBranch
                  member={orgRoot}
                  onSelect={setSelectedMember}
                  expandedNodes={expandedNodes}
                  onToggle={handleToggle}
                  depth={0}
                />
              </div>
            ) : (
              <div className="org-empty">
                <span style={{ fontSize: "3rem" }}>🏢</span>
                <p style={{ marginTop: "0.75rem", color: "var(--text-muted)" }}>
                  Organization structure not available yet.
                </p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="org-legend">
            {["Root / CEO", "Level 1", "Level 2", "Level 3", "Level 4+"].map((label, i) => {
              const colors = ["#5b8dee", "#10b981", "#f59e0b", "#a855f7", "#ef4444"];
              return (
                <div key={label} className="org-legend-item">
                  <div className="org-legend-dot" style={{ background: colors[i] }} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

        </main>
      </div>

      {/* ── Member Detail Modal ── */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "var(--accent)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontWeight: 700, fontSize: "1.2rem", color: "#fff", flexShrink: 0,
                }}>
                  {(selectedMember.firstName?.[0] || selectedMember.name?.[0] || "?").toUpperCase()}
                </div>
                <div>
                  <h3 className="modal-title" style={{ marginBottom: "0.1rem" }}>
                    {selectedMember.firstName && selectedMember.lastName
                      ? `${selectedMember.firstName} ${selectedMember.lastName}`
                      : selectedMember.name || "—"}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {selectedMember.jobTitle || selectedMember.designation || "Employee"} · {selectedMember.departmentName || selectedMember.department || "—"}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedMember(null)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
              {[
                { label: "Email",          value: selectedMember.email },
                { label: "Phone",          value: selectedMember.phoneMobile || selectedMember.phone },
                { label: "Employee ID",    value: selectedMember.employeeId || selectedMember.id },
                { label: "Date of Joining",value: selectedMember.dateOfJoining ? new Date(selectedMember.dateOfJoining).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null },
                { label: "Manager",        value: selectedMember.managerName },
                { label: "Direct Reports", value: selectedMember.directReports?.length != null ? `${selectedMember.directReports.length} people` : null },
              ].filter((r) => r.value).map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>{value}</span>
                </div>
              ))}
            </div>

            {selectedMember.directReports?.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Direct Reports ({selectedMember.directReports.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: "240px", overflowY: "auto", paddingRight: "0.25rem" }}>
                  {selectedMember.directReports.map((r) => {
                    const name = r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.name || "—";
                    return (
                      <div key={r.employeeId || r.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0.65rem", background: "var(--surface-secondary)", borderRadius: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {(name[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{name}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.jobTitle || r.designation || "Employee"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "1.25rem" }}>
              <button className="btn btn-primary" onClick={() => setSelectedMember(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
