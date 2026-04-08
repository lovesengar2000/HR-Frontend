"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../finance.css";
import "../../../app/styles/dashboard.css";

// Sub-nav tabs for the finance section
const FINANCE_TABS = [
  { label: "Summary",     path: "/finance/summary" },
  { label: "My Pay",      path: "/finance/pay"     },
  { label: "Manage Tax",  path: "/finance/tax"      },
];

function InfoRow({ label, value, highlight }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${highlight ? "info-value-highlight" : ""}`}>
        {value || <span className="info-empty">—</span>}
      </span>
    </div>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <div className="finance-section-card HRM-card">
      <div className="finance-section-header">
        <span className="finance-section-icon">{icon}</span>
        <h2 className="finance-section-title">{title}</h2>
      </div>
      <div className="finance-section-body">{children}</div>
    </div>
  );
}

export default function FinanceSummaryPage() {
  const router = useRouter();
  const [user, setUser]         = useState(null);
  const [employee, setEmployee] = useState(null);
  const [finance, setFinance]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw  = await res.json();
      const data = JSON.parse(raw);

      if (res.status === 200) {
        setUser(data.user);
        setEmployee(data.Employee);
      }

      const finRes = await fetch(
        `/api/finance/profile?employeeId=${data.Employee.employeeId}&companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (finRes.status === 200) {
        setFinance(await finRes.json());
      }
    } catch (err) {
      console.error("Error loading finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  // Helpers — pull from API response if available, fall back to employee object
  const emp = finance?.employee || employee || {};
  const pay = finance?.payment  || {};
  const id  = finance?.identity || {};
  const stat= finance?.statutory|| {};

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/finance/summary" />
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
        <Sidebar activePath="/finance/summary" />

        <main className="main-content">
          {/* Page header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">My Finances</h1>
              <p className="page-subtitle">Your financial profile and statutory information</p>
            </div>
          </div>

          {/* Finance sub-nav */}
          <div className="finance-subnav">
            {FINANCE_TABS.map((t) => (
              <button
                key={t.path}
                className={`finance-subnav-btn ${t.path === "/finance/summary" ? "active" : ""}`}
                onClick={() => router.push(t.path)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Payment Information ──────────────────────────── */}
          <SectionCard icon="🏦" title="Payment Information">
            <InfoRow label="Payment Mode"       value={pay.paymentMode || emp.paymentMode} />
            <InfoRow label="Bank Name"          value={pay.bankName} />
            <InfoRow label="Account Number"     value={pay.accountNumber ? `••••${pay.accountNumber.slice(-4)}` : null} />
            <InfoRow label="IFSC Code"          value={pay.ifscCode} />
            <InfoRow label="Account Type"       value={pay.accountType} />
            <InfoRow label="Bank Branch"        value={pay.bankBranch} />
            <InfoRow label="Salary Structure"   value={pay.salaryStructure || emp.salaryStructure} />
            <InfoRow label="Pay Schedule"       value={pay.paySchedule || "Monthly"} />
            <InfoRow label="Effective From"     value={pay.effectiveFrom} />
          </SectionCard>

          {/* ── Identity Information ─────────────────────────── */}
          <SectionCard icon="🪪" title="Identity Information">
            <InfoRow label="Employee ID"        value={emp.employeeId}                     highlight />
            <InfoRow label="Full Name"          value={emp.name}                           highlight />
            <InfoRow label="Date of Birth"      value={id.dateOfBirth     ? new Date(id.dateOfBirth).toLocaleDateString("en-IN") : null} />
            <InfoRow label="Gender"             value={id.gender          || emp.gender} />
            <InfoRow label="PAN Number"         value={id.panNumber} />
            <InfoRow label="Aadhaar Number"     value={id.aadhaarNumber   ? `••••••••${id.aadhaarNumber.slice(-4)}` : null} />
            <InfoRow label="Passport Number"    value={id.passportNumber} />
            <InfoRow label="Nationality"        value={id.nationality     || "Indian"} />
            <InfoRow label="Residential Status" value={id.residentialStatus} />
          </SectionCard>

          {/* ── Statutory Information ────────────────────────── */}
          <SectionCard icon="📋" title="Statutory Information">

            {/* PF */}
            <div className="statutory-group">
              <h3 className="statutory-group-title">Provident Fund (PF)</h3>
              <InfoRow label="PF Account Number (UAN)" value={stat.pfUAN}                 highlight />
              <InfoRow label="PF Member ID"            value={stat.pfMemberId} />
              <InfoRow label="PF Enrollment Date"      value={stat.pfEnrollmentDate ? new Date(stat.pfEnrollmentDate).toLocaleDateString("en-IN") : null} />
              <InfoRow label="Employer PF Contribution" value={stat.employerPFContribution ? `${stat.employerPFContribution}%` : null} />
              <InfoRow label="Employee PF Contribution" value={stat.employeePFContribution ? `${stat.employeePFContribution}%` : null} />
              <InfoRow label="PF Status"               value={stat.pfStatus} />
            </div>

            {/* ESI */}
            <div className="statutory-group">
              <h3 className="statutory-group-title">Employee State Insurance (ESI)</h3>
              <InfoRow label="ESI Number"              value={stat.esiNumber}             highlight />
              <InfoRow label="ESI Dispensary"          value={stat.esiDispensary} />
              <InfoRow label="ESI Enrollment Date"     value={stat.esiEnrollmentDate ? new Date(stat.esiEnrollmentDate).toLocaleDateString("en-IN") : null} />
              <InfoRow label="ESI Status"              value={stat.esiStatus} />
            </div>

            {/* LWF */}
            <div className="statutory-group">
              <h3 className="statutory-group-title">Labour Welfare Fund (LWF)</h3>
              <InfoRow label="LWF Applicable"         value={stat.lwfApplicable != null ? (stat.lwfApplicable ? "Yes" : "No") : null} />
              <InfoRow label="LWF State"              value={stat.lwfState} />
              <InfoRow label="LWF Employee Deduction" value={stat.lwfEmployeeDeduction != null ? `₹${stat.lwfEmployeeDeduction}` : null} />
              <InfoRow label="LWF Employer Contribution" value={stat.lwfEmployerContribution != null ? `₹${stat.lwfEmployerContribution}` : null} />
              <InfoRow label="LWF Status"             value={stat.lwfStatus} />
            </div>

            {/* PT */}
            <div className="statutory-group">
              <h3 className="statutory-group-title">Professional Tax (PT)</h3>
              <InfoRow label="PT Applicable"          value={stat.ptApplicable != null ? (stat.ptApplicable ? "Yes" : "No") : null} />
              <InfoRow label="PT State"               value={stat.ptState} />
              <InfoRow label="PT Monthly Deduction"   value={stat.ptMonthlyDeduction != null ? `₹${stat.ptMonthlyDeduction}` : null} />
            </div>

          </SectionCard>
        </main>
      </div>
    </div>
  );
}
