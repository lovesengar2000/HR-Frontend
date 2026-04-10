"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import "../styles/dashboard.css";

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [clockStatus, setClockStatus] = useState("not-clocked-in");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [clockInTime, setClockInTime] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("text");
  const [postImage, setPostImage] = useState(null);
  const [postPollOptions, setPostPollOptions] = useState(["", ""]);
  const [postQuestion, setPostQuestion] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userdata = await fetch("/api/users/getData", {
        method: "GET",
        credentials: "include",
      });

      const RecivedCokieData = await userdata.json();
      const userDataJson = JSON.parse(RecivedCokieData);
      const userId = userDataJson.user.userId;
      const companyId = userDataJson.user.companyId;

      if (userdata.status === 200) {
        setRole(userDataJson.role);
        setUser(userDataJson.user);
        setEmployee(userDataJson.employee);
      }

      const LeaveData = await fetch(
        `/api/users/leaves/leaveTypes?userId=${userId}&companyId=${companyId}`,
        { method: "GET", credentials: "include" }
      );
      const leavesData = await LeaveData.json();
      if (LeaveData.status === 200) setLeaves(leavesData);

      const LeaveBalanceData = await fetch(
        `/api/users/leaves/leaveBalance?userId=${userId}&companyId=${companyId}`,
        { method: "GET", credentials: "include" }
      );
      const leaveBalanceData = await LeaveBalanceData.json();
      if (LeaveBalanceData.status === 200) setLeaveBalance(leaveBalanceData);

      if (userDataJson.employee?.employeeId) {
        const GetAttendance = await fetch(
          `/api/users/attendance?companyId=${companyId}&employeeId=${userDataJson.employee.employeeId}`,
          { method: "GET", credentials: "include" }
        );
        const getAttendanceData = await GetAttendance.json();
        if (GetAttendance.status === 200) {
          const today = new Date().toDateString();
          const todayRecords = getAttendanceData
            .filter((a) => new Date(a.eventTime).toDateString() === today)
            .sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));

          const lastEvent = todayRecords[0];
          if (lastEvent?.eventType === "CLOCK_OUT") {
            setClockStatus("clocked-out");
          } else if (lastEvent?.eventType === "CLOCK_IN") {
            setClockStatus("clocked-in");
            setClockInTime(new Date(lastEvent.eventTime));
          }
        }
      }

      const postsRes = await fetch(
        `/api/posts?companyId=${companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (postsRes.status === 200) {
        const postsData = await postsRes.json();
        setPosts(Array.isArray(postsData) ? postsData : postsData.posts || []);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setMessage("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      const res = await fetch(
        `/api/users/attendance/clockIn?companyId=${employee.companyId}&employeeId=${employee.employeeId}`,
        { method: "GET", credentials: "include" }
      );
      if (res.status === 200) {
        setClockStatus("clocked-in");
        setClockInTime(new Date());
        setMessage("Clocked in successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to clock in");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  const handleClockOut = async () => {
    try {
      const res = await fetch(
        `/api/users/attendance/clockOut?companyId=${employee.companyId}&employeeId=${employee.employeeId}`,
        { method: "GET", credentials: "include" }
      );
      if (res.status === 200) {
        setClockStatus("clocked-out");
        setMessage("Clocked out successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to clock out");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent && postType !== "poll") {
      setMessage("Please add some content");
      return;
    }
    if (postType === "poll" && (!postQuestion || postPollOptions.some(o => !o))) {
      setMessage("Please fill in all poll fields");
      return;
    }

    setCreatingPost(true);
    try {
      const payload = {
        companyId: user.companyId,
        employeeId: employee.employeeId,
        type: postType,
        content: postContent,
      };

      if (postType === "poll") {
        payload.question = postQuestion;
        payload.options = postPollOptions.filter(o => o.trim());
      }

      if (postImage && postType !== "poll") {
        payload.imageUrl = postImage;
      }

      const res = await fetch("/api/posts/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 200 || res.status === 201) {
        setMessage("Post created successfully!");
        setPostContent("");
        setPostImage(null);
        setPostType("text");
        setPostQuestion("");
        setPostPollOptions(["", ""]);
        setShowCreatePost(false);
        loadDashboardData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to create post");
      }
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setCreatingPost(false);
    }
  };

  const handleVote = async (postId, optionIndex) => {
    try {
      const res = await fetch("/api/posts/vote", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          companyId: user.companyId,
          employeeId: employee.employeeId,
          optionIndex,
        }),
      });

      if (res.status === 200) {
        loadDashboardData();
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Logout error:", error);
    }
    router.push("/");
  };

   const calcUsedDays = (leaveTypeId) =>
    leaveBalance
      .filter(
        (t) =>
          t.leaveTypeId === leaveTypeId 
          // && t.status?.toLowerCase() === "accepted"
      )
      .reduce((sum, t) => {
        const start = new Date(t.startDate);
        const end = new Date(t.endDate);
        return sum + Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }, 0);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/dashboard" />
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
        <Sidebar activePath="/dashboard" />

        <main className="main-content">
          {message && <div className="alert">{message}</div>}

          {/* Welcome Banner */}
          <div className="page-header">
            <div>
              <h1 className="page-title">
                Good {today.getHours() < 12 ? "Morning" : today.getHours() < 17 ? "Afternoon" : "Evening"},{" "}
                {employee?.name?.split(" ")[0] || "there"}!
              </h1>
              <p className="page-subtitle">{dateStr}</p>
            </div>
            {role === "COMPANY_ADMIN" && (
              <button className="btn btn-primary btn-sm" onClick={() => router.push("/admin")}>
                Admin Dashboard →
              </button>
            )}
          </div>

          {role === "USER" && (
            <div className="dashboard-columns">

              {/* ── Left Column: Quick Access ── */}
              <div className="dashboard-col-left">
                <h2 className="col-section-title">Quick Access</h2>

                {/* Attendance */}
                <div className="HRM-card attendance-card">
                  <div className="HRM-card-header">
                    <span className="HRM-card-title">Today's Attendance</span>
                    <span
                      className={`clock-badge ${
                        clockStatus === "clocked-in"
                          ? "badge-in"
                          : clockStatus === "clocked-out"
                          ? "badge-out"
                          : "badge-idle"
                      }`}
                    >
                      {clockStatus === "clocked-in"
                        ? "● Working"
                        : clockStatus === "clocked-out"
                        ? "✓ Done"
                        : "○ Not Started"}
                    </span>
                  </div>

                  {clockInTime && (
                    <p className="clock-time-label">
                      In: {clockInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}

                  <div className="clock-actions">
                    {clockStatus === "not-clocked-in" && (
                      <button className="btn btn-clock-in" onClick={handleClockIn}>
                        Clock In
                      </button>
                    )}
                    {clockStatus === "clocked-in" && (
                      <button className="btn btn-clock-out" onClick={handleClockOut}>
                        Clock Out
                      </button>
                    )}
                    {clockStatus === "clocked-out" && (
                      <p className="clock-done-text">You've completed your shift today.</p>
                    )}
                    <button
                      className="btn btn-link-sm"
                      onClick={() => router.push("/me/attendance")}
                    >
                      View full attendance →
                    </button>
                  </div>
                </div>

                {/* Leave Balance */}
                <div className="HRM-card">
                  <div className="HRM-card-header">
                    <span className="HRM-card-title">Leave Balance</span>
                    <button
                      className="btn btn-link-sm"
                      onClick={() => router.push("/me/leave")}
                    >
                      Apply →
                    </button>
                  </div>
                  {leaves && Object.keys(leaves).length > 0 ? (
                    <div className="leave-balance-list">
                      {Object.entries(leaves).map(([, value]) => {
                        const used = calcUsedDays(value.leaveTypeId);
                        console.log("Leave Type:", value.name, "Used:", used, "Max:", value.maxDaysPerYear);
                        return (
                          <div key={value.leaveTypeId} className="leave-balance-row">
                            <span className="leave-type-name">{value.name}</span>
                            <div className="leave-balance-bar-wrap">
                              <div
                                className="leave-balance-bar"
                                style={{ width: `${( ( value.maxDaysPerYear - used) / value.maxDaysPerYear) * 100}%` }}
                              />
                            </div>
                            <span className="leave-balance-count">
                              {( value.maxDaysPerYear - used)}/{value.maxDaysPerYear}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="no-data">No leave types configured</p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="HRM-card">
                  <div className="HRM-card-header">
                    <span className="HRM-card-title">Quick Actions</span>
                  </div>
                  <div className="quick-action-grid">
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/me/leave")}
                    >
                      <span className="qa-icon">📋</span>
                      <span>Apply Leave</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/me/attendance")}
                    >
                      <span className="qa-icon">🕐</span>
                      <span>Attendance</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/assets")}
                    >
                      <span className="qa-icon">💼</span>
                      <span>My Assets</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/me/expense")}
                    >
                      <span className="qa-icon">💳</span>
                      <span>Expenses</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/performance/objectives/my")}
                    >
                      <span className="qa-icon">🎯</span>
                      <span>Objectives</span>
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => router.push("/inbox")}
                    >
                      <span className="qa-icon">📬</span>
                      <span>Inbox</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Right Column: Engagement ── */}
              <div className="dashboard-col-right">
                <div className="col-section-header">
                  <h2 className="col-section-title">Engagement</h2>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowCreatePost(true)}
                  >
                    + Post / Poll / Praise
                  </button>
                </div>

                {posts.length > 0 ? (
                  <div className="posts-feed">
                    {posts.map((post) => (
                      <div key={post.postId || Math.random()} className="post-card HRM-card">
                        {/* Post Header */}
                        <div className="post-header">
                          <div className="post-author">
                            <div className="post-avatar">
                              {post.employeeName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="post-author-info">
                              <span className="post-author-name">{post.employeeName}</span>
                              <span className="post-date">
                                {new Date(post.createdAt).toLocaleDateString("en-IN")}
                              </span>
                            </div>
                          </div>
                          {post.type && (
                            <span className="post-type-badge">
                              {post.type === "poll" ? "📊 Poll" : post.type === "praise" ? "🌟 Praise" : "📝 Post"}
                            </span>
                          )}
                        </div>

                        {/* Post Content */}
                        {post.type === "text" && (
                          <div className="post-content">
                            <p>{post.content}</p>
                          </div>
                        )}

                        {post.type === "praise" && (
                          <div className="post-content post-praise">
                            <p>{post.content}</p>
                          </div>
                        )}

                        {post.type === "image" && (
                          <div className="post-media">
                            <img src={post.imageUrl} alt="Post" className="post-image" />
                            {post.content && <p className="post-caption">{post.content}</p>}
                          </div>
                        )}

                        {post.type === "video" && (
                          <div className="post-media">
                            <video controls className="post-video">
                              <source src={post.videoUrl} type="video/mp4" />
                            </video>
                            {post.content && <p className="post-caption">{post.content}</p>}
                          </div>
                        )}

                        {post.type === "poll" && (
                          <div className="post-poll">
                            <div className="poll-question">{post.question}</div>
                            <div className="poll-options">
                              {post.options?.map((option, idx) => {
                                const totalVotes = post.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
                                const percentage = totalVotes > 0 ? Math.round((option.votes || 0) / totalVotes * 100) : 0;
                                const hasVoted = post.userVoted === idx;

                                return (
                                  <button
                                    key={idx}
                                    className={`poll-option ${hasVoted ? "voted" : ""}`}
                                    onClick={() => handleVote(post.postId, idx)}
                                  >
                                    <div className="poll-option-bar" style={{ width: `${percentage}%` }} />
                                    <span className="poll-option-text">{option.text}</span>
                                    <span className="poll-option-count">{option.votes || 0} ({percentage}%)</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="posts-empty">
                    <span>📝</span>
                    <p>No posts yet. Be the first to share!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {role === "COMPANY_ADMIN" && (
            <div className="HRM-card">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Admin Panel</span>
              </div>
              <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
                You have administrative privileges. Manage your company from the admin dashboard.
              </p>
              <button className="btn btn-primary" onClick={() => router.push("/admin")}>
                Go to Admin Dashboard →
              </button>
            </div>
          )}

          {/* Create Post Modal */}
          {showCreatePost && (
            <div className="modal-overlay" onClick={() => setShowCreatePost(false)}>
              <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Create Post</h3>
                  <button
                    className="modal-close"
                    onClick={() => setShowCreatePost(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="modal-body">
                  {/* Post Type Selector */}
                  <div className="post-type-selector">
                    <label className="post-type-option">
                      <input
                        type="radio"
                        value="text"
                        checked={postType === "text"}
                        onChange={(e) => setPostType(e.target.value)}
                      />
                      <span>📝 Post</span>
                    </label>
                    <label className="post-type-option">
                      <input
                        type="radio"
                        value="poll"
                        checked={postType === "poll"}
                        onChange={(e) => setPostType(e.target.value)}
                      />
                      <span>📊 Poll</span>
                    </label>
                    <label className="post-type-option">
                      <input
                        type="radio"
                        value="praise"
                        checked={postType === "praise"}
                        onChange={(e) => setPostType(e.target.value)}
                      />
                      <span>🌟 Praise</span>
                    </label>
                    <label className="post-type-option">
                      <input
                        type="radio"
                        value="image"
                        checked={postType === "image"}
                        onChange={(e) => setPostType(e.target.value)}
                      />
                      <span>🖼️ Image</span>
                    </label>
                  </div>

                  {/* Content Input */}
                  {postType !== "poll" && (
                    <>
                      <textarea
                        className="form-control"
                        placeholder={
                          postType === "praise"
                            ? "Recognise someone's great work..."
                            : postType === "image"
                            ? "Add a caption for your image..."
                            : "What's on your mind?"
                        }
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        style={{ minHeight: "100px", marginTop: "1rem" }}
                      />

                      {postType === "image" && (
                        <div style={{ marginTop: "1rem" }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter image URL"
                            value={postImage}
                            onChange={(e) => setPostImage(e.target.value)}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Poll Input */}
                  {postType === "poll" && (
                    <div style={{ marginTop: "1rem" }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter your question"
                        value={postQuestion}
                        onChange={(e) => setPostQuestion(e.target.value)}
                      />
                      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {postPollOptions.map((opt, idx) => (
                          <input
                            key={idx}
                            type="text"
                            className="form-control"
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...postPollOptions];
                              newOptions[idx] = e.target.value;
                              setPostPollOptions(newOptions);
                            }}
                          />
                        ))}
                        {postPollOptions.length < 5 && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setPostPollOptions([...postPollOptions, ""])}
                          >
                            + Add Option
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowCreatePost(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreatePost}
                    disabled={creatingPost}
                  >
                    {creatingPost ? "Creating..." : "Create"}
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
