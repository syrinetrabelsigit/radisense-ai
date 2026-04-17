import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/admin/ModelManagement.css';

const ModelManagement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('active');
  const [selectedModel, setSelectedModel] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
  }, []);

  const models = [
    { id:1, name:'DenseNet-121',    version:'v2.3.1', status:'production', accuracy:89.2, deployed:'2026-01-15', lastUpdated:'2026-02-10', predictions:15420, architecture:'DenseNet-121',    framework:'PyTorch 2.0',      inputSize:'224×224', parameters:'7.98M',  trainingTime:'12h 45min', dataset:'ChestX-ray14 (112,120 images)',          metrics:{ precision:91.3, recall:87.6, f1Score:89.4, auc:0.94 } },
    { id:2, name:'ResNet-50',       version:'v1.8.0', status:'staging',    accuracy:86.7, deployed:'2026-02-01', lastUpdated:'2026-02-18', predictions:3240,  architecture:'ResNet-50',       framework:'TensorFlow 2.12', inputSize:'224×224', parameters:'25.6M', trainingTime:'8h 20min',  dataset:'ChestX-ray14 (112,120 images)',          metrics:{ precision:88.1, recall:85.2, f1Score:86.6, auc:0.92 } },
    { id:3, name:'EfficientNet-B4', version:'v3.1.0', status:'training',   accuracy:null, deployed:null,         lastUpdated:'2026-02-20', predictions:0,     architecture:'EfficientNet-B4', framework:'PyTorch 2.0',      inputSize:'380×380', parameters:'19.3M', trainingTime:'In progress…', dataset:'ChestX-ray14 Extended (150,000 images)', metrics:{ precision:null, recall:null, f1Score:null, auc:null } },
    { id:4, name:'VGG-16',          version:'v1.2.5', status:'archived',   accuracy:82.4, deployed:'2025-08-10', lastUpdated:'2025-12-15', predictions:45680, architecture:'VGG-16',          framework:'Keras',           inputSize:'224×224', parameters:'138M',  trainingTime:'18h 30min', dataset:'ChestX-ray8 (80,000 images)',            metrics:{ precision:84.2, recall:80.5, f1Score:82.3, auc:0.88 } },
  ];

  const trainingHistory = [
    { epoch:1,  loss:0.452, valLoss:0.389 },
    { epoch:5,  loss:0.298, valLoss:0.312 },
    { epoch:10, loss:0.187, valLoss:0.245 },
    { epoch:15, loss:0.145, valLoss:0.198 },
    { epoch:20, loss:0.112, valLoss:0.176 },
    { epoch:25, loss:0.089, valLoss:0.165 },
  ];

  const statusCfg = {
    production: { color:'#10B981', bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)',  label: t('admin.models.status.production') || 'Production' },
    staging:    { color:'#F59E0B', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)',  label: t('admin.models.status.staging')    || 'Staging' },
    training:   { color:'#0066CC', bg:'rgba(0,102,204,0.12)',   border:'rgba(0,102,204,0.25)',   label: t('admin.models.status.training')   || 'Training' },
    archived:   { color:'#6B7280', bg:'rgba(107,114,128,0.12)', border:'rgba(107,114,128,0.25)', label: t('admin.models.status.archived')   || 'Archived' },
  };

  const metricColors = { precision:'#0066CC', recall:'#10B981', f1Score:'#8B5CF6', auc:'#F59E0B' };

  const filtered = models.filter(m => activeTab === 'active' ? m.status !== 'archived' : m.status === 'archived');

  const GradId = ({ id }) => (
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066CC"/>
        <stop offset="100%" stopColor="#00BFA6"/>
      </linearGradient>
    </defs>
  );

  return (
    <div className="mm-page">
      <div className="container">

        {/* HEADER */}
        <div className="mm-header" data-aos="fade-down">
          <div>
            <div className="mm-badge"><div className="mm-badge-dot"/><span>Admin Console</span></div>
            <h1 className="mm-title"><span className="mm-title-grad">{t('admin.models.title') || 'Model Management'}</span></h1>
            <p className="mm-subtitle">{t('admin.models.subtitle') || 'Deploy, monitor and manage AI models'}</p>
          </div>
          <button className="mm-deploy-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {t('admin.models.deployNew') || 'Deploy New Model'}
          </button>
        </div>

        {/* TABS */}
        <div className="mm-tabs" data-aos="fade-up">
          {[
            { key:'active',   label: t('admin.models.active')   || 'Active Models', count: models.filter(m => m.status !== 'archived').length,
              icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
            { key:'archived', label: t('admin.models.archived') || 'Archived',       count: models.filter(m => m.status === 'archived').length,
              icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> },
          ].map(tab => (
            <button key={tab.key} className={`mm-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              <div className="mm-tab-icon">{tab.icon}</div>
              <div className="mm-tab-body">
                <span className="mm-tab-label">{tab.label}</span>
                <span className="mm-tab-count">{tab.count}</span>
              </div>
            </button>
          ))}
        </div>

        {/* MODELS GRID */}
        <div className="mm-grid">
          {filtered.map((model, i) => {
            const sc = statusCfg[model.status];
            const circ = 2 * Math.PI * 40;
            const dash = model.accuracy ? (model.accuracy / 100) * circ : 0;
            return (
              <div key={model.id} className="mm-card" data-aos="zoom-in" data-aos-delay={i * 80}>

                {/* TOP BAR */}
                <div className="mm-card-bar" style={{ background: sc.color }} />

                {/* CARD HEADER */}
                <div className="mm-card-header">
                  <div>
                    <h3 className="mm-model-name">{model.name}</h3>
                    <span className="mm-model-version">{model.version}</span>
                  </div>
                  <div className="mm-status-pill" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                    <div className="mm-status-dot" style={{ background: sc.color }} />
                    {sc.label}
                  </div>
                </div>

                {/* ACCURACY CIRCLE */}
                <div className="mm-accuracy-wrap">
                  {model.accuracy ? (
                    <div className="mm-circle">
                      <svg viewBox="0 0 100 100" className="mm-circle-svg">
                        <GradId id={`mg-${model.id}`} />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-secondary)" strokeWidth="7"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke={`url(#mg-${model.id})`} strokeWidth="7"
                          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)"
                          style={{ transition: 'stroke-dasharray 1s ease' }}
                        />
                      </svg>
                      <div className="mm-circle-text">
                        <span className="mm-acc-value">{model.accuracy}%</span>
                        <span className="mm-acc-label">{t('admin.models.accuracy') || 'Accuracy'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mm-training-state">
                      <div className="mm-train-rings">
                        <div className="mm-ring r1" />
                        <div className="mm-ring r2" />
                        <div className="mm-ring r3" />
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mm-train-icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      </div>
                      <span className="mm-train-label">Training in progress…</span>
                    </div>
                  )}
                </div>

                {/* INFO GRID */}
                <div className="mm-info-grid">
                  {[
                    { label: t('admin.models.architecture') || 'Architecture', val: model.architecture },
                    { label: t('admin.models.predictions')  || 'Predictions',  val: model.predictions.toLocaleString() },
                    { label: t('admin.models.lastUpdated')  || 'Last Updated', val: model.lastUpdated ? new Date(model.lastUpdated).toLocaleDateString() : 'N/A' },
                    { label: t('admin.models.framework')    || 'Framework',    val: model.framework },
                  ].map((item, j) => (
                    <div key={j} className="mm-info-item">
                      <span className="mm-info-label">{item.label}</span>
                      <span className="mm-info-val">{item.val}</span>
                    </div>
                  ))}
                </div>

                {/* ACTIONS */}
                <div className="mm-card-actions">
                  <button className="mm-btn-primary" onClick={() => { setSelectedModel(model); setShowModal(true); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    {t('admin.models.action.viewMetrics') || 'View Metrics'}
                  </button>
                  {model.status !== 'archived'
                    ? <>
                        <button className="mm-btn-outline">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                          {t('admin.models.action.retrain') || 'Retrain'}
                        </button>
                        <button className="mm-btn-outline">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg>
                          {t('admin.models.action.archive') || 'Archive'}
                        </button>
                      </>
                    : <button className="mm-btn-outline activate">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        {t('admin.models.action.activate') || 'Activate'}
                      </button>
                  }
                </div>
              </div>
            );
          })}
        </div>

        {/* DETAIL MODAL */}
        {showModal && selectedModel && (() => {
          const sc = statusCfg[selectedModel.status];
          return (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="mm-modal" onClick={e => e.stopPropagation()}>

                <div className="mm-modal-header">
                  <div className="mm-modal-title-wrap">
                    <div>
                      <div className="mm-modal-name-row">
                        <h2 className="mm-modal-name">{selectedModel.name}</h2>
                        <span className="mm-modal-version">{selectedModel.version}</span>
                      </div>
                      <div className="mm-status-pill sm" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                        <div className="mm-status-dot" style={{ background: sc.color }} />{sc.label}
                      </div>
                    </div>
                  </div>
                  <button className="mm-modal-close" onClick={() => setShowModal(false)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <div className="mm-modal-body">

                  {/* PERFORMANCE */}
                  <div className="mm-modal-section">
                    <h3 className="mm-modal-section-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      {t('admin.models.performance') || 'Performance Metrics'}
                    </h3>
                    <div className="mm-metrics-grid">
                      {Object.entries(selectedModel.metrics).map(([key, val]) => {
                        const color = metricColors[key] || '#0066CC';
                        const display = val === null ? 'N/A' : key === 'auc' ? val.toFixed(2) : `${val}%`;
                        const pct = val === null ? 0 : key === 'auc' ? val * 100 : val;
                        return (
                          <div key={key} className="mm-metric-card" style={{ '--mc': color }}>
                            <div className="mm-metric-ring">
                              <svg width="70" height="70" viewBox="0 0 70 70">
                                <circle cx="35" cy="35" r="28" fill="none" stroke="var(--bg-secondary)" strokeWidth="5"/>
                                <circle cx="35" cy="35" r="28" fill="none" stroke={color} strokeWidth="5"
                                  strokeDasharray={`${(pct/100)*175.9} 175.9`} strokeLinecap="round"
                                  transform="rotate(-90 35 35)"
                                  style={{ transition: 'stroke-dasharray 1s ease' }}
                                />
                              </svg>
                              <div className="mm-metric-ring-val">{display}</div>
                            </div>
                            <span className="mm-metric-key">{t(`admin.models.${key}`) || key}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div className="mm-modal-section">
                    <h3 className="mm-modal-section-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {t('admin.models.details') || 'Model Details'}
                    </h3>
                    <div className="mm-details-grid">
                      {[
                        { label: t('admin.models.dataset')      || 'Dataset',       val: selectedModel.dataset,       icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
                        { label: t('admin.models.parameters')   || 'Parameters',    val: selectedModel.parameters,    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg> },
                        { label: t('admin.models.inputSize')    || 'Input Size',    val: selectedModel.inputSize,     icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> },
                        { label: t('admin.models.trainingTime') || 'Training Time', val: selectedModel.trainingTime,  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                      ].map((item, i) => (
                        <div key={i} className="mm-detail-item">
                          <div className="mm-detail-label">{item.icon}{item.label}</div>
                          <div className="mm-detail-val">{item.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TRAINING HISTORY */}
                  {selectedModel.status !== 'training' && (
                    <div className="mm-modal-section">
                      <h3 className="mm-modal-section-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        {t('admin.models.training.title') || 'Training History'}
                      </h3>
                      <div className="mm-train-table-wrap">
                        <table className="mm-train-table">
                          <thead>
                            <tr>
                              <th>{t('admin.models.training.epoch')  || 'Epoch'}</th>
                              <th>{t('admin.models.training.loss')   || 'Train Loss'}</th>
                              <th>{t('admin.models.training.valLoss')|| 'Val Loss'}</th>
                              <th>Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trainingHistory.map((row, ri) => {
                              const prev = trainingHistory[ri - 1];
                              const improving = prev && row.valLoss < prev.valLoss;
                              return (
                                <tr key={row.epoch}>
                                  <td><span className="mm-epoch-badge">Epoch {row.epoch}</span></td>
                                  <td className="mm-mono">{row.loss.toFixed(3)}</td>
                                  <td className="mm-mono">{row.valLoss.toFixed(3)}</td>
                                  <td>
                                    {ri > 0 && (
                                      <span className={`mm-trend-badge ${improving ? 'good' : 'bad'}`}>
                                        {improving
                                          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                                          : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                        }
                                        {improving ? 'Improving' : 'Higher'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <button className="mm-view-logs-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {t('admin.models.training.viewLogs') || 'View Full Logs'}
                      </button>
                    </div>
                  )}

                </div>

                <div className="mm-modal-footer">
                  <button className="mm-modal-cancel" onClick={() => setShowModal(false)}>Close</button>
                  <button className="mm-modal-download">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {t('admin.models.action.download') || 'Download Model'}
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
};

export default ModelManagement;