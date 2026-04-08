"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../finance.css";
import "../../../app/styles/dashboard.css";

const FINANCE_TABS = [
  { label: "Summary",    path: "/finance/summary" },
  { label: "My Pay",     path: "/finance/pay"     },
  { label: "Manage Tax", path: "/finance/tax"     },
];

const REGIME_INFO = {
  OLD: {
    label: "Old Regime",
    desc: "Allows deductions under 80C, 80D, HRA, LTA, and other exemptions to reduce taxable income.",
    pros: ["80C deductions up to ₹1.5L", "HRA & LTA exemptions", "Home loan interest deduction", "Standard deduction ₹50,000"],
  },
  NEW: {
    label: "New Regime",
    desc: "Lower, flat tax slabs with no exemptions/deductions (except standard deduction of ₹75,000 from FY 2024-25).",
    pros: ["Lower slab rates", "Standard deduction ₹75,000", "Simpler filing", "No need to track investments"],
  },
};

function fmtCurrency(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

export default function ManageTaxPage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [employee, setEmployee] = useState(null);
  const [tax, setTax]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState({ text: "", type: "" });

  // Local form state for regime selection
  const [selectedRegime, setSelectedRegime] = useState("NEW");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw  = await res.json();
      const data = JSON.parse(raw);
      if (res.status === 200) { setUser(data.user); setEmployee(data.Employee); }

      const taxRes = await fetch(
        `/api/finance/tax?employeeId=${data.Employee.employeeId}&companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (taxRes.status === 200) {
        const taxData = await taxRes.json();
        setTax(taxData);
        setSelectedRegime(taxData.taxRegime || "NEW");
      }
    } catch (err) {
      console.error("Error loading tax data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRegime = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/finance/tax", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employee.employeeId,
          companyId: user.companyId,
          taxRegime: selectedRegime,
        }),
      });
      if (res.status === 200 || res.status === 201) {
        setMessage({ text: "Tax regime updated successfully.", type: "success" });
        loadData();
      } else {
        setMessage({ text: "Failed to update tax regime.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Error: " + err.message, type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
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
          <Sidebar activePath="/finance/tax" />
          <main className="main-content">
            <div className="loading"><div className="spinner"></div></div>
          </main>
        </div>
      </div>
    );
  }

  const currentFY = (() => {
    const now = new Date();
    const y = now.getFullYear();
    return now.getMonth() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  })();

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={emp.name || user?.email}
        userInitial={(emp.name || user?.email || "U")[0].toUpperCase()}
      />
      <div className="app-body">
        <Sidebar activePath="/finance/tax" />

        <main className="main-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Finances</h1>
              <p className="page-subtitle">Tax declaration and regime for FY {currentFY}</p>
            </div>
          </div>

          <div className="finance-subnav">
            {FINANCE_TABS.map((t) => (
              <button
                key={t.path}
                className={`finance-subnav-btn ${t.path === "/finance/tax" ? "active" : ""}`}
                onClick={() => router.push(t.path)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {message.text && (
            <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
              {message.text}
            </div>
          )}

          {/* Tax Summary tiles */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Financial Year</span>
              <span className="stat-tile-value" style={{ fontSize: "1.2rem" }}>FY {currentFY}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Tax Regime</span>
              <span className="stat-tile-value" style={{ fontSize: "1.1rem" }}>
                {REGIME_INFO[tax?.taxRegime || "NEW"]?.label}
              </span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Estimated Tax Liability</span>
              <span className="stat-tile-value stat-amber">{fmtCurrency(tax?.estimatedTax)}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">TDS Deducted (YTD)</span>
              <span className="stat-tile-value">{fmtCurrency(tax?.tdsDeducted)}</span>
            </div>
          </div>

          {/* Regime Selector */}
          <div className="HRM-card">
            <div className="HRM-card-header">
              <span className="HRM-card-title">Tax Regime Selection</span>
              <span className="insight-period">Applicable from next payroll cycle</span>
            </div>

            <div className="regime-grid">
              {Object.entries(REGIME_INFO).map(([key, info]) => (
                <div
                  key={key}
                  className={`regime-card ${selectedRegime === key ? "selected" : ""}`}
                  onClick={() => setSelectedRegime(key)}
                >
                  <div className="regime-card-top">
                    <div className="regime-radio">
                      <div className={`regime-radio-dot ${selectedRegime === key ? "active" : ""}`} />
                    </div>
                    <div>
                      <div className="regime-name">{info.label}</div>
                      <div className="regime-desc">{info.desc}</div>
                    </div>
                  </div>
                  <ul className="regime-pros">
                    {info.pros.map((p, i) => (
                      <li key={i} className="regime-pro-item">
                        <span className="regime-pro-tick">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveRegime}
                disabled={saving || selectedRegime === tax?.taxRegime}
              >
                {saving ? "Saving…" : "Save Preference"}
              </button>
              {selectedRegime === tax?.taxRegime && (
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  This is your current selection.
                </span>
              )}
            </div>
          </div>

          {/* Tax Breakdown */}
          {tax?.breakdown && (
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Tax Computation</span>
                <span className="insight-period">Year-to-date</span>
              </div>
              <div className="tax-breakdown-list">
                {tax.breakdown.map((item, i) => (
                  <div key={i} className="tax-breakdown-row">
                    <span className="tax-breakdown-label">{item.label}</span>
                    <span className={`tax-breakdown-value ${item.type === "deduction" ? "pst-green" : item.type === "tax" ? "pst-red" : ""}`}>
                      {item.type === "deduction" ? "− " : ""}{fmtCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Declaration note */}
          <div className="tax-declaration-note HRM-card">
            <span className="tax-note-icon">ℹ️</span>
            <p>
              Your tax regime preference must be submitted before the payroll cut-off date for the current financial year.
              Once the year ends, no further changes can be made. Contact your HR or payroll team for assistance.
            </p>
          </div>

        </main>
      </div>
    </div>
  );
}
