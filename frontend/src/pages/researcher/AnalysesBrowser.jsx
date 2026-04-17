import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';

const API = 'http://localhost:8000';

const AnalysesBrowser = () => {
  const { t } = useTranslation();
  const initialized = useRef(false);

  const [loading, setLoading]               = useState(true);
  const [analyses, setAnalyses]             = useState([]);
  const [total, setTotal]                   = useState(0);
  const [planLimit, setPlanLimit]           = useState(null);
  const [userPlan, setUserPlan]             = useState('free');
  const [pathologyStats, setPathologyStats] = useState([]);
  const [modelStats, setModelStats]         = useState([]);
  const [selected, setSelected]             = useState(null);
  const [filterModel, setFilterModel]       = useState('');
  const [filterPathology, setFilterPathology] = useState('');
  const [page, setPage]                     = useState(0);
  const LIMIT = 20;

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' });
    fetchStats();
  }, []);

  useEffect(() => { fetchAnalyses(); }, [filterModel, filterPathology, page]);

  const fetchStats = async () => {
    try {
      const [pathRes, modelRes] = await Promise.all([
        fetch(`${API}/api/researcher/analytics/pathologies`, { headers: getHeaders() }),
        fetch(`${API}/api/researcher/analytics/models`,      { headers: getHeaders() }),
      ]);
      if (pathRes.ok)  { const d = await pathRes.json();  setPathologyStats(d.distribution || []); }
      if (modelRes.ok) { const d = await modelRes.json(); setModelStats(d.models || []); }
    } catch {}
  };

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ skip: page * LIMIT, limit: LIMIT });
      if (filterModel)     params.append('model_version', filterModel);
      if (filterPathology) params.append('pathology', filterPathology);
      const r = await fetch(`${API}/api/researcher/analytics/analyses?${params}`, { headers: getHeaders() });
      if (r.ok) {
        const d = await r.json();
        setAnalyses(d.analyses || []);
        setTotal(d.total || 0);
        setPlanLimit(d.plan_limit ?? null);
        setUserPlan(d.plan || 'free');
      }
    } catch {}
    setLoading(false);
  };

  const COLORS = ['#0066CC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#00BFA6'];
  const MODEL_COLORS = { mobilenet: '#0066CC', densenet: '#8B5CF6', efficientnet: '#10B981', resnet: '#F59E0B' };
  const colorForModel = (m) => MODEL_COLORS[m] || '#64748B';
  const allPathologies = [...new Set(pathologyStats.map(p => p.name))];
  const allModels      = [...new Set(modelStats.map(m => m.model))];

  return (
    <div style={S.page}>
      <div className="container">

        {/* HEADER */}
        <div style={S.header} data-aos="fade-down">
          <div>
            <div style={S.badge}><div style={S.badgeDot} /><span>{t('researcher.analyses.badge')}</span></div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('researcher.analyses.title')}</span></h1>
            <p style={S.subtitle}>{t('researcher.analyses.subtitle')}</p>
          </div>

          {/* ✅ PLAN LIMIT BADGE */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            background: userPlan === 'researcher_enterprise'
              ? 'rgba(139,92,246,0.08)'
              : userPlan === 'researcher_pro'
              ? 'rgba(0,102,204,0.08)'
              : 'rgba(245,158,11,0.08)',
            border: `1px solid ${
              userPlan === 'researcher_enterprise'
              ? 'rgba(139,92,246,0.25)'
              : userPlan === 'researcher_pro'
              ? 'rgba(0,102,204,0.25)'
              : 'rgba(245,158,11,0.25)'
            }`,
            borderRadius: '14px',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '10px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              background: userPlan === 'researcher_enterprise' ? '#8B5CF6'
                : userPlan === 'researcher_pro' ? '#0066CC' : '#F59E0B',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Plan
              </p>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {userPlan === 'researcher_enterprise' ? '♾ Unlimited analyses'
                  : userPlan === 'researcher_pro' ? '100 most recent analyses'
                  : '5 oldest analyses (read-only)'}
              </p>
            </div>
            {userPlan !== 'researcher_enterprise' && (
              <a href="/pricing" style={{
                marginLeft: '0.5rem', padding: '0.4rem 0.875rem', borderRadius: '8px',
                background: 'linear-gradient(135deg,#0066CC,#00BFA6)',
                color: 'white', fontWeight: 700, fontSize: '0.75rem',
                textDecoration: 'none', whiteSpace: 'nowrap'
              }}>
                Upgrade ↗
              </a>
            )}
          </div>
        </div>

        {/* TOP STATS */}
        <div style={S.statsRow} data-aos="fade-up">
          {[
            { label: t('researcher.analyses.stats.total'),         val: total,                color: '#0066CC',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
            { label: t('researcher.analyses.stats.pathologies'),   val: pathologyStats.length, color: '#8B5CF6',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
            { label: t('researcher.analyses.stats.models'),        val: modelStats.length,     color: '#10B981',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
            { label: t('researcher.analyses.stats.avgProcessing'),
              val: modelStats.length > 0 ? `${(modelStats.reduce((a, m) => a + m.avg_processing_time, 0) / modelStats.length).toFixed(2)}s` : '—',
              color: '#F59E0B',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          ].map((s, i) => (
            <div key={i} style={{ ...S.statCard, borderColor: s.color + '40' }}>
              <div style={{ ...S.statIcon, background: s.color }}>{s.icon}</div>
              <div>
                <p style={S.statLabel}>{s.label}</p>
                <p style={{ ...S.statVal, color: s.color }}>{s.val}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>

          {/* SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} data-aos="fade-right">

            {/* FILTERS */}
            <div style={S.card}>
              <h3 style={S.cardTitle}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                {t('researcher.analyses.filters.title')}
              </h3>

              {/* Model filter */}
              <div style={{ marginTop: '1rem' }}>
                <p style={S.filterLabel}>{t('researcher.analyses.filters.model')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <button
                    style={{ ...S.filterChip, ...(filterModel === '' ? S.filterChipActive('#0066CC') : {}) }}
                    onClick={() => { setFilterModel(''); setPage(0); }}
                  >
                    {t('researcher.analyses.filters.allModels')}
                  </button>
                  {allModels.map(m => (
                    <button key={m}
                      style={{ ...S.filterChip, ...(filterModel === m ? S.filterChipActive(colorForModel(m)) : {}), textTransform: 'capitalize' }}
                      onClick={() => { setFilterModel(m); setPage(0); }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: colorForModel(m), flexShrink: 0 }} />
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pathology filter */}
              <div style={{ marginTop: '1.25rem' }}>
                <p style={S.filterLabel}>{t('researcher.analyses.filters.pathology')}</p>
                <select style={S.select} value={filterPathology} onChange={e => { setFilterPathology(e.target.value); setPage(0); }}>
                  <option value="">{t('researcher.analyses.filters.allPathologies')}</option>
                  {allPathologies.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {(filterModel || filterPathology) && (
                <button
                  style={{ marginTop: '1rem', width: '100%', padding: '0.625rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                  onClick={() => { setFilterModel(''); setFilterPathology(''); setPage(0); }}
                >
                  {t('researcher.analyses.filters.clearFilters')}
                </button>
              )}
            </div>

            {/* PATHOLOGY DISTRIBUTION */}
            {pathologyStats.length > 0 && (
              <div style={S.card}>
                <h3 style={S.cardTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  {t('researcher.analyses.distribution')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.875rem' }}>
                  {pathologyStats.slice(0, 8).map((p, i) => (
                    <button key={i}
                      style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.25rem 0' }}
                      onClick={() => { setFilterPathology(p.name); setPage(0); }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: filterPathology === p.name ? COLORS[i % COLORS.length] : 'var(--text-primary)' }}>{p.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{p.count} ({p.percentage}%)</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p.percentage}%`, background: COLORS[i % COLORS.length], borderRadius: '3px' }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* MODEL STATS */}
            {modelStats.length > 0 && (
              <div style={S.card}>
                <h3 style={S.cardTitle}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  {t('researcher.analyses.modelPerformance')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.875rem' }}>
                  {modelStats.map((m, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: `1px solid color-mix(in srgb, ${colorForModel(m.model)} 20%, transparent)` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: colorForModel(m.model), textTransform: 'capitalize' }}>{m.model}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{m.total_analyses}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Success: <b style={{ color: '#10B981' }}>{m.success_rate}%</b></span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Avg: <b style={{ color: 'var(--text-primary)' }}>{m.avg_processing_time}s</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ANALYSES LIST */}
          <div data-aos="fade-left">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div style={S.spinner} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : analyses.length === 0 ? (
              <div style={{ ...S.card, textAlign: 'center', padding: '4rem 2rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', display: 'block' }}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>{t('researcher.analyses.noData')}</p>
                <p style={{ color: '#64748B', margin: '0.5rem 0 0', fontSize: '0.875rem' }}>{t('researcher.analyses.noDataSub')}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.875rem' }}>
                    {t('researcher.analyses.showing')} <b style={{ color: 'var(--text-primary)' }}>{analyses.length}</b> {t('researcher.analyses.of')} <b style={{ color: 'var(--text-primary)' }}>{total}</b>
                    {filterModel && <> · <b style={{ color: colorForModel(filterModel), textTransform: 'capitalize' }}>{filterModel}</b></>}
                    {filterPathology && <> · <b style={{ color: '#8B5CF6' }}>{filterPathology}</b></>}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {analyses.map((a, i) => {
                    const color = colorForModel(a.model_version);
                    return (
                      <div key={a.id}
                        style={{ ...S.card, cursor: 'pointer', transition: 'all 0.2s', padding: '1.25rem 1.5rem' }}
                        onClick={() => setSelected(a)}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateX(4px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.transform = 'none'; }}
                        data-aos="fade-up" data-aos-delay={i * 30}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 140 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '10px', background: `color-mix(in srgb, ${color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                            </div>
                            <div>
                              <p style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{t('researcher.analyses.modal.id')}{a.id}</p>
                              <span style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', background: `color-mix(in srgb, ${color} 12%, transparent)`, color, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                                {a.model_version}
                              </span>
                            </div>
                          </div>

                          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                            {a.predictions.length === 0
                              ? <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{t('researcher.analyses.modal.noFindings')}</span>
                              : a.predictions.map((pred, pi) => (
                                <span key={pi} style={{ padding: '0.2rem 0.625rem', borderRadius: '100px', background: `color-mix(in srgb, ${COLORS[pi % COLORS.length]} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${COLORS[pi % COLORS.length]} 25%, transparent)`, color: COLORS[pi % COLORS.length], fontSize: '0.75rem', fontWeight: 600 }}>
                                  {pred}
                                </span>
                              ))
                            }
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{a.processing_time ? `${a.processing_time.toFixed(2)}s` : '—'}</span>
                            <span style={{ fontSize: '0.72rem', color: '#475569' }}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                              <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>{a.status}</span>
                            </div>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION */}
                {total > LIMIT && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button style={{ ...S.pageBtn, opacity: page === 0 ? 0.4 : 1 }} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                      {t('researcher.analyses.prev')}
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                      {page + 1} / {Math.ceil(total / LIMIT)}
                    </span>
                    <button style={{ ...S.pageBtn, opacity: (page + 1) * LIMIT >= total ? 0.4 : 1 }} onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total}>
                      {t('researcher.analyses.next')}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* DETAIL MODAL */}
        {selected && (
          <div style={S.overlay} onClick={() => setSelected(null)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={{ height: 5, background: `linear-gradient(90deg, ${colorForModel(selected.model_version)}, #00BFA6)`, borderRadius: '22px 22px 0 0' }} />
              <div style={S.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>{t('researcher.analyses.modal.id')}{selected.id}</h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.82rem' }}>{selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</p>
                </div>
                <button style={S.closeBtn} onClick={() => setSelected(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={S.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    [t('researcher.analyses.modal.model'),      selected.model_version],
                    [t('researcher.analyses.modal.status'),     selected.status],
                    [t('researcher.analyses.modal.processing'), selected.processing_time ? `${selected.processing_time.toFixed(3)}s` : '—'],
                    [t('researcher.analyses.modal.hasPatient'), selected.has_patient ? 'Yes' : 'No'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{v}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p style={{ margin: '0 0 0.625rem', fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t('researcher.analyses.modal.predictions')} ({selected.predictions.length})
                  </p>
                  {selected.predictions.length === 0
                    ? <p style={{ color: '#64748B', fontSize: '0.875rem', margin: 0 }}>{t('researcher.analyses.modal.noFindings')}</p>
                    : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {selected.predictions.map((pred, i) => (
                          <span key={i} style={{ padding: '0.4rem 0.875rem', borderRadius: '100px', background: `color-mix(in srgb, ${COLORS[i % COLORS.length]} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${COLORS[i % COLORS.length]} 30%, transparent)`, color: COLORS[i % COLORS.length], fontSize: '0.82rem', fontWeight: 700 }}>
                            {pred}
                          </span>
                        ))}
                      </div>
                    )
                  }
                </div>

                {selected.confidence_scores && Object.keys(selected.confidence_scores).length > 0 && (
                  <div>
                    <p style={{ margin: '0 0 0.625rem', fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {t('researcher.analyses.modal.confidence')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Object.entries(selected.confidence_scores).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, score], i) => {
                        const pct = Math.round(score * 100);
                        const color = COLORS[i % COLORS.length];
                        return (
                          <div key={name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 800, color }}>{pct}%</span>
                            </div>
                            <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {selected.image_path && (
                  <div>
                    <p style={{ margin: '0 0 0.625rem', fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      X-Ray Image
                    </p>
                    <img
                      src={`http://localhost:8000/${selected.image_path.startsWith('uploads') ? selected.image_path : 'uploads/' + selected.image_path}`}
                      alt="X-Ray"
                      style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-primary)', objectFit: 'contain', maxHeight: '300px', background: '#000' }}
                      onError={e => e.currentTarget.style.display = 'none'}
                    />
                  </div>
                )}

                {selected.heatmap_path && (
                  <div>
                    <p style={{ margin: '0 0 0.625rem', fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Grad-CAM Heatmap
                    </p>
                    <img
                      src={`http://localhost:8000/${selected.heatmap_path.startsWith('uploads') ? selected.heatmap_path : 'uploads/' + selected.heatmap_path}`}
                      alt="Heatmap"
                      style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-primary)', objectFit: 'contain', maxHeight: '300px', background: '#000' }}
                      onError={e => e.currentTarget.style.display = 'none'}
                    />
                  </div>
                )}
              </div>
              <div style={{ padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={S.cancelBtn} onClick={() => setSelected(null)}>{t('researcher.analyses.modal.close')}</button>
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
  page:      { minHeight: 'calc(100vh - 80px)', padding: '3rem 0 5rem' },
  header:    { marginBottom: '2rem' },
  badge:     { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)', borderRadius: '100px', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot:  { width: 7, height: 7, borderRadius: '50%', background: '#00BFA6' },
  title:     { margin: 0, fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad: { background: 'linear-gradient(135deg,#0066CC,#00BFA6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle:  { color: '#64748B', fontSize: '1rem', margin: 0 },
  statsRow:  { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard:  { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: 'var(--bg-card)', border: '1px solid', borderRadius: '18px' },
  statIcon:  { width: 48, height: 48, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' },
  statVal:   { margin: 0, fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 },
  card:      { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', padding: '1.25rem' },
  cardTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' },
  filterLabel: { margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' },
  filterChip: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' },
  filterChipActive: (color) => ({ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid ${color}`, color }),
  select:    { width: '100%', padding: '0.625rem 0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' },
  spinner:   { width: 44, height: 44, borderRadius: '50%', border: '4px solid rgba(0,102,204,0.2)', borderTopColor: '#0066CC', animation: 'spin 0.8s linear infinite' },
  pageBtn:   { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.25rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
  modal:     { width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '22px', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid var(--border-primary)' },
  closeBtn:  { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' },
  modalBody: { padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  cancelBtn: { padding: '0.7rem 1.5rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' },
};

export default AnalysesBrowser;