'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

const QUESTION_TYPES  = ['MULTIPLE_CHOICE', 'RATING', 'TEXT', 'YES_NO'];
const EMPTY_QUESTION  = { text: '', type: 'MULTIPLE_CHOICE', options: ['', ''], required: true };
const EMPTY_FORM      = { title: '', description: '', anonymous: true, targetAudience: 'ALL', questions: [{ ...EMPTY_QUESTION }] };

export default function SurveysPage() {
  const router = useRouter();
  const [user,       setUser]       = useState(null);
  const [employee,   setEmployee]   = useState(null);
  const [surveys,    setSurveys]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [message,    setMessage]    = useState({ text: '', type: '' });

  const [showModal,   setShowModal]   = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteId,    setDeleteId]    = useState(null);

  useEffect(() => { loadData(); }, []);

  const flash = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
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

      const sr = await fetch(`/api/admin/surveys?companyId=${data.user.companyId}`, { credentials: 'include' });
      if (sr.ok) { const sd = await sr.json(); setSurveys(Array.isArray(sd) ? sd : sd.data || []); }
    } catch {
      flash('Failed to load surveys.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { flash('Survey title is required.', 'error'); return; }
    if (form.questions.some((q) => !q.text.trim())) { flash('All question texts are required.', 'error'); return; }
    setSaveLoading(true);
    try {
      const res = await fetch('/api/admin/surveys', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, companyId: user.companyId }),
      });
      if (res.ok) { flash('Survey created.'); setShowModal(false); setForm(EMPTY_FORM); loadData(); }
      else { const err = await res.json(); flash(err.error || 'Failed to create survey.', 'error'); }
    } catch {
      flash('Error creating survey.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (surveyId) => {
    try {
      const res = await fetch(`/api/admin/surveys?surveyId=${surveyId}&companyId=${user.companyId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (res.ok) { flash('Survey deleted.'); loadData(); }
      else flash('Failed to delete survey.', 'error');
    } catch {
      flash('Error deleting survey.', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const addQuestion = () => setForm((f) => ({ ...f, questions: [...f.questions, { ...EMPTY_QUESTION, options: ['', ''] }] }));
  const removeQuestion = (i) => setForm((f) => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));
  const updateQuestion = (i, field, value) => setForm((f) => {
    const qs = [...f.questions];
    qs[i] = { ...qs[i], [field]: value };
    return { ...f, questions: qs };
  });
  const addOption    = (qi) => updateQuestion(qi, 'options', [...(form.questions[qi].options || []), '']);
  const updateOption = (qi, oi, value) => {
    const opts = [...(form.questions[qi].options || [])];
    opts[oi] = value;
    updateQuestion(qi, 'options', opts);
  };
  const removeOption = (qi, oi) => updateQuestion(qi, 'options', form.questions[qi].options.filter((_, i) => i !== oi));

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/surveys" />
          <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
        </div>
      </div>
    );
  }

  const emp = employee || {};

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || 'A')[0].toUpperCase()} />
      <div className="app-body">
        <AdminSidebar activePath="/admin/surveys" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Surveys</h1>
              <p className="page-subtitle">Create pulse surveys, anonymous feedback forms, and engagement checks</p>
            </div>
            <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>+ Create Survey</button>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {surveys.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {surveys.map((s, i) => (
                <div className="HRM-card HRM-card-full" key={s.id || i}>
                  <div className="HRM-card-header">
                    <div>
                      <span className="HRM-card-title">{s.title}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        {s.anonymous && <span className="status-badge status-approved">Anonymous</span>}
                        <span className="admin-role-chip">{s.targetAudience || 'ALL'}</span>
                        <span className="admin-role-chip">{s.questions?.length || 0} questions</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {s.responseCount || 0} response(s)
                      </span>
                      <span className={`status-badge ${s.status === 'ACTIVE' ? 'status-approved' : 'status-rejected'}`}>
                        {s.status || 'DRAFT'}
                      </span>
                      <button className="btn-reject" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setDeleteId(s.id)}>Delete</button>
                    </div>
                  </div>
                  {s.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{s.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="HRM-card HRM-card-full">
              <div className="no-data">
                <p>No surveys created yet.</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Create anonymous pulse surveys to measure employee engagement.</p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}>+ Create First Survey</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Survey Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card modal-large" style={{ maxWidth: 720, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h3 className="modal-title">Create Survey</h3>
                <p className="modal-subtitle">Build a survey with questions and distribute to employees</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className="onboard-form">
              <div className="form-group">
                <label className="form-label">Survey Title <span className="required-star">*</span></label>
                <input className="form-control" placeholder="e.g. Q1 2026 Engagement Pulse"
                  value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="2" placeholder="Brief description or instructions"
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select className="form-control" value={form.targetAudience} onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))}>
                    {['ALL', 'EMPLOYEES', 'MANAGERS', 'SPECIFIC_DEPT'].map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input type="checkbox" checked={form.anonymous} onChange={(e) => setForm((f) => ({ ...f, anonymous: e.target.checked }))} />
                    <span className="form-label" style={{ marginBottom: 0 }}>Anonymous responses</span>
                  </label>
                </div>
              </div>

              {/* Questions */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Questions ({form.questions.length})</span>
                  <button type="button" className="btn-outline-accent" onClick={addQuestion}>+ Add Question</button>
                </div>

                {form.questions.map((q, qi) => (
                  <div key={qi} style={{ background: 'var(--surface-secondary)', borderRadius: 10, padding: '0.9rem', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Q{qi + 1}</span>
                      {form.questions.length > 1 && (
                        <button type="button" className="btn-reject" style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }} onClick={() => removeQuestion(qi)}>Remove</button>
                      )}
                    </div>

                    <div className="form-row-2" style={{ marginBottom: '0.5rem' }}>
                      <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                        <input className="form-control" placeholder="Enter your question…"
                          value={q.text} onChange={(e) => updateQuestion(qi, 'text', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <select className="form-control" value={q.type} onChange={(e) => updateQuestion(qi, 'type', e.target.value)}>
                          {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                    </div>

                    {q.type === 'MULTIPLE_CHOICE' && (
                      <div style={{ marginTop: '0.5rem' }}>
                        {(q.options || []).map((opt, oi) => (
                          <div key={oi} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem' }}>
                            <input className="form-control" style={{ flex: 1 }} placeholder={`Option ${oi + 1}`}
                              value={opt} onChange={(e) => updateOption(qi, oi, e.target.value)} />
                            {(q.options?.length || 0) > 2 && (
                              <button type="button" className="btn-reject" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => removeOption(qi, oi)}>✕</button>
                            )}
                          </div>
                        ))}
                        <button type="button" className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }} onClick={() => addOption(qi)}>+ Add Option</button>
                      </div>
                    )}

                    {q.type === 'RATING' && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Employees will rate on a scale of 1 to 10.</p>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                      <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(qi, 'required', e.target.checked)} />
                      Required question
                    </label>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Creating…' : 'Create & Publish Survey'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Survey</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0' }}>This will permanently delete the survey and all responses.</p>
            <div className="modal-actions">
              <button className="btn-reject" onClick={() => handleDelete(deleteId)}>Delete</button>
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
