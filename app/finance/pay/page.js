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

function fmtCurrency(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

export default function MyPayPage() {
  const router = useRouter();
  const [user, setUser]             = useState(null);
  const [employee, setEmployee]     = useState(null);
  const [payslips, setPayslips]     = useState([]);
  const [selected, setSelected]     = useState(null); // currently expanded payslip
  const [loading, setLoading]       = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw  = await res.json();
      const data = JSON.parse(raw);
      if (res.status === 200) { setUser(data.user); setEmployee(data.Employee); }

      const payRes = await fetch(
        `/api/finance/payslips?employeeId=${data.Employee.employeeId}&companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (payRes.status === 200) {
        const slips = await payRes.json();
        const arr = Array.isArray(slips) ? slips : [];
        setPayslips(arr);
        if (arr.length > 0) setSelected(arr[0]);
      }
    } catch (err) {
      console.error("Error loading payslips:", err);
    } finally {
      setLoading(false);
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
          <Sidebar activePath="/finance/pay" />
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
        <Sidebar activePath="/finance/pay" />

        <main className="main-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Finances</h1>
              <p className="page-subtitle">Salary and payslip history</p>
            </div>
          </div>

          <div className="finance-subnav">
            {FINANCE_TABS.map((t) => (
              <button
                key={t.path}
                className={`finance-subnav-btn ${t.path === "/finance/pay" ? "active" : ""}`}
                onClick={() => router.push(t.path)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {payslips.length === 0 ? (
            <div className="HRM-card">
              <div className="finance-empty">
                <span style={{ fontSize: "2rem" }}>💸</span>
                <p>No payslips available yet.</p>
              </div>
            </div>
          ) : (
            <div className="pay-layout">

              {/* Payslip list */}
              <div className="pay-list HRM-card">
                <div className="HRM-card-header">
                  <span className="HRM-card-title">Payslips</span>
                </div>
                {payslips.map((slip) => {
                  const label = new Date(slip.periodStart).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
                  const isActive = selected?.payslipId === slip.payslipId;
                  return (
                    <div
                      key={slip.payslipId}
                      className={`payslip-row ${isActive ? "active" : ""}`}
                      onClick={() => setSelected(slip)}
                    >
                      <div className="payslip-row-info">
                        <span className="payslip-row-month">{label}</span>
                        <span className="payslip-row-status">
                          <span className={`status-badge ${slip.status === "PAID" ? "status-approved" : "status-pending"}`}>
                            {slip.status || "Processed"}
                          </span>
                        </span>
                      </div>
                      <span className="payslip-row-amount">{fmtCurrency(slip.netPay)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Payslip detail */}
              {selected && (
                <div className="pay-detail HRM-card">
                  <div className="payslip-detail-header">
                    <div>
                      <div className="payslip-detail-period">
                        {new Date(selected.periodStart).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                      </div>
                      <div className="payslip-detail-name">{emp.name}</div>
                      <div className="payslip-detail-id">{emp.employeeId}</div>
                    </div>
                    <div className="payslip-net-block">
                      <span className="payslip-net-label">Net Pay</span>
                      <span className="payslip-net-amount">{fmtCurrency(selected.netPay)}</span>
                    </div>
                  </div>

                  <div className="payslip-summary-row">
                    <div className="payslip-summary-tile">
                      <span className="pst-label">Gross Earnings</span>
                      <span className="pst-value pst-green">{fmtCurrency(selected.grossEarnings)}</span>
                    </div>
                    <div className="payslip-summary-tile">
                      <span className="pst-label">Total Deductions</span>
                      <span className="pst-value pst-red">{fmtCurrency(selected.totalDeductions)}</span>
                    </div>
                    <div className="payslip-summary-tile">
                      <span className="pst-label">Days Paid</span>
                      <span className="pst-value">{selected.daysPaid ?? "—"}</span>
                    </div>
                    <div className="payslip-summary-tile">
                      <span className="pst-label">Days LOP</span>
                      <span className="pst-value pst-amber">{selected.lossOfPayDays ?? 0}</span>
                    </div>
                  </div>

                  <div className="payslip-breakdown-grid">
                    {/* Earnings */}
                    <div>
                      <h3 className="payslip-breakdown-heading earnings-heading">Earnings</h3>
                      <div className="payslip-breakdown-list">
                        {(selected.earnings || []).map((item, i) => (
                          <div key={i} className="payslip-breakdown-row">
                            <span>{item.label}</span>
                            <span>{fmtCurrency(item.amount)}</span>
                          </div>
                        ))}
                        {(!selected.earnings || selected.earnings.length === 0) && (
                          <p className="no-data" style={{ padding: "1rem 0" }}>No breakdown available</p>
                        )}
                      </div>
                      <div className="payslip-breakdown-total">
                        <span>Gross Total</span>
                        <span>{fmtCurrency(selected.grossEarnings)}</span>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <h3 className="payslip-breakdown-heading deductions-heading">Deductions</h3>
                      <div className="payslip-breakdown-list">
                        {(selected.deductions || []).map((item, i) => (
                          <div key={i} className="payslip-breakdown-row">
                            <span>{item.label}</span>
                            <span>{fmtCurrency(item.amount)}</span>
                          </div>
                        ))}
                        {(!selected.deductions || selected.deductions.length === 0) && (
                          <p className="no-data" style={{ padding: "1rem 0" }}>No breakdown available</p>
                        )}
                      </div>
                      <div className="payslip-breakdown-total">
                        <span>Total Deductions</span>
                        <span>{fmtCurrency(selected.totalDeductions)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
