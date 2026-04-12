'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import '../../styles/dashboard.css';

export default function ResignPage() {
  const router = useRouter();
  const [user,          setUser]          = useState(null);
  const [employee,      setEmployee]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message,       setMessage]       = useState({ text: '', type: '' });
  const [submitted,     setSubmitted]     = useState(false);
  const [existingExit,  setExistingExit]  = useState(null);

  const [form, setForm] = useState({
    lastWorkingDay: '',
    reason: '',
    additionalNotes: '',
    noticePeriodAck: false,
  });

  useEffect(() => { loadData(); }, []);

  const flash = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/users/getData', { credentials: 'include' });
      const raw  = await res.json();
      const data = JSON.parse(raw);
      if (res.status !== 200) { router.push('/'); return; }
      setUser(data.user);
      setEmployee(data.employee);

      // Check if already submitted
      const er = await fetch(`/api/admin/exit?companyId=${data.user.companyId}&employeeId=${data.employee?.id || data.user.userId}`, { credentials: 'include' });
      if (er.ok) {
        const ed = await er.json();
        const arr = Array.isArray(ed) ? ed : ed.data || [];
        const mine = arr.find((e) => e.employeeId === (data.employee?.id || data.user.userId));
        if (mine) setExistingExit(mine);
      }
    } catch {
      flash('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lastWorkingDay) { flash('Please select your last working day.', 'error'); return; }
    if (!form.reason.trim())  { flash('Please provide a reason for resignation.', 'error'); return; }
    if (!form.noticePeriodAck) { flash('Please acknowledge the notice period.', 'error'); return; }

    setSubmitLoading(true);
    try {
      const res = await fetch('/api/users/resign', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId:      user.companyId,
          employeeId:     employee?.id || user.userId,
          lastWorkingDay: form.lastWorkingDay,
          reason:         form.reason,
          additionalNotes: form.additionalNotes,
          exitType: 'RESIGNATION',
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const err = await res.json();
        flash(err.error || 'Failed to submit resignation.', 'error');
      }
    } catch {
      flash('Error submitting resignation.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const minLastDay = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <Sidebar activePath="/me/resign" />
          <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
        </div>
      </div>
    );
  }

  const emp  = employee || {};
  const name = emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : user?.email;

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={name} userInitial={(name || 'E')[0].toUpperCase()} />
      <div className="app-body">
        <Sidebar activePath="/me/resign" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Resign</h1>
              <p className="page-subtitle">Submit your formal resignation and initiate the offboarding process</p>
            </div>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* Existing resignation */}
          {existingExit && !submitted && (
            <div className="HRM-card HRM-card-full">
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Resignation Already Submitted</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Your resignation was submitted on {new Date(existingExit.createdAt || existingExit.initiatedAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
                </p>
                <div style={{ display: 'inline-flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', background: 'var(--surface-secondary)', borderRadius: 12, padding: '1rem 1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last Working Day</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {existingExit.lastWorkingDay ? new Date(existingExit.lastWorkingDay).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Status</div>
                    <div style={{ fontWeight: 700 }}>
                      <span className={`status-badge ${existingExit.status === 'COMPLETED' ? 'status-approved' : 'status-pending'}`}>
                        {existingExit.status || 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  HR will reach out to you with offboarding details. Please check your inbox.
                </p>
              </div>
            </div>
          )}

          {/* Success state */}
          {submitted && (
            <div className="HRM-card HRM-card-full">
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Resignation Submitted</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 1.5rem auto' }}>
                  Your resignation has been submitted to HR. You will receive a confirmation email with further offboarding steps.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
                  <button className="btn-ghost" onClick={() => router.push('/inbox')}>Check Inbox</button>
                </div>
              </div>
            </div>
          )}

          {/* Resignation form */}
          {!existingExit && !submitted && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', alignItems: 'start' }}>

              <div className="HRM-card">
                <div className="HRM-card-header">
                  <span className="HRM-card-title">Resignation Form</span>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Your Name</label>
                    <input className="form-control" value={name} disabled style={{ opacity: 0.6 }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Proposed Last Working Day <span className="required-star">*</span></label>
                    <input className="form-control" type="date" min={minLastDay()}
                      value={form.lastWorkingDay} onChange={(e) => setForm((f) => ({ ...f, lastWorkingDay: e.target.value }))} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Final date subject to HR approval based on notice period policy.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Reason for Resignation <span className="required-star">*</span></label>
                    <select className="form-control" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}>
                      <option value="">Select a reason…</option>
                      {[
                        'Better opportunity', 'Higher compensation', 'Career growth',
                        'Personal reasons', 'Relocation', 'Health reasons',
                        'Work-life balance', 'Higher education', 'Other',
                      ].map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Additional Notes</label>
                    <textarea className="form-control" rows="4"
                      placeholder="Share any feedback, handover notes, or additional context (optional)…"
                      value={form.additionalNotes} onChange={(e) => setForm((f) => ({ ...f, additionalNotes: e.target.value }))} />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', padding: '0.75rem', background: 'var(--surface-secondary)', borderRadius: 10, margin: '0.75rem 0' }}>
                    <input
                      type="checkbox"
                      checked={form.noticePeriodAck}
                      onChange={(e) => setForm((f) => ({ ...f, noticePeriodAck: e.target.checked }))}
                      style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      I understand and acknowledge the company's notice period policy. I agree to serve the required notice period or discuss an early release with HR.
                    </span>
                  </label>

                  <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
                    <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                      {submitLoading ? 'Submitting…' : 'Submit Resignation'}
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => router.push('/dashboard')}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              {/* Info panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="HRM-card">
                  <div className="HRM-card-header">
                    <span className="HRM-card-title">What happens next?</span>
                  </div>
                  <ol style={{ padding: '0.5rem 0 0 1.2rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {[
                      'Your resignation is sent to HR for review',
                      'HR will confirm your last working day',
                      'Offboarding checklist will be shared with you',
                      'Knowledge transfer & handover period begins',
                      'Assets must be returned before the last day',
                      'Full & final settlement is processed after exit',
                      'Experience and relieving letters are issued',
                    ].map((step, i) => (
                      <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="HRM-card" style={{ background: 'rgba(255, 180, 0, 0.07)', border: '1px solid rgba(255, 180, 0, 0.25)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--amber)' }}>⚠ Note</span>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                    Resignation once submitted cannot be undone through this form. If you wish to withdraw, please contact HR directly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
