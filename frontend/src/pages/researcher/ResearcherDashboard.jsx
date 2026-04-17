import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/researcher/ResearcherDashboard.css';

const API = 'http://localhost:8000';

const ResearcherDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initialized = useRef(false);

  const [loading, setLoading]         = useState(true);
  const [overview, setOverview]       = useState(null);
  const [datasets, setDatasets]       = useState([]);
  const [experiments, setExperiments] = useState([]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    Promise.all([
      fetch(`${API}/api/researcher/analytics/overview`, { headers: getHeaders() }).then(r => r.ok ? r.json() : null),
      fetch(`${API}/api/researcher/datasets`,           { headers: getHeaders() }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/researcher/experiments`,        { headers: getHeaders() }).then(r => r.ok ? r.json() : []),
    ]).then(([ov, ds, exp]) => {
      setOverview(ov);
      setDatasets(ds || []);
      setExperiments(exp || []);
    }).finally(() => setLoading(false));
  }, []);

  const COLORS = ['#0066CC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#00BFA6'];

  const stats = [
    {
      label: t('researcher.analyses.stats.total'),
      value: overview?.total_analyses ?? 0,
      color: '#0066CC',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    },
    {
      label: t('researcher.analyses.stats.total') === t('researcher.analyses.stats.total') ? 'Success Rate' : '',
      value: overview ? `${overview.success_rate}%` : '—',
      color: '#10B981',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    },
    {
      label: t('researcher.stats.datasets'),
      value: datasets.length,
      color: '#8B5CF6',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
    },
    {
      label: t('researcher.stats.experiments'),
      value: experiments.length,
      color: '#F59E0B',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
    },
  ];

  // Override label 2 properly
  stats[1].label = t('researcher.analyses.stats.total') + ' Rate'; // fallback simple

  const quickActions = [
    {
      label: t('researcher.analyses.title'),
      color: '#0066CC',
      path: '/researcher/analyses',
      desc: t('researcher.analyses.subtitle'),
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    },
    {
      label: t('researcher.experiments.title'),
      color: '#8B5CF6',
      path: '/researcher/experiments',
      desc: t('researcher.experiments.subtitle'),
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
    },
    {
      label: t('researcher.datasets.title'),
      color: '#10B981',
      path: '/researcher/datasets',
      desc: t('researcher.datasets.subtitle'),
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
    },
  ];

  if (loading) return (
    <div className="rd-page">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', animation: 'rdSpin 0.8s linear infinite' }} />
        <p style={{ color: '#64748B' }}>{t('researcher.dashboard.title')}…</p>
        <style>{`@keyframes rdSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div className="rd-page">
      <div className="container">

        {/* HEADER */}
        <div className="rd-header" data-aos="fade-down">
          <div>
            <div className="rd-badge"><div className="rd-badge-dot"/><span>Researcher Portal</span></div>
            <h1 className="rd-title"><span className="rd-title-grad">{t('researcher.dashboard.title')}</span></h1>
            <p className="rd-subtitle">{t('researcher.dashboard.subtitle')}</p>

            {/* ✅ PLAN LIMIT BANNER */}
            {(() => {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              const plan = user.plan || 'free';
              const cfg = {
                researcher_enterprise: { color: '#8B5CF6', text: '♾ Unlimited access to all analyses', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)' },
                researcher_pro:        { color: '#0066CC', text: '100 most recent analyses', bg: 'rgba(0,102,204,0.08)', border: 'rgba(0,102,204,0.25)' },
              }[plan] || { color: '#F59E0B', text: '5 oldest analyses (read-only)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' };
              return (
                <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', marginTop:'0.75rem', padding:'0.5rem 1rem', background: cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:'100px', fontSize:'0.8rem', fontWeight:700, color: cfg.color }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  {cfg.text}
                  {plan !== 'researcher_enterprise' && (
                    <a href="/pricing" style={{ marginLeft:'0.25rem', color:'white', background:'linear-gradient(135deg,#0066CC,#00BFA6)', padding:'0.2rem 0.625rem', borderRadius:'6px', textDecoration:'none', fontSize:'0.72rem' }}>
                      Upgrade
                    </a>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="rd-role-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
            {t('navbar.researcher')}
          </div>
        </div>

        {/* STATS */}
        <div className="rd-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="rd-stat-card" data-aos="fade-up" data-aos-delay={i * 70} style={{ '--rsc': s.color }}>
              <div className="rd-stat-glow" style={{ background: s.color }}/>
              <div className="rd-stat-icon" style={{ background: s.color, boxShadow: `0 8px 24px color-mix(in srgb, ${s.color} 40%, transparent)` }}>{s.icon}</div>
              <div className="rd-stat-body">
                <p className="rd-stat-label">{s.label}</p>
                <h3 className="rd-stat-val">{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="rd-content-grid">

          {/* QUICK ACTIONS */}
          <div className="rd-card" data-aos="fade-right">
            <div className="rd-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <h3 className="rd-card-title">{t('researcher.actions.title')}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {quickActions.map((a, i) => (
                <button key={i} onClick={() => navigate(a.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--bg-secondary)', border: `1px solid color-mix(in srgb, ${a.color} 20%, transparent)`, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `color-mix(in srgb, ${a.color} 20%, transparent)`; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '12px', background: `color-mix(in srgb, ${a.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${a.color} 25%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, flexShrink: 0 }}>
                    {a.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{a.label}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{a.desc}</p>
                  </div>
                  <svg style={{ marginLeft: 'auto', color: '#64748B', flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              ))}
            </div>
          </div>

          {/* TOP PATHOLOGIES */}
          <div className="rd-card" data-aos="fade-left">
            <div className="rd-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <h3 className="rd-card-title">{t('researcher.analyses.distribution')} — Platform</h3>
            </div>
            {!overview?.top_pathologies?.length ? (
              <p style={{ color: '#64748B', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>{t('researcher.analyses.noData')}</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '0.5rem' }}>
                {overview.top_pathologies.slice(0, 6).map((p, i) => {
                  const color = COLORS[i % COLORS.length];
                  const max   = overview.top_pathologies[0].count;
                  const pct   = Math.round((p.count / max) * 100);
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color }}>{p.count}</span>
                      </div>
                      <div style={{ height: 7, background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MODEL DISTRIBUTION */}
        {overview?.model_distribution?.length > 0 && (
          <div className="rd-card" data-aos="fade-up" style={{ marginTop: '1.5rem' }}>
            <div className="rd-card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <h3 className="rd-card-title">{t('researcher.analyses.modelPerformance')} — Platform</h3>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {overview.model_distribution.map((m, i) => {
                const color = COLORS[i % COLORS.length];
                const total = overview.model_distribution.reduce((a, x) => a + x.count, 0);
                const pct   = total > 0 ? Math.round((m.count / total) * 100) : 0;
                return (
                  <div key={i} style={{ flex: '1 1 140px', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: '14px', border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', textTransform: 'capitalize' }}>{m.model}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color }}>{m.count}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ResearcherDashboard;