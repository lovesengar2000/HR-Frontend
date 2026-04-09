"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Sidebar from "../../../components/Sidebar";
import "../../styles/dashboard.css";

function timeLeft(endsAt) {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hrs}h left`;
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 0) return `${hrs}h ${mins}m left`;
  return `${mins}m left`;
}

export default function PollsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [voting, setVoting] = useState({}); // pollId -> optionId being submitted
  const [voted, setVoted] = useState({});   // pollId -> optionId already voted

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ question: "", options: ["", ""], endsAt: "", anonymous: false });
  const [submitting, setSubmitting] = useState(false);

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
        `/api/engage/polls?companyId=${data.user.companyId}`,
        { method: "GET", credentials: "include" }
      );
      if (pRes.ok) {
        const d = await pRes.json();
        const list = Array.isArray(d) ? d : [];
        setPolls(list);
        // Populate already-voted map from server data
        const v = {};
        list.forEach(poll => { if (poll.myVote) v[poll.id] = poll.myVote; });
        setVoted(v);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    router.push("/");
  };

  const handleVote = async (pollId, optionId) => {
    if (voted[pollId] || voting[pollId]) return;
    setVoting(p => ({ ...p, [pollId]: optionId }));
    try {
      const res = await fetch("/api/engage/polls/vote", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId, optionId, employeeId: employee?.employeeId, companyId: user.companyId }),
      });
      if (res.ok) {
        setVoted(p => ({ ...p, [pollId]: optionId }));
        // Optimistically update vote counts
        setPolls(prev => prev.map(poll => {
          if (poll.id !== pollId) return poll;
          return {
            ...poll,
            options: poll.options.map(opt => ({
              ...opt,
              votes: opt.id === optionId ? (opt.votes || 0) + 1 : (opt.votes || 0),
            })),
            totalVotes: (poll.totalVotes || 0) + 1,
          };
        }));
      }
    } catch (err) { console.error(err); }
    finally { setVoting(p => { const n = { ...p }; delete n[pollId]; return n; }); }
  };

  const handleCreate = async () => {
    const opts = form.options.filter(o => o.trim());
    if (!form.question.trim() || opts.length < 2) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/engage/polls", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, options: opts, companyId: user.companyId, authorId: employee?.employeeId }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ question: "", options: ["", ""], endsAt: "", anonymous: false });
        await loadData();
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const updateOption = (i, val) => setForm(p => { const o = [...p.options]; o[i] = val; return { ...p, options: o }; });
  const addOption = () => setForm(p => ({ ...p, options: [...p.options, ""] }));
  const removeOption = (i) => setForm(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }));

  const isAdmin = user?.role === "COMPANY_ADMIN";
  const now = Date.now();
  const filtered = polls.filter(p => {
    const active = !p.endsAt || new Date(p.endsAt).getTime() > now;
    if (filter === "active") return active;
    if (filter === "ended") return !active;
    return true;
  });
  const emp = employee || {};

  if (loading) return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} />
      <div className="app-body">
        <Sidebar activePath="/engage/polls" />
        <main className="main-content"><div className="loading"><div className="spinner"></div></div></main>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || "U")[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/engage/polls" />
        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Polls</h1>
              <p className="page-subtitle">Vote on company topics and share your opinion</p>
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Poll</button>
            )}
          </div>

          <div className="filter-tabs">
            {[["active","Active"],["ended","Ended"],["all","All"]].map(([val, label]) => (
              <button key={val} className={`filter-tab ${filter === val ? "active" : ""}`} onClick={() => setFilter(val)}>
                {label}
                <span className="filter-tab-count">
                  {val === "all" ? polls.length
                    : val === "active" ? polls.filter(p => !p.endsAt || new Date(p.endsAt).getTime() > now).length
                    : polls.filter(p => p.endsAt && new Date(p.endsAt).getTime() <= now).length}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filtered.length === 0 ? (
              <div className="HRM-card org-empty">
                <span>📊</span>
                <p>No polls found.</p>
              </div>
            ) : filtered.map((poll, pi) => {
              const total = poll.totalVotes || poll.options?.reduce((s, o) => s + (o.votes || 0), 0) || 0;
              const myVote = voted[poll.id];
              const isEnded = poll.endsAt && new Date(poll.endsAt).getTime() <= now;
              const showResults = !!myVote || isEnded;
              const tLeft = timeLeft(poll.endsAt);

              return (
                <div key={poll.id || pi} className="HRM-card">
                  {/* Poll header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{poll.question}</h3>
                      <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.73rem", color: "var(--text-muted)" }}>
                        {poll.author && <span>{poll.author}</span>}
                        <span>{total} vote{total !== 1 ? "s" : ""}</span>
                        {poll.anonymous && <span>· Anonymous</span>}
                      </div>
                    </div>
                    {tLeft && (
                      <span style={{
                        fontSize: "0.72rem", flexShrink: 0,
                        color: isEnded ? "var(--text-muted)" : "var(--accent)",
                        background: isEnded ? "rgba(255,255,255,0.05)" : "rgba(91,141,238,0.1)",
                        padding: "0.2rem 0.55rem", borderRadius: "999px", marginLeft: "0.75rem",
                      }}>
                        {tLeft}
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {(poll.options || []).map((opt, oi) => {
                      const pct = total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0;
                      const isMyVote = myVote === opt.id;

                      if (showResults) {
                        return (
                          <div key={opt.id || oi} style={{ position: "relative" }}>
                            <div style={{
                              position: "absolute", inset: 0, borderRadius: "var(--radius-sm)",
                              background: isMyVote ? "rgba(91,141,238,0.15)" : "rgba(255,255,255,0.04)",
                              width: `${pct}%`, transition: "width 0.4s ease",
                            }} />
                            <div style={{
                              position: "relative", display: "flex", justifyContent: "space-between",
                              padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)",
                              border: `1px solid ${isMyVote ? "rgba(91,141,238,0.4)" : "var(--border)"}`,
                            }}>
                              <span style={{ fontSize: "0.85rem", color: isMyVote ? "var(--accent)" : "var(--text-primary)", fontWeight: isMyVote ? 600 : 400 }}>
                                {isMyVote && "✓ "}{opt.label || opt.text}
                              </span>
                              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>{pct}%</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={opt.id || oi}
                          disabled={!!voting[poll.id] || isEnded}
                          onClick={() => handleVote(poll.id, opt.id)}
                          style={{
                            background: "transparent", border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)", padding: "0.55rem 0.75rem",
                            color: "var(--text-primary)", fontSize: "0.85rem", cursor: "pointer",
                            textAlign: "left", transition: "all 0.15s",
                          }}
                          onMouseEnter={e => { if (!voting[poll.id]) e.currentTarget.style.borderColor = "var(--border-focus)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
                        >
                          {voting[poll.id] === opt.id ? "Submitting…" : (opt.label || opt.text)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </main>
      </div>

      {/* Create Poll modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-card" style={{ maxWidth: "520px" }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-title" style={{ marginBottom: "1.25rem" }}>Create Poll</h3>

            <div className="docs-form-group">
              <label className="docs-form-label">Question</label>
              <input className="form-control" placeholder="What would you like to ask?" value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} autoFocus />
            </div>

            <div className="docs-form-group">
              <label className="docs-form-label">Options</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {form.options.map((opt, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      className="form-control"
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={e => updateOption(i, e.target.value)}
                    />
                    {form.options.length > 2 && (
                      <button className="btn btn-ghost" style={{ padding: "0.4rem 0.65rem", flexShrink: 0 }} onClick={() => removeOption(i)}>✕</button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <button className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "0.3rem 0.6rem", alignSelf: "flex-start" }} onClick={addOption}>
                    + Add Option
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="docs-form-group">
                <label className="docs-form-label">Ends At (optional)</label>
                <input className="form-control" type="datetime-local" value={form.endsAt} onChange={e => setForm(p => ({ ...p, endsAt: e.target.value }))} />
              </div>
              <div className="docs-form-group" style={{ justifyContent: "flex-end" }}>
                <label className="docs-form-label">Anonymous voting</label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", marginTop: "0.35rem" }}>
                  <input type="checkbox" checked={form.anonymous} onChange={e => setForm(p => ({ ...p, anonymous: e.target.checked }))} />
                  <span style={{ fontSize: "0.83rem", color: "var(--text-secondary)" }}>Anonymous</span>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={submitting || !form.question.trim() || form.options.filter(o => o.trim()).length < 2}
              >
                {submitting ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
