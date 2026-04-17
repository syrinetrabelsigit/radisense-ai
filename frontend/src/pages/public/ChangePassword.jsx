import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API = 'http://localhost:8000';

const ChangePassword = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFirst = searchParams.get('first') === 'true';

  const [form, setForm]       = useState({ username: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showPw,  setShowPw]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API}/api/users/change-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          new_username: form.username || undefined,
          new_password: form.password,
        }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Failed'); }
      const data = await r.json();

      // ✅ Mettre à jour le token avec le nouveau (contient le nouveau username)
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
      }

      // ✅ Mettre à jour le user stocké
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...storedUser,
        username: data.new_username || storedUser.username,
        must_change_password: false
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (onLogin) onLogin(updatedUser);

      // Redirect to dashboard
      const redirectMap = {
        patient:      '/patient/dashboard',
        radiologist:  '/dashboard',
        researcher:   '/researcher/dashboard',
        admin:        '/admin/dashboard',
      };
      navigate(redirectMap[updatedUser.role] || '/');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-img" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1920&h=1080&fit=crop)` }} />
        <div className="auth-bg-overlay" />
      </div>

      <div className="container auth-container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
          <div className="auth-form-card">

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 16px 48px rgba(0,102,204,0.3)' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
              </div>
              <h2 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isFirst ? 'Set Your Password' : 'Change Password'}
              </h2>
              <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.6 }}>
                {isFirst
                  ? 'Welcome! Your account has been created by our admin. Please set your own username and password to continue.'
                  : 'Update your login credentials below.'}
              </p>
            </div>

            {isFirst && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.78rem', color: '#F59E0B' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                You are using a temporary password. You must set a new one before accessing the platform.
              </div>
            )}

            {error && (
              <div className="auth-error" style={{ marginBottom: '1rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">

              {/* Username (optional) */}
              <div className="auth-field">
                <label className="auth-label">
                  New Username <span style={{ color: '#64748B', fontSize: '0.72rem' }}>(optional — keep current if empty)</span>
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Choose a username..."
                    className="auth-input"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  />
                </div>
              </div>

              {/* New password */}
              <div className="auth-field">
                <label className="auth-label">New Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    className="auth-input"
                    required
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" className="auth-input-toggle" onClick={() => setShowPw(v => !v)}>
                    {showPw
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="auth-field">
                <label className="auth-label">Confirm New Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Repeat password"
                    className="auth-input"
                    required
                    value={form.confirm}
                    onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="auth-spinner" />Saving...</>
                  : <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {isFirst ? 'Set Password & Enter Platform' : 'Update Password'}
                    </>
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;