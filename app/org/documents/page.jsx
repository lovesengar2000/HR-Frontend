"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

const TYPE_ICONS = {
  default: "📄",
  policy: "📋",
  holiday: "🗓️",
  claim: "🧾",
  handbook: "📖",
  form: "📝",
  guideline: "📌",
};

function getIcon(typeName = "") {
  const lower = typeName.toLowerCase();
  if (lower.includes("policy") || lower.includes("policies")) return TYPE_ICONS.policy;
  if (lower.includes("holiday")) return TYPE_ICONS.holiday;
  if (lower.includes("claim") || lower.includes("expense")) return TYPE_ICONS.claim;
  if (lower.includes("handbook")) return TYPE_ICONS.handbook;
  if (lower.includes("form")) return TYPE_ICONS.form;
  if (lower.includes("guideline")) return TYPE_ICONS.guideline;
  return TYPE_ICONS.default;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docTypes, setDocTypes] = useState([]);
  const [expandedTypes, setExpandedTypes] = useState([]);

  // Add-type modal
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [typeSubmitting, setTypeSubmitting] = useState(false);

  // Add-doc modal
  const [addDocFor, setAddDocFor] = useState(null); // typeId
  const [newDoc, setNewDoc] = useState({ name: "", description: "", url: "" });
  const [docSubmitting, setDocSubmitting] = useState(false);

  // View-doc modal
  const [viewDoc, setViewDoc] = useState(null);

  const isAdmin = user?.role === "COMPANY_ADMIN";

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

      const typesRes = await fetch(
        `/api/docs/types?companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (typesRes.ok) {
        const typesData = await typesRes.json();
        const types = Array.isArray(typesData) ? typesData : [];
        setDocTypes(types);
        // Auto-expand all types
        setExpandedTypes(types.map((t) => t.id));
      }
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  const toggleType = (id) => {
    setExpandedTypes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    setTypeSubmitting(true);
    try {
      const res = await fetch("/api/docs/types", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTypeName.trim(), companyId: user.companyId }),
      });
      if (res.ok) {
        setNewTypeName("");
        setShowAddType(false);
        await loadData();
      }
    } catch (err) {
      console.error("Error creating doc type:", err);
    } finally {
      setTypeSubmitting(false);
    }
  };

  const handleAddDoc = async () => {
    if (!newDoc.name.trim()) return;
    setDocSubmitting(true);
    try {
      const res = await fetch("/api/docs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDoc,
          typeId: addDocFor,
          companyId: user.companyId,
        }),
      });
      if (res.ok) {
        setNewDoc({ name: "", description: "", url: "" });
        setAddDocFor(null);
        await loadData();
      }
    } catch (err) {
      console.error("Error adding document:", err);
    } finally {
      setDocSubmitting(false);
    }
  };

  const emp = employee || {};

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/org/documents" />
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
        <Sidebar activePath="/org/documents" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Company Documents</h1>
              <p className="page-subtitle">Policies, holiday lists, forms, and more</p>
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowAddType(true)}>
                + Add Category
              </button>
            )}
          </div>

          {/* Document type cards */}
          {docTypes.length === 0 ? (
            <div className="HRM-card org-empty" style={{ marginTop: "1.5rem" }}>
              <span>📂</span>
              <p>No document categories yet.{isAdmin ? " Add one to get started." : ""}</p>
            </div>
          ) : (
            <div className="docs-type-grid">
              {docTypes.map((type) => {
                const isOpen = expandedTypes.includes(type.id);
                const docs = Array.isArray(type.documents) ? type.documents : [];
                return (
                  <div key={type.id} className="docs-type-card">
                    <div className="docs-type-header" onClick={() => toggleType(type.id)}>
                      <div className="docs-type-title-row">
                        <div className="docs-type-icon">{getIcon(type.name)}</div>
                        <div>
                          <div className="docs-type-name">{type.name}</div>
                          <div className="docs-type-count">
                            {docs.length} document{docs.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <span className={`docs-type-chevron ${isOpen ? "open" : ""}`}>›</span>
                    </div>

                    {isOpen && (
                      <div className="docs-list">
                        {docs.length === 0 ? (
                          <div className="docs-empty-type">No documents in this category.</div>
                        ) : (
                          docs.map((doc) => (
                            <div key={doc.id} className="docs-list-item">
                              <div className="docs-list-item-info">
                                <span className="docs-list-item-name">{doc.name}</span>
                                {doc.description && (
                                  <span className="docs-list-item-meta">{doc.description}</span>
                                )}
                              </div>
                              <button
                                className="docs-view-btn"
                                onClick={() => setViewDoc(doc)}
                              >
                                View
                              </button>
                            </div>
                          ))
                        )}
                        {isAdmin && (
                          <div className="docs-add-row">
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }}
                              onClick={() => { setAddDocFor(type.id); setNewDoc({ name: "", description: "", url: "" }); }}
                            >
                              + Add Document
                            </button>
                          </div>
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

      {/* ── Add Category Modal ── */}
      {showAddType && (
        <div className="modal-overlay" onClick={() => setShowAddType(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>New Document Category</h3>
            <div className="docs-form-group">
              <label className="docs-form-label">Category Name</label>
              <input
                className="form-control"
                placeholder="e.g. Company Policies, Holiday List"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowAddType(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddType} disabled={typeSubmitting || !newTypeName.trim()}>
                {typeSubmitting ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Document Modal ── */}
      {addDocFor !== null && (
        <div className="modal-overlay" onClick={() => setAddDocFor(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>Add Document</h3>
            <div className="docs-form-group">
              <label className="docs-form-label">Document Name</label>
              <input
                className="form-control"
                placeholder="e.g. Leave Policy 2025"
                value={newDoc.name}
                onChange={(e) => setNewDoc((p) => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Description (optional)</label>
              <input
                className="form-control"
                placeholder="Short description"
                value={newDoc.description}
                onChange={(e) => setNewDoc((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Document URL / Link</label>
              <input
                className="form-control"
                placeholder="https://..."
                value={newDoc.url}
                onChange={(e) => setNewDoc((p) => ({ ...p, url: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setAddDocFor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddDoc} disabled={docSubmitting || !newDoc.name.trim()}>
                {docSubmitting ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Document Modal ── */}
      {viewDoc && (
        <div className="modal-overlay" onClick={() => setViewDoc(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="member-detail-header">
              <div className="docs-type-icon" style={{ width: 48, height: 48, fontSize: 22 }}>
                {getIcon(viewDoc.typeName || "")}
              </div>
              <div>
                <h3 className="modal-title">{viewDoc.name}</h3>
                {viewDoc.description && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                    {viewDoc.description}
                  </p>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setViewDoc(null)}>Close</button>
              {viewDoc.url && (
                <a
                  className="btn btn-primary"
                  href={viewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  Open Document ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
