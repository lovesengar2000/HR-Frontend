"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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

  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: "Weak",   color: "#ef4444", pct: 25 };
    if (score === 2) return { label: "Fair",   color: "#f59e0b", pct: 50 };
    if (score === 3) return { label: "Good",   color: "#22c55e", pct: 75 };
    return              { label: "Strong", color: "#5b8dee", pct: 100 };
  };

  const strength = getPasswordStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setMessage({ text: "Please fill in all fields.", type: "error" });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }
    if (form.newPassword.length < 8) {
      setMessage({ text: "New password must be at least 8 characters.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          userId: user?.userId,
        }),
      });

      if (res.status === 200 || res.status === 201) {
        setMessage({ text: "Password changed successfully!", type: "success" });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ text: data.message || "Failed to change password. Check your current password.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Error: " + err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
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
              <h1 className="page-title">Change Password</h1>
              <p className="page-subtitle">Update your account password</p>
            </div>
            <button className="btn btn-ghost" onClick={() => router.push("/profile")}>
              ← Back to Profile
            </button>
          </div>

          {message.text && (
            <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
              {message.text}
            </div>
          )}

          <div className="HRM-card" style={{ maxWidth: "480px" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Current Password */}
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    className="form-control"
                    placeholder="Enter current password"
                    value={form.currentPassword}
                    onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.85rem" }}
                    onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
                  >
                    {showPasswords.current ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    className="form-control"
                    placeholder="Enter new password"
                    value={form.newPassword}
                    onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.85rem" }}
                    onClick={() => setShowPasswords((p) => ({ ...p, new: !p.new }))}
                  >
                    {showPasswords.new ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Strength indicator */}
                {form.newPassword && strength && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${strength.pct}%`, background: strength.color, borderRadius: "999px", transition: "width 0.3s ease" }} />
                    </div>
                    <span style={{ fontSize: "0.72rem", color: strength.color, marginTop: "0.25rem", display: "block" }}>
                      {strength.label} — {form.newPassword.length < 8 ? "Min 8 characters" : "Include uppercase, numbers & symbols for stronger password"}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    className="form-control"
                    placeholder="Re-enter new password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    autoComplete="new-password"
                    style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.newPassword ? "#ef4444" : "" }}
                  />
                  <button
                    type="button"
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.85rem" }}
                    onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}
                  >
                    {showPasswords.confirm ? "Hide" : "Show"}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                  <span style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: "0.25rem", display: "block" }}>
                    Passwords do not match
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Updating…" : "Update Password"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => router.push("/profile")}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
