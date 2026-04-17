import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import '../../styles/pages/public/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Appel API sécurisé - le backend vérifie si l'email existe
      await api.post('/auth/forgot-password', { email });
      
      // TOUJOURS afficher le message de succès, même si l'email n'existe pas
      // Ceci empêche un attaquant de découvrir quels emails sont enregistrés
      setSuccess(true);
   } catch (err) {
      // ERR_CONNECTION_REFUSED = backend arrêté, pas une erreur de sécurité
      if (err?.message?.includes('Failed to fetch') || err?.code === 'ERR_NETWORK') {
        setError('Unable to connect to server. Please try again later.');
      } else {
        // Vraie erreur sécurité → afficher succès quand même
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-img" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=1080&fit=crop)` }} />
        <div className="auth-bg-overlay" />
      </div>

      <div className="container auth-container">
        <div className="auth-content" style={{ 
          display: 'flex',
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 'calc(100vh - 100px)',
          padding: '40px 20px'
        }}>

          <div className="auth-form-card" style={{ 
            maxWidth: '500px', 
            width: '100%'
          }}>
            
            {!success ? (
              <>
                <div className="auth-form-header">
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      margin: '0 auto 16px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    </div>
                  </div>
                  <h2 className="auth-form-title" style={{ textAlign: 'center' }}>
                    {t('forgot.title')}
                  </h2>
                  <p className="auth-form-subtitle" style={{ textAlign: 'center' }}>
                    {t('forgot.subtitle')}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                  {error && (
                    <div className="auth-error">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {error}
                    </div>
                  )}

                  <div className="auth-field">
                    <label className="auth-label">{t('forgot.form.email')}</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john.doe@example.com"
                        className="auth-input"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading
                      ? <><span className="auth-spinner" />{t('forgot.form.loading')}</>
                      : <>{t('forgot.form.submit')}
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                      </>
                    }
                  </button>

                  <div className="auth-divider"><span>{t('login.form.or')}</span></div>

                  <button type="button" className="auth-secondary-btn" onClick={() => navigate('/login')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                    {t('forgot.form.back')}
                  </button>
                </form>
              </>
            ) : (
              <div className="auth-form-success">
                <div className="success-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                </div>
                <h3>{t('forgot.form.success')}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                  If an account exists with <strong>{email}</strong>, you will receive a password reset link within the next few minutes.
                </p>
                
                <div style={{
                  background: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                        Didn't receive the email?
                      </strong>
                      Check your spam folder or contact support at support@radisense.ai
                    </div>
                  </div>
                </div>
                
                <button className="auth-submit-btn" onClick={() => navigate('/login')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                  </svg>
                  {t('forgot.form.back')}
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;