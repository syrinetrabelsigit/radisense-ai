import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/researcher/Datasets.css';

const API = 'http://localhost:8000';

const DISEASE_SUGGESTIONS = [
  'Pneumonia', 'COVID-19', 'Tuberculosis', 'Atelectasis', 'Cardiomegaly',
  'Effusion', 'Infiltration', 'Mass', 'Nodule', 'Pneumothorax',
  'Consolidation', 'Edema', 'Emphysema', 'Fibrosis', 'Normal',
];

const Datasets = () => {
  const { t } = useTranslation();
  const initialized = useRef(false);

  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [datasets, setDatasets]                 = useState([]);
  const [selectedDataset, setSelectedDataset]   = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal]         = useState(false);
  const [submitting, setSubmitting]             = useState(false);
  const [deleteLoading, setDeleteLoading]       = useState(null);
  const [tagInput, setTagInput]                 = useState('');

  const [form, setForm] = useState({
    name: '', description: '', type: 'training', size: '',
    source: '', format: 'PNG', resolution: '', license: 'CC0 1.0', diseases: [],
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API}/api/researcher/datasets`, { headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch datasets');
      setDatasets(await r.json());
      setError(null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const descParts = [];
      if (form.description.trim()) descParts.push(form.description.trim());
      if (form.source)     descParts.push(`Source: ${form.source}`);
      if (form.format)     descParts.push(`Format: ${form.format}`);
      if (form.resolution) descParts.push(`Resolution: ${form.resolution}`);
      if (form.license)    descParts.push(`License: ${form.license}`);
      if (form.diseases.length > 0) descParts.push(`Classes: ${form.diseases.join(', ')}`);

      const r = await fetch(`${API}/api/researcher/datasets`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          name: form.name.trim(),
          description: descParts.join(' | ') || null,
          type: form.type,
          size: form.size ? parseInt(form.size) : null,
        }),
      });
      if (!r.ok) throw new Error('Failed to create dataset');
      const created = await r.json();
      setDatasets(prev => [created, ...prev]);
      setShowAddModal(false);
      resetForm();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', type: 'training', size: '', source: '', format: 'PNG', resolution: '', license: 'CC0 1.0', diseases: [] });
    setTagInput('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('researcher.datasets.deleteConfirm'))) return;
    setDeleteLoading(id);
    try {
      const r = await fetch(`${API}/api/researcher/datasets/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to delete');
      setDatasets(prev => prev.filter(d => d.id !== id));
      setShowDetailsModal(false);
    } catch (err) { alert('Error: ' + err.message); }
    finally { setDeleteLoading(null); }
  };

  const addDisease = (name) => {
    const n = name.trim();
    if (n && !form.diseases.includes(n)) setForm(f => ({ ...f, diseases: [...f.diseases, n] }));
    setTagInput('');
  };

  const removeDisease = (name) => setForm(f => ({ ...f, diseases: f.diseases.filter(d => d !== name) }));

  const parseDesc = (desc) => {
    if (!desc) return { main: '', meta: {} };
    const parts = desc.split(' | ');
    const meta = {};
    const mainParts = [];
    for (const p of parts) {
      if (p.startsWith('Source: '))     meta.source     = p.replace('Source: ', '');
      else if (p.startsWith('Format: '))     meta.format     = p.replace('Format: ', '');
      else if (p.startsWith('Resolution: ')) meta.resolution = p.replace('Resolution: ', '');
      else if (p.startsWith('License: '))    meta.license    = p.replace('License: ', '');
      else if (p.startsWith('Classes: '))    meta.diseases   = p.replace('Classes: ', '').split(', ');
      else mainParts.push(p);
    }
    return { main: mainParts.join(' '), meta };
  };

  const typeConfig = {
    training:   { color: '#0066CC', bg: 'rgba(0,102,204,0.12)',  border: 'rgba(0,102,204,0.3)',  label: t('researcher.datasets.training') },
    validation: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: 'Validation' },
    test:       { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: 'Test' },
  };

  const COLORS = ['#0066CC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#00BFA6'];
  const colorFor = (id) => COLORS[(id || 0) % COLORS.length];
  const totalImages = datasets.reduce((a, d) => a + (d.size || 0), 0);

  if (loading) return (
    <div className="ds-page">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', animation: 'dsSpin 0.8s linear infinite' }} />
        <p style={{ color: '#64748B' }}>{t('researcher.datasets.title')}…</p>
        <style>{`@keyframes dsSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div className="ds-page">
      <div className="container">

        {/* HEADER */}
        <div className="ds-header" data-aos="fade-down">
          <div>
            <div className="ds-badge"><div className="ds-badge-dot"/><span>{t('researcher.analyses.badge')}</span></div>
            <h1 className="ds-title"><span className="ds-title-grad">{t('researcher.datasets.title')}</span></h1>
            <p className="ds-subtitle">{t('researcher.datasets.subtitle')}</p>
          </div>
          <button className="ds-upload-btn" onClick={() => setShowAddModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t('researcher.datasets.register')}
          </button>
        </div>

        {/* STATS */}
        <div className="ds-overview" data-aos="fade-up">
          {[
            { val: datasets.length,                                                          label: t('nav.datasets'),                        color: '#0066CC',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
            { val: totalImages > 0 ? `${(totalImages / 1000).toFixed(0)}K` : '0',          label: t('researcher.datasets.totalImages'),      color: '#8B5CF6',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
            { val: datasets.filter(d => d.type === 'training').length,                       label: t('researcher.datasets.training'),         color: '#10B981',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
            { val: datasets.filter(d => d.type === 'validation' || d.type === 'test').length, label: t('researcher.datasets.valTest'),          color: '#F59E0B',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
          ].map((s, i) => (
            <div key={i} className="ds-stat-card" style={{ '--dsc': s.color }}>
              <div className="ds-stat-glow" style={{ background: s.color }}/>
              <div className="ds-stat-icon" style={{ background: s.color, boxShadow: `0 8px 24px color-mix(in srgb, ${s.color} 40%, transparent)` }}>{s.icon}</div>
              <div>
                <span className="ds-stat-val">{s.val}</span>
                <span className="ds-stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ padding: '1rem', color: '#EF4444', background: 'rgba(239,68,68,0.08)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error} <button onClick={fetchDatasets} style={{ marginLeft: '1rem', color: '#0066CC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
          </div>
        )}

        {/* EMPTY */}
        {datasets.length === 0 && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '24px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>{t('researcher.datasets.noDatasets')}</p>
            <p style={{ color: '#64748B', margin: 0 }}>{t('researcher.datasets.noDatasetsSub')}</p>
            <button className="ds-upload-btn" onClick={() => setShowAddModal(true)}>{t('researcher.datasets.register')}</button>
          </div>
        )}

        {/* GRID */}
        {datasets.length > 0 && (
          <div className="ds-grid">
            {datasets.map((d, i) => {
              const tc = typeConfig[d.type] || typeConfig.training;
              const color = colorFor(d.id);
              const { main, meta } = parseDesc(d.description);
              return (
                <div key={d.id} className="ds-card" data-aos="fade-up" data-aos-delay={i * 60} style={{ '--dcc': color }}>
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 60%, #00BFA6))`, borderRadius: '4px 4px 0 0' }} />
                  <div className="ds-card-body" style={{ paddingTop: '1.25rem' }}>
                    <div className="ds-card-header">
                      <div className="ds-card-name-row">
                        <div className="ds-card-dot" style={{ background: color }}/>
                        <h3 className="ds-card-name">{d.name}</h3>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, color: tc.color, background: tc.bg, border: `1px solid ${tc.border}` }}>
                        {tc.label}
                      </span>
                    </div>

                    {main && <p className="ds-card-desc">{main}</p>}

                    {(meta.source || meta.format || meta.license) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                        {meta.source  && <span style={S.metaTag}><b style={{ color }}>Source</b> {meta.source}</span>}
                        {meta.format  && <span style={S.metaTag}><b style={{ color }}>Format</b> {meta.format}</span>}
                        {meta.license && <span style={S.metaTag}><b style={{ color }}>License</b> {meta.license}</span>}
                        {meta.resolution && <span style={S.metaTag}><b style={{ color }}>Res.</b> {meta.resolution}</span>}
                      </div>
                    )}

                    {meta.diseases?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                        {meta.diseases.slice(0, 5).map((dis, di) => (
                          <span key={di} style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`, fontSize: '0.72rem', fontWeight: 600, color }}>
                            {dis}
                          </span>
                        ))}
                        {meta.diseases.length > 5 && (
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', fontSize: '0.72rem', color: '#64748B' }}>
                            +{meta.diseases.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="ds-mini-stats">
                      {[
                        { val: d.size ? d.size.toLocaleString() : '—', label: t('researcher.datasets.totalImages'),
                          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
                        { val: d.type, label: t('researcher.datasets.modal.type'),
                          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></svg> },
                        { val: d.is_active ? 'Active' : 'Inactive', label: 'Status',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg> },
                        { val: new Date(d.created_at).toLocaleDateString(), label: 'Added',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                      ].map((s, si) => (
                        <div key={si} className="ds-mini-stat">
                          <div className="ds-mini-icon" style={{ color }}>{s.icon}</div>
                          <span className="ds-mini-val">{s.val}</span>
                          <span className="ds-mini-label">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="ds-card-actions">
                      <button className="ds-details-btn" style={{ '--dab': color, flex: 1 }}
                        onClick={() => { setSelectedDataset({ ...d, parsedDesc: parseDesc(d.description) }); setShowDetailsModal(true); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {t('researcher.datasets.details')}
                      </button>
                      <button
                        style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 600 }}
                        onClick={() => handleDelete(d.id)} disabled={deleteLoading === d.id}
                      >
                        {deleteLoading === d.id ? '…' : (
                          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg> {t('researcher.datasets.delete')}</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DETAILS MODAL */}
        {showDetailsModal && selectedDataset && (() => {
          const color = colorFor(selectedDataset.id);
          const tc = typeConfig[selectedDataset.type] || typeConfig.training;
          const { main, meta } = selectedDataset.parsedDesc || parseDesc(selectedDataset.description);
          return (
            <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
              <div className="ds-modal" onClick={e => e.stopPropagation()}>
                <div style={{ height: 6, background: `linear-gradient(90deg, ${color}, #00BFA6)`, borderRadius: '12px 12px 0 0' }} />
                <div className="ds-modal-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '14px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                      </div>
                      <div>
                        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.25rem' }}>{selectedDataset.name}</h2>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.2rem 0.625rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, color: tc.color, background: tc.bg, border: `1px solid ${tc.border}` }}>{tc.label}</span>
                      </div>
                    </div>
                    <button className="ds-modal-close" onClick={() => setShowDetailsModal(false)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>

                  {main && (
                    <div className="ds-modal-section">
                      <div className="ds-modal-section-label" style={{ color }}>{t('researcher.datasets.modal.description')}</div>
                      <p className="ds-modal-text">{main}</p>
                    </div>
                  )}

                  <div className="ds-modal-section">
                    <div className="ds-modal-section-label" style={{ color }}>{t('researcher.datasets.title')}</div>
                    <div className="ds-modal-info-grid">
                      {[
                        [t('researcher.datasets.modal.type'),       selectedDataset.type],
                        [t('researcher.datasets.totalImages'),      selectedDataset.size ? selectedDataset.size.toLocaleString() : '—'],
                        ['Status',                                   selectedDataset.is_active ? 'Active' : 'Inactive'],
                        [t('researcher.datasets.modal.source'),     meta.source || '—'],
                        [t('researcher.datasets.modal.format'),     meta.format || '—'],
                        [t('researcher.datasets.modal.resolution'), meta.resolution || '—'],
                        [t('researcher.datasets.modal.license'),    meta.license || '—'],
                        ['Added',                                    new Date(selectedDataset.created_at).toLocaleString()],
                      ].map(([k, v], i) => (
                        <div key={i} className="ds-modal-info-item">
                          <span className="ds-modal-info-key">{k}</span>
                          <span className="ds-modal-info-val">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {meta.diseases?.length > 0 && (
                    <div className="ds-modal-section">
                      <div className="ds-modal-section-label" style={{ color }}>{t('researcher.datasets.modal.diseases')} ({meta.diseases.length})</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.625rem' }}>
                        {meta.diseases.map((dis, i) => (
                          <span key={i} style={{ padding: '0.3rem 0.75rem', borderRadius: '8px', background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`, fontSize: '0.78rem', fontWeight: 600, color }}>
                            {dis}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ds-modal-footer">
                  <button className="ds-modal-cancel" onClick={() => setShowDetailsModal(false)}>{t('researcher.datasets.modal.cancel')}</button>
                  <button
                    style={{ padding: '0.875rem 1.5rem', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onClick={() => handleDelete(selectedDataset.id)} disabled={deleteLoading === selectedDataset.id}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    {deleteLoading === selectedDataset.id ? '…' : t('researcher.datasets.delete')}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ADD MODAL */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div style={{ ...S.modal, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
              <div style={{ height: 5, background: 'linear-gradient(90deg,#8B5CF6,#0066CC)', borderRadius: '22px 22px 0 0' }} />
              <div style={S.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                  </div>
                  <div>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>{t('researcher.datasets.modal.register')}</h2>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem' }}>{t('researcher.datasets.modal.subtitle')}</p>
                  </div>
                </div>
                <button style={S.closeBtn} onClick={() => { setShowAddModal(false); resetForm(); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div style={{ ...S.modalBody, maxHeight: '65vh', overflowY: 'auto' }}>
                <div>
                  <label style={S.label}>{t('researcher.datasets.modal.name')} *</label>
                  <input style={S.input} type="text" placeholder="e.g., ChestX-ray14"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>{t('researcher.datasets.modal.description')}</label>
                  <textarea style={{ ...S.input, resize: 'vertical', minHeight: 70, fontFamily: 'inherit' }} rows="3"
                    placeholder="Describe this dataset…"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={S.label}>{t('researcher.datasets.modal.type')} *</label>
                    <select style={S.select} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="training">{t('researcher.datasets.training')}</option>
                      <option value="validation">Validation</option>
                      <option value="test">Test</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>{t('researcher.datasets.modal.size')}</label>
                    <input style={S.input} type="number" placeholder="e.g., 112120"
                      value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={S.label}>{t('researcher.datasets.modal.source')}</label>
                    <input style={S.input} type="text" placeholder="e.g., NIH Clinical Center"
                      value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>{t('researcher.datasets.modal.format')}</label>
                    <select style={S.select} value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
                      {['PNG', 'JPEG', 'DICOM', 'TIFF', 'NIfTI'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                  <div>
                    <label style={S.label}>{t('researcher.datasets.modal.resolution')}</label>
                    <input style={S.input} type="text" placeholder="e.g., 1024×1024"
                      value={form.resolution} onChange={e => setForm(f => ({ ...f, resolution: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>{t('researcher.datasets.modal.license')}</label>
                    <select style={S.select} value={form.license} onChange={e => setForm(f => ({ ...f, license: e.target.value }))}>
                      {['CC0 1.0', 'CC BY 4.0', 'CC BY-NC-SA 4.0', 'MIT', 'Apache 2.0', 'PhysioNet', 'Proprietary'].map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={S.label}>{t('researcher.datasets.modal.diseases')}</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input style={{ ...S.input, flex: 1 }} type="text"
                      placeholder={t('researcher.datasets.modal.diseasePlaceholder')}
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDisease(tagInput); } }}
                    />
                    <button style={{ padding: '0 1rem', borderRadius: '8px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                      onClick={() => addDisease(tagInput)} type="button">{t('researcher.datasets.modal.add')}</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.625rem' }}>
                    {DISEASE_SUGGESTIONS.filter(d => !form.diseases.includes(d)).slice(0, 8).map(d => (
                      <button key={d} type="button"
                        style={{ padding: '0.2rem 0.625rem', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: '#64748B', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => addDisease(d)}>+ {d}</button>
                    ))}
                  </div>
                  {form.diseases.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {form.diseases.map(d => (
                        <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '8px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#A78BFA', fontSize: '0.78rem', fontWeight: 600 }}>
                          {d}
                          <button type="button" onClick={() => removeDisease(d)} style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: '1rem' }}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={S.modalFooter}>
                <button style={S.cancelBtn} onClick={() => { setShowAddModal(false); resetForm(); }}>{t('researcher.datasets.modal.cancel')}</button>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', borderRadius: '12px', background: 'linear-gradient(135deg,#8B5CF6,#0066CC)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', opacity: !form.name.trim() || submitting ? 0.6 : 1 }}
                  onClick={handleCreate} disabled={!form.name.trim() || submitting}
                >
                  {submitting ? t('researcher.datasets.modal.submitting') : (
                    <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t('researcher.datasets.modal.submit')}</>
                  )}
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
  metaTag:    { padding: '0.2rem 0.625rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' },
  modal:      { width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '22px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' },
  modalHeader:{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid var(--border-primary)' },
  closeBtn:   { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)', flexShrink: 0 },
  modalBody:  { padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  modalFooter:{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-primary)' },
  label:      { display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input:      { width: '100%', padding: '0.625rem 0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' },
  select:     { width: '100%', padding: '0.625rem 0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' },
  cancelBtn:  { padding: '0.7rem 1.25rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' },
};

export default Datasets;