import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/researcher/Experiments.css';

const API = 'http://localhost:8000';

const Experiments = () => {
  const { t } = useTranslation();
  const initialized = useRef(false);

  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [experiments, setExperiments]           = useState([]);
  const [datasets, setDatasets]                 = useState([]);
  const [showCreateModal, setShowCreateModal]   = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedExp, setSelectedExp]           = useState(null);
  const [submitting, setSubmitting]             = useState(false);
  const [deleteLoading, setDeleteLoading]       = useState(null);
  const [actionLoading, setActionLoading]       = useState(null);
  const [statusFilter, setStatusFilter]         = useState('');

  const [createForm, setCreateForm] = useState({
    name: '', description: '', model_type: 'DenseNet-121', dataset_id: '',
    learning_rate: '0.001', epochs: '50', batch_size: '32',
    optimizer: 'Adam', scheduler: 'StepLR', augmentation: true, early_stopping: true,
  });

  const [resultsForm, setResultsForm] = useState({
    accuracy: '', loss: '', precision: '', recall: '', f1: '', auc: '', new_status: '',
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [expRes, dsRes] = await Promise.all([
        fetch(`${API}/api/researcher/experiments`, { headers: getHeaders() }),
        fetch(`${API}/api/researcher/datasets`,    { headers: getHeaders() }),
      ]);
      if (expRes.ok) setExperiments(await expRes.json());
      if (dsRes.ok)  setDatasets(await dsRes.json());
      setError(null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/api/researcher/experiments`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
          model_type: createForm.model_type,
          dataset_id: createForm.dataset_id ? parseInt(createForm.dataset_id) : null,
          hyperparameters: {
            learning_rate: parseFloat(createForm.learning_rate) || 0.001,
            epochs: parseInt(createForm.epochs) || 50,
            batch_size: parseInt(createForm.batch_size) || 32,
            optimizer: createForm.optimizer,
            scheduler: createForm.scheduler,
            augmentation: createForm.augmentation,
            early_stopping: createForm.early_stopping,
          },
        }),
      });
      if (!r.ok) throw new Error('Failed to create');
      const created = await r.json();
      setExperiments(prev => [created, ...prev]);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', model_type: 'DenseNet-121', dataset_id: '', learning_rate: '0.001', epochs: '50', batch_size: '32', optimizer: 'Adam', scheduler: 'StepLR', augmentation: true, early_stopping: true });
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSubmitting(false); }
  };

  const handleAction = async (expId, action) => {
    setActionLoading(expId + action);
    const statusMap = { start: 'running', complete: 'completed', fail: 'failed' };
    try {
      const r = await fetch(`${API}/api/researcher/experiments/${expId}/${action}`, { method: 'PUT', headers: getHeaders() });
      if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Action failed'); }
      const newStatus = statusMap[action];
      setExperiments(prev => prev.map(e => e.id === expId ? { ...e, status: newStatus } : e));
      setSelectedExp(prev => prev?.id === expId ? { ...prev, status: newStatus } : prev);
    } catch (err) { alert('Error: ' + err.message); }
    finally { setActionLoading(null); }
  };

  const handleUpdateResults = async () => {
    if (!selectedExp) return;
    setSubmitting(true);
    try {
      const body = {};
      if (resultsForm.accuracy)   body.accuracy = parseFloat(resultsForm.accuracy) / 100;
      if (resultsForm.loss)       body.loss      = parseFloat(resultsForm.loss);
      if (resultsForm.new_status) body.status    = resultsForm.new_status;
      const metrics = {};
      if (resultsForm.precision) metrics.precision = parseFloat(resultsForm.precision) / 100;
      if (resultsForm.recall)    metrics.recall    = parseFloat(resultsForm.recall) / 100;
      if (resultsForm.f1)        metrics.f1        = parseFloat(resultsForm.f1) / 100;
      if (resultsForm.auc)       metrics.auc       = parseFloat(resultsForm.auc) / 100;
      if (Object.keys(metrics).length > 0) body.metrics = metrics;

      const r = await fetch(`${API}/api/researcher/experiments/${selectedExp.id}/results`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('Failed to update');
      const updated = await r.json();
      setExperiments(prev => prev.map(e => e.id === updated.id ? updated : e));
      setSelectedExp(updated);
      setShowResultsModal(false);
      setResultsForm({ accuracy: '', loss: '', precision: '', recall: '', f1: '', auc: '', new_status: '' });
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (expId) => {
    if (!window.confirm('Delete this experiment permanently?')) return;
    setDeleteLoading(expId);
    try {
      const r = await fetch(`${API}/api/researcher/experiments/${expId}`, { method: 'DELETE', headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to delete');
      setExperiments(prev => prev.filter(e => e.id !== expId));
      setShowDetailsModal(false);
    } catch (err) { alert('Error: ' + err.message); }
    finally { setDeleteLoading(null); }
  };

  const openResultsModal = (exp) => {
    setSelectedExp(exp);
    setResultsForm({
      accuracy:   exp.accuracy  ? (exp.accuracy * 100).toFixed(2)            : '',
      loss:       exp.loss      ? exp.loss                                    : '',
      precision:  exp.metrics?.precision ? (exp.metrics.precision * 100).toFixed(2) : '',
      recall:     exp.metrics?.recall    ? (exp.metrics.recall * 100).toFixed(2)    : '',
      f1:         exp.metrics?.f1        ? (exp.metrics.f1 * 100).toFixed(2)        : '',
      auc:        exp.metrics?.auc       ? (exp.metrics.auc * 100).toFixed(2)       : '',
      new_status: exp.status,
    });
    setShowResultsModal(true);
  };

  const statusCfg = {
    pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)',  label: t('researcher.experiments.status.pending')   },
    running:   { color: '#00BFA6', bg: 'rgba(0,191,166,0.12)',   border: 'rgba(0,191,166,0.25)',   label: t('researcher.experiments.status.running')   },
    completed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)',  label: t('researcher.experiments.status.completed') },
    failed:    { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)',   label: t('researcher.experiments.status.failed')    },
  };

  const MODEL_COLORS = {
    'DenseNet-121': '#0066CC', 'ResNet-50': '#EF4444',
    'EfficientNet-B4': '#8B5CF6', 'VGG-16': '#F59E0B', 'MobileNet-V2': '#10B981',
  };
  const colorFor = (model) => MODEL_COLORS[model] || '#8B5CF6';
  const displayed = statusFilter ? experiments.filter(e => e.status === statusFilter) : experiments;

  if (loading) return (
    <div className="ex-page">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', animation: 'exSpin 0.8s linear infinite' }} />
        <p style={{ color: '#64748B' }}>{t('researcher.experiments.title')}…</p>
        <style>{`@keyframes exSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div className="ex-page">
      <div className="container">

        {/* HEADER */}
        <div className="ex-header" data-aos="fade-down">
          <div>
            <div className="ex-badge"><div className="ex-badge-dot"/><span>ML Experiments</span></div>
            <h1 className="ex-title"><span className="ex-title-grad">{t('researcher.experiments.title')}</span></h1>
            <p className="ex-subtitle">{t('researcher.experiments.subtitle')}</p>
          </div>
          <div className="ex-header-right">
            <div className="ex-quick-stats">
              {[
                { val: experiments.length,                                       label: t('researcher.experiments.stats.total'),     color: 'var(--text-primary)' },
                { val: experiments.filter(e => e.status === 'running').length,   label: t('researcher.experiments.stats.running'),   color: '#00BFA6' },
                { val: experiments.filter(e => e.status === 'completed').length, label: t('researcher.experiments.stats.done'),      color: '#10B981' },
                { val: experiments.filter(e => e.status === 'failed').length,    label: t('researcher.experiments.stats.failed'),    color: '#EF4444' },
              ].map((s, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="ex-qs-div"/>}
                  <div className="ex-qs">
                    <span className="ex-qs-val" style={{ color: s.color }}>{s.val}</span>
                    <span className="ex-qs-label">{s.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <button className="ex-create-btn" onClick={() => setShowCreateModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {t('researcher.experiments.create')}
            </button>
          </div>
        </div>

        {/* STATUS FILTER TABS */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }} data-aos="fade-up">
          {[
            { val: '',          label: 'All',                                            count: experiments.length },
            { val: 'pending',   label: t('researcher.experiments.status.pending'),       count: experiments.filter(e => e.status === 'pending').length },
            { val: 'running',   label: t('researcher.experiments.status.running'),       count: experiments.filter(e => e.status === 'running').length },
            { val: 'completed', label: t('researcher.experiments.status.completed'),     count: experiments.filter(e => e.status === 'completed').length },
            { val: 'failed',    label: t('researcher.experiments.status.failed'),        count: experiments.filter(e => e.status === 'failed').length },
          ].map(tab => (
            <button key={tab.val}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.2s', background: statusFilter === tab.val ? 'linear-gradient(135deg,#8B5CF6,#0066CC)' : 'var(--bg-card)', border: statusFilter === tab.val ? '1px solid transparent' : '1px solid var(--border-primary)', color: statusFilter === tab.val ? 'white' : 'var(--text-secondary)', boxShadow: statusFilter === tab.val ? '0 6px 18px rgba(139,92,246,0.3)' : 'none' }}
              onClick={() => setStatusFilter(tab.val)}
            >
              {tab.label}
              <span style={{ padding: '0.1rem 0.4rem', borderRadius: '6px', background: statusFilter === tab.val ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', fontSize: '0.75rem' }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ padding: '1rem', color: '#EF4444', background: 'rgba(239,68,68,0.08)', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error} <button onClick={fetchAll} style={{ marginLeft: '1rem', color: '#0066CC', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
          </div>
        )}

        {/* EMPTY */}
        {displayed.length === 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '24px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>{t('researcher.experiments.empty', { status: statusFilter })}</p>
            {!statusFilter && <button className="ex-create-btn" onClick={() => setShowCreateModal(true)}>{t('researcher.experiments.noExperiments')}</button>}
          </div>
        )}

        {/* GRID */}
        {displayed.length > 0 && (
          <div className="ex-grid">
            {displayed.map((exp, i) => {
              const sc  = statusCfg[exp.status] || statusCfg.pending;
              const col = colorFor(exp.model_type);
              const acc = exp.accuracy != null ? `${(exp.accuracy * 100).toFixed(1)}%` : null;
              const datasetName = datasets.find(d => d.id === exp.dataset_id)?.name || null;
              const hp = exp.hyperparameters || {};

              return (
                <div key={exp.id} className="ex-card" data-aos="fade-up" data-aos-delay={i * 50} style={{ '--ecc': col }}>
                  <div className="ex-card-glow" style={{ background: col }}/>
                  <div className="ex-card-top">
                    <div className="ex-card-icon" style={{ background: `color-mix(in srgb, ${col} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${col} 25%, transparent)` }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
                    </div>
                    <span className="ex-status-pill" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <div className="ex-status-dot" style={{ background: sc.color, animation: exp.status === 'running' ? 'exPulse 1.5s ease infinite' : 'none' }}/>
                      {sc.label}
                    </span>
                  </div>

                  <h3 className="ex-card-name">{exp.name}</h3>
                  {exp.description && <p className="ex-card-desc">{exp.description}</p>}

                  {(acc || exp.loss != null) && (
                    <div className="ex-stats">
                      <div className="ex-stat" style={{ '--esc': col }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        <span className="ex-stat-val">{acc || '—'}</span>
                        <span className="ex-stat-label">{t('researcher.experiments.results.accuracy').replace(' (%)', '')}</span>
                      </div>
                      <div className="ex-stat-div"/>
                      <div className="ex-stat" style={{ '--esc': col }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        <span className="ex-stat-val">{exp.loss != null ? exp.loss.toFixed(4) : '—'}</span>
                        <span className="ex-stat-label">{t('researcher.experiments.results.loss')}</span>
                      </div>
                      {exp.metrics?.auc != null && (
                        <>
                          <div className="ex-stat-div"/>
                          <div className="ex-stat" style={{ '--esc': col }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                            <span className="ex-stat-val">{(exp.metrics.auc * 100).toFixed(1)}%</span>
                            <span className="ex-stat-label">AUC</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* HP tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.875rem' }}>
                    {hp.learning_rate != null && <span style={S.hpTag}><b style={{ color: col }}>LR</b> {hp.learning_rate}</span>}
                    {hp.epochs        != null && <span style={S.hpTag}><b style={{ color: col }}>{t('researcher.experiments.form.epochs')}</b> {hp.epochs}</span>}
                    {hp.batch_size    != null && <span style={S.hpTag}><b style={{ color: col }}>Batch</b> {hp.batch_size}</span>}
                    {hp.optimizer          && <span style={S.hpTag}>{hp.optimizer}</span>}
                    {datasetName           && <span style={{ ...S.hpTag, color: '#64748B' }}>{datasetName}</span>}
                  </div>

                  {/* ACTIONS */}
                  <div className="ex-card-actions" style={{ flexWrap: 'wrap' }}>
                    <button className="ex-view-btn" style={{ '--evb': col }} onClick={() => { setSelectedExp(exp); setShowDetailsModal(true); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {t('researcher.experiments.actions.details')}
                    </button>
                    {exp.status === 'pending' && (
                      <button style={S.actionBtn('#00BFA6')} onClick={() => handleAction(exp.id, 'start')} disabled={!!actionLoading}>
                        {actionLoading === exp.id + 'start' ? '…' : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> {t('researcher.experiments.actions.start')}</>}
                      </button>
                    )}
                    {exp.status === 'running' && (
                      <button style={S.actionBtn('#10B981')} onClick={() => handleAction(exp.id, 'complete')} disabled={!!actionLoading}>
                        {actionLoading === exp.id + 'complete' ? '…' : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t('researcher.experiments.actions.done')}</>}
                      </button>
                    )}
                    {exp.status === 'running' && (
                      <button style={S.actionBtn('#EF4444')} onClick={() => handleAction(exp.id, 'fail')} disabled={!!actionLoading}>
                        {actionLoading === exp.id + 'fail' ? '…' : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> {t('researcher.experiments.actions.fail')}</>}
                      </button>
                    )}
                    {(exp.status === 'completed' || exp.status === 'running') && (
                      <button style={S.actionBtn('#8B5CF6')} onClick={() => openResultsModal(exp)}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        {t('researcher.experiments.actions.results')}
                      </button>
                    )}
                    <button style={{ padding: '0.5rem 0.625rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      onClick={() => handleDelete(exp.id)} disabled={deleteLoading === exp.id}>
                      {deleteLoading === exp.id ? '…' : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DETAILS MODAL */}
        {showDetailsModal && selectedExp && (() => {
          const sc  = statusCfg[selectedExp.status] || statusCfg.pending;
          const col = colorFor(selectedExp.model_type);
          const datasetName = datasets.find(d => d.id === selectedExp.dataset_id)?.name || '—';
          const hp = selectedExp.hyperparameters || {};
          const mt = selectedExp.metrics || {};
          return (
            <div style={S.overlay} onClick={() => setShowDetailsModal(false)}>
              <div style={S.modal} onClick={e => e.stopPropagation()}>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${col}, #00BFA6)`, borderRadius: '22px 22px 0 0' }} />
                <div style={S.modalHeader}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>{selectedExp.name}</h3>
                    <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.82rem' }}>#{selectedExp.id} · {new Date(selectedExp.created_at).toLocaleString()}</p>
                  </div>
                  <button style={S.closeBtn} onClick={() => setShowDetailsModal(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div style={S.modalBody}>
                  {selectedExp.description && (
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '0.875rem' }}>{selectedExp.description}</p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p style={S.dl}>{t('researcher.experiments.details.status')}</p>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '100px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, fontSize: '0.78rem', fontWeight: 700 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color }}/>{sc.label}
                      </span>
                    </div>
                    <div>
                      <p style={S.dl}>{t('researcher.experiments.details.model')}</p>
                      <span style={{ padding: '0.3rem 0.75rem', borderRadius: '8px', background: `color-mix(in srgb, ${col} 12%, transparent)`, color: col, fontSize: '0.82rem', fontWeight: 700 }}>{selectedExp.model_type}</span>
                    </div>
                    <div><p style={S.dl}>{t('researcher.experiments.details.dataset')}</p><p style={S.dv}>{datasetName}</p></div>
                    <div><p style={S.dl}>{t('researcher.experiments.details.started')}</p><p style={S.dv}>{selectedExp.started_at ? new Date(selectedExp.started_at).toLocaleString() : '—'}</p></div>
                    <div><p style={S.dl}>{t('researcher.experiments.details.completed')}</p><p style={S.dv}>{selectedExp.completed_at ? new Date(selectedExp.completed_at).toLocaleString() : '—'}</p></div>
                  </div>

                  <div>
                    <p style={{ ...S.dl, marginBottom: '0.625rem' }}>{t('researcher.experiments.details.results')}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
                      {[
                        { label: t('researcher.experiments.results.accuracy').replace(' (%)', ''), val: selectedExp.accuracy != null ? `${(selectedExp.accuracy * 100).toFixed(2)}%` : '—', color: '#10B981' },
                        { label: t('researcher.experiments.results.loss'),  val: selectedExp.loss != null ? selectedExp.loss.toFixed(4) : '—', color: '#EF4444' },
                        { label: 'AUC',       val: mt.auc       != null ? `${(mt.auc * 100).toFixed(2)}%` : '—',       color: '#0066CC' },
                        { label: t('researcher.experiments.results.precision').replace(' (%)', ''), val: mt.precision != null ? `${(mt.precision * 100).toFixed(2)}%` : '—', color: '#8B5CF6' },
                        { label: t('researcher.experiments.results.recall').replace(' (%)', ''),    val: mt.recall    != null ? `${(mt.recall * 100).toFixed(2)}%` : '—',    color: '#F59E0B' },
                        { label: 'F1',        val: mt.f1        != null ? `${(mt.f1 * 100).toFixed(2)}%` : '—',        color: '#00BFA6' },
                      ].map((r, ri) => (
                        <div key={ri} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: `1px solid color-mix(in srgb, ${r.color} 20%, transparent)`, textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</p>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', fontWeight: 900, color: r.val === '—' ? '#475569' : r.color }}>{r.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {Object.keys(hp).length > 0 && (
                    <div>
                      <p style={{ ...S.dl, marginBottom: '0.625rem' }}>{t('researcher.experiments.details.hyperparameters')}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {Object.entries(hp).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.875rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: col }}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={S.modalFooter}>
                  <button style={S.cancelBtn} onClick={() => setShowDetailsModal(false)}>{t('researcher.experiments.details.close')}</button>
                  {selectedExp.status === 'pending' && (
                    <button style={{ ...S.submitBtn, background: 'rgba(0,191,166,0.15)', border: '1px solid rgba(0,191,166,0.3)', color: '#00BFA6' }}
                      onClick={() => { handleAction(selectedExp.id, 'start'); setShowDetailsModal(false); }} disabled={!!actionLoading}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {t('researcher.experiments.actions.startTraining')}
                    </button>
                  )}
                  {selectedExp.status === 'running' && (
                    <>
                      <button style={{ ...S.submitBtn, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}
                        onClick={() => { handleAction(selectedExp.id, 'complete'); setShowDetailsModal(false); }} disabled={!!actionLoading}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {t('researcher.experiments.actions.markDone')}
                      </button>
                      <button style={{ ...S.submitBtn, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6' }}
                        onClick={() => { setShowDetailsModal(false); openResultsModal(selectedExp); }}>
                        {t('researcher.experiments.actions.enterResults')}
                      </button>
                    </>
                  )}
                  {selectedExp.status === 'completed' && (
                    <button style={{ ...S.submitBtn, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6' }}
                      onClick={() => { setShowDetailsModal(false); openResultsModal(selectedExp); }}>
                      {t('researcher.experiments.actions.updateResults')}
                    </button>
                  )}
                  <button style={{ ...S.submitBtn, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}
                    onClick={() => handleDelete(selectedExp.id)} disabled={deleteLoading === selectedExp.id}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    {deleteLoading === selectedExp.id ? t('researcher.experiments.details.deleting') : t('researcher.experiments.details.delete')}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* RESULTS MODAL */}
        {showResultsModal && selectedExp && (
          <div style={S.overlay} onClick={() => setShowResultsModal(false)}>
            <div style={{ ...S.modal, maxWidth: 500 }} onClick={e => e.stopPropagation()}>
              <div style={{ height: 5, background: 'linear-gradient(90deg,#8B5CF6,#0066CC)', borderRadius: '22px 22px 0 0' }} />
              <div style={S.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem' }}>{t('researcher.experiments.results.title')}</h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.82rem' }}>{selectedExp.name}</p>
                </div>
                <button style={S.closeBtn} onClick={() => setShowResultsModal(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={S.modalBody}>
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px', fontSize: '0.8rem', color: '#A78BFA' }}>
                  {t('researcher.experiments.results.info')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { key: 'accuracy',  label: t('researcher.experiments.results.accuracy'),  placeholder: 'e.g. 91.2', color: '#10B981' },
                    { key: 'loss',      label: t('researcher.experiments.results.loss'),       placeholder: 'e.g. 0.234', color: '#EF4444' },
                    { key: 'auc',       label: t('researcher.experiments.results.auc'),        placeholder: 'e.g. 95.0',  color: '#0066CC' },
                    { key: 'f1',        label: t('researcher.experiments.results.f1'),         placeholder: 'e.g. 90.5',  color: '#00BFA6' },
                    { key: 'precision', label: t('researcher.experiments.results.precision'),  placeholder: 'e.g. 89.1',  color: '#8B5CF6' },
                    { key: 'recall',    label: t('researcher.experiments.results.recall'),     placeholder: 'e.g. 92.3',  color: '#F59E0B' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: f.color, marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                      <input style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'var(--bg-secondary)', border: `1px solid color-mix(in srgb, ${f.color} 30%, var(--border-primary))`, borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                        type="number" step="0.01" placeholder={f.placeholder}
                        value={resultsForm[f.key]}
                        onChange={e => setResultsForm(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('researcher.experiments.results.status')}</label>
                  <select style={{ width: '100%', padding: '0.625rem 0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
                    value={resultsForm.new_status} onChange={e => setResultsForm(p => ({ ...p, new_status: e.target.value }))}>
                    <option value="">{t('researcher.experiments.results.keepStatus')}</option>
                    <option value="running">{t('researcher.experiments.status.running')}</option>
                    <option value="completed">{t('researcher.experiments.status.completed')}</option>
                    <option value="failed">{t('researcher.experiments.status.failed')}</option>
                  </select>
                </div>
              </div>
              <div style={S.modalFooter}>
                <button style={S.cancelBtn} onClick={() => setShowResultsModal(false)}>{t('researcher.experiments.results.cancel')}</button>
                <button style={{ ...S.submitBtn, background: 'linear-gradient(135deg,#8B5CF6,#0066CC)', color: 'white', border: 'none', opacity: submitting ? 0.7 : 1 }}
                  onClick={handleUpdateResults} disabled={submitting}>
                  {submitting ? t('researcher.experiments.results.saving') : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t('researcher.experiments.results.save')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE MODAL */}
        {showCreateModal && (
          <div style={S.overlay} onClick={() => setShowCreateModal(false)}>
            <div style={{ ...S.modal, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
              <div style={{ height: 5, background: 'linear-gradient(90deg,#8B5CF6,#0066CC)', borderRadius: '22px 22px 0 0' }} />
              <div className="ex-modal-header">
                <div className="ex-modal-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
                </div>
                <div>
                  <h2 className="ex-modal-title">{t('researcher.experiments.create')}</h2>
                  <p className="ex-modal-sub">{t('researcher.experiments.subtitle')}</p>
                </div>
                <button className="ex-modal-close" onClick={() => setShowCreateModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="ex-modal-body">
                <div className="ex-field">
                  <label className="ex-label">{t('researcher.experiments.form.name')} *</label>
                  <input className="ex-input" type="text" placeholder={t('researcher.experiments.form.namePlaceholder')}
                    value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="ex-field">
                  <label className="ex-label">{t('researcher.experiments.form.description')}</label>
                  <textarea className="ex-input ex-textarea" rows="2" placeholder={t('researcher.experiments.form.descPlaceholder')}
                    value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="ex-field-row">
                  <div className="ex-field">
                    <label className="ex-label">{t('researcher.experiments.form.model')} *</label>
                    <select className="ex-select" value={createForm.model_type} onChange={e => setCreateForm(f => ({ ...f, model_type: e.target.value }))}>
                      {['DenseNet-121', 'ResNet-50', 'EfficientNet-B4', 'VGG-16', 'MobileNet-V2'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="ex-field">
                    <label className="ex-label">{t('researcher.experiments.form.dataset')}</label>
                    <select className="ex-select" value={createForm.dataset_id} onChange={e => setCreateForm(f => ({ ...f, dataset_id: e.target.value }))}>
                      <option value="">{t('researcher.experiments.form.noDataset')}</option>
                      {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem' }}>
                  <div className="ex-field">
                    <label className="ex-label">{t('researcher.experiments.form.learningRate')}</label>
                    <input className="ex-input" type="number" step="0.0001" min="0.00001"
                      value={createForm.learning_rate} onChange={e => setCreateForm(f => ({ ...f, learning_rate: e.target.value }))} />
                  </div>
                  <div className="ex-field">
                    <label className="ex-label">{t('researcher.experiments.form.epochs')}</label>
                    <input className="ex-input" type="number" min="1"
                      value={createForm.epochs} onChange={e => setCreateForm(f => ({ ...f, epochs: e.target.value }))} />
                  </div>
                  <div className="ex-field">
                    <label className="ex-label">{t('researcher.experiments.form.batchSize')}</label>
                    <input className="ex-input" type="number" min="1"
                      value={createForm.batch_size} onChange={e => setCreateForm(f => ({ ...f, batch_size: e.target.value }))} />
                  </div>
                </div>
                <div className="ex-field-row">
                  <div className="ex-field">
                    <label className="ex-label">{t('researcher.experiments.form.optimizer')}</label>
                    <select className="ex-select" value={createForm.optimizer} onChange={e => setCreateForm(f => ({ ...f, optimizer: e.target.value }))}>
                      {['Adam', 'SGD', 'AdamW', 'RMSprop', 'Adagrad'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="ex-field">
                    <label className="ex-label">{t('researcher.experiments.form.scheduler')}</label>
                    <select className="ex-select" value={createForm.scheduler} onChange={e => setCreateForm(f => ({ ...f, scheduler: e.target.value }))}>
                      {['StepLR', 'CosineAnnealingLR', 'ReduceLROnPlateau', 'None'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {[
                    { key: 'augmentation',   label: t('researcher.experiments.form.augmentation') },
                    { key: 'early_stopping', label: t('researcher.experiments.form.earlyStopping') },
                  ].map(tog => (
                    <button key={tog.key}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', borderRadius: '10px', background: createForm[tog.key] ? 'rgba(139,92,246,0.12)' : 'var(--bg-secondary)', border: `1px solid ${createForm[tog.key] ? 'rgba(139,92,246,0.4)' : 'var(--border-primary)'}`, color: createForm[tog.key] ? '#A78BFA' : '#64748B', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      onClick={() => setCreateForm(f => ({ ...f, [tog.key]: !f[tog.key] }))}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: createForm[tog.key] ? '#8B5CF6' : 'var(--bg-secondary)', border: `2px solid ${createForm[tog.key] ? '#8B5CF6' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {createForm[tog.key] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      {tog.label}
                    </button>
                  ))}
                </div>
                <div className="ex-info-banner">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {t('researcher.experiments.form.info')}
                </div>
              </div>
              <div className="ex-modal-footer">
                <button className="ex-modal-cancel" onClick={() => setShowCreateModal(false)}>{t('researcher.experiments.form.cancel')}</button>
                <button className="ex-modal-create"
                  onClick={handleCreate} disabled={!createForm.name.trim() || submitting}
                  style={{ opacity: !createForm.name.trim() || submitting ? 0.6 : 1 }}>
                  {submitting ? t('researcher.experiments.form.submitting') : (
                    <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> {t('researcher.experiments.form.submit')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes exPulse { 0%,100%{ opacity:1; } 50%{ opacity:0.5; } }`}</style>
    </div>
  );
};

const S = {
  hpTag:      { padding: '0.2rem 0.625rem', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' },
  actionBtn:  (color) => ({ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`, color, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }),
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
  modal:      { width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '22px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' },
  modalHeader:{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid var(--border-primary)' },
  closeBtn:   { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' },
  modalBody:  { padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  modalFooter:{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-primary)', flexWrap: 'wrap' },
  cancelBtn:  { padding: '0.7rem 1.25rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' },
  submitBtn:  { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' },
  dl:         { margin: 0, fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' },
  dv:         { margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' },
};

export default Experiments;