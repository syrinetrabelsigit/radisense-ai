import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import '../../styles/pages/public/Auth.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const user = await authService.login(formData.username.trim(), formData.password.trim());

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      if (onLogin) onLogin(user);

      if (user.must_change_password) {
        navigate('/change-password?first=true');
        return;
      }

      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        navigate(redirect);
        return;
      }

      const redirectMap = {
        patient: '/patient/dashboard',
        radiologist: '/dashboard',
        researcher: '/researcher/dashboard',
        admin: '/admin/dashboard',
      };

      navigate(redirectMap[user.role] || '/');

    } catch (err) {
      const msg = err?.detail || err?.message || '';

      if (msg.includes('verify your email')) {
        setError(t('login.errorEmailNotVerified'));
      } else if (msg.includes('inactive')) {
        setError(t('login.errorInactive'));
      } else {
        setError(t('login.errorCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
      title: t('login.feature1.title'),
      desc: t('login.feature1.desc')
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
      title: t('login.feature2.title'),
      desc: t('login.feature2.desc')
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      title: t('login.feature3.title'),
      desc: t('login.feature3.desc')
    }
  ];

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-img" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=1080&fit=crop)` }} />
        <div className="auth-bg-overlay" />
      </div>

      <div className="container auth-container">
        <div className="auth-content">

          {/* LEFT */}
          <div className="auth-info">
            <div className="auth-badge">
              <div className="auth-badge-dot" />
              <span>AI-Powered Platform</span>
            </div>
            <h1 className="auth-info-title">
              <span className="title-gradient-modern">{t('login.title')}</span>
            </h1>
            <p className="auth-info-subtitle">{t('login.subtitle')}</p>

            <div className="auth-features">
              {features.map((f, i) => (
                <div className="auth-feature-item" key={i}>
                  <div className="auth-feature-icon">{f.icon}</div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2 className="auth-form-title">{t('login.form.title')}</h2>
              <p className="auth-form-subtitle">{t('login.form.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {successMessage && (
                <div className="auth-success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="auth-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="auth-field">
                <label className="auth-label">{t('login.form.username')}</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={t('login.form.username')}
                    className="auth-input"
                    required
                    autoFocus
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">{t('login.form.password')}</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="auth-input"
                    required
                    autoComplete="new-password"
                  />
                  <button type="button" className="auth-input-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div className="auth-form-footer">
                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="auth-checkbox-box" />
                  <span>{t('login.form.remember')}</span>
                </label>
                <a href="/forgot-password" className="auth-link">{t('login.form.forgot')}</a>
              </div>

              <button type="button" onClick={handleSubmit} className="auth-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="auth-spinner" />{t('login.form.loading')}</>
                  : <>{t('login.form.submit')}
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                      </svg>
                    </>
                }
              </button>

              <div className="auth-divider"><span>{t('login.form.or')}</span></div>

              <button type="button" className="auth-secondary-btn" onClick={() => navigate('/register')}>
                {t('login.form.create')}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;