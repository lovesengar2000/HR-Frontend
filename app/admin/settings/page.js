'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import AdminSidebar from '../../../components/AdminSidebar';
import '../../styles/dashboard.css';

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
  'UTC',
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const WEEK_STARTS = ['MONDAY', 'SUNDAY'];

export default function CompanySettingsPage() {
  const router = useRouter();
  const [user,        setUser]        = useState(null);
  const [employee,    setEmployee]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message,     setMessage]     = useState({ text: '', type: '' });
  const [activeTab,   setActiveTab]   = useState('company');

  const [companyForm, setCompanyForm] = useState({
    companyName: '', domain: '', industry: '', founded: '', website: '',
    address: '', city: '', state: '', country: 'India', pincode: '',
    phone: '', supportEmail: '', hrEmail: '',
    timezone: 'Asia/Kolkata', currency: 'INR', weekStart: 'MONDAY',
    fiscalYearStart: '04', probationDays: '90', noticePeriodDays: '30',
  });

  const [notifForm, setNotifForm] = useState({
    leaveApprovalEmail: true, leaveRejectionEmail: true,
    payslipEmail: true, assetAssignedEmail: true,
    birthdayEmail: true, workAnniversaryEmail: true,
    surveyLaunchEmail: true, exitInitiatedEmail: true,
  });

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

      const sr = await fetch(`/api/admin/settings?companyId=${data.user.companyId}`, { credentials: 'include' });
      if (sr.ok) {
        const sd = await sr.json();
        if (sd.company) setCompanyForm((f) => ({ ...f, ...sd.company }));
        if (sd.notifications) setNotifForm((f) => ({ ...f, ...sd.notifications }));
      }
    } catch {
      // settings not saved yet, use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    router.push('/');
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: user.companyId,
          company: companyForm,
          notifications: notifForm,
        }),
      });
      if (res.ok) flash('Settings saved successfully.');
      else { const err = await res.json(); flash(err.error || 'Failed to save settings.', 'error'); }
    } catch {
      flash('Error saving settings.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar onLogout={handleLogout} />
        <div className="app-body">
          <AdminSidebar activePath="/admin/settings" />
          <main className="main-content"><div className="loading"><div className="spinner" /></div></main>
        </div>
      </div>
    );
  }

  const emp = employee || {};

  const TABS = [
    { key: 'company',       label: 'Company Profile' },
    { key: 'hr',            label: 'HR Policies' },
    { key: 'notifications', label: 'Notifications' },
  ];

  return (
    <div className="app-shell">
      <Navbar onLogout={handleLogout} userName={emp.name || user?.email} userInitial={(emp.name || user?.email || 'A')[0].toUpperCase()} />
      <div className="app-body">
        <AdminSidebar activePath="/admin/settings" />

        <main className="main-content">

          <div className="page-header">
            <div>
              <h1 className="page-title">Company Settings</h1>
              <p className="page-subtitle">Configure company profile, HR policies, and notification preferences</p>
            </div>
            <button className="btn btn-primary" disabled={saveLoading} onClick={handleSave}>
              {saveLoading ? 'Saving…' : 'Save All Changes'}
            </button>
          </div>

          {message.text && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : 'alert-success'}`}>{message.text}</div>
          )}

          {/* Tabs */}
          <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
            {TABS.map((t) => (
              <button key={t.key} className={`filter-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Company Profile Tab ── */}
          {activeTab === 'company' && (
            <div className="HRM-card HRM-card-full">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Company Information</span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input className="form-control" placeholder="Acme Corp"
                      value={companyForm.companyName} onChange={(e) => setCompanyForm((f) => ({ ...f, companyName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Domain</label>
                    <input className="form-control" placeholder="acmecorp.com"
                      value={companyForm.domain} onChange={(e) => setCompanyForm((f) => ({ ...f, domain: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input className="form-control" placeholder="e.g. Technology"
                      value={companyForm.industry} onChange={(e) => setCompanyForm((f) => ({ ...f, industry: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input className="form-control" placeholder="https://acmecorp.com"
                      value={companyForm.website} onChange={(e) => setCompanyForm((f) => ({ ...f, website: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">HR Email</label>
                    <input className="form-control" type="email" placeholder="hr@acmecorp.com"
                      value={companyForm.hrEmail} onChange={(e) => setCompanyForm((f) => ({ ...f, hrEmail: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Support Email</label>
                    <input className="form-control" type="email" placeholder="support@acmecorp.com"
                      value={companyForm.supportEmail} onChange={(e) => setCompanyForm((f) => ({ ...f, supportEmail: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select className="form-control" value={companyForm.timezone} onChange={(e) => setCompanyForm((f) => ({ ...f, timezone: e.target.value }))}>
                      {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select className="form-control" value={companyForm.currency} onChange={(e) => setCompanyForm((f) => ({ ...f, currency: e.target.value }))}>
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-control" placeholder="Street address"
                    value={companyForm.address} onChange={(e) => setCompanyForm((f) => ({ ...f, address: e.target.value }))} />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-control" placeholder="Bengaluru"
                      value={companyForm.city} onChange={(e) => setCompanyForm((f) => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-control" placeholder="Karnataka"
                      value={companyForm.state} onChange={(e) => setCompanyForm((f) => ({ ...f, state: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── HR Policies Tab ── */}
          {activeTab === 'hr' && (
            <div className="HRM-card HRM-card-full">
              <div className="HRM-card-header">
                <span className="HRM-card-title">HR Policy Configuration</span>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Probation Period (days)</label>
                    <input className="form-control" type="number" min="0" placeholder="90"
                      value={companyForm.probationDays} onChange={(e) => setCompanyForm((f) => ({ ...f, probationDays: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Notice Period (days)</label>
                    <input className="form-control" type="number" min="0" placeholder="30"
                      value={companyForm.noticePeriodDays} onChange={(e) => setCompanyForm((f) => ({ ...f, noticePeriodDays: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Fiscal Year Start Month</label>
                    <select className="form-control" value={companyForm.fiscalYearStart} onChange={(e) => setCompanyForm((f) => ({ ...f, fiscalYearStart: e.target.value }))}>
                      {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                        <option key={m} value={m}>{new Date(2000, i).toLocaleString('en-IN', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Work Week Starts On</label>
                    <select className="form-control" value={companyForm.weekStart} onChange={(e) => setCompanyForm((f) => ({ ...f, weekStart: e.target.value }))}>
                      {WEEK_STARTS.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications Tab ── */}
          {activeTab === 'notifications' && (
            <div className="HRM-card HRM-card-full">
              <div className="HRM-card-header">
                <span className="HRM-card-title">Email Notification Preferences</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Control which events trigger email notifications to employees and admins.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {[
                  { key: 'leaveApprovalEmail',    label: 'Leave Approved',              desc: 'Notify employee when leave is approved' },
                  { key: 'leaveRejectionEmail',   label: 'Leave Rejected',              desc: 'Notify employee when leave is rejected' },
                  { key: 'payslipEmail',          label: 'Payslip Generated',           desc: 'Send payslip to employee after payroll run' },
                  { key: 'assetAssignedEmail',    label: 'Asset Assigned',              desc: 'Notify employee when an asset is assigned' },
                  { key: 'birthdayEmail',         label: 'Birthday Wishes',             desc: 'Auto-send birthday greetings to employees' },
                  { key: 'workAnniversaryEmail',  label: 'Work Anniversary',            desc: 'Celebrate work anniversaries automatically' },
                  { key: 'surveyLaunchEmail',     label: 'Survey Launched',             desc: 'Notify employees when a new survey is published' },
                  { key: 'exitInitiatedEmail',    label: 'Exit Process Initiated',      desc: 'Notify HR when an exit is initiated' },
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{desc}</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 22, cursor: 'pointer', flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={notifForm[key]}
                        onChange={(e) => setNotifForm((f) => ({ ...f, [key]: e.target.checked }))}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: notifForm[key] ? 'var(--accent)' : 'var(--border)',
                        borderRadius: 22, transition: 'background 0.2s',
                      }} />
                      <span style={{
                        position: 'absolute', top: 3, left: notifForm[key] ? 22 : 3,
                        width: 16, height: 16, background: 'white', borderRadius: '50%',
                        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
