"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

const CATEGORIES = [
  { value: "travel", label: "Travel", icon: "✈️", subcategories: ["Flight", "Train", "Cab / Taxi", "Bus", "Fuel / Mileage", "Parking", "Other"] },
  { value: "accommodation", label: "Accommodation", icon: "🏨", subcategories: ["Hotel", "Guest House", "Other"] },
  { value: "meals", label: "Meals & Entertainment", icon: "🍽️", subcategories: ["Team Lunch / Dinner", "Client Meal", "Coffee / Snacks", "Other"] },
  { value: "office", label: "Office Supplies", icon: "🖊️", subcategories: ["Stationery", "Equipment", "Software / Subscriptions", "Other"] },
  { value: "communication", label: "Communication", icon: "📱", subcategories: ["Mobile Bill", "Internet", "Courier", "Other"] },
  { value: "other", label: "Other", icon: "📌", subcategories: ["Miscellaneous"] },
];

const STATUS_META = {
  PENDING:  { label: "Pending",  cls: "status-pending"  },
  APPROVED: { label: "Approved", cls: "status-approved" },
  REJECTED: { label: "Rejected", cls: "status-rejected" },
};

function fmtCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function ExpensePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("history"); // "new" | "history"

  // Form state
  const [form, setForm] = useState({
    category: "",
    subcategory: "",
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    title: "",
    description: "",
    receiptRef: "",
    isTravel: false,
    travelFrom: "",
    travelTo: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw = await res.json();
      const data = JSON.parse(raw);

      if (res.status === 200) {
        setUser(data.user);
        setEmployee(data.employee);
      }

      const expRes = await fetch(
        `/api/users/expenses?employeeId=${data.employee.employeeId}&companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (expRes.status === 200) {
        const expData = await expRes.json();
        setExpenses(Array.isArray(expData) ? expData : []);
      }
    } catch (err) {
      console.error("Error loading expense data:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATEGORIES.find((c) => c.value === form.category);

  const handleFormChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // reset subcategory when category changes
      if (field === "category") {
        next.subcategory = "";
        next.isTravel = value === "travel";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.date || !form.amount || !form.title) {
      setMessage({ text: "Please fill in all required fields.", type: "error" });
      return;
    }
    if (parseFloat(form.amount) <= 0) {
      setMessage({ text: "Amount must be greater than 0.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employeeId: employee.employeeId,
        companyId: user.companyId,
        category: form.category,
        subcategory: form.subcategory,
        date: form.date,
        amount: parseFloat(form.amount),
        title: form.title,
        description: form.description,
        receiptRef: form.receiptRef,
        ...(form.isTravel && { travelFrom: form.travelFrom, travelTo: form.travelTo }),
      };

      const res = await fetch("/api/users/expenses/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 200 || res.status === 201) {
        setMessage({ text: "Expense submitted successfully!", type: "success" });
        setForm({
          category: "", subcategory: "", date: new Date().toISOString().slice(0, 10),
          amount: "", title: "", description: "", receiptRef: "",
          isTravel: false, travelFrom: "", travelTo: "",
        });
        setActiveTab("history");
        setTimeout(() => {
          loadData();
          setMessage({ text: "", type: "" });
        }, 1800);
      } else {
        setMessage({ text: "Failed to submit expense. Please try again.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Error: " + err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.status === filter);
  const countByStatus = (s) => expenses.filter((e) => e.status === s).length;

  const totalPending  = expenses.filter((e) => e.status === "PENDING").reduce((s, e) => s + e.amount, 0);
  const totalApproved = expenses.filter((e) => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0);
  const totalAll      = expenses.reduce((s, e) => s + e.amount, 0);

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/me/expense" />
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
        userName={employee?.name || user?.email}
        userInitial={(employee?.name || user?.email || "U")[0].toUpperCase()}
      />
      <div className="app-body">
        <Sidebar activePath="/me/expense" />

        <main className="main-content">
          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Expense & Travel</h1>
              <p className="page-subtitle">Submit expenses for reimbursement and track their status</p>
            </div>
            <button
              className={`btn ${activeTab === "new" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setActiveTab(activeTab === "new" ? "history" : "new")}
            >
              {activeTab === "new" ? "← Back to History" : "+ New Expense"}
            </button>
          </div>

          {message.text && (
            <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
              {message.text}
            </div>
          )}

          {/* Summary tiles */}
          <div className="stats-row">
            <div className="stat-tile">
              <span className="stat-tile-label">Total Submitted</span>
              <span className="stat-tile-value">{fmtCurrency(totalAll)}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Pending Approval</span>
              <span className="stat-tile-value stat-amber">{fmtCurrency(totalPending)}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Approved</span>
              <span className="stat-tile-value stat-green">{fmtCurrency(totalApproved)}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile-label">Claims</span>
              <span className="stat-tile-value">{expenses.length}</span>
            </div>
          </div>

          {/* ── New Expense Form ──────────────────────────────── */}
          {activeTab === "new" && (
            <div className="expense-form-card HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">New Expense Claim</span>
              </div>

              <form onSubmit={handleSubmit} className="expense-form">

                {/* Category picker */}
                <div className="form-group">
                  <label className="form-label">Category <span className="req">*</span></label>
                  <div className="category-grid">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`category-btn ${form.category === cat.value ? "selected" : ""}`}
                        onClick={() => handleFormChange("category", cat.value)}
                      >
                        <span className="cat-icon">{cat.icon}</span>
                        <span className="cat-label">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategory */}
                {selectedCategory && (
                  <div className="form-group">
                    <label className="form-label">Sub-category</label>
                    <div className="subcat-pills">
                      {selectedCategory.subcategories.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`subcat-pill ${form.subcategory === s ? "selected" : ""}`}
                          onClick={() => handleFormChange("subcategory", s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Travel from/to */}
                {form.isTravel && (
                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">From</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Mumbai"
                        value={form.travelFrom}
                        onChange={(e) => handleFormChange("travelFrom", e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">To</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Bangalore"
                        value={form.travelTo}
                        onChange={(e) => handleFormChange("travelTo", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Title <span className="req">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Brief title for this expense"
                      value={form.title}
                      onChange={(e) => handleFormChange("title", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date <span className="req">*</span></label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.date}
                      onChange={(e) => handleFormChange("date", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) <span className="req">*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      min="1"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => handleFormChange("amount", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Purpose</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Describe the business purpose of this expense"
                    value={form.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Receipt Reference</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Invoice no., ticket no., or any reference"
                    value={form.receiptRef}
                    onChange={(e) => handleFormChange("receiptRef", e.target.value)}
                  />
                </div>

                <div className="expense-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit for Approval"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setActiveTab("history")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Expense History ───────────────────────────────── */}
          {activeTab === "history" && (
            <div className="HRM-card HRM-card-full">
              <div className="HRM-card-header">
                <span className="HRM-card-title">My Expense Claims</span>
              </div>

              <div className="filter-tabs">
                {[
                  { key: "all",      label: "All",      count: expenses.length },
                  { key: "PENDING",  label: "Pending",  count: countByStatus("PENDING") },
                  { key: "APPROVED", label: "Approved", count: countByStatus("APPROVED") },
                  { key: "REJECTED", label: "Rejected", count: countByStatus("REJECTED") },
                ].map((t) => (
                  <button
                    key={t.key}
                    className={`filter-tab ${filter === t.key ? "active" : ""}`}
                    onClick={() => setFilter(t.key)}
                  >
                    {t.label}
                    <span className="filter-tab-count">{t.count}</span>
                  </button>
                ))}
              </div>

              {filtered.length > 0 ? (
                <div className="expense-list">
                  {filtered.slice().reverse().map((exp, i) => {
                    const cat = CATEGORIES.find((c) => c.value === exp.category);
                    const statusMeta = STATUS_META[exp.status] || STATUS_META.PENDING;
                    return (
                      <div key={exp.expenseId || i} className="expense-item">
                        <div className="expense-icon-col">
                          <span className="expense-cat-icon">{cat?.icon || "📌"}</span>
                        </div>
                        <div className="expense-info">
                          <div className="expense-title">{exp.title}</div>
                          <div className="expense-meta">
                            {cat?.label}{exp.subcategory ? ` · ${exp.subcategory}` : ""}
                            {exp.travelFrom && exp.travelTo ? ` · ${exp.travelFrom} → ${exp.travelTo}` : ""}
                            {" · "}
                            {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          {exp.description && (
                            <div className="expense-desc">{exp.description}</div>
                          )}
                          {exp.receiptRef && (
                            <div className="expense-receipt">Ref: {exp.receiptRef}</div>
                          )}
                        </div>
                        <div className="expense-right">
                          <span className="expense-amount">{fmtCurrency(exp.amount)}</span>
                          <span className={`status-badge ${statusMeta.cls}`}>{statusMeta.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="expense-empty">
                  <span className="expense-empty-icon">💼</span>
                  <p>No {filter !== "all" ? filter.toLowerCase() : ""} expense claims found.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("new")}>
                    Submit your first expense →
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
