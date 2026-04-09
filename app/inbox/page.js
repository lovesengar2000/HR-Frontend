"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "../styles/dashboard.css";

const ITEM_TYPE_META = {
  REDIRECT: { label: "Notification", icon: "🔔", color: "text-blue" },
  MCQ_SURVEY: { label: "Survey", icon: "📋", color: "text-purple" },
  MEETING_REQUEST: { label: "Meeting", icon: "📅", color: "text-green" },
  FEEDBACK_FORM: { label: "Feedback", icon: "💬", color: "text-orange" },
  ANNOUNCEMENT: { label: "Announcement", icon: "📢", color: "text-red" },
};

export default function InboxPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Modal state for engagement items
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/getData", { method: "GET", credentials: "include" });
      const raw = await res.json();
      const data = JSON.parse(raw);
      if (res.status === 200) { setUser(data.user); setEmployee(data.employee); }

      const inboxRes = await fetch(
        `/api/inbox?employeeId=${data.employee.employeeId}&companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (inboxRes.status === 200) {
        const inboxData = await inboxRes.json();
        setItems(Array.isArray(inboxData) ? inboxData : []);
      }
    } catch (err) {
      console.error("Error loading inbox:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (inboxId) => {
    try {
      await fetch("/api/inbox/markRead", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxId, employeeId: employee.employeeId, companyId: user.companyId }),
      });
      setItems((prev) =>
        prev.map((item) => (item.inboxId === inboxId ? { ...item, isRead: true } : item))
      );
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const handleRedirect = (item) => {
    if (item.type === "REDIRECT" && item.redirectUrl) {
      handleMarkAsRead(item.inboxId);
      router.push(item.redirectUrl);
    }
  };

  const handleEngagementAction = async (item) => {
    handleMarkAsRead(item.inboxId);
    setSelectedItem(item);
    setModalData(item);
    setShowModal(true);
  };

  const handleMeetingResponse = async (response) => {
    setResponding(true);
    try {
      const res = await fetch("/api/inbox/respondMeeting", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inboxId: modalData.inboxId,
          employeeId: employee.employeeId,
          companyId: user.companyId,
          response,
        }),
      });
      if (res.status === 200 || res.status === 201) {
        setMessage({ text: `Meeting ${response}d successfully.`, type: "success" });
        setShowModal(false);
        loadData();
      }
    } catch (err) {
      setMessage({ text: "Error responding to meeting.", type: "error" });
    } finally {
      setResponding(false);
    }
  };

  const handleMCQSubmit = async (answers) => {
    setResponding(true);
    try {
      const res = await fetch("/api/inbox/submitMCQ", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inboxId: modalData.inboxId,
          employeeId: employee.employeeId,
          companyId: user.companyId,
          answers,
        }),
      });
      if (res.status === 200 || res.status === 201) {
        setMessage({ text: "Survey submitted successfully.", type: "success" });
        setShowModal(false);
        loadData();
      }
    } catch (err) {
      setMessage({ text: "Error submitting survey.", type: "error" });
    } finally {
      setResponding(false);
    }
  };

  const filteredItems =
    filter === "all" ? items : items.filter((item) => item.type === filter);

  const unreadCount = items.filter((i) => !i.isRead).length;
  const countByType = (type) => items.filter((i) => i.type === type).length;

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
          <Sidebar activePath="/inbox" />
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
        <Sidebar activePath="/inbox" />

        <main className="main-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Inbox</h1>
              <p className="page-subtitle">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "All caught up"}
              </p>
            </div>
          </div>

          {message.text && (
            <div className={`alert ${message.type === "error" ? "alert-error" : "alert-success"}`}>
              {message.text}
            </div>
          )}

          {/* Filter buttons */}
          <div className="inbox-filter-tabs">
            {[
              { key: "all", label: "All", count: items.length },
              { key: "REDIRECT", label: "Notifications", count: countByType("REDIRECT") },
              { key: "MCQ_SURVEY", label: "Surveys", count: countByType("MCQ_SURVEY") },
              { key: "MEETING_REQUEST", label: "Meetings", count: countByType("MEETING_REQUEST") },
              { key: "FEEDBACK_FORM", label: "Feedback", count: countByType("FEEDBACK_FORM") },
              { key: "ANNOUNCEMENT", label: "Announcements", count: countByType("ANNOUNCEMENT") },
            ].map((t) => (
              <button
                key={t.key}
                className={`inbox-filter-btn ${filter === t.key ? "active" : ""}`}
                onClick={() => setFilter(t.key)}
              >
                {t.label}
                {t.count > 0 && <span className="inbox-filter-count">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Inbox list */}
          <div className="HRM-card HRM-card-full">
            {filteredItems.length > 0 ? (
              <div className="inbox-list">
                {filteredItems.map((item, i) => {
                  const meta = ITEM_TYPE_META[item.type] || ITEM_TYPE_META.REDIRECT;
                  const isActionable = ["MCQ_SURVEY", "MEETING_REQUEST", "FEEDBACK_FORM"].includes(item.type);
                  const isRedirect = item.type === "REDIRECT";

                  return (
                    <div
                      key={item.inboxId || i}
                      className={`inbox-item ${!item.isRead ? "unread" : ""}`}
                      onClick={() =>
                        isRedirect
                          ? handleRedirect(item)
                          : isActionable
                          ? handleEngagementAction(item)
                          : handleMarkAsRead(item.inboxId)
                      }
                    >
                      <div className="inbox-item-icon">{meta.icon}</div>
                      <div className="inbox-item-content">
                        <div className="inbox-item-header">
                          <span className="inbox-item-type">{meta.label}</span>
                          {!item.isRead && <span className="inbox-item-unread-badge">New</span>}
                        </div>
                        <span className="inbox-item-title">{item.title}</span>
                        <span className="inbox-item-desc">{item.description}</span>
                        <span className="inbox-item-meta">
                          {item.senderName || "System"} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "—"}
                        </span>
                      </div>
                      {isActionable && (
                        <div className="inbox-item-action">
                          <span className="inbox-action-arrow">→</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="inbox-empty">
                <span>📭</span>
                <p>No {filter !== "all" ? filter.toLowerCase() : ""} messages found.</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                  {filter === "all"
                    ? "Your inbox is empty. Check back later for updates!"
                    : `No ${filter.toLowerCase()} messages in this category.`}
                </p>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* ── Modal for engagement actions ── */}
      {showModal && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>

            {/* Meeting Request Modal */}
            {modalData.type === "MEETING_REQUEST" && (
              <>
                <h3 className="modal-title">{modalData.title}</h3>
                <div className="modal-meeting-details">
                  <div className="meeting-detail-row">
                    <span className="meeting-detail-label">Organizer</span>
                    <span className="meeting-detail-value">{modalData.senderName}</span>
                  </div>
                  <div className="meeting-detail-row">
                    <span className="meeting-detail-label">Date & Time</span>
                    <span className="meeting-detail-value">
                      {modalData.meetingDate ? new Date(modalData.meetingDate).toLocaleString("en-IN") : "—"}
                    </span>
                  </div>
                  <div className="meeting-detail-row">
                    <span className="meeting-detail-label">Duration</span>
                    <span className="meeting-detail-value">{modalData.duration || "—"}</span>
                  </div>
                  <div className="meeting-detail-row">
                    <span className="meeting-detail-label">Location / Link</span>
                    <span className="meeting-detail-value">{modalData.meetingLink || "—"}</span>
                  </div>
                </div>
                <p className="modal-description">{modalData.description}</p>
                <div className="modal-actions" style={{ gap: "0.75rem" }}>
                  <button
                    className="btn btn-approve"
                    disabled={responding}
                    onClick={() => handleMeetingResponse("accept")}
                  >
                    {responding ? "…" : "✓ Accept"}
                  </button>
                  <button
                    className="btn btn-reject"
                    disabled={responding}
                    onClick={() => handleMeetingResponse("decline")}
                  >
                    {responding ? "…" : "✗ Decline"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                </div>
              </>
            )}

            {/* MCQ Survey Modal */}
            {modalData.type === "MCQ_SURVEY" && (
              <>
                <h3 className="modal-title">{modalData.title}</h3>
                <p className="modal-description">{modalData.description}</p>
                <div className="mcq-container">
                  {modalData.questions && modalData.questions.length > 0 ? (
                    modalData.questions.map((q, idx) => (
                      <div key={idx} className="mcq-question">
                        <span className="mcq-question-text">
                          {idx + 1}. {q.questionText}
                        </span>
                        <div className="mcq-options">
                          {(q.options || []).map((opt, optIdx) => (
                            <label key={optIdx} className="mcq-option">
                              <input type="radio" name={`q${idx}`} value={opt} />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">No questions available.</p>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    disabled={responding}
                    onClick={() => {
                      const answers = {};
                      modalData.questions?.forEach((q, idx) => {
                        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
                        if (selected) answers[idx] = selected.value;
                      });
                      handleMCQSubmit(answers);
                    }}
                  >
                    {responding ? "Submitting…" : "Submit Survey"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Feedback Form Modal */}
            {modalData.type === "FEEDBACK_FORM" && (
              <>
                <h3 className="modal-title">{modalData.title}</h3>
                <p className="modal-description">{modalData.description}</p>
                <textarea
                  className="form-control"
                  rows="5"
                  placeholder="Share your feedback here..."
                  id="feedback-text"
                  style={{ marginTop: "1rem" }}
                />
                <div className="modal-actions">
                  <button
                    className="btn btn-primary"
                    disabled={responding}
                    onClick={() => {
                      const feedbackText = (document.getElementById("feedback-text") )?.value || "";
                      handleMCQSubmit({ feedback: feedbackText });
                    }}
                  >
                    {responding ? "Submitting…" : "Submit Feedback"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Announcement Modal (view-only) */}
            {modalData.type === "ANNOUNCEMENT" && (
              <>
                <h3 className="modal-title">{modalData.title}</h3>
                <p className="modal-sender">From: {modalData.senderName || "Company"}</p>
                <p className="modal-description">{modalData.description}</p>
                {modalData.announcementBody && (
                  <div className="modal-body" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                    {modalData.announcementBody}
                  </div>
                )}
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                    Got it
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
