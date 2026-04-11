'use client';
import Link from 'next/link';
import '../styles/landing.css';

/* ── Mock Dashboard Visual ─────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="lp-dashboard-mockup">
      {/* Browser chrome */}
      <div className="lp-mock-topbar">
        <span className="lp-mock-dot" />
        <span className="lp-mock-dot" />
        <span className="lp-mock-dot" />
        <span className="lp-mock-topbar-title">HRMatrix — Dashboard</span>
      </div>
      {/* App body */}
      <div className="lp-mock-body">
        {/* Sidebar */}
        <div className="lp-mock-sidebar">
          {[
            { icon: '📊', label: 'Dashboard', active: true },
            { icon: '👥', label: 'Employees' },
            { icon: '📅', label: 'Leave' },
            { icon: '💰', label: 'Payroll' },
            { icon: '🏆', label: 'Performance' },
            { icon: '📦', label: 'Assets' },
            { icon: '🎯', label: 'Engage' },
          ].map(({ icon, label, active }) => (
            <div key={label} className={`lp-mock-sidebar-item${active ? ' active' : ''}`}>
              <span className="lp-mock-sidebar-icon">{icon}</span>
              {label}
            </div>
          ))}
        </div>
        {/* Main content */}
        <div className="lp-mock-main">
          <div className="lp-mock-stats">
            {[
              { label: 'Total Employees', val: '284', chg: '+12 this month' },
              { label: 'On Leave Today', val: '18', chg: '6.3% of workforce' },
              { label: 'Payroll Due', val: '₹4.2L', chg: 'In 3 days' },
              { label: 'Open Positions', val: '7', chg: '3 interviews today' },
            ].map(({ label, val, chg }) => (
              <div key={label} className="lp-mock-stat">
                <div className="lp-mock-stat-label">{label}</div>
                <div className="lp-mock-stat-value">{val}</div>
                <div className="lp-mock-stat-change">{chg}</div>
              </div>
            ))}
          </div>
          <div className="lp-mock-charts">
            <div className="lp-mock-chart">
              <div className="lp-mock-chart-title">Attendance — Last 7 Days</div>
              <div className="lp-mock-bars">
                {[65, 80, 75, 90, 85, 70, 95].map((h, i) => (
                  <div key={i} className="lp-mock-bar" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="lp-mock-chart">
              <div className="lp-mock-chart-title">Leave Distribution</div>
              <div className="lp-mock-donut" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Feature Cards data ────────────────────────────────────── */
const FEATURES = [
  {
    icon: '💰',
    title: 'Payroll & Compensation',
    desc: 'Run accurate, on-time payroll with automated tax calculations, reimbursements, and one-click payslip generation.',
    bullets: ['Auto tax & TDS calculations', 'Payslip & salary revision history', 'Bank disbursement integration', 'Expense reimbursement tracking'],
  },
  {
    icon: '👥',
    title: 'Employee Management',
    desc: 'Maintain a single source of truth for every employee — from onboarding documents to role changes and offboarding.',
    bullets: ['Digital onboarding workflows', 'Role & department management', 'Document vault', 'Org-chart view'],
  },
  {
    icon: '📅',
    title: 'Leave Management',
    desc: 'Replace email chains with a self-service leave portal. Managers approve in one click; balances update instantly.',
    bullets: ['Custom leave policies per team', 'Manager approval workflows', 'Real-time balance tracking', 'Holiday calendar'],
  },
  {
    icon: '📦',
    title: 'Asset Tracking',
    desc: 'Know exactly what hardware and equipment is assigned to whom, including history and condition logs.',
    bullets: ['Asset assignment & return flows', 'Condition & warranty tracking', 'Employee asset portal', 'Audit trail'],
  },
  {
    icon: '🏆',
    title: 'Performance Management',
    desc: 'Run structured review cycles, set OKRs, and track progress with meetings, action items, and skill assessments.',
    bullets: ['OKR & company objectives', 'One-on-one meeting templates', 'Action item tracking', 'Skills & competency matrix'],
  },
  {
    icon: '🎯',
    title: 'Engagement & Culture',
    desc: 'Keep your team aligned and motivated with company-wide announcements, polls, and a social post feed.',
    bullets: ['Announcement broadcasts', 'Pulse polls & surveys', 'Social posts & reactions', 'Recognition feeds'],
  },
];

/* ── Testimonials data ─────────────────────────────────────── */
const TESTIMONIALS = [
  {
    text: 'We cut payroll processing time from two days to under two hours. The automated tax calculations alone saved us from three compliance headaches last quarter.',
    name: 'Priya Sharma',
    role: 'HR Director, NovaTech Solutions',
    initials: 'PS',
  },
  {
    text: 'Managing leave requests used to flood my inbox. Now employees self-serve, managers approve in one tap, and I get clean reports without chasing anyone.',
    name: 'Rahul Mehta',
    role: 'Operations Head, BrightEdge Consulting',
    initials: 'RM',
  },
  {
    text: 'The performance module changed how we run reviews. Everyone can see their objectives, track progress, and I finally have data to back up promotion decisions.',
    name: 'Sneha Reddy',
    role: 'VP People, Orbify Labs',
    initials: 'SR',
  },
];

/* ── FAQ preview items ─────────────────────────────────────── */
const FAQ_PREVIEW = [
  {
    q: 'How long does onboarding take?',
    a: 'Most companies are up and running within a day. Our guided setup walks you through company configuration, importing employees, and running your first payroll.',
  },
  {
    q: 'Is our employee data secure?',
    a: 'Yes. All data is encrypted at rest and in transit, with role-based access controls so only authorized personnel see sensitive information.',
  },
  {
    q: 'Can we customize leave policies?',
    a: 'Absolutely. You can create unlimited leave types, set accrual rules, define approval chains, and restrict eligibility by department or role.',
  },
  {
    q: 'Does it integrate with our existing payroll software?',
    a: 'HRMatrix handles payroll natively, but we also provide export-ready formats compatible with major accounting and payroll tools.',
  },
];

/* ============================================================
   MAIN PAGE COMPONENT
   ============================================================ */
export default function LandingPage() {
  return (
    <div>
      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#hero" className="lp-logo">HRMatrix</a>

          <ul className="lp-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How it Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>

          <div className="lp-nav-cta">
            <Link href="/login" className="lp-btn lp-btn-ghost">Sign In</Link>
            <Link href="/register" className="lp-btn lp-btn-primary">Start Free Trial</Link>
          </div>

          <button className="lp-hamburger" aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section id="hero" className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            Trusted by 500+ companies across India
          </div>

          <h1>
            HR That Runs Itself — <br />
            <span className="lp-gradient-text">So You Can Focus on People</span>
          </h1>

          <p>
            HRMatrix brings payroll, leave, attendance, assets, performance, and engagement
            into one platform — eliminating manual work and giving every HR team superpowers.
          </p>

          <div className="lp-hero-ctas">
            <Link href="/register" className="lp-btn lp-btn-primary lp-btn-xl">
              Start Free Trial — No Card Needed
            </Link>
            <a href="#how-it-works" className="lp-btn lp-btn-outline lp-btn-xl">
              See How It Works
            </a>
          </div>

          <div className="lp-hero-social-proof">
            <div className="lp-hero-avatars">
              {['PK','NR','AS','MG','TR'].map(i => <span key={i}>{i}</span>)}
            </div>
            <span>Join 500+ HR teams already using HRMatrix</span>
          </div>

          <DashboardMockup />
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <section className="lp-stats-strip">
        <div className="lp-stats-grid">
          {[
            { val: '500+', label: 'Companies onboarded' },
            { val: '50K+', label: 'Employees managed' },
            { val: '98%', label: 'Payroll accuracy rate' },
            { val: '4.8★', label: 'Average customer rating' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="lp-stat-item-value">{val}</div>
              <div className="lp-stat-item-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM → SOLUTION ───────────────────────────────── */}
      <section className="lp-section lp-problem">
        <div className="lp-wrap">
          <div className="lp-problem-grid">
            {/* Left — pain points */}
            <div className="lp-problem-left">
              <span className="lp-tag">The Problem</span>
              <h2>HR Teams Are Drowning in Manual Work</h2>
              <p>
                Spreadsheets, email chains, and disconnected tools create errors,
                delays, and compliance risks that cost you time and money every month.
              </p>
              <ul className="lp-pain-list">
                {[
                  { icon: '⚠️', title: 'Payroll Errors Every Cycle', desc: 'Manual calculations lead to wrong deductions, missed bonuses, and employee frustration.' },
                  { icon: '📂', title: 'Scattered Employee Data', desc: 'HR data lives in 5 different tools — no single source of truth, constant reconciliation.' },
                  { icon: '🔄', title: 'Leave Approval Chaos', desc: 'Email threads, missed requests, and no visibility into team availability when it matters.' },
                  { icon: '📊', title: 'No Performance Visibility', desc: 'Review cycles happen once a year with no ongoing data, making fair evaluations impossible.' },
                ].map(({ icon, title, desc }) => (
                  <li key={title} className="lp-pain-item">
                    <span className="lp-pain-icon">{icon}</span>
                    <div className="lp-pain-text">
                      <h4>{title}</h4>
                      <p>{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — solution */}
            <div>
              <span className="lp-tag">The Solution</span>
              <p className="lp-solution-title">HRMatrix Unifies Everything in One Place</p>
              <ul className="lp-solution-list">
                {[
                  { icon: '✅', title: 'Automated Payroll', desc: 'Zero-error payroll with auto tax calculations and one-click disbursement.' },
                  { icon: '✅', title: 'Single Employee Record', desc: 'Every piece of employee data in one searchable, audit-ready system.' },
                  { icon: '✅', title: 'Self-Service Leave Portal', desc: 'Employees apply, managers approve instantly — no emails needed.' },
                  { icon: '✅', title: 'Continuous Performance Data', desc: 'OKRs, check-ins, and skills tracked year-round for fair, data-backed reviews.' },
                  { icon: '✅', title: 'Asset & Compliance Tracking', desc: 'Know what\'s assigned to whom and stay audit-ready at all times.' },
                ].map(({ icon, title, desc }) => (
                  <li key={title} className="lp-solution-item">
                    <span className="lp-pain-icon">{icon}</span>
                    <div className="lp-pain-text">
                      <h4>{title}</h4>
                      <p>{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="lp-section lp-features">
        <div className="lp-wrap">
          <div className="lp-features-header">
            <span className="lp-tag">Platform Modules</span>
            <h2>Everything HR Needs, Built Into One Platform</h2>
            <p>
              Six deeply integrated modules that work together — so data flows automatically
              instead of being re-entered everywhere.
            </p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map(({ icon, title, desc, bullets }) => (
              <div key={title} className="lp-feature-card">
                <div className="lp-feature-icon-wrap">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <ul className="lp-feature-bullets">
                  {bullets.map(b => <li key={b}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="lp-section lp-how">
        <div className="lp-wrap">
          <div className="lp-how-header">
            <span className="lp-tag">Getting Started</span>
            <h2>Up and Running in Under a Day</h2>
            <p>No implementation consultants. No weeks of setup. Just three steps and you're live.</p>
          </div>
          <div className="lp-how-steps">
            {[
              {
                num: '1',
                title: 'Set Up Your Company',
                desc: 'Enter your company details, configure departments, define leave policies, and set up your payroll structure in our guided wizard.',
              },
              {
                num: '2',
                title: 'Import Your Employees',
                desc: 'Upload your employee list via CSV or add them manually. Invite them to the platform — they\'ll receive a guided onboarding flow.',
              },
              {
                num: '3',
                title: 'Run Your Operations',
                desc: 'Process payroll, manage leaves, track attendance, run performance reviews — everything from one dashboard, accessible from anywhere.',
              },
            ].map(({ num, title, desc }) => (
              <div key={num} className="lp-how-step">
                <div className="lp-how-step-num">{num}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="lp-section lp-testimonials">
        <div className="lp-wrap">
          <div className="lp-testimonials-header">
            <span className="lp-tag">Customer Stories</span>
            <h2>Loved by HR Teams Across India</h2>
            <p>Real results from real companies who switched to HRMatrix.</p>
          </div>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map(({ text, name, role, initials }) => (
              <div key={name} className="lp-testimonial-card">
                <div className="lp-stars">★★★★★</div>
                <p className="lp-testimonial-text">"{text}"</p>
                <div className="lp-testimonial-author">
                  <div className="lp-author-avatar">{initials}</div>
                  <div>
                    <div className="lp-author-name">{name}</div>
                    <div className="lp-author-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY ─────────────────────────────────────────── */}
      <section className="lp-security">
        <div className="lp-security-inner">
          <div className="lp-security-header">
            <span className="lp-tag">Trust & Security</span>
            <h2>Your Data is Safe With Us</h2>
            <p>Enterprise-grade security and compliance built into every layer of the platform.</p>
          </div>
          <div className="lp-security-grid">
            {[
              { icon: '🔐', title: 'AES-256 Encryption', desc: 'All data encrypted at rest and in transit with industry-standard AES-256 encryption.' },
              { icon: '🛡️', title: 'Role-Based Access', desc: 'Granular permissions ensure employees only see data they\'re authorized to access.' },
              { icon: '📋', title: 'Audit Logs', desc: 'Every action is logged with timestamps, providing a complete, tamper-proof audit trail.' },
              { icon: '🌐', title: 'GDPR & IT Act Compliant', desc: 'Built to comply with India\'s IT Act 2000 and international GDPR data protection standards.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="lp-security-item">
                <div className="lp-security-icon">{icon}</div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="lp-section lp-pricing">
        <div className="lp-wrap">
          <div className="lp-pricing-header">
            <span className="lp-tag">Pricing</span>
            <h2>Simple, Transparent Pricing</h2>
            <p>No hidden fees. No per-module charges. Pick the plan that fits your team size.</p>
          </div>
          <div className="lp-pricing-grid">
            {/* Starter */}
            <div className="lp-pricing-card">
              <div className="lp-pricing-tier">Starter</div>
              <div className="lp-pricing-amount">₹49<span style={{ fontSize: '1rem', fontWeight: 500 }}>/emp</span></div>
              <div className="lp-pricing-period">per month · up to 50 employees</div>
              <hr className="lp-pricing-divider" />
              <ul className="lp-pricing-features">
                {['Employee profiles & org chart', 'Leave management', 'Attendance tracking', 'Basic payroll', 'Email support'].map(f => <li key={f}>{f}</li>)}
              </ul>
              <Link href="/register" className="lp-pricing-cta lp-pricing-cta-default">Get Started Free</Link>
            </div>

            {/* Growth — popular */}
            <div className="lp-pricing-card popular">
              <div className="lp-pricing-badge">Most Popular</div>
              <div className="lp-pricing-tier">Growth</div>
              <div className="lp-pricing-amount">₹99<span style={{ fontSize: '1rem', fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>/emp</span></div>
              <div className="lp-pricing-period">per month · up to 250 employees</div>
              <hr className="lp-pricing-divider" />
              <ul className="lp-pricing-features">
                {['Everything in Starter', 'Full payroll & tax', 'Asset management', 'Performance & OKRs', 'Engagement module', 'Priority support'].map(f => <li key={f}>{f}</li>)}
              </ul>
              <Link href="/register" className="lp-pricing-cta lp-pricing-cta-popular">Start Free Trial</Link>
            </div>

            {/* Enterprise */}
            <div className="lp-pricing-card">
              <div className="lp-pricing-tier">Enterprise</div>
              <div className="lp-pricing-amount" style={{ fontSize: '1.6rem' }}>Custom</div>
              <div className="lp-pricing-period">tailored for large teams</div>
              <hr className="lp-pricing-divider" />
              <ul className="lp-pricing-features">
                {['Everything in Growth', 'Unlimited employees', 'Custom integrations', 'Dedicated onboarding', 'SLA & uptime guarantee', '24/7 dedicated support'].map(f => <li key={f}>{f}</li>)}
              </ul>
              <a href="mailto:sales@hrmatrix.in" className="lp-pricing-cta lp-pricing-cta-default">Contact Sales</a>
            </div>
          </div>
          <p className="lp-pricing-note">All plans include a 14-day free trial. No credit card required to start.</p>
        </div>
      </section>

      {/* ── FAQ PREVIEW ──────────────────────────────────────── */}
      <section className="lp-section-sm lp-faq-preview">
        <div className="lp-wrap">
          <div className="lp-faq-preview-header">
            <span className="lp-tag">FAQ</span>
            <h2>Questions? We Have Answers.</h2>
            <p>Here are the most common things people ask before getting started.</p>
          </div>
          <div className="lp-faq-grid">
            {FAQ_PREVIEW.map(({ q, a }) => (
              <Link key={q} href="/faq" className="lp-faq-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h4>{q}</h4>
                <p>{a}</p>
              </Link>
            ))}
          </div>
          <div className="lp-faq-view-all">
            <Link href="/faq" className="lp-btn lp-btn-outline lp-btn-lg">View All FAQs →</Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="lp-final-cta">
        <h2>Ready to Transform Your HR?</h2>
        <p>
          Join 500+ companies that have replaced spreadsheets and email chaos
          with HRMatrix — the HR platform built for how modern teams actually work.
        </p>
        <div className="lp-final-cta-btns">
          <Link href="/register" className="lp-btn lp-btn-primary lp-btn-xl">
            Start Your Free Trial
          </Link>
          <a href="mailto:sales@hrmatrix.in" className="lp-btn lp-btn-ghost lp-btn-xl">
            Talk to Sales
          </a>
        </div>
        <p className="lp-final-cta-note">14-day free trial · No credit card · Cancel anytime</p>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <span className="lp-footer-brand-name">HRMatrix</span>
              <p>The all-in-one HR platform helping modern companies hire, manage, pay, and grow their teams — all from one place.</p>
              <div className="lp-footer-socials">
                {[['🐦', '#'], ['💼', '#'], ['📘', '#']].map(([icon, href], i) => (
                  <a key={i} href={href} className="lp-social-btn">{icon}</a>
                ))}
              </div>
            </div>

            <div className="lp-footer-col">
              <h5>Product</h5>
              <ul>
                {[['Features', '#features'], ['Pricing', '#pricing'], ['Security', '#'], ['Changelog', '#']].map(([label, href]) => (
                  <li key={label}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </div>

            <div className="lp-footer-col">
              <h5>Resources</h5>
              <ul>
                {[['FAQ', '/faq'], ['Documentation', '#'], ['API Reference', '#'], ['Blog', '#']].map(([label, href]) => (
                  <li key={label}><Link href={href}>{label}</Link></li>
                ))}
              </ul>
            </div>

            <div className="lp-footer-col">
              <h5>Company</h5>
              <ul>
                {[['About', '#'], ['Careers', '#'], ['Privacy Policy', '#'], ['Terms of Service', '#']].map(([label, href]) => (
                  <li key={label}><a href={href}>{label}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <p className="lp-footer-copy">© {new Date().getFullYear()} HRMatrix. All rights reserved.</p>
            <div className="lp-footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
