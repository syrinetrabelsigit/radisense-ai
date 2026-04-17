import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/admin/AuditLogs.css';

const AuditLogs = () => {
  const { t } = useTranslation();
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      // ✅ On stocke uniquement les données brutes du backend
      // La traduction se fait au moment du rendu, pas ici
      const transformedLogs = data.logs.map(log => ({
        id: log.id,
        timestamp: new Date(log.timestamp).toLocaleString('fr-FR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).replace(',', ''),
        level: log.status === 'completed' ? 'success' : log.status === 'failed' ? 'error' : 'info',
        service: 'ml',
        user: log.user_name || `User #${log.user_id}`,
        // ✅ On stocke la clé de traduction, pas le texte traduit
        actionKey: 'admin.logs.action.analysisPrediction',
        statusKey: log.status, // 'completed' | 'failed' | 'pending'
        ip: '127.0.0.1',
        metadata: {
          analysisId: log.id,
          userId: log.user_id,
          status: log.status,
          timestamp: log.timestamp
        }
      }));

      setLogs(transformedLogs);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setLoading(false);
    }
  };

  const levelConfig = {
    info:     { color:'#0066CC', bg:'rgba(0,102,204,0.12)',   border:'rgba(0,102,204,0.25)',   label: t('admin.logs.level.info'),     icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
    success:  { color:'#10B981', bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)',  label: t('admin.logs.level.success'),  icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    warning:  { color:'#F59E0B', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)',  label: t('admin.logs.level.warning'),  icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
    error:    { color:'#EF4444', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)',   label: t('admin.logs.level.error'),    icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
    critical: { color:'#DC2626', bg:'rgba(220,38,38,0.12)',   border:'rgba(220,38,38,0.25)',   label: t('admin.logs.level.critical'), icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  };

  const serviceConfig = {
    api:      { color:'#8B5CF6', label: t('admin.logs.service.api')      },
    database: { color:'#0066CC', label: t('admin.logs.service.database') },
    ml:       { color:'#00BFA6', label: t('admin.logs.service.ml')       },
    auth:     { color:'#F59E0B', label: t('admin.logs.service.auth')     },
    system:   { color:'#EF4444', label: t('admin.logs.service.system')   },
  };

  const stats = [
    {
      label: t('admin.logs.stats.totalLogs'),
      value: logs.length.toLocaleString(),
      color: '#8B5CF6',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    },
    {
      label: t('admin.logs.stats.errors'),
      value: logs.filter(l => l.level === 'error' || l.level === 'critical').length.toString(),
      color: '#EF4444',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
    },
    {
      label: t('admin.logs.stats.warnings'),
      value: logs.filter(l => l.level === 'warning').length.toString(),
      color: '#F59E0B',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
    },
    {
      label: t('admin.logs.stats.todayActivity'),
      value: logs.filter(l => l.level === 'success').length.toString(),
      color: '#10B981',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    },
  ];

  const filtered = logs.filter(l => {
    const ml = selectedLevel   === 'all' || l.level   === selectedLevel;
    const ms = selectedService === 'all' || l.service === selectedService;
    const mq = t(l.actionKey).toLowerCase().includes(searchTerm.toLowerCase()) ||
               l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
               t(`dashboard.status.${l.statusKey}`).toLowerCase().includes(searchTerm.toLowerCase());
    return ml && ms && mq;
  });

  const clearFilters = () => { setSelectedLevel('all'); setSelectedService('all'); setSearchTerm(''); };

  if (loading) {
    return (
      <div className="al-page">
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid var(--border-primary)', borderTopColor: '#0066CC', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{t('admin.logs.title')}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="al-page">
      <div className="container">

        {/* HEADER */}
        <div className="al-header" data-aos="fade-down">
          <div>
            <div className="al-badge">
              <div className="al-badge-dot"/>
              <span>{t('admin.dashboard.title')}</span>
            </div>
            <h1 className="al-title">
              <span className="al-title-grad">{t('admin.logs.title')}</span>
            </h1>
            <p className="al-subtitle">{t('admin.logs.subtitle')}</p>
          </div>
          <div className="al-header-actions">
            <button className="al-clear-btn" onClick={clearFilters}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
              {t('admin.logs.clearFilters')}
            </button>
            {/* <button className="al-export-btn" onClick={() => alert('Export feature coming soon!')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t('admin.logs.export')}
            </button> */}
          </div>
        </div>

        {/* STATS */}
        <div className="al-stats-grid" data-aos="fade-up">
          {stats.map((s, i) => (
            <div key={i} className="al-stat-card">
              <div className="al-stat-icon" style={{ background: s.color, boxShadow: `0 8px 24px color-mix(in srgb, ${s.color} 40%, transparent)` }}>
                {s.icon}
              </div>
              <div>
                <p className="al-stat-label">{s.label}</p>
                <h3 className="al-stat-value">{s.value}</h3>
              </div>
              <div className="al-stat-glow" style={{ background: s.color }}/>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="al-filters" data-aos="fade-up">
          <div className="al-filters-row">
            <div className="al-filter-group">
              <label className="al-filter-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                {t('admin.logs.filterByLevel')}
              </label>
              <select className="al-select" value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}>
                <option value="all">{t('admin.logs.level.all')}</option>
                {Object.entries(levelConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="al-filter-group">
              <label className="al-filter-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                {t('admin.logs.filterByService')}
              </label>
              <select className="al-select" value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                <option value="all">{t('admin.logs.service.all')}</option>
                {Object.entries(serviceConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="al-filter-group al-search-group">
              <label className="al-filter-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                {t('admin.logs.search')}
              </label>
              <div className="al-search-wrap">
                <svg className="al-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  className="al-search-input"
                  placeholder={t('admin.logs.search')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="al-search-clear" onClick={() => setSearchTerm('')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="al-filter-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>
            <strong>{filtered.length}</strong> / <strong>{logs.length}</strong> {t('admin.logs.title').toLowerCase()}
          </div>
        </div>

        {/* TABLE */}
        <div className="al-table-card" data-aos="fade-up">
          <div className="al-table-wrap">
            <table className="al-table">
              <thead>
                <tr>
                  <th>{t('admin.logs.table.timestamp')}</th>
                  <th>{t('admin.logs.table.level')}</th>
                  <th>{t('admin.logs.table.service')}</th>
                  <th>{t('admin.logs.table.user')}</th>
                  <th>{t('admin.logs.table.action')}</th>
                  <th>{t('admin.logs.table.details')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const lc = levelConfig[log.level];
                  const sc = serviceConfig[log.service];
                  // ✅ Traduction au moment du rendu — réactif au changement de langue
                  const actionLabel  = t(log.actionKey);
                  const detailsLabel = `#${log.id} — ${t(`dashboard.status.${log.statusKey}`)}`;
                  return (
                    <tr
                      key={log.id}
                      className="al-table-row"
                      onClick={() => { setSelectedLog({ ...log, action: actionLabel, details: detailsLabel }); setShowModal(true); }}
                      data-aos="fade-right"
                      data-aos-delay={i * 35}
                    >
                      <td className="al-td-timestamp">
                        <span className="al-ts-date">{log.timestamp.split(' ')[0]}</span>
                        <span className="al-ts-time">{log.timestamp.split(' ')[1]}</span>
                      </td>
                      <td>
                        <div className="al-level-pill" style={{ color: lc.color, background: lc.bg, border: `1px solid ${lc.border}` }}>
                          {lc.icon}{lc.label}
                        </div>
                      </td>
                      <td>
                        <div className="al-service-tag" style={{ color: sc.color, background: `color-mix(in srgb, ${sc.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${sc.color} 22%, transparent)` }}>
                          {sc.label}
                        </div>
                      </td>
                      <td className="al-td-user">{log.user}</td>
                      <td className="al-td-action">{actionLabel}</td>
                      <td className="al-td-details">{detailsLabel}</td>
                      <td>
                        <div className="al-row-arrow">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="al-empty">
                <div className="al-empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                <h3>{t('patient.recentAnalyses.noResults')}</h3>
                <p>{t('admin.logs.search')}</p>
                <button className="al-empty-btn" onClick={clearFilters}>{t('admin.logs.clearFilters')}</button>
              </div>
            )}
          </div>
        </div>

        {/* DETAIL MODAL */}
        {showModal && selectedLog && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="al-modal" onClick={e => e.stopPropagation()}>
              {(() => {
                const lc = levelConfig[selectedLog.level];
                const sc = serviceConfig[selectedLog.service];
                return (
                  <>
                    <div className="al-modal-header">
                      <div className="al-modal-title-wrap">
                        <h2 className="al-modal-title">{t('admin.logs.action.viewDetails')}</h2>
                        <div className="al-level-pill" style={{ color: lc.color, background: lc.bg, border: `1px solid ${lc.border}` }}>
                          {lc.icon}{lc.label}
                        </div>
                      </div>
                      <button className="al-modal-close" onClick={() => setShowModal(false)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>

                    <div className="al-modal-body">
                      <div className="al-modal-grid">
                        {[
                          { label: t('admin.logs.table.timestamp'), val: selectedLog.timestamp, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                          { label: t('admin.logs.table.service'),   val: sc.label,               icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>, color: sc.color },
                          { label: t('admin.logs.table.user'),      val: selectedLog.user,        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                          { label: 'IP',                            val: selectedLog.ip,          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
                        ].map((item, i) => (
                          <div key={i} className="al-modal-field">
                            <div className="al-modal-field-label">
                              <span style={{ color: item.color || 'var(--text-muted)' }}>{item.icon}</span>
                              {item.label}
                            </div>
                            <div className="al-modal-field-val" style={{ color: item.color }}>{item.val}</div>
                          </div>
                        ))}
                      </div>

                      {[
                        { title: t('admin.logs.table.action'),  content: selectedLog.action  },
                        { title: t('admin.logs.table.details'), content: selectedLog.details },
                      ].map((s, i) => (
                        <div key={i} className="al-modal-section">
                          <h4 className="al-modal-section-title">{s.title}</h4>
                          <p className="al-modal-section-text">{s.content}</p>
                        </div>
                      ))}

                      <div className="al-modal-section">
                        <h4 className="al-modal-section-title">Metadata</h4>
                        <pre className="al-metadata">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                      </div>
                    </div>

                    <div className="al-modal-footer">
                      <button className="al-modal-cancel" onClick={() => setShowModal(false)}>
                        {t('patients.form.cancel')}
                      </button>
                      {/* <button className="al-modal-download" onClick={() => alert('Download feature coming soon!')}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {t('admin.logs.action.download')}
                      </button> */}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuditLogs;