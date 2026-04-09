"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

const TAG_COLORS = ["#5b8dee","#a855f7","#22c55e","#f59e0b","#ef4444","#14b8a6"];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function PostsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [readPost, setReadPost] = useState(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tag: "", type: "ARTICLE" });
  const [submitting, setSubmitting] = useState(false);

  // Likes (optimistic)
  const [liked, setLiked] = useState({});
  const [liking, setLiking] = useState({});

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

      const pRes = await fetch(
        `/api/posts?companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (pRes.ok) {
        const d = await pRes.json();
        const list = Array.isArray(d) ? d : [];
        setPosts(list);
        const l = {};
        list.forEach(p => { if (p.likedByMe) l[p.id] = true; });
        setLiked(l);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          companyId: user.companyId,
          authorId: employee?.employeeId,
          authorName: employee?.name || user?.email,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: "", content: "", tag: "", type: "ARTICLE" });
        await loadData();
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleLike = async (postId) => {
    if (liking[postId]) return;
    setLiking(p => ({ ...p, [postId]: true }));
    const wasLiked = liked[postId];
    setLiked(p => ({ ...p, [postId]: !wasLiked }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + (wasLiked ? -1 : 1) } : p));
    try {
      await fetch("/api/posts/vote", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, employeeId: employee?.employeeId, action: wasLiked ? "unlike" : "like" }),
      });
    } catch (err) {
      // revert on error
      setLiked(p => ({ ...p, [postId]: wasLiked }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + (wasLiked ? 1 : -1) } : p));
    } finally {
      setLiking(p => { const n = { ...p }; delete n[postId]; return n; });
    }
  };

  const TYPES = ["all", "ARTICLE", "UPDATE", "CELEBRATION"];
  const TYPE_LABELS = { all: "All", ARTICLE: "Articles", UPDATE: "Updates", CELEBRATION: "Celebrations" };
  const TYPE_ICONS  = { ARTICLE: "📰", UPDATE: "📣", CELEBRATION: "🎉" };

  const filtered = filter === "all" ? posts : posts.filter(p => p.type === filter);
  const emp = employee || {};

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/engage/posts" />
        <main className="main-content"><div className="loading"><div className="spinner"></div></div></main>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || "U")[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/engage/posts" />
        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Posts & Articles</h1>
              <p className="page-subtitle">Company news, updates, and employee stories</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Write Post</button>
          </div>

          {/* Type filter tabs */}
          <div className="filter-tabs">
            {TYPES.map(t => (
              <button key={t} className={`filter-tab ${filter === t ? "active" : ""}`} onClick={() => setFilter(t)}>
                {t !== "all" && TYPE_ICONS[t] + " "}{TYPE_LABELS[t]}
                <span className="filter-tab-count">
                  {t === "all" ? posts.length : posts.filter(p => p.type === t).length}
                </span>
              </button>
            ))}
          </div>

          {/* Posts grid */}
          {filtered.length === 0 ? (
            <div className="HRM-card org-empty">
              <span>📝</span>
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filtered.map((post, i) => {
                const tagColor = TAG_COLORS[Math.abs((post.tag || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % TAG_COLORS.length];
                const isLiked = liked[post.id];
                const excerpt = (post.content || "").length > 220 ? post.content.slice(0, 220) + "…" : post.content;

                return (
                  <div key={post.id || i} className="HRM-card" style={{ cursor: "pointer" }} onClick={() => setReadPost(post)}>
                    {/* Post type badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {post.type && (
                          <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.06)", padding: "0.15rem 0.5rem", borderRadius: "999px", color: "var(--text-secondary)" }}>
                            {TYPE_ICONS[post.type]} {TYPE_LABELS[post.type] || post.type}
                          </span>
                        )}
                        {post.tag && (
                          <span style={{ fontSize: "0.72rem", background: `${tagColor}18`, color: tagColor, padding: "0.15rem 0.5rem", borderRadius: "999px", fontWeight: 500 }}>
                            {post.tag}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.73rem", color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo(post.createdAt)}</span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: "1rem" }}>
                      {excerpt}
                    </p>

                    {/* Footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
                          {(post.authorName || "?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{post.authorName || "Unknown"}</span>
                      </div>

                      <button
                        style={{
                          background: "transparent", border: "none", cursor: "pointer",
                          display: "flex", alignItems: "center", gap: "0.35rem",
                          color: isLiked ? "#ef4444" : "var(--text-muted)",
                          fontSize: "0.8rem", padding: "0.25rem 0.5rem",
                          borderRadius: "var(--radius-sm)", transition: "background 0.12s",
                        }}
                        onClick={e => { e.stopPropagation(); handleLike(post.id); }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {isLiked ? "❤️" : "🤍"} {post.likes || 0}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* Full-read modal */}
      {readPost && (
        <div className="modal-overlay" onClick={() => setReadPost(null)}>
          <div className="modal-card" style={{ maxWidth: "620px", maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                {readPost.type && (
                  <span style={{ fontSize: "0.72rem", background: "rgba(255,255,255,0.06)", padding: "0.15rem 0.5rem", borderRadius: "999px", color: "var(--text-secondary)" }}>
                    {TYPE_ICONS[readPost.type]} {TYPE_LABELS[readPost.type] || readPost.type}
                  </span>
                )}
                {readPost.tag && (
                  <span style={{ fontSize: "0.72rem", background: "rgba(91,141,238,0.12)", color: "var(--accent)", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                    {readPost.tag}
                  </span>
                )}
              </div>
              <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", lineHeight: 1.4 }}>{readPost.title}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,var(--accent),#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}>
                  {(readPost.authorName || "?")[0].toUpperCase()}
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{readPost.authorName || "Unknown"}</span>
                <span style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>· {timeAgo(readPost.createdAt)}</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.25rem" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {readPost.content}
              </p>
            </div>

            <div className="modal-actions" style={{ flexShrink: 0, marginTop: "1rem" }}>
              <button
                style={{
                  background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                  padding: "0.45rem 0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem",
                  color: liked[readPost.id] ? "#ef4444" : "var(--text-secondary)", fontSize: "0.85rem",
                }}
                onClick={() => handleLike(readPost.id)}
              >
                {liked[readPost.id] ? "❤️" : "🤍"} {readPost.likes || 0} Likes
              </button>
              <button className="btn btn-primary" onClick={() => setReadPost(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create post modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card" style={{ maxWidth: "560px" }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>Write a Post</h3>

            <div className="docs-form-group">
              <label className="docs-form-label">Title</label>
              <input className="form-control" placeholder="Post title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} autoFocus />
            </div>
            <div className="docs-form-group">
              <label className="docs-form-label">Content</label>
              <textarea className="form-control" rows={6} placeholder="Write your post…" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} style={{ resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="docs-form-group">
                <label className="docs-form-label">Type</label>
                <select className="docs-form-select" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="ARTICLE">📰 Article</option>
                  <option value="UPDATE">📣 Update</option>
                  <option value="CELEBRATION">🎉 Celebration</option>
                </select>
              </div>
              <div className="docs-form-group">
                <label className="docs-form-label">Tag (optional)</label>
                <input className="form-control" placeholder="e.g. Engineering, HR" value={form.tag} onChange={e => setForm(p => ({ ...p, tag: e.target.value }))} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={submitting || !form.title.trim() || !form.content.trim()}>
                {submitting ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
