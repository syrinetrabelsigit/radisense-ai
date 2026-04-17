import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get('session_id');
  const planParam = searchParams.get('plan') || 'pro';
  const billing   = searchParams.get('billing') || 'monthly';

  const [status, setStatus] = useState('loading');
  const [data,   setData]   = useState(null);

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API}/api/payments/verify-session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Verification failed');
      const d = await r.json();
      setData(d);
      setStatus('success');
    } catch (err) {
      setStatus('error');
    }
  };

  const PLAN_FEATURES = {
    pro: [
      '500 analyses / month',
      'Up to 20 radiologists',
      'Advanced analytics',
      'Priority support',
      'API access',
      'PDF export',
    ],
    enterprise: [
      'Unlimited analyses',
      'Unlimited radiologists',
      'Custom model training',
      'On-premise deployment',
      'Dedicated support',
      'SLA guarantee',
    ],
  };

  const PLAN_COLORS = {
    pro:        '#0066CC',
    enterprise: '#8B5CF6',
  };

  const plan       = data?.plan || planParam;
  const color      = PLAN_COLORS[plan] || '#0066CC';
  const features   = PLAN_FEATURES[plan] || PLAN_FEATURES.pro;
  const CURRENCY_SYMBOLS = { usd: '$', eur: '€', gbp: '£', tnd: 'TND ' };
  const currSymbol = CURRENCY_SYMBOLS[(data?.currency || 'usd').toLowerCase()] || '$';

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${3 + Math.random() * 4}s`,
    size: `${6 + Math.random() * 10}px`,
    color: ['#0066CC', '#00BFA6', '#10B981', '#8B5CF6', '#F59E0B'][i % 5],
  }));

  return (
    <div style={S.page}>

      <div style={S.bg}>
        <div style={{ ...S.bgGlow, background: `radial-gradient(ellipse at 30% 40%, color-mix(in srgb, ${color} 15%, transparent), transparent 60%)` }} />
        <div style={{ ...S.bgGlow, background: 'radial-gradient(ellipse at 70% 60%, rgba(0,191,166,0.12), transparent 60%)' }} />
      </div>

      {status === 'success' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          {particles.map(p => (
            <div key={p.id} style={{
              position: 'absolute', top: '-20px', left: p.left,
              width: p.size, height: p.size, borderRadius: '50%',
              background: p.color, opacity: 0.7,
              animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
            }} />
          ))}
        </div>
      )}

      <div style={S.container}>

        {/* LOADING */}
        {status === 'loading' && (
          <div style={S.card}>
            <div style={S.loadingWrap}>
              <div style={S.spinner} />
              <h2 style={S.loadingTitle}>{t('payment.verifying')}</h2>
              <p style={S.loadingText}>{t('payment.verifyingDesc')}</p>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: 640 }}>

            <div style={{ ...S.card, overflow: 'hidden' }}>
              <div style={{ height: 6, background: `linear-gradient(90deg, ${color}, #00BFA6)` }} />

              <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${color}, #00BFA6)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 20px 60px color-mix(in srgb, ${color} 40%, transparent)`,
                    animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    fontSize: '2.5rem',
                  }}>
                    ✓
                  </div>
                  <div style={{
                    position: 'absolute', inset: -8,
                    borderRadius: '50%',
                    border: `2px solid color-mix(in srgb, ${color} 30%, transparent)`,
                    animation: 'ringPulse 2s ease infinite',
                  }} />
                </div>

                <h1 style={S.successTitle}>{t('payment.successTitle')}</h1>
                <p style={S.successSub}>
                  {t('payment.successDesc', { plan: plan.charAt(0).toUpperCase() + plan.slice(1) })}
                </p>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, borderRadius: '100px', color, fontWeight: 800, fontSize: '1.1rem', margin: '1rem 0' }}>
                  {currSymbol}{data?.amount}{billing === 'yearly' ? '/year' : '/month'}
                </div>
              </div>

              <div style={{ padding: '0 2rem 1.5rem' }}>
                <div style={{ background: 'var(--bg-secondary, rgba(255,255,255,0.04))', border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`, borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                    {plan.charAt(0).toUpperCase() + plan.slice(1)} — {t('payment.included')}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                    {features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#94A3B8' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: `color-mix(in srgb, ${color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Plan',    value: plan.charAt(0).toUpperCase() + plan.slice(1), color },
                  { label: 'Status',  value: '✓ Active',                                   color: '#10B981' },
                  { label: 'Billing', value: billing === 'yearly' ? 'Yearly' : 'Monthly',  color: '#64748B' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: '1rem', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{item.label}</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.25rem', background: 'rgba(0,191,166,0.06)', border: '1px solid rgba(0,191,166,0.2)', borderRadius: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(0,191,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00BFA6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#00BFA6', fontSize: '0.875rem', marginBottom: '0.125rem' }}>{t('payment.emailSent')}</p>
                <p style={{ color: '#64748B', fontSize: '0.78rem' }}>{t('payment.emailSentDesc')}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/login')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', padding: '1rem 1.5rem', background: `linear-gradient(135deg, ${color}, #00BFA6)`, border: 'none', borderRadius: '14px', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: `0 8px 32px color-mix(in srgb, ${color} 30%, transparent)` }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                {t('payment.goToDashboard')}
              </button>
              <button
                onClick={() => navigate('/pricing')}
                style={{ padding: '1rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: '#64748B', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {t('payment.viewPlans')}
              </button>
            </div>

          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div style={{ ...S.card, textAlign: 'center', padding: '3rem 2rem', maxWidth: 500 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '2rem' }}>
              ✗
            </div>
            <h2 style={{ color: '#EF4444', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              {t('payment.errorTitle')}
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              {t('payment.errorDesc')}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/pricing')}
                style={{ padding: '0.875rem 1.75rem', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                {t('payment.backToPricing')}
              </button>
              <button onClick={() => window.location.reload()}
                style={{ padding: '0.875rem 1.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}>
                {t('payment.tryAgain')}
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%       { transform: scale(1.15); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const S = {
  page: {
    minHeight: '100vh',
    background: '#0a0e1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  bgGlow: {
    position: 'absolute',
    inset: 0,
  },
  container: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: 640,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.5rem',
  },
  card: {
    width: '100%',
    background: 'linear-gradient(135deg, rgba(26,31,58,0.95), rgba(15,22,40,0.98))',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '24px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px)',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  spinner: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: '4px solid rgba(0,102,204,0.2)',
    borderTopColor: '#0066CC',
    animation: 'spin 0.8s linear infinite',
  },
  loadingTitle: {
    color: '#e2e8f0',
    fontWeight: 800,
    fontSize: '1.25rem',
    margin: 0,
  },
  loadingText: {
    color: '#64748B',
    fontSize: '0.9rem',
    margin: 0,
  },
  successTitle: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    fontWeight: 900,
    color: 'white',
    letterSpacing: '-0.04em',
    marginBottom: '0.75rem',
  },
  successSub: {
    color: '#94A3B8',
    fontSize: '1rem',
    lineHeight: 1.7,
    maxWidth: 420,
    margin: '0 auto',
  },
};

export default PaymentSuccess;