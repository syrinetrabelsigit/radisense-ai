import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';

const API = 'http://localhost:8000';

const ModelComparison = () => {
  const { t } = useTranslation();
  const initialized = useRef(false);
  const [loading, setLoading]     = useState(true);
  const [experiments, setExperiments] = useState([]);
  const [selected, setSelected]   = useState([]);

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

  const toggleSelect = (exp) => {
    setSelected(prev =>
      prev.find(e => e.id === exp.id)
        ? prev.filter(e => e.id !== exp.id)
        : prev.length < 4 ? [...prev, exp] : prev
    );
  };

  const MODEL_COLORS = {
    'DenseNet-121': '#0066CC', 'ResNet-50': '#EF4444',
    'EfficientNet-B4': '#8B5CF6', 'VGG-16': '#F59E0B',
    'MobileNet-V2': '#10B981', 'Multiple': '#00BFA6',
  };
  const colorFor = (model) => MODEL_COLORS[model] || '#8B5CF6';

  if (loading) return (
    <div style={S.page}>
      <div style={S.loaderWrap}>
        <div style={S.spinner} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div className="container">

        {/* HEADER */}
        <div style={S.header} data-aos="fade-down">
          <div>
            <div style={S.badge}><div style={S.badgeDot} /><span>Model Comparison</span></div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('researcher.comparison.title') || 'Model Comparison'}</span></h1>
            <p style={S.subtitle}>{t('researcher.comparison.subtitle') || 'Select up to 4 experiments to compare side by side'}</p>
          </div>
        </div>

        {experiments.length === 0 ? (
          <div style={S.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>No experiments to compare</p>
            <p style={{ color: '#64748B', margin: 0, fontSize: '0.875rem' }}>Create experiments first</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>

            {/* SELECT PANEL */}
            <div style={S.selectPanel} data-aos="fade-right">
              <p style={S.panelTitle}>Select experiments ({selected.length}/4)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {experiments.map(exp => {
                  const isSelected = !!selected.find(e => e.id === exp.id);
                  const color = colorFor(exp.model_type);
                  return (
                    <button key={exp.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderRadius: '12px', background: isSelected ? `color-mix(in srgb, ${color} 10%, transparent)` : 'var(--bg-secondary)', border: `1px solid ${isSelected ? color : 'var(--border-primary)'}`, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%' }}
                      onClick={() => toggleSelect(exp)}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: isSelected ? color : '#475569', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.name}</p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>{exp.model_type} · {exp.status}</p>
                      </div>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COMPARISON TABLE */}
            <div data-aos="fade-left">
              {selected.length === 0 ? (
                <div style={S.empty}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <p style={{ color: '#64748B', margin: 0, fontSize: '0.875rem' }}>Select experiments from the left to compare</p>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(139,92,246,0.06)' }}>
                        <th style={S.th}>Metric</th>
                        {selected.map(exp => (
                          <th key={exp.id} style={{ ...S.th, color: colorFor(exp.model_type) }}>
                            {exp.name.length > 16 ? exp.name.slice(0, 16) + '…' : exp.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'Architecture', key: 'model_type', fmt: v => v },
                        { label: 'Status',       key: 'status',     fmt: v => v },
                        { label: 'Accuracy',     key: 'accuracy',   fmt: v => v ? `${(v * 100).toFixed(2)}%` : '—' },
                        { label: 'Loss',         key: 'loss',       fmt: v => v ? v.toFixed(4) : '—' },
                        { label: 'Created',      key: 'created_at', fmt: v => new Date(v).toLocaleDateString() },
                      ].map((row, ri) => (
                        <tr key={row.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ ...S.td, fontWeight: 700, color: '#64748B', fontSize: '0.8rem' }}>{row.label}</td>
                          {selected.map(exp => {
                            const val = row.fmt(exp[row.key]);
                            const color = colorFor(exp.model_type);
                            const isBest = row.key === 'accuracy' && exp.accuracy === Math.max(...selected.filter(e => e.accuracy).map(e => e.accuracy));
                            return (
                              <td key={exp.id} style={{ ...S.td, fontWeight: isBest ? 800 : 500, color: isBest ? color : 'var(--text-primary)', fontSize: '0.875rem' }}>
                                {isBest ? '🏆 ' : ''}{val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
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
  selectPanel: { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', padding: '1.25rem', height: 'fit-content' },
  panelTitle: { margin: '0 0 1rem', fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.875rem' },
  th: { padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-primary)' },
  td: { padding: '0.875rem 1.25rem', verticalAlign: 'middle' },
};

export default ModelComparison;