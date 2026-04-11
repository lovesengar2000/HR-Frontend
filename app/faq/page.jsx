'use client';
import { useState } from 'react';
import Link from 'next/link';
import '../styles/faq.css';

/* ============================================================
   FAQ DATA
   ============================================================ */
const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    desc: 'Everything you need to know before and during onboarding.',
    questions: [
      {
        q: 'How long does it take to set up HRM?',
        a: `Most companies are fully operational within a single working day. Our guided setup wizard walks you through company configuration, department structure, leave policies, and payroll setup step by step. If you're importing employees via CSV, that process takes minutes, not hours.`,
      },
      {
        q: 'Do I need technical expertise to get started?',
        a: `No technical background is needed. HRM is designed for HR professionals, not developers. Our intuitive interface, guided setup, and in-app help documentation mean you can configure everything yourself. If you ever get stuck, our support team is ready to help.`,
      },
      {
        q: 'Can I import our existing employee data?',
        a: `Yes. You can upload your employee roster via a standard CSV file. We provide a template with all required fields (name, department, designation, date of joining, etc.). The system validates your data before import and flags any errors for you to fix before committing.`,
      },
      {
        q: 'Is there a free trial available?',
        a: `Absolutely. All plans come with a 14-day free trial — no credit card required. You get access to all features of the Growth plan during your trial. At the end of 14 days, you can choose to subscribe or your account moves to a read-only state (your data is never deleted).`,
      },
      {
        q: 'What happens to my data if I cancel my subscription?',
        a: `Your data remains accessible in a read-only state for 90 days after cancellation. During this window you can export all records in CSV or PDF format. After 90 days, data is permanently deleted from our servers per our data retention policy.`,
      },
    ],
  },
  {
    id: 'payroll',
    icon: '💰',
    title: 'Payroll & Compensation',
    desc: 'Questions about salary processing, tax calculations, and payslips.',
    questions: [
      {
        q: 'Does HRM handle TDS and tax calculations automatically?',
        a: `Yes. HRM automatically calculates TDS (Tax Deducted at Source) based on each employee's salary components, investment declarations, and applicable tax slab. Calculations follow the latest Income Tax rules and are updated whenever there are budget-related changes. You can review the breakdown for every employee before processing payroll.`,
      },
      {
        q: 'Can we customize salary components (HRA, allowances, bonuses)?',
        a: `Yes, fully. You can define an unlimited number of salary components — fixed and variable — such as Basic, HRA, DA, Special Allowance, Performance Bonus, Travel Allowance, and more. Each component can be set as taxable or non-taxable, and you can specify whether it's a percentage of another component or a fixed value.`,
      },
      {
        q: 'How are payslips generated and distributed?',
        a: `Payslips are generated automatically when payroll is processed. Employees can log in and download their payslips from the "My Finances" section at any time. Admins can also bulk-download payslips as PDFs or trigger email delivery to all employees with a single click.`,
      },
      {
        q: 'Does HRM support arrears, bonuses, and one-time payments?',
        a: `Yes. You can add ad-hoc earnings or deductions to any pay cycle — arrears, performance bonuses, loan EMI deductions, or any one-time adjustment. These are included in the payslip with their own line items so employees can see the breakdown clearly.`,
      },
      {
        q: 'Can we process payroll for employees on different pay cycles?',
        a: `Currently HRM supports monthly pay cycles (standard in India). Support for bi-monthly and weekly cycles is on our roadmap. Enterprise customers can contact us to discuss custom arrangements.`,
      },
    ],
  },
  {
    id: 'leave',
    icon: '📅',
    title: 'Leave Management',
    desc: 'How leave policies, approvals, and balances work.',
    questions: [
      {
        q: 'Can we create custom leave types (e.g., sabbatical, study leave)?',
        a: `Yes. You can create an unlimited number of leave types with custom names, accrual rules, carryover policies, and eligibility criteria. You can restrict certain leave types by department, designation, or employee gender. All leave types appear in the self-service portal for eligible employees.`,
      },
      {
        q: 'How does the leave approval workflow work?',
        a: `When an employee applies for leave, their designated manager receives an instant notification and can approve or reject with a single click — either from the dashboard or via email. You can configure multi-level approval chains (e.g., manager → HR head) for specific leave types or teams. Leave balances update instantly upon approval.`,
      },
      {
        q: 'Can employees check their leave balance without contacting HR?',
        a: `Absolutely — that's one of the core benefits. Employees can see their current balance for every leave type, their full application history with status, and upcoming approved leaves — all from the "Me → Leave" section. HR teams report an 80% reduction in leave-related queries after switching to HRM.`,
      },
      {
        q: 'How does carry-forward work at year end?',
        a: `You define the carry-forward rules per leave type — maximum days allowed to carry over, expiry date for carried-over leaves, and encashment policies. HRM runs the year-end carryover process automatically on the date you specify. The system generates a report of all carryover actions for your records.`,
      },
      {
        q: 'Does the system handle half-day and hourly leave applications?',
        a: `Yes. Employees can apply for half-day leave (first half or second half) which deducts 0.5 days from their balance. Hourly leave tracking is available for Enterprise plan customers. The system also correctly handles leave spanning public holidays and weekends based on your company's work calendar.`,
      },
    ],
  },
  {
    id: 'performance',
    icon: '🏆',
    title: 'Performance & Engagement',
    desc: 'OKRs, review cycles, meetings, and team engagement.',
    questions: [
      {
        q: 'How does the OKR module work?',
        a: `HRM lets you set objectives at three levels: company-wide, team, and individual. Each objective has key results with measurable targets. Employees update progress on their key results regularly, and managers can see real-time alignment between individual goals and company objectives. This data feeds directly into performance reviews.`,
      },
      {
        q: 'Can managers schedule structured one-on-one meetings?',
        a: `Yes. The meetings module lets managers create recurring one-on-one sessions using templates. Each meeting has a structured agenda, space for talking points added by both parties, and an action items section. Action items carry forward to the next meeting so nothing falls through the cracks.`,
      },
      {
        q: 'How do we run performance review cycles?',
        a: `You can configure review cycles (quarterly, half-yearly, annual) with self-assessment, manager assessment, and peer review stages. The system sends automated reminders, tracks completion status, and compiles all inputs into a consolidated report. All review history is stored against the employee's profile for future reference.`,
      },
      {
        q: 'What does the Engagement module include?',
        a: `The Engage module includes three features: Announcements (broadcast updates to the entire company or specific teams), Posts (a social-style feed where employees can share updates and reactions), and Polls (quick pulse surveys to gauge team sentiment). All three are designed to reduce reliance on company-wide email threads.`,
      },
    ],
  },
  {
    id: 'security',
    icon: '🔐',
    title: 'Security & Compliance',
    desc: 'How we protect your employee data.',
    questions: [
      {
        q: 'Where is our data stored? Is it in India?',
        a: `All data is stored on servers located in India, complying with Indian data localization guidelines. We use enterprise-grade cloud infrastructure with 99.9% uptime SLAs and automated daily backups with 30-day retention.`,
      },
      {
        q: 'Who can see sensitive employee information like salary?',
        a: `Role-based access control (RBAC) ensures that only authorized users see sensitive data. Employees only see their own salary and personal data. Managers can see their team's attendance and leave (not salaries, unless granted access). HR admins and finance roles have appropriate access as configured by your super admin.`,
      },
      {
        q: 'Is HRM compliant with Indian labor laws?',
        a: `HRM is built with Indian compliance in mind — PF (Provident Fund), ESI, professional tax, and TDS calculations follow applicable statutory rules. We update the platform when regulations change. That said, we recommend your team verify compliance requirements specific to your state and industry as laws can vary.`,
      },
      {
        q: 'What happens if there is a data breach?',
        a: `We follow a responsible disclosure and incident response policy. In the event of a breach, we will notify affected customers within 72 hours, in line with GDPR and applicable Indian IT Act requirements. We carry cyber liability insurance and conduct regular third-party security audits.`,
      },
      {
        q: 'Can we export all our data if we decide to leave?',
        a: `Yes, always. Data portability is a core principle. You can export all employee records, payroll history, leave records, performance data, and documents in CSV and PDF formats at any time — even during a free trial. We do not hold your data hostage.`,
      },
    ],
  },
  {
    id: 'billing',
    icon: '🧾',
    title: 'Billing & Plans',
    desc: 'Pricing, upgrades, invoices, and payment questions.',
    questions: [
      {
        q: 'How is billing calculated? Per employee or per admin user?',
        a: `Billing is per employee — meaning every person in your employee database counts toward your plan limit. Unlimited admin or manager accounts are included at no extra cost. If your headcount exceeds your plan's limit mid-cycle, we'll prompt you to upgrade before the next billing date.`,
      },
      {
        q: 'Can I upgrade or downgrade my plan at any time?',
        a: `Yes. Upgrades take effect immediately and you're charged a prorated amount for the remainder of the billing period. Downgrades take effect at the start of the next billing cycle. If a feature you're currently using isn't available on the lower plan, you'll be warned before confirming.`,
      },
      {
        q: 'Do you offer annual billing with a discount?',
        a: `Yes — annual billing comes with a 20% discount compared to monthly billing. You can switch to annual billing from your account settings at any time. We accept bank transfers (NEFT/RTGS), credit/debit cards, and UPI for Indian customers.`,
      },
      {
        q: 'Are there discounts for NGOs, startups, or educational institutions?',
        a: `We offer a 30% discount for registered NGOs and verified early-stage startups (under 2 years old, under 20 employees). For educational institutions, please contact our sales team — we have a dedicated Education plan. Proof of eligibility is required during signup.`,
      },
    ],
  },
];

/* ============================================================
   FAQ ITEM (Accordion)
   ============================================================ */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="faq-question-text">{question}</span>
        <span className="faq-chevron">▼</span>
      </button>
      <div className="faq-answer">
        <div className="faq-answer-inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function FaqPage() {
  const [activeTab, setActiveTab] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  /* Filter questions by search */
  const filteredCategories = FAQ_CATEGORIES.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      ({ q, a }) =>
        !searchQuery ||
        q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.questions.length > 0);

  const visibleCategories = searchQuery
    ? filteredCategories
    : filteredCategories.filter(c => c.id === activeTab);

  return (
    <div className="faq-page">
      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav className="faq-nav">
        <div className="faq-nav-inner">
          <Link href="/landing" className="faq-nav-logo">HRM</Link>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/landing" className="faq-nav-back">← Back to Home</Link>
            <Link href="/register" className="faq-nav-cta">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="faq-hero" style={{ paddingTop: 100 }}>
        <div className="faq-hero-inner">
          <span className="faq-tag">Help Center</span>
          <h1>Frequently Asked Questions</h1>
          <p>
            Everything you need to know about HRM. Can't find what you're looking for?{' '}
            <a href="mailto:support@HRM.in" className="faq-answer-link">Talk to our team.</a>
          </p>
          <div className="faq-search-wrap">
            <input
              type="text"
              className="faq-search-input"
              placeholder="Search questions… e.g. 'payroll', 'leave policy'"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="faq-search-btn" aria-label="Search">🔍</button>
          </div>
        </div>
      </section>

      {/* ── CATEGORY TABS (hidden during search) ─────────────── */}
      {!searchQuery && (
        <div className="faq-tabs-section">
          <div className="faq-tabs">
            {FAQ_CATEGORIES.map(({ id, icon, title }) => (
              <button
                key={id}
                className={`faq-tab${activeTab === id ? ' active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <span className="faq-tab-icon">{icon}</span>
                {title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── FAQ BODY ─────────────────────────────────────────── */}
      <section className="faq-body">
        <div className="faq-wrap">
          {/* Search results banner */}
          {searchQuery && (
            <div style={{ marginBottom: 32, padding: '14px 18px', background: 'rgba(106,17,203,.06)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: '#6a11cb', fontWeight: 600 }}>
                {filteredCategories.reduce((n, c) => n + c.questions.length, 0)} result(s) for "{searchQuery}"
              </span>
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6a11cb', fontWeight: 700, fontSize: '0.85rem' }}
              >
                Clear ✕
              </button>
            </div>
          )}

          {/* Category accordions */}
          {visibleCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
              <p style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</p>
              <p style={{ fontSize: '1rem', marginBottom: 8, color: '#555', fontWeight: 600 }}>No results found</p>
              <p style={{ fontSize: '0.88rem' }}>Try different keywords, or <a href="mailto:support@HRM.in" className="faq-answer-link">contact our support team</a>.</p>
            </div>
          ) : (
            visibleCategories.map(({ id, icon, title, desc, questions }) => (
              <div key={id} className="faq-category" id={id}>
                <div className="faq-category-header">
                  <div className="faq-category-title">
                    <span className="faq-category-title-icon">{icon}</span>
                    {title}
                  </div>
                  {!searchQuery && <p className="faq-category-desc">{desc}</p>}
                </div>
                <div className="faq-accordion">
                  {questions.map(({ q, a }) => (
                    <FaqItem key={q} question={q} answer={a} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── CONTACT / STILL HAVE QUESTIONS ───────────────────── */}
      <section className="faq-contact">
        <div className="faq-contact-inner">
          <span className="faq-tag">Still Need Help?</span>
          <h2>We're Here to Help</h2>
          <p>
            Our team is available Monday–Saturday, 9 AM–7 PM IST.
            Most queries are resolved within 2 hours.
          </p>
          <div className="faq-contact-options">
            <a href="mailto:support@HRM.in" className="faq-contact-card">
              <div className="faq-contact-card-icon">📧</div>
              <h4>Email Support</h4>
              <p>support@HRM.in<br />Reply within 2 hours</p>
            </a>
            <a href="#" className="faq-contact-card">
              <div className="faq-contact-card-icon">💬</div>
              <h4>Live Chat</h4>
              <p>Chat with us directly<br />Mon–Sat, 9 AM–7 PM IST</p>
            </a>
            <a href="mailto:sales@HRM.in" className="faq-contact-card">
              <div className="faq-contact-card-icon">📞</div>
              <h4>Talk to Sales</h4>
              <p>sales@HRM.in<br />Enterprise & custom plans</p>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="faq-footer">
        <p>
          © {new Date().getFullYear()} HRM · <a href="/landing">Home</a> · <a href="mailto:support@HRM.in">Support</a> · <a href="#">Privacy Policy</a>
        </p>
      </footer>
    </div>
  );
}
