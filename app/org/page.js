"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "../styles/dashboard.css";

function OrgNode({ member, onSelect, expandedNodes, onToggleExpand }) {
  const hasChildren = member.directReports && member.directReports.length > 0;
  const isExpanded = expandedNodes.includes(member.employeeId);

  return (
    <div className="org-node-wrapper">
      <div
        className="org-node"
        onClick={() => onSelect(member)}
      >
        <div className="org-node-avatar">
          <span>{member.name?.[0]?.toUpperCase() || "?"}</span>
        </div>
        <div className="org-node-info">
          <span className="org-node-name">{member.name}</span>
          <span className="org-node-title">{member.jobTitle || "Employee"}</span>
          <span className="org-node-dept">{member.department || "—"}</span>
        </div>
        {hasChildren && (
          <button
            className="org-node-expand"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(member.employeeId);
            }}
          >
            {isExpanded ? "−" : "+"}
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="org-children">
          {member.directReports.map((child) => (
            <div key={child.employeeId} className="org-child-branch">
              <OrgNode
                member={child}
                onSelect={onSelect}
                expandedNodes={expandedNodes}
                onToggleExpand={onToggleExpand}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [orgRoot, setOrgRoot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw = await res.json();
      const data = JSON.parse(raw);
      if (res.status === 200) { setUser(data.user); setEmployee(data.employee); }

      const orgRes = await fetch(
        `/api/org?companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (orgRes.status === 200) {
        const orgData = await orgRes.json();
        setOrgRoot(orgData);
        // Auto-expand first 2 levels on load
        const defaultExpanded = [];
        const collectIds = (node) => {
          defaultExpanded.push(node.employeeId);
          if (node.directReports?.length > 0) {
            node.directReports.forEach((child) => {
              defaultExpanded.push(child.employeeId);
            });
          }
        };
        collectIds(orgData);
        setExpandedNodes(defaultExpanded.slice(0, 10)); // Limit initial expansion
      }
    } catch (err) {
      console.error("Error loading org data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (employeeId) => {
    setExpandedNodes((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

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
        userName={emp.name || user?.email}
        userInitial={(emp.name || user?.email || "U")[0].toUpperCase()}
      />
      <div className="app-body">
        <Sidebar activePath="/org" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Organization Structure</h1>
              <p className="page-subtitle">Company hierarchy and team members</p>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: "1.5rem" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, title, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: "400px" }}
            />
            {searchTerm && (
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                Search is for reference only. Expand nodes to view hierarchy.
              </p>
            )}
          </div>

          {/* Org chart container */}
          <div className="HRM-card org-chart-card">
            {orgRoot ? (
              <div className="org-chart-container">
                <OrgNode
                  member={orgRoot}
                  onSelect={setSelectedMember}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                />
              </div>
            ) : (
              <div className="org-empty">
                <span>🏢</span>
                <p>Organization structure not available.</p>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* ── Member Detail Modal ── */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="member-detail-header">
              <div className="member-detail-avatar-lg">
                <span>{selectedMember.name?.[0]?.toUpperCase() || "?"}</span>
              </div>
              <div>
                <h3 className="modal-title">{selectedMember.name}</h3>
                <p className="member-detail-title">{selectedMember.jobTitle || "Employee"}</p>
                <p className="member-detail-dept">{selectedMember.department || "—"}</p>
              </div>
            </div>

            <div className="member-detail-info">
              <div className="member-detail-row">
                <span className="member-detail-label">Employee ID</span>
                <span className="member-detail-value">{selectedMember.employeeId}</span>
              </div>
              <div className="member-detail-row">
                <span className="member-detail-label">Email</span>
                <span className="member-detail-value">{selectedMember.email || "—"}</span>
              </div>
              <div className="member-detail-row">
                <span className="member-detail-label">Phone</span>
                <span className="member-detail-value">{selectedMember.phone || "—"}</span>
              </div>
              {selectedMember.managerId && (
                <div className="member-detail-row">
                  <span className="member-detail-label">Manager</span>
                  <span className="member-detail-value">{selectedMember.managerName || "—"}</span>
                </div>
              )}
              <div className="member-detail-row">
                <span className="member-detail-label">Direct Reports</span>
                <span className="member-detail-value stat-green" style={{ fontWeight: 700 }}>
                  {selectedMember.directReports?.length || 0}
                </span>
              </div>
            </div>

            {selectedMember.directReports && selectedMember.directReports.length > 0 && (
              <>
                <h4 style={{ fontSize: "0.85rem", color: "var(--text-primary)", marginTop: "1rem", marginBottom: "0.6rem", fontWeight: 600 }}>
                  Team Members ({selectedMember.directReports.length})
                </h4>
                <div className="member-reports-list">
                  {selectedMember.directReports.map((report) => (
                    <div key={report.employeeId} className="member-report-item">
                      <div className="member-report-avatar">
                        <span>{report.name?.[0]?.toUpperCase() || "?"}</span>
                      </div>
                      <div>
                        <span className="member-report-name">{report.name}</span>
                        <span className="member-report-title">{report.jobTitle || "Employee"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="modal-actions" style={{ marginTop: "1rem" }}>
              <button className="btn btn-primary" onClick={() => setSelectedMember(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
