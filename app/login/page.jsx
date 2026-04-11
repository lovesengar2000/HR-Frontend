'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import authAPI from '@/lib/authAPI';
import style from './login.module.css';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [otp, setOtp]               = useState('');
  const [userState, setUserState]   = useState(null); // null | 'existing' | 'employee'
  const [loading, setLoading]       = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [message, setMessage]       = useState('');
  const [messageType, setMessageType] = useState('error');

  const showMsg = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  /* ── Check email on blur ─────────────────────────────────── */
  const handleEmailBlur = async () => {
    setMessage('');
    setUserState(null);
    if (!emailRegex.test(email)) return;

    setCheckingEmail(true);
    try {
      const res = await fetch('/api/auth/checkEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.Event === 'Invalid user') {
        showMsg('No account found for this email address.', 'error');
      } else if (data.exists) {
        if (data.Event === 'Employee Registration Required') {
          setUserState('employee');
          showMsg('Check your email — we sent you a one-time password.', 'info');
        } else {
          setUserState('existing');
        }
      }
    } catch {
      showMsg('Could not verify email. Please try again.', 'error');
    } finally {
      setCheckingEmail(false);
    }
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async () => {
    setMessage('');
    if (!email || !password) {
      return showMsg('Please enter your email and password.', 'error');
    }

    if (userState === 'employee' && !otp) {
      return showMsg('Please enter the OTP sent to your email.', 'error');
    }

    setLoading(true);
    try {
      let res, data;

      if (userState === 'employee') {
        // Employee first-time registration
        res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/registerEmployee`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, otpCode: otp }),
        });
        data = await res.json();
        if (res.ok) {
          authAPI.setToken(data.token);
          authAPI.setUserId(data.userId);
          authAPI.setCompanyId(data.companyId);
          authAPI.setUserRole('EMPLOYEE');
          // Set cookie via login route so middleware can read it
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          router.push('/dashboard');
          return;
        }
      } else {
        // Normal login
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        data = await res.json();
        if (data.success) {
          authAPI.setToken(data.token);
          authAPI.setUserId(data.userId);
          authAPI.setCompanyId(data.companyId);
          authAPI.setUserRole(data.role);
          router.push('/dashboard');
          return;
        }
      }

      showMsg(data.error || 'Invalid email or password. Please try again.', 'error');
    } catch {
      showMsg('Something went wrong. Please try again.', 'error');
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
          <div className={style.Logo}>HRM</div>
          <div className={style.Tagline}>Welcome back — sign in to your workspace</div>
        </div>

        {/* Form */}
        <div className={style.Form}>
          {/* Email */}
          <div className={style.FieldGroup}>
            <label className={style.Label}>Work Email</label>
            <input
              className={style.Input}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              onKeyDown={handleKeyDown}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password — shown once email is verified */}
          {userState !== null && (
            <div className={`${style.FieldGroup} ${style.InputAppear}`}>
              <label className={style.Label}>Password</label>
              <input
                className={style.Input}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="current-password"
                autoFocus
              />
            </div>
          )}

          {/* OTP — only for employees doing first-time setup */}
          {userState === 'employee' && (
            <div className={`${style.FieldGroup} ${style.InputAppear}`}>
              <label className={style.Label}>One-Time Password</label>
              <input
                className={style.Input}
                type="text"
                placeholder="Enter the OTP from your email"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete="one-time-code"
                autoFocus
              />
              <span className={style.OtpHint}>
                Check your inbox for the OTP sent by your HR admin.
              </span>
            </div>
          )}

          {/* Forgot password */}
          {userState === 'existing' && (
            <button
              className={style.ForgotPassword}
              onClick={() => router.push('/forgotPassword')}
              type="button"
            >
              Forgot password?
            </button>
          )}

          {/* Message */}
          {(message || checkingEmail) && (
            <div className={`${style.Message} ${
              checkingEmail ? style.MessageInfo :
              messageType === 'error' ? style.MessageError :
              messageType === 'success' ? style.MessageSuccess :
              style.MessageInfo
            }`}>
              {checkingEmail ? 'Checking email…' : message}
            </div>
          )}

          {/* Submit */}
          <button
            className={style.SubmitBtn}
            onClick={handleSubmit}
            disabled={loading || checkingEmail || userState === null}
            type="button"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <hr className={style.Divider} />

          <div className={style.Footer}>
            <span>Don't have an account?</span>
            <Link href="/register" className={style.FooterLink}>Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
