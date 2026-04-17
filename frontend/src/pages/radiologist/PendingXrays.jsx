import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000';

const PendingXrays = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading]   = useState(true);
  const [analyses, setAnalyses] = useState([]);
  const [total, setTotal]       = useState(0);
  const [selected, setSelected] = useState(null); // for preview modal

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/predict/pending-from-patients`, { headers: getHeaders() });
      if (r.ok) {
        const d = await r.json();
        setAnalyses(d.analyses || []);
        setTotal(d.total || 0);
      }
    } catch {}
    setLoading(false);
  };

  const handleAnalyze = (analysisId) => {
    // Redirige vers Upload avec l'ID de l'analyse pending
    navigate(`/upload?pending_id=${analysisId}`);
  };

  const getInitials = (p) => {
    if (!p) return '?';
    return `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`;
  };

  const getAge = (dob) => {
    if (!dob) return null;
    return new Date().getFullYear() - new Date(dob).getFullYear();
  };

  return (
    <div style={S.page}>
      <div className="container">

        {/* HEADER */}
        <div style={S.header}>
          <div>
            <div style={S.badge}>
              <div style={S.badgeDot} />
              <span>Radiologist Portal</span>
            </div>
            <h1 style={S.title}>
              <span style={S.titleGrad}>Pending X-Rays</span>
            </h1>
            <p style={S.subtitle}>X-rays submitted by patients waiting for your analysis</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button style={S.refreshBtn} onClick={fetchPending}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
              Refresh
            </button>
          </div>
        </div>

        {/* STATS BAR */}
        <div style={S.statsBar}>
          <div style={S.statItem}>
            <div style={{ ...S.statDot, background: '#F59E0B' }} />
            <span style={S.statLabel}>Pending</span>
            <span style={{ ...S.statVal, color: '#F59E0B' }}>{total}</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <div style={{ ...S.statDot, background: '#64748B' }} />
            <span style={S.statLabel}>Waiting review</span>
            <span style={{ ...S.statVal, color: '#64748B' }}>{total} X-ray{total !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* LIST */}
        {loading ? (
          <div style={S.loaderWrap}>
            <div style={S.spinner} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : analyses.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>All caught up!</h3>
            <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>No pending X-rays from patients right now.</p>
          </div>
        ) : (
          <div style={S.list}>
            {analyses.map((a, i) => (
              <div key={a.id} style={S.card}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#F59E0B'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
              >
                {/* X-Ray thumbnail */}
                <div style={S.thumb} onClick={() => setSelected(a)}>
                  <img
                    src={`${API}/${a.image_path?.replace(/\\/g, '/')}`}
                    alt="X-Ray"
                    style={S.thumbImg}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div style={S.thumbOverlay}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <div style={S.pendingBadge}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 2s infinite' }} />
                    Pending
                  </div>
                </div>

                {/* Info */}
                <div style={S.info}>
                  {/* Patient */}
                  <div style={S.patientRow}>
                    <div style={S.patientAvatar}>
                      {getInitials(a.patient)}
                    </div>
                    <div>
                      <div style={S.patientName}>
                        {a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : 'Unknown Patient'}
                      </div>
                      <div style={S.patientMeta}>
                        {a.patient?.patient_id && <span>{a.patient.patient_id}</span>}
                        {a.patient?.date_of_birth && <span>· {getAge(a.patient.date_of_birth)} years</span>}
                      </div>
                    </div>
                  </div>

                  {/* Date + notes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <div style={S.metaRow}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <span>Submitted {new Date(a.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span style={{ color: '#475569' }}>at {new Date(a.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {a.notes && (
                      <div style={S.notes}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span>{a.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={S.actions}>
                  <button style={S.analyzeBtn} onClick={() => handleAnalyze(a.id)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    Analyze
                  </button>
                  <button style={S.previewBtn} onClick={() => setSelected(a)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PREVIEW MODAL */}
        {selected && (
          <div style={S.overlay} onClick={() => setSelected(null)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={S.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
                    X-Ray Preview
                  </h3>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem' }}>
                    {selected.patient ? `${selected.patient.first_name} ${selected.patient.last_name}` : 'Unknown Patient'}
                    {' · '}
                    {new Date(selected.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button style={S.closeBtn} onClick={() => setSelected(null)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', margin: '1rem 0' }}>
                <img
                  src={`${API}/${selected.image_path?.replace(/\\/g, '/')}`}
                  alt="X-Ray"
                  style={{ width: '100%', maxHeight: 500, objectFit: 'contain', display: 'block', borderRadius: '8px' }}
                />
              </div>

              {selected.notes && (
                <div style={{ padding: '1rem', background: 'rgba(0,102,204,0.06)', border: '1px solid rgba(0,102,204,0.15)', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Patient Notes:</strong> {selected.notes}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button style={{ ...S.analyzeBtn, flex: 1, justifyContent: 'center' }} onClick={() => { setSelected(null); handleAnalyze(selected.id); }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  Analyze This X-Ray
                </button>
                <button style={{ ...S.previewBtn, padding: '0.75rem 1.25rem' }} onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const S = {
  page:      { minHeight: 'calc(100vh - 80px)', padding: '3rem 0 5rem' },
  header:    { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', gap: '2rem' },
  badge:     { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '100px', color: '#F59E0B', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot:  { width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 2s infinite' },
  title:     { margin: 0, fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad: { background: 'linear-gradient(135deg,#F59E0B,#EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle:  { color: '#64748B', fontSize: '1rem', margin: 0 },
  refreshBtn:{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.25rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },

  statsBar:    { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '14px', marginBottom: '1.5rem' },
  statItem:    { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  statDot:     { width: 8, height: 8, borderRadius: '50%' },
  statLabel:   { fontSize: '0.82rem', color: '#64748B', fontWeight: 600 },
  statVal:     { fontSize: '0.9rem', fontWeight: 800 },
  statDivider: { width: 1, height: 20, background: 'var(--border-primary)' },

  loaderWrap: { display: 'flex', justifyContent: 'center', padding: '4rem' },
  spinner:    { width: 44, height: 44, borderRadius: '50%', border: '4px solid rgba(245,158,11,0.2)', borderTopColor: '#F59E0B', animation: 'spin 0.8s linear infinite' },

  empty:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '20px', textAlign: 'center' },
  emptyIcon:{ width: 80, height: 80, borderRadius: '20px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem 1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', transition: 'border-color 0.2s', flexWrap: 'wrap' },

  thumb:        { width: 80, height: 80, minWidth: 80, borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative', cursor: 'pointer', flexShrink: 0 },
  thumbImg:     { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  thumbOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' },
  pendingBadge: { position: 'absolute', bottom: 4, left: 4, right: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '2px 6px', background: 'rgba(245,158,11,0.9)', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700, color: 'white' },

  info:        { flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  patientRow:  { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  patientAvatar:{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', color: 'white', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  patientName: { fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' },
  patientMeta: { fontSize: '0.75rem', color: '#64748B', display: 'flex', gap: '0.25rem' },
  metaRow:     { display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', color: '#64748B' },
  notes:       { display: 'flex', alignItems: 'flex-start', gap: '0.375rem', fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5 },

  actions:     { display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 },
  analyzeBtn:  { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.25rem', borderRadius: '10px', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  previewBtn:  { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.25rem', borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' },

  overlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:    { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '24px', padding: '1.5rem', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  closeBtn: { width: 36, height: 36, borderRadius: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};

export default PendingXrays;