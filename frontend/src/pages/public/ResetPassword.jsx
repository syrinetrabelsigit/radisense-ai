import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import '../../styles/pages/public/Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!token) navigate('/forgot-password');
  }, [token, navigate]);

  const strength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)          score++;
    if (/[A-Z]/.test(pwd))        score++;
    if (/[0-9]/.test(pwd))        score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const map = [
      { label: '',                         color: '' },
      { label: t('reset.strength.weak'),   color: '#EF4444' },
      { label: t('reset.strength.fair'),   color: '#F59E0B' },
      { label: t('reset.strength.good'),   color: '#0066CC' },
      { label: t('reset.strength.strong'), color: '#10B981' },
    ];
    return { score, ...map[score] };
  };

  const pwdStrength = strength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('reset.error.minLength'));
      return;
    }
    if (password !== confirm) {
      setError(t('reset.error.noMatch'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: password,
      });
      setSuccess(true);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail?.includes('expired')) {
        setError(t('reset.error.expired'));
      } else if (detail?.includes('Invalid')) {
        setError(t('reset.error.invalid'));
      } else {
        setError(detail || t('reset.error.generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  const EyeOpen = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeOff = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-img" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=1080&fit=crop)` }} />
        <div className="auth-bg-overlay" />
      </div>

      <div className="container auth-container">
        <div className="auth-content" style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          minHeight: 'calc(100vh - 100px)', padding: '40px 20px',
        }}>
          <div className="auth-form-card" style={{ maxWidth: 500, width: '100%' }}>

            {/* ── SUCCESS ── */}
            {success ? (
              <div className="auth-form-success" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{
                  width: 80, height: 80, margin: '0 auto 1.5rem',
                  background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(0,191,166,0.15))',
                  border: '2px solid rgba(16,185,129,0.3)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.375rem', fontWeight: 800, margin: '0 0 0.75rem' }}>
                  {t('reset.success.title')}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.75rem' }}>
                  {t('reset.success.desc')}
                </p>
                <button className="auth-submit-btn" onClick={() => navigate('/login')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  {t('reset.success.login')}
                </button>
              </div>

            ) : (
              <>
                {/* ── HEADER ── */}
                <div className="auth-form-header">
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                      width: 64, height: 64, margin: '0 auto 1rem',
                      background: 'linear-gradient(135deg,rgba(0,102,204,0.12),rgba(0,191,166,0.12))',
                      border: '2px solid rgba(0,102,204,0.25)', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                  </div>
                  <h2 className="auth-form-title" style={{ textAlign: 'center' }}>
                    {t('reset.title')}
                  </h2>
                  <p className="auth-form-subtitle" style={{ textAlign: 'center' }}>
                    {t('reset.subtitle')}
                  </p>
                </div>

                {/* ── FORM ── */}
                <form onSubmit={handleSubmit} className="auth-form">

                  {error && (
                    <div className="auth-error">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span>{error}</span>
                      {(error.includes('expired') || error.includes('expiré') || error.includes('invalid') || error.includes('invalide')) && (
                        <button
                          type="button"
                          onClick={() => navigate('/forgot-password')}
                          style={{ display:'block', marginTop:'0.5rem', color:'#0066CC', background:'none', border:'none', cursor:'pointer', fontSize:'0.82rem', textDecoration:'underline' }}
                        >
                          {t('reset.error.newLink')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── New Password ── */}
                  <div className="auth-field">
                    <label className="auth-label">{t('reset.newPassword')}</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      </span>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t('reset.placeholder')}
                        className="auth-input"
                        required
                        autoFocus
                      />
                      <button type="button" className="auth-toggle-pwd" onClick={() => setShowPwd(v => !v)}>
                        {showPwd ? <EyeOff /> : <EyeOpen />}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {password && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display:'flex', gap:'4px', marginBottom:'4px' }}>
                          {[1,2,3,4].map(i => (
                            <div key={i} style={{
                              flex:1, height:3, borderRadius:2,
                              background: i <= pwdStrength.score ? pwdStrength.color : 'rgba(255,255,255,0.1)',
                              transition: 'background 0.2s',
                            }} />
                          ))}
                        </div>
                        {pwdStrength.label && (
                          <span style={{ fontSize:'0.72rem', color: pwdStrength.color, fontWeight:600 }}>
                            {pwdStrength.label}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Confirm Password ── */}
                  <div className="auth-field">
                    <label className="auth-label">{t('reset.confirmPassword')}</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      <input
                        type={showConf ? 'text' : 'password'}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder={t('reset.confirmPlaceholder')}
                        className="auth-input"
                        required
                        style={{ borderColor: confirm && confirm !== password ? '#EF4444' : undefined }}
                      />
                      <button type="button" className="auth-toggle-pwd" onClick={() => setShowConf(v => !v)}>
                        {showConf ? <EyeOff /> : <EyeOpen />}
                      </button>
                    </div>
                    {confirm && confirm !== password && (
                      <p style={{ fontSize:'0.72rem', color:'#EF4444', marginTop:'4px', fontWeight:600 }}>
                        {t('reset.noMatch')}
                      </p>
                    )}
                    {confirm && confirm === password && (
                      <p style={{ fontSize:'0.72rem', color:'#10B981', marginTop:'4px', fontWeight:600 }}>
                        {t('reset.match')}
                      </p>
                    )}
                  </div>

                  {/* ── Requirements ── */}
                  <div style={{ background:'rgba(0,102,204,0.06)', border:'1px solid rgba(0,102,204,0.15)', borderRadius:10, padding:'12px 14px', marginBottom:'0.5rem' }}>
                    <p style={{ margin:'0 0 8px', fontSize:'0.75rem', color:'#64748B', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      {t('reset.requirements')}
                    </p>
                    {[
                      { label: t('reset.req1'), ok: password.length >= 8 },
                      { label: t('reset.req2'), ok: /[A-Z]/.test(password) },
                      { label: t('reset.req3'), ok: /[0-9]/.test(password) },
                    ].map((req, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={req.ok ? '#10B981' : '#475569'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span style={{ fontSize:'0.78rem', color: req.ok ? '#10B981' : '#64748B' }}>{req.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* ── Submit ── */}
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || password !== confirm || password.length < 8}
                  >
                    {loading ? (
                      <><span className="auth-spinner" />{t('reset.loading')}</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {t('reset.submit')}
                      </>
                    )}
                  </button>

                  <div className="auth-divider"><span>or</span></div>

                  <button type="button" className="auth-secondary-btn" onClick={() => navigate('/login')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                    {t('reset.back')}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;