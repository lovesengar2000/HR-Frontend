"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "../styles/dashboard.css";

const ASSET_TYPES = [
  { value: "Laptop",    icon: "💻" },
  { value: "Monitor",   icon: "🖥️" },
  { value: "Keyboard",  icon: "⌨️" },
  { value: "Mouse",     icon: "🖱️" },
  { value: "Headset",   icon: "🎧" },
  { value: "Phone",     icon: "📱" },
  { value: "Chair",     icon: "🪑" },
  { value: "Other",     icon: "📦" },
];

const CONDITION_COLOR = {
  Excellent: "stat-green",
  Good:      "stat-green",
  Fair:      "stat-amber",
  Poor:      "stat-red",
};

export default function AssetsPage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [employee, setEmployee] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("assigned"); // "assigned" | "requests"
  const [reqFilter, setReqFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [returning, setReturning]   = useState(null); // assetId being returned
  const [message, setMessage]   = useState({ text: "", type: "" });

  // Request form state
  const [form, setForm] = useState({
    assetType: "",
    reason: "",
    urgency: "Normal",
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw  = await res.json();
      const data = JSON.parse(raw);
      if (res.status === 200) { setUser(data.user); setEmployee(data.employee); }

      const assetRes = await fetch(
        `/api/users/assets?employeeId=${data.employee.employeeId}&companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (assetRes.status === 200) {
        const assetData = await assetRes.json();
        setAssigned(assetData.assigned || []);
        setRequests(assetData.requests || []);
      }
    } catch (err) {
      console.error("Error loading assets:", err);
      setMessage({ text: "Failed to load asset data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!form.assetType || !form.reason.trim()) {
      setMessage({ text: "Please select an asset type and provide a reason.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/users/assets/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.employeeId,
          companyId: user.companyId,
          assetType: form.assetType,
          reason: form.reason,
          urgency: form.urgency,
        }),
      });
      if (res.status === 200 || res.status === 201) {
        setMessage({ text: "Asset request submitted successfully!", type: "success" });
        setForm({ assetType: "", reason: "", urgency: "Normal" });
        setShowForm(false);
        setTab("requests");
        setTimeout(() => { loadData(); setMessage({ text: "", type: "" }); }, 1500);
      } else {
        setMessage({ text: "Failed to submit request.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Error: " + err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnRequest = async (assetId) => {
    setReturning(assetId);
    try {
      const res = await fetch("/api/users/assets/return", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.employeeId,
          companyId: user.companyId,
          assetId,
        }),
      });
      if (res.status === 200 || res.status === 201) {
        setMessage({ text: "Return request submitted. Admin will process it.", type: "success" });
        loadData();
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      } else {
        setMessage({ text: "Failed to submit return request.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Error: " + err.message, type: "error" });
    } finally {
      setReturning(null);
    }
  };

  const filteredRequests = reqFilter === "all"
    ? requests
    : requests.filter((r) => r.status === reqFilter);

  const countReq = (s) => requests.filter((r) => r.status === s).length;

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/assets" />
          <main className="main-content">
            <div className="loading"><div className="spinner"></div></div>
          </main>
        </div>
      </div>
    );
  }

  const emp = employee || {};

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={emp.name || user?.email}
        userInitial={(emp.name || user?.email || "U")[0].toUpperCase()}
      />
      <div className="app-body">
        <Sidebar activePath="/assets" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">My Assets</h1>
              <p className="page-subtitle">Assigned company assets and requests</p>
            </div>
            <button
              className={`btn ${showForm ? "btn-ghost" : "btn-primary"}`}
              onClick={() => { setShowForm(!showForm); setMessage({ text: "", type: "" }); }}
            >
              {showForm ? "← Cancel" : "+ Request Asset"}
            </button>
          </div>

          {message.text && (
            <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
              {message.text}
            </div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Assigned</span>
              <span className="stat-tile-value">{assigned.length}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Pending Requests</span>
              <span className="stat-tile-value stat-amber">{countReq("PENDING")}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Return Requested</span>
              <span className="stat-tile-value stat-red">
                {assigned.filter((a) => a.returnStatus === "RETURN_REQUESTED").length}
              </span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Approved Requests</span>
              <span className="stat-tile-value stat-green">{countReq("APPROVED")}</span>
            </div>
          </div>

          {/* ── Request Form ─────────────────────────────────── */}
          {showForm && (
            <div className="HRM-card asset-request-form-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">New Asset Request</span>
              </div>
              <form onSubmit={handleRequestSubmit} className="asset-request-form">

                <div className="form-group">
                  <label className="form-label">Asset Type <span className="req">*</span></label>
                  <div className="asset-type-grid">
                    {ASSET_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        className={`asset-type-btn ${form.assetType === t.value ? "selected" : ""}`}
                        onClick={() => setForm((f) => ({ ...f, assetType: t.value }))}
                      >
                        <span className="asset-type-icon">{t.icon}</span>
                        <span>{t.value}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Reason / Purpose <span className="req">*</span></label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Describe why you need this asset"
                      value={form.reason}
                      onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Urgency</label>
                    <div className="urgency-options">
                      {["Normal", "Urgent"].map((u) => (
                        <button
                          key={u}
                          type="button"
                          className={`urgency-btn ${form.urgency === u ? "selected" : ""} ${u === "Urgent" ? "urgent" : ""}`}
                          onClick={() => setForm((f) => ({ ...f, urgency: u }))}
                        >
                          {u === "Urgent" ? "🔴" : "🟢"} {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="asset-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit Request"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Tabs ─────────────────────────────────────────── */}
          <div className="HRM-card HRM-card-full">
            <div className="asset-tabs">
              <button
                className={`asset-tab ${tab === "assigned" ? "active" : ""}`}
                onClick={() => setTab("assigned")}
              >
                Assigned Assets
                <span className="filter-tab-count">{assigned.length}</span>
              </button>
              <button
                className={`asset-tab ${tab === "requests" ? "active" : ""}`}
                onClick={() => setTab("requests")}
              >
                My Requests
                <span className="filter-tab-count">{requests.length}</span>
              </button>
            </div>

            {/* Assigned Assets */}
            {tab === "assigned" && (
              assigned.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Type</th>
                        <th>Serial No.</th>
                        <th>Issued On</th>
                        <th>Condition</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assigned.map((asset) => {
                        const isReturnPending = asset.returnStatus === "RETURN_REQUESTED";
                        const typeInfo = ASSET_TYPES.find((t) => t.value === asset.type) || { icon: "📦" };
                        return (
                          <tr key={asset.assetId}>
                            <td>
                              <div className="asset-name-cell">
                                <span className="asset-row-icon">{typeInfo.icon}</span>
                                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                  {asset.name}
                                </span>
                              </div>
                            </td>
                            <td>{asset.type}</td>
                            <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {asset.serialNumber || "—"}
                            </td>
                            <td>{asset.issuedDate ? new Date(asset.issuedDate).toLocaleDateString("en-IN") : "—"}</td>
                            <td>
                              <span className={CONDITION_COLOR[asset.condition] || ""} style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                                {asset.condition || "—"}
                              </span>
                            </td>
                            <td>
                              {isReturnPending ? (
                                <span className="status-badge status-return-requested">Return Requested</span>
                              ) : (
                                <span className="status-badge status-approved">Assigned</span>
                              )}
                            </td>
                            <td>
                              {!isReturnPending && (
                                <button
                                  className="btn btn-return"
                                  disabled={returning === asset.assetId}
                                  onClick={() => handleReturnRequest(asset.assetId)}
                                >
                                  {returning === asset.assetId ? "…" : "Request Return"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="asset-empty">
                  <span>🗄️</span>
                  <p>No assets assigned to you yet.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                    Request an asset →
                  </button>
                </div>
              )
            )}

            {/* My Requests */}
            {tab === "requests" && (
              <>
                <div className="filter-tabs">
                  {[
                    { key: "all",      label: "All",      count: requests.length },
                    { key: "PENDING",  label: "Pending",  count: countReq("PENDING") },
                    { key: "APPROVED", label: "Approved", count: countReq("APPROVED") },
                    { key: "REJECTED", label: "Rejected", count: countReq("REJECTED") },
                  ].map((t) => (
                    <button
                      key={t.key}
                      className={`filter-tab ${reqFilter === t.key ? "active" : ""}`}
                      onClick={() => setReqFilter(t.key)}
                    >
                      {t.label}
                      <span className="filter-tab-count">{t.count}</span>
                    </button>
                  ))}
                </div>

                {filteredRequests.length > 0 ? (
                  <div className="asset-request-list">
                    {filteredRequests.slice().reverse().map((req, i) => {
                      const typeInfo = ASSET_TYPES.find((t) => t.value === req.assetType) || { icon: "📦" };
                      const statusCls =
                        req.status === "APPROVED" ? "status-approved"
                        : req.status === "REJECTED" ? "status-rejected"
                        : "status-pending";
                      return (
                        <div key={req.requestId || i} className="asset-request-item">
                          <div className="asset-req-icon">{typeInfo.icon}</div>
                          <div className="asset-req-info">
                            <span className="asset-req-type">{req.assetType}</span>
                            <span className="asset-req-reason">{req.reason}</span>
                            <span className="asset-req-meta">
                              Requested on {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              {req.urgency === "Urgent" && <span className="urgency-tag">🔴 Urgent</span>}
                            </span>
                            {req.adminNote && (
                              <span className="asset-req-admin-note">Admin note: {req.adminNote}</span>
                            )}
                          </div>
                          <span className={`status-badge ${statusCls}`}>{req.status}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="asset-empty">
                    <span>📋</span>
                    <p>No {reqFilter !== "all" ? reqFilter.toLowerCase() : ""} requests found.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
