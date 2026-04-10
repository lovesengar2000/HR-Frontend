"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

const ASSET_TYPES = [
  { value: "Laptop",   icon: "💻" },
  { value: "Monitor",  icon: "🖥️" },
  { value: "Keyboard", icon: "⌨️" },
  { value: "Mouse",    icon: "🖱️" },
  { value: "Headset",  icon: "🎧" },
  { value: "Phone",    icon: "📱" },
  { value: "Chair",    icon: "🪑" },
  { value: "Other",    icon: "📦" },
];

function assetIcon(type) {
  return ASSET_TYPES.find((t) => t.value === type)?.icon || "📦";
}

export default function AdminAssetsPage() {
  const router = useRouter();
  const [user, setUser]             = useState(null);
  const [employee, setEmployee]     = useState(null);
  const [requests, setRequests]     = useState([]);
  const [returns, setReturns]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState("requests");
  const [reqFilter, setReqFilter]   = useState("all");
  const [message, setMessage]       = useState({ text: "", type: "" });
  const [actionLoading, setActionLoading] = useState(null); // requestId/assetId being actioned
  const [rejectModal, setRejectModal]     = useState(null); // { requestId, reason }

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw  = await res.json();
      const data = JSON.parse(raw);
      if (res.status === 200) { setUser(data.user); setEmployee(data.employee); }

      const adminRes = await fetch(
        `/api/admin/assets?companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (adminRes.status === 200) {
        const adminData = await adminRes.json();
        setRequests(adminData.requests || []);
        setReturns(adminData.returns   || []);
      }
    } catch (err) {
      console.error("Error loading admin asset data:", err);
      setMessage({ text: "Failed to load asset data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const flash = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/admin/assets/approve", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: user.companyId, requestId }),
      });
      if (res.status === 200 || res.status === 201) {
        flash("Asset request approved.");
        loadData();
      } else {
        flash("Failed to approve request.", "error");
      }
    } catch (err) {
      flash("Error: " + err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.requestId);
    try {
      const res = await fetch("/api/admin/assets/reject", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: user.companyId,
          requestId: rejectModal.requestId,
          reason: rejectModal.reason,
        }),
      });
      if (res.status === 200 || res.status === 201) {
        flash("Asset request rejected.");
        setRejectModal(null);
        loadData();
      } else {
        flash("Failed to reject request.", "error");
      }
    } catch (err) {
      flash("Error: " + err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReturn = async (assetId) => {
    setActionLoading(assetId);
    try {
      const res = await fetch("/api/admin/assets/confirmReturn", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: user.companyId, assetId }),
      });
      if (res.status === 200 || res.status === 201) {
        flash("Asset return confirmed and unassigned.");
        loadData();
      } else {
        flash("Failed to confirm return.", "error");
      }
    } catch (err) {
      flash("Error: " + err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReqs = reqFilter === "all"
    ? requests
    : requests.filter((r) => r.status === reqFilter);

  const countReq  = (s) => requests.filter((r) => r.status === s).length;

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/admin" />
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
        <Sidebar activePath="/admin" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Asset Management</h1>
              <p className="page-subtitle">Review asset requests and process returns</p>
            </div>
            <button className="btn btn-ghost" onClick={() => router.push("/admin")}>
              ← Back to Admin
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
              <span className="stat-tile-label">Total Requests</span>
              <span className="stat-tile-value">{requests.length}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Pending</span>
              <span className="stat-tile-value stat-amber">{countReq("PENDING")}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Approved</span>
              <span className="stat-tile-value stat-green">{countReq("APPROVED")}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Pending Returns</span>
              <span className="stat-tile-value stat-red">{returns.length}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="HRM-card HRM-card-full">
            <div className="asset-tabs">
              <button
                className={`asset-tab ${tab === "requests" ? "active" : ""}`}
                onClick={() => setTab("requests")}
              >
                Asset Requests
                <span className="filter-tab-count">{requests.length}</span>
              </button>
              <button
                className={`asset-tab ${tab === "returns" ? "active" : ""}`}
                onClick={() => setTab("returns")}
              >
                Pending Returns
                <span className="filter-tab-count">{returns.length}</span>
              </button>
            </div>

            {/* ── Asset Requests tab ── */}
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

                {filteredReqs.length > 0 ? (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Asset Type</th>
                          <th>Reason</th>
                          <th>Urgency</th>
                          <th>Requested</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReqs.slice().reverse().map((req, i) => {
                          const statusCls =
                            req.status === "APPROVED" ? "status-approved"
                            : req.status === "REJECTED" ? "status-rejected"
                            : "status-pending";
                          const isPending = req.status === "PENDING";
                          const isActioning = actionLoading === req.requestId;
                          return (
                            <tr key={req.requestId || i}>
                              <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                {req.employeeName || req.employeeId}
                              </td>
                              <td>
                                <div className="asset-name-cell">
                                  <span>{assetIcon(req.assetType)}</span>
                                  <span>{req.assetType}</span>
                                </div>
                              </td>
                              <td style={{ maxWidth: 220, color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                                {req.reason}
                              </td>
                              <td>
                                {req.urgency === "Urgent"
                                  ? <span className="urgency-tag">🔴 Urgent</span>
                                  : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Normal</span>}
                              </td>
                              <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                                {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString("en-IN") : "—"}
                              </td>
                              <td>
                                <span className={`status-badge ${statusCls}`}>{req.status}</span>
                              </td>
                              <td>
                                {isPending && (
                                  <div style={{ display: "flex", gap: "0.4rem" }}>
                                    <button
                                      className="btn btn-approve"
                                      disabled={isActioning}
                                      onClick={() => handleApprove(req.requestId)}
                                    >
                                      {isActioning ? "…" : "Approve"}
                                    </button>
                                    <button
                                      className="btn btn-reject"
                                      disabled={isActioning}
                                      onClick={() => setRejectModal({ requestId: req.requestId, reason: "" })}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                                {req.status === "REJECTED" && req.adminNote && (
                                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                    {req.adminNote}
                                  </span>
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
                    <span>📋</span>
                    <p>No {reqFilter !== "all" ? reqFilter.toLowerCase() : ""} asset requests.</p>
                  </div>
                )}
              </>
            )}

            {/* ── Returns tab ── */}
            {tab === "returns" && (
              returns.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Asset</th>
                        <th>Type</th>
                        <th>Serial No.</th>
                        <th>Issued On</th>
                        <th>Return Requested</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returns.map((asset, i) => {
                        const isActioning = actionLoading === asset.assetId;
                        return (
                          <tr key={asset.assetId || i}>
                            <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              {asset.employeeName || asset.employeeId}
                            </td>
                            <td>
                              <div className="asset-name-cell">
                                <span>{assetIcon(asset.type)}</span>
                                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                  {asset.name}
                                </span>
                              </div>
                            </td>
                            <td>{asset.type}</td>
                            <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {asset.serialNumber || "—"}
                            </td>
                            <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                              {asset.issuedDate ? new Date(asset.issuedDate).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                              {asset.returnRequestedAt ? new Date(asset.returnRequestedAt).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td>
                              <button
                                className="btn btn-approve"
                                disabled={isActioning}
                                onClick={() => handleConfirmReturn(asset.assetId)}
                              >
                                {isActioning ? "…" : "Confirm Return"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="asset-empty">
                  <span>✅</span>
                  <p>No pending return requests.</p>
                </div>
              )
            )}
          </div>

          {/* ── Reject Modal ── */}
          {rejectModal && (
            <div className="modal-overlay" onClick={() => setRejectModal(null)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">Reject Request</h3>
                <p className="modal-subtitle">Provide a reason for rejecting this asset request.</p>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Reason for rejection (optional but recommended)"
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal((m) => ({ ...m, reason: e.target.value }))}
                  style={{ marginTop: "0.75rem" }}
                />
                <div className="modal-actions">
                  <button
                    className="btn btn-reject"
                    disabled={actionLoading === rejectModal.requestId}
                    onClick={handleReject}
                  >
                    {actionLoading === rejectModal.requestId ? "Rejecting…" : "Confirm Reject"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setRejectModal(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
