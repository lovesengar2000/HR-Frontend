'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import authAPI from '@/lib/authAPI';
import style from './register.module.css';

/* ── Captcha helpers ─────────────────────────────────────── */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateCaptcha(len = 5) {
  return Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: '',
    companyName: '',
    domain: '',
    password: '',
    confirmPassword: '',
  });
  const [captchaCode, setCaptchaCode]     = useState('');
  const [captchaInput, setCaptchaInput]   = useState('');
  const [errors, setErrors]               = useState({});

  // Generate captcha only on the client to avoid SSR/client mismatch
  useEffect(() => { setCaptchaCode(generateCaptcha()); }, []);
  const [loading, setLoading]             = useState(false);
  const [message, setMessage]             = useState('');
  const [messageType, setMessageType]     = useState('error');

  const refreshCaptcha = useCallback(() => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput('');
  }, []);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
  };

  /* ── Validate ────────────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(form.email))
      errs.email = 'Enter a valid email address.';
    if (form.companyName.trim().length < 2)
      errs.companyName = 'Company name must be at least 2 characters.';
    if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/.test(form.domain))
      errs.domain = 'Enter a valid domain (e.g. future.com or acme.co.in).';
    if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';
    if (captchaInput.toUpperCase() !== captchaCode) {
      errs.captcha = 'Captcha does not match. Please try again.';
      refreshCaptcha();
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setMessage('');
    if (!validate()) return;

    setLoading(true);
    console.log('Submitting registration with data:', form);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          companyName: form.companyName,
          domain: form.domain,
          password: form.password,
        }),
      });

      const data = await res.json();
      console.log('Registration response:', data);
      if (data.success) {
        authAPI.setToken(data.token);
        authAPI.setUserId(data.userId);
        authAPI.setCompanyId(data.companyId);
        authAPI.setUserRole(data.role);
        setMessage('Account created! Taking you to your dashboard…', 'success');
        setMessageType('success');
        setTimeout(() => router.push('/dashboard'), 800);
        return;
      }

      setMessage(data.error || 'Registration failed. Please try again.');
      setMessageType('error');
      refreshCaptcha();
    } catch {
      setMessage('Something went wrong. Please try again.');
      setMessageType('error');
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className={style.Wrapper}>
      <Link href="/landing" className={style.BackLink}>← Home</Link>

      <div className={style.Card}>
        {/* Header */}
        <div className={style.CardHeader}>
          <div className={style.Logo}>HRMatrix</div>
          <div className={style.Tagline}>Create your company account — free for 14 days</div>
        </div>

        {/* Form */}
        <div className={style.Form}>
          {/* Email */}
          <div className={style.FieldGroup}>
            <label className={style.Label}>Work Email</label>
            <input
              className={`${style.Input}${errors.email ? ' ' + style.InputError : ''}`}
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={set('email')}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <span className={style.FieldError}>{errors.email}</span>}
          </div>

          {/* Company Name */}
          <div className={style.FieldGroup}>
            <label className={style.Label}>Company Name</label>
            <input
              className={`${style.Input}${errors.companyName ? ' ' + style.InputError : ''}`}
              type="text"
              placeholder="Acme Technologies"
              value={form.companyName}
              onChange={set('companyName')}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="organization"
            />
            {errors.companyName && <span className={style.FieldError}>{errors.companyName}</span>}
          </div>

          {/* Domain */}
          <div className={style.FieldGroup}>
            <label className={style.Label}>Company Domain</label>
            <input
              className={`${style.Input}${errors.domain ? ' ' + style.InputError : ''}`}
              type="text"
              placeholder="e.g. future.com or acme.co.in"
              value={form.domain}
              onChange={set('domain')}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="off"
            />
            {errors.domain && <span className={style.FieldError}>{errors.domain}</span>}
          </div>

          {/* Password */}
          <div className={style.FieldGroup}>
            <label className={style.Label}>Password</label>
            <input
              className={`${style.Input}${errors.password ? ' ' + style.InputError : ''}`}
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.password && <span className={style.FieldError}>{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className={style.FieldGroup}>
            <label className={style.Label}>Confirm Password</label>
            <input
              className={`${style.Input}${errors.confirmPassword ? ' ' + style.InputError : ''}`}
              type="password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className={style.FieldError}>{errors.confirmPassword}</span>}
          </div>

          {/* Captcha */}
          <div className={style.FieldGroup}>
            <label className={style.Label}>Security Check</label>
            <div className={style.CaptchaRow}>
              <div className={style.CaptchaBox} aria-label="Captcha code">{captchaCode}</div>
              <button
                className={style.RefreshBtn}
                type="button"
                onClick={refreshCaptcha}
                title="New captcha"
                aria-label="Refresh captcha"
              >
                ↻
              </button>
              <input
                className={`${style.CaptchaInput}${errors.captcha ? ' ' + style.InputError : ''}`}
                type="text"
                placeholder="Type the code"
                value={captchaInput}
                onChange={e => { setCaptchaInput(e.target.value); setErrors(er => ({ ...er, captcha: '' })); }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="off"
                maxLength={5}
              />
            </div>
            {errors.captcha && <span className={style.FieldError}>{errors.captcha}</span>}
          </div>

          {/* API message */}
          {message && (
            <div className={`${style.Message} ${messageType === 'success' ? style.MessageSuccess : style.MessageError}`}>
              {message}
            </div>
          )}

          {/* Submit */}
          <button
            className={style.SubmitBtn}
            onClick={handleSubmit}
            disabled={loading}
            type="button"
          >
            {loading ? 'Creating account…' : 'Create Company Account'}
          </button>

          <hr className={style.Divider} />

          <div className={style.Footer}>
            <span>Already have an account?</span>
            <Link href="/login" className={style.FooterLink}>Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
