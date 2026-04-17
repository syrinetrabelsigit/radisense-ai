import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';

const API = 'http://localhost:8000';

const Models = () => {
  const { t } = useTranslation();
  const initialized = useRef(false);
  const [loading, setLoading]   = useState(true);
  const [models, setModels]     = useState([]);
  const [selected, setSelected] = useState(null);

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
      .then(data => setModels(data))
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, []);

  const MODEL_COLORS = {
    'DenseNet-121': '#0066CC', 'ResNet-50': '#EF4444',
    'EfficientNet-B4': '#8B5CF6', 'VGG-16': '#F59E0B',
    'MobileNet-V2': '#10B981', 'Multiple': '#00BFA6',
  };
  const colorFor = (model) => MODEL_COLORS[model] || '#8B5CF6';

  const statusCfg = {
    pending:   { color: '#F59E0B', label: 'Pending' },
    running:   { color: '#00BFA6', label: 'Running' },
    completed: { color: '#10B981', label: 'Completed' },
    failed:    { color: '#EF4444', label: 'Failed' },
  };

  if (loading) return (
    <div style={S.page}>
      <div style={S.loaderWrap}>
        <div style={S.spinner} />
        <p style={{ color: '#64748B' }}>Loading models…</p>
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
            <div style={S.badge}><div style={S.badgeDot} /><span>Model Registry</span></div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('researcher.models.title') || 'Models'}</span></h1>
            <p style={S.subtitle}>{t('researcher.models.subtitle') || 'Your trained models from experiments'}</p>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={S.statsRow} data-aos="fade-up">
          {[
            { label: 'Total', val: models.length, color: '#8B5CF6' },
            { label: 'Completed', val: models.filter(m => m.status === 'completed').length, color: '#10B981' },
            { label: 'Running', val: models.filter(m => m.status === 'running').length, color: '#00BFA6' },
            { label: 'Best Accuracy', val: models.filter(m => m.accuracy).length > 0 ? `${(Math.max(...models.filter(m => m.accuracy).map(m => m.accuracy)) * 100).toFixed(1)}%` : '—', color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} style={{ ...S.statCard, borderColor: s.color + '40' }}>
              <p style={{ margin: 0, fontSize: '1.875rem', fontWeight: 900, color: s.color }}>{s.val}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* EMPTY */}
        {models.length === 0 && (
          <div style={S.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>No models yet</p>
            <p style={{ color: '#64748B', margin: 0, fontSize: '0.875rem' }}>Create experiments to generate models</p>
          </div>
        )}

        {/* TABLE */}
        {models.length > 0 && (
          <div style={S.tableWrap} data-aos="fade-up">
            <table style={S.table}>
              <thead>
                <tr style={S.thead}>
                  {['Model', 'Architecture', 'Status', 'Accuracy', 'Loss', 'Created', 'Actions'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {models.map((m, i) => {
                  const sc = statusCfg[m.status] || statusCfg.pending;
                  const color = colorFor(m.model_type);
                  return (
                    <tr key={m.id}
                      style={{ ...S.tr, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                    >
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '8px', background: `color-mix(in srgb, ${color} 12%, transparent)`, color, fontSize: '0.78rem', fontWeight: 700 }}>
                          {m.model_type}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '100px', background: `color-mix(in srgb, ${sc.color} 12%, transparent)`, fontSize: '0.75rem', fontWeight: 700, color: sc.color }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }} />
                          {sc.label}
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{ fontWeight: 700, color: m.accuracy ? '#10B981' : '#64748B' }}>
                          {m.accuracy ? `${(m.accuracy * 100).toFixed(2)}%` : '—'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
                          {m.loss ? m.loss.toFixed(4) : '—'}
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ color: '#64748B', fontSize: '0.8rem' }}>
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td style={S.td}>
                        <button style={S.detailBtn} onClick={() => setSelected(m)}>
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* DETAILS MODAL */}
        {selected && (
          <div style={S.overlay} onClick={() => setSelected(null)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={{ height: 5, background: `linear-gradient(90deg, ${colorFor(selected.model_type)}, #00BFA6)`, borderRadius: '22px 22px 0 0' }} />
              <div style={S.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>{selected.name}</h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.82rem' }}>{selected.model_type}</p>
                </div>
                <button style={S.closeBtn} onClick={() => setSelected(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={S.modalBody}>
                {selected.description && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{selected.description}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    ['Architecture', selected.model_type],
                    ['Status', selected.status],
                    ['Accuracy', selected.accuracy ? `${(selected.accuracy * 100).toFixed(2)}%` : '—'],
                    ['Loss', selected.loss ? selected.loss.toFixed(4) : '—'],
                    ['Created', new Date(selected.created_at).toLocaleString()],
                    ['Started', selected.started_at ? new Date(selected.started_at).toLocaleString() : '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{v}</p>
                    </div>
                  ))}
                </div>
                {selected.hyperparameters && (
                  <div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hyperparameters</p>
                    <pre style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0, fontFamily: 'monospace' }}>
                      {JSON.stringify(selected.hyperparameters, null, 2)}
                    </pre>
                  </div>
                )}
                {selected.metrics && (
                  <div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Metrics</p>
                    <pre style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '10px', padding: '0.875rem', fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0, fontFamily: 'monospace' }}>
                      {JSON.stringify(selected.metrics, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
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
  loaderWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner: { width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', animation: 'spin 0.8s linear infinite' },
  header: { marginBottom: '2rem' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '100px', color: '#A78BFA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot: { width: 7, height: 7, borderRadius: '50%', background: '#8B5CF6' },
  title: { margin: 0, fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad: { background: 'linear-gradient(135deg,#8B5CF6,#0066CC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { color: '#64748B', fontSize: '1rem', margin: 0 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: { display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1.25rem 1.5rem', background: 'var(--bg-card)', border: '1px solid', borderRadius: '16px' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '20px', textAlign: 'center' },
  tableWrap: { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: 'rgba(139,92,246,0.06)' },
  th: { padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-primary)' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' },
  td: { padding: '1rem 1.25rem', verticalAlign: 'middle' },
  detailBtn: { padding: '0.4rem 0.875rem', borderRadius: '7px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
  modal: { width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '22px', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid var(--border-primary)' },
  closeBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' },
  modalBody: { padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
};

export default Models;