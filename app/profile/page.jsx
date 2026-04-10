"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "../styles/dashboard.css";

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "1rem", padding: "0.75rem 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</span>
      <span style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>{value || "—"}</span>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  const emp = employee || {};
  const initial = (emp.name || user?.email || "U")[0].toUpperCase();

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/profile" />
        <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar
        onLogout={handleLogout}
        userName={emp.name || user?.email}
        userInitial={initial}
      />
      <div className="app-body">
        <Sidebar activePath="/profile" />

        <main className="main-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">My Profile</h1>
              <p className="page-subtitle">Your personal and employment information</p>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => router.push("/profile/change-password")}
            >
              🔑 Change Password
            </button>
          </div>

          {/* Avatar hero */}
          <div className="HRM-card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {initial}
            </div>
            <div>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {emp.name || "—"}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                {emp.jobTitle || "Employee"}{emp.department ? ` · ${emp.department}` : ""}
              </p>
              <p style={{ fontSize: "0.78rem", color: "var(--accent)", margin: "0.2rem 0 0" }}>
                {user?.email}
              </p>
            </div>
          </div>

          {/* Personal Info */}
          <div className="HRM-card" style={{ marginTop: "1rem" }}>
            <div className="HRM-card-header">
              <span className="HRM-card-title">Personal Information</span>
            </div>
            <InfoRow label="Full Name"     value={emp.name} />
            <InfoRow label="Email"         value={user?.email} />
            <InfoRow label="Phone"         value={emp.phone} />
            <InfoRow label="Date of Birth" value={emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString("en-IN") : null} />
            <InfoRow label="Gender"        value={emp.gender} />
            <InfoRow label="Address"       value={emp.address} />
          </div>

          {/* Employment Info */}
          <div className="HRM-card" style={{ marginTop: "1rem" }}>
            <div className="HRM-card-header">
              <span className="HRM-card-title">Employment Details</span>
            </div>
            <InfoRow label="Employee ID"   value={emp.employeeId} />
            <InfoRow label="Department"    value={emp.department} />
            <InfoRow label="Job Title"     value={emp.jobTitle} />
            <InfoRow label="Manager"       value={emp.managerName} />
            <InfoRow label="Date of Join"  value={emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString("en-IN") : null} />
            <InfoRow label="Employment Type" value={emp.employmentType} />
            <InfoRow label="Work Location" value={emp.workLocation} />
          </div>
        </main>
      </div>
    </div>
  );
}
