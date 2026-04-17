import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';

const API = 'http://localhost:8000';

const Visualization = () => {
  const { t } = useTranslation();
  const initialized = useRef(false);
  const [loading, setLoading]         = useState(true);
  const [experiments, setExperiments] = useState([]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' });
    fetch(`${API}/api/researcher/experiments`, { headers: getHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setExperiments(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const MODEL_COLORS = {
    'DenseNet-121': '#0066CC', 'ResNet-50': '#EF4444',
    'EfficientNet-B4': '#8B5CF6', 'VGG-16': '#F59E0B',
    'MobileNet-V2': '#10B981', 'Multiple': '#00BFA6',
  };
  const colorFor = (model) => MODEL_COLORS[model] || '#8B5CF6';

  // ── compute chart data ──────────────────────────────────────────────────────
  const withAccuracy = experiments.filter(e => e.accuracy);
  const maxAccuracy  = withAccuracy.length > 0 ? Math.max(...withAccuracy.map(e => e.accuracy)) : 1;

  const statusCounts = experiments.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  const modelCounts = experiments.reduce((acc, e) => {
    acc[e.model_type] = (acc[e.model_type] || 0) + 1;
    return acc;
  }, {});

  if (loading) return (
    <div style={S.page}>
      <div style={S.loaderWrap}>
        <div style={S.spinner} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (experiments.length === 0) return (
    <div style={S.page}>
      <div className="container">
        <div style={S.header} data-aos="fade-down">
          <div>
            <div style={S.badge}><div style={S.badgeDot} /><span>Visualization</span></div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('researcher.visualization.title') || 'Visualization'}</span></h1>
          </div>
        </div>
        <div style={S.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>No data to visualize</p>
          <p style={{ color: '#64748B', margin: 0, fontSize: '0.875rem' }}>Create experiments first</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div className="container">

        {/* HEADER */}
        <div style={S.header} data-aos="fade-down">
          <div>
            <div style={S.badge}><div style={S.badgeDot} /><span>Data Visualization</span></div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('researcher.visualization.title') || 'Visualization'}</span></h1>
            <p style={S.subtitle}>{t('researcher.visualization.subtitle') || 'Charts and insights from your experiments'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* ACCURACY BAR CHART */}
          <div style={S.card} data-aos="fade-up">
            <h3 style={S.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Accuracy by Experiment
            </h3>
            {withAccuracy.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>No accuracy data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginTop: '1rem' }}>
                {withAccuracy.map(exp => {
                  const pct = (exp.accuracy / maxAccuracy) * 100;
                  const color = colorFor(exp.model_type);
                  return (
                    <div key={exp.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{exp.name}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color }}>{(exp.accuracy * 100).toFixed(2)}%</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 60%, #00BFA6))`, borderRadius: '4px', transition: 'width 0.8s ease', boxShadow: `0 0 8px color-mix(in srgb, ${color} 40%, transparent)` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STATUS DONUT */}
          <div style={S.card} data-aos="fade-up" data-aos-delay="100">
            <h3 style={S.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
              Experiment Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {Object.entries(statusCounts).map(([status, count]) => {
                const statusColors = { pending: '#F59E0B', running: '#00BFA6', completed: '#10B981', failed: '#EF4444' };
                const color = statusColors[status] || '#64748B';
                const pct = Math.round((count / experiments.length) * 100);
                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{status}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MODEL USAGE */}
          <div style={S.card} data-aos="fade-up" data-aos-delay="150">
            <h3 style={S.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Architecture Distribution
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', marginTop: '1rem' }}>
              {Object.entries(modelCounts).map(([model, count]) => {
                const color = colorFor(model);
                return (
                  <div key={model} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, borderRadius: '10px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{model}</span>
                    <span style={{ fontSize: '0.75rem', background: color, color: 'white', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: 800 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SUMMARY STATS */}
          <div style={S.card} data-aos="fade-up" data-aos-delay="200">
            <h3 style={S.cardTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Summary Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              {[
                { label: 'Total Experiments', val: experiments.length, color: '#8B5CF6' },
                { label: 'With Results', val: withAccuracy.length, color: '#10B981' },
                { label: 'Best Accuracy', val: withAccuracy.length > 0 ? `${(Math.max(...withAccuracy.map(e => e.accuracy)) * 100).toFixed(2)}%` : '—', color: '#0066CC' },
                { label: 'Avg Accuracy', val: withAccuracy.length > 0 ? `${(withAccuracy.reduce((a, e) => a + e.accuracy, 0) / withAccuracy.length * 100).toFixed(2)}%` : '—', color: '#F59E0B' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: `1px solid ${s.color}30` }}>
                  <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const S = {
  page: { minHeight: 'calc(100vh - 80px)', padding: '3rem 0 5rem' },
  loaderWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  spinner: { width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', animation: 'spin 0.8s linear infinite' },
  header: { marginBottom: '2rem' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '100px', color: '#A78BFA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot: { width: 7, height: 7, borderRadius: '50%', background: '#8B5CF6' },
  title: { margin: 0, fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad: { background: 'linear-gradient(135deg,#8B5CF6,#0066CC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { color: '#64748B', fontSize: '1rem', margin: 0 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '20px', textAlign: 'center' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '20px', padding: '1.5rem' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '0.625rem', margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' },
};

export default Visualization;