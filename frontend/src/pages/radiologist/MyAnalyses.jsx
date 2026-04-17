import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';

const API = 'http://localhost:8000';

const MyAnalyses = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const initialized = useRef(false);

  const [loading, setLoading]           = useState(true);
  const [ready, setReady]               = useState(false);
  const [analyses, setAnalyses]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [stats, setStats]               = useState({ total: 0, completed: 0, failed: 0, pending: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [page, setPage]                 = useState(0);
  const LIMIT = 20;

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' });
  }, []);

  useEffect(() => { fetchAll(); }, [filterStatus, page]);

  const fetchAll = async () => {
    setLoading(true);
    setReady(false);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch(`${API}/api/predict/?skip=0&limit=1000`, { headers: getHeaders() }),
        fetch(`${API}/api/predict/?skip=${page * LIMIT}&limit=${LIMIT}${filterStatus ? `&status=${filterStatus}` : ''}`, { headers: getHeaders() }),
      ]);
      if (statsRes.ok) {
        const d = await statsRes.json();
        const all = d.analyses || [];
        setStats({
          total:     d.total || 0,
          completed: all.filter(a => a.status === 'completed').length,
          failed:    all.filter(a => a.status === 'failed').length,
          pending:   all.filter(a => a.status === 'pending').length,
        });
      }
      if (listRes.ok) {
        const d = await listRes.json();
        setAnalyses(d.analyses || []);
        setTotal(d.total || 0);
      }
    } catch {}
    setLoading(false);
    setReady(true);
  };

  const modelColors = {
    mobilenet:    '#0066CC',
    densenet:     '#8B5CF6',
    resnet:       '#F59E0B',
    efficientnet: '#10B981',
  };

  const statusCfg = {
    completed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: t('dashboard.status.completed') || 'Completed' },
    pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: t('dashboard.status.pending')   || 'Pending'   },
    failed:    { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  label: t('dashboard.status.failed')    || 'Failed'    },
  };

  const getTopPrediction = (analysis) => {
    if (!analysis.confidence_scores) return null;
    const entries = Object.entries(analysis.confidence_scores);
    if (!entries.length) return null;
    const top = entries.sort((a, b) => b[1] - a[1])[0];
    return { name: top[0], score: (top[1] * 100).toFixed(1) };
  };

  const filtered = analyses.filter(a => {
    if (!searchTerm) return true;
    const top = getTopPrediction(a);
    return (
      String(a.id).includes(searchTerm) ||
      (top && top.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.model_version || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const statCards = [
    { label: t('dashboard.stats.totalAnalyses') || 'Total Analyses', val: stats.total,     color: '#0066CC',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { label: t('dashboard.status.completed') || 'Completed',         val: stats.completed, color: '#10B981',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: t('dashboard.status.pending') || 'Pending',             val: stats.pending,   color: '#F59E0B',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: t('dashboard.status.failed') || 'Failed',               val: stats.failed,    color: '#EF4444',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  ];

  return (
    <div style={S.page}>
      <div className="container">

        {/* HEADER */}
        <div style={S.header} data-aos="fade-down">
          <div>
            <div style={S.badge}><div style={S.badgeDot} /><span>{t('dashboard.badge') || 'Radiologist Portal'}</span></div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('nav.myAnalyses') || 'My Analyses'}</span></h1>
            <p style={S.subtitle}>{t('nav.analyses') || 'Complete history of your AI-powered X-ray analyses'}</p>
          </div>
          <button style={S.newBtn} onClick={() => navigate('/upload')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t('dashboard.newAnalysis') || 'New Analysis'}
          </button>
        </div>

        {/* STATS */}
        <div style={S.statsGrid} data-aos="fade-up">
          {statCards.map((s, i) => (
            <div key={i} style={{ ...S.statCard, borderColor: s.color + '40' }}>
              <div style={{ ...S.statIcon, background: s.color, boxShadow: `0 8px 24px color-mix(in srgb, ${s.color} 40%, transparent)` }}>
                {s.icon}
              </div>
              <div>
                <p style={S.statLabel}>{s.label}</p>
                <h3 style={{ ...S.statVal, color: s.color }}>{s.val}</h3>
              </div>
              <div style={{ ...S.statGlow, background: s.color }} />
            </div>
          ))}
        </div>

        {/* FILTER BAR */}
        <div style={S.filterBar} data-aos="fade-up">
          <div style={S.searchWrap}>
            <svg style={S.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              style={S.searchInput}
              type="text"
              placeholder="Search by ID, model, pathology..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button style={S.searchClear} onClick={() => setSearchTerm('')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { val: '',          label: 'All' },
              { val: 'completed', label: t('dashboard.status.completed') || 'Completed' },
              { val: 'pending',   label: t('dashboard.status.pending')   || 'Pending'   },
              { val: 'failed',    label: t('dashboard.status.failed')    || 'Failed'    },
            ].map(f => (
              <button
                key={f.val}
                style={{ ...S.filterBtn, ...(filterStatus === f.val ? S.filterBtnActive : {}) }}
                onClick={() => { setFilterStatus(f.val); setPage(0); }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span style={{ color: '#64748B', fontSize: '0.82rem', fontWeight: 600, marginLeft: 'auto' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* LIST */}
        {!ready ? (
          <div style={S.loaderWrap}>
            <div style={S.spinner} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>No analyses found</p>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>Upload an X-ray to get started</p>
            <button style={S.newBtn} onClick={() => navigate('/upload')}>New Analysis</button>
          </div>
        ) : (
          <div style={S.list}>
            {filtered.map((a, i) => {
              const sc = statusCfg[a.status] || statusCfg.completed;
              const modelColor = modelColors[a.model_version] || '#64748B';
              const top = getTopPrediction(a);
              const predictions = a.predictions || [];

              return (
                <div
                  key={a.id}
                  style={S.card}
                  data-aos="fade-up"
                  data-aos-delay={i * 40}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = modelColor; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Left: ID + Model + Date */}
                  <div style={S.cardLeft}>
                    <div style={{ ...S.modelBadge, background: `color-mix(in srgb, ${modelColor} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${modelColor} 25%, transparent)`, color: modelColor }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      {a.model_version || 'unknown'}
                    </div>
                    <p style={S.analysisId}>#{a.id}</p>
                    <p style={S.analysisDate}>{a.created_at ? new Date(a.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                    <p style={{ ...S.analysisDate, fontSize: '0.72rem' }}>{a.created_at ? new Date(a.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>

                  {/* Middle: Predictions */}
                  <div style={S.cardMiddle}>
                    {predictions.length === 0 ? (
                      <span style={{ color: '#10B981', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        Normal — No pathologies detected
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {predictions.slice(0, 4).map((pred, pi) => (
                          <span key={pi} style={{ padding: '0.2rem 0.625rem', borderRadius: '100px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                            {pred}
                          </span>
                        ))}
                        {predictions.length > 4 && (
                          <span style={{ padding: '0.2rem 0.625rem', borderRadius: '100px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', color: '#64748B', fontSize: '0.75rem', fontWeight: 700 }}>
                            +{predictions.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    {top && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Top:</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{top.name}</span>
                        <span style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 800 }}>{top.score}%</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Speed + Status */}
                  <div style={S.cardRight}>
                    {a.processing_time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748B', fontSize: '0.78rem', marginBottom: '0.375rem' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        {a.processing_time.toFixed(2)}s
                      </div>
                    )}
                    <div style={{ ...S.statusPill, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                      {sc.label}
                    </div>
                  </div>

                  {/* View button */}
                  <button style={S.viewBtn} onClick={() => navigate(`/results/${a.id}`)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    View
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION */}
        {total > LIMIT && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '2rem' }} data-aos="fade-up">
            <button style={{ ...S.pageBtn, opacity: page === 0 ? 0.4 : 1 }} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              Prev
            </button>
            <span style={{ display: 'flex', alignItems: 'center', color: '#64748B', fontSize: '0.875rem', fontWeight: 600 }}>
              {page + 1} / {Math.ceil(total / LIMIT)}
            </span>
            <button style={{ ...S.pageBtn, opacity: (page + 1) * LIMIT >= total ? 0.4 : 1 }} onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total}>
              Next
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const S = {
  page:       { minHeight: 'calc(100vh - 80px)', padding: '3rem 0 5rem' },
  header:     { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', gap: '2rem' },
  badge:      { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)', borderRadius: '100px', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot:   { width: 7, height: 7, borderRadius: '50%', background: '#00BFA6' },
  title:      { margin: 0, fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad:  { background: 'linear-gradient(135deg,#0066CC,#00BFA6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle:   { color: '#64748B', fontSize: '1rem', margin: 0 },
  newBtn:     { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,102,204,0.3)', whiteSpace: 'nowrap', flexShrink: 0 },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard:   { position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: 'var(--bg-card)', border: '1px solid', borderRadius: '20px', transition: 'all 0.25s' },
  statIcon:   { width: 48, height: 48, borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel:  { margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' },
  statVal:    { margin: 0, fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 },
  statGlow:   { position: 'absolute', bottom: -16, right: -16, width: 60, height: 60, borderRadius: '50%', opacity: 0.08, filter: 'blur(14px)' },
  filterBar:  { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '14px', marginBottom: '1.25rem', flexWrap: 'wrap' },
  searchWrap: { position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 200 },
  searchIcon: { position: 'absolute', left: '0.875rem', color: '#64748B', pointerEvents: 'none', flexShrink: 0 },
  searchInput:{ width: '100%', padding: '0.6rem 2.5rem 0.6rem 2.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' },
  searchClear:{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 },
  filterBtn:  { padding: '0.375rem 0.875rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' },
  filterBtnActive: { background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: '1px solid transparent', color: 'white' },
  loaderWrap: { display: 'flex', justifyContent: 'center', padding: '4rem', alignItems: 'center' },
  spinner:    { width: 44, height: 44, borderRadius: '50%', border: '4px solid rgba(0,102,204,0.2)', borderTopColor: '#0066CC', animation: 'spin 0.8s linear infinite' },
  empty:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '20px', textAlign: 'center' },
  emptyIcon:  { width: 80, height: 80, borderRadius: '20px', background: 'rgba(0,102,204,0.08)', border: '1px solid rgba(0,102,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  list:       { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card:       { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem 1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', transition: 'all 0.2s', flexWrap: 'wrap' },
  cardLeft:   { display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 130, flexShrink: 0 },
  cardMiddle: { flex: 1, minWidth: 200 },
  cardRight:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem', flexShrink: 0 },
  modelBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize', width: 'fit-content' },
  analysisId: { margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)' },
  analysisDate:{ margin: 0, fontSize: '0.78rem', color: '#64748B' },
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' },
  viewBtn:    { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)', color: '#0066CC', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' },
  pageBtn:    { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.25rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
};

export default MyAnalyses;