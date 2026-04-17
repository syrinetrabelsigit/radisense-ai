import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/admin/DatabaseManagement.css';

const DatabaseManagement = () => {
  const { t } = useTranslation();
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupRunning, setBackupRunning] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
  }, []);

  const stats = [
    { label: t('admin.database.totalRecords') || 'Total Records', value:'1,247,892', color:'#8B5CF6',
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
    { label: t('admin.database.storageUsed')  || 'Storage Used',  value:'45.3 GB',   color:'#0066CC',
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg> },
    { label: t('admin.database.backups')      || 'Total Backups', value:'127',        color:'#10B981',
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
    { label: t('admin.database.lastBackup')   || 'Last Backup',   value:'2h ago',     color:'#F59E0B',
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ];

  const performanceMetrics = [
    { label: t('admin.database.performance.queries')     || 'Queries/sec',       value:'342',   trend:'+12%', up:true,  color:'#0066CC' },
    { label: t('admin.database.performance.connections') || 'Active Connections', value:'28',    trend:'+5%',  up:true,  color:'#8B5CF6' },
    { label: t('admin.database.performance.cacheHit')   || 'Cache Hit Rate',     value:'94.2%', trend:'+2%',  up:true,  color:'#10B981' },
    { label: t('admin.database.performance.avgQuery')   || 'Avg Query Time',     value:'45ms',  trend:'-8%',  up:false, color:'#F59E0B' },
  ];

  const recentOperations = [
    { id:1, type:'OPTIMIZE', table:'analyses',   status:'completed', time:'5 min ago',  color:'#0066CC' },
    { id:2, type:'BACKUP',   table:'All tables', status:'completed', time:'2 hrs ago',  color:'#10B981' },
    { id:3, type:'ANALYZE',  table:'images',     status:'completed', time:'4 hrs ago',  color:'#8B5CF6' },
    { id:4, type:'VACUUM',   table:'audit_logs', status:'completed', time:'8 hrs ago',  color:'#F59E0B' },
  ];

  const tables = [
    { name:'users',          records:1247,  size:'2.4 MB',   lastModified:'2026-02-20 14:32', color:'#8B5CF6' },
    { name:'analyses',       records:15420, size:'128.6 MB', lastModified:'2026-02-20 15:45', color:'#0066CC' },
    { name:'images',         records:15420, size:'42.8 GB',  lastModified:'2026-02-20 15:44', color:'#00BFA6' },
    { name:'predictions',    records:15420, size:'45.2 MB',  lastModified:'2026-02-20 15:45', color:'#10B981' },
    { name:'models',         records:12,    size:'3.2 GB',   lastModified:'2026-02-18 10:20', color:'#EF4444' },
    { name:'appointments',   records:3240,  size:'1.8 MB',   lastModified:'2026-02-20 13:15', color:'#F59E0B' },
    { name:'medical_records',records:892,   size:'8.4 MB',   lastModified:'2026-02-19 16:22', color:'#EC4899' },
    { name:'audit_logs',     records:45680, size:'156.3 MB', lastModified:'2026-02-20 15:50', color:'#6366F1' },
  ];

  const backupHistory = [
    { id:1, timestamp:'2026-02-20 14:00:00', status:'completed', size:'44.8 GB', duration:'12m 34s', type:'Automatic' },
    { id:2, timestamp:'2026-02-20 02:00:00', status:'completed', size:'44.7 GB', duration:'11m 58s', type:'Automatic' },
    { id:3, timestamp:'2026-02-19 14:00:00', status:'completed', size:'43.2 GB', duration:'12m 15s', type:'Automatic' },
    { id:4, timestamp:'2026-02-19 10:30:00', status:'completed', size:'43.1 GB', duration:'13m 02s', type:'Manual' },
    { id:5, timestamp:'2026-02-19 02:00:00', status:'failed',    size:'N/A',     duration:'N/A',     type:'Automatic' },
  ];

  const statusCfg = {
    completed: { color:'#10B981', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)' },
    running:   { color:'#F59E0B', bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.25)' },
    failed:    { color:'#EF4444', bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.25)' },
  };

  const executeBackup = () => {
    setBackupRunning(true);
    setTimeout(() => { setBackupRunning(false); setShowBackupModal(false); }, 2000);
  };

  const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  const XIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

  return (
    <div className="dm-page">
      <div className="container">

        {/* HEADER */}
        <div className="dm-header" data-aos="fade-down">
          <div>
            <div className="dm-badge"><div className="dm-badge-dot"/><span>Admin Console</span></div>
            <h1 className="dm-title"><span className="dm-title-grad">{t('admin.database.title') || 'Database Management'}</span></h1>
            <p className="dm-subtitle">{t('admin.database.subtitle') || 'Monitor, optimize and backup your database'}</p>
          </div>
          <button className="dm-backup-btn" onClick={() => setShowBackupModal(true)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {t('admin.database.action.backup') || 'Backup Now'}
          </button>
        </div>

        {/* STATS */}
        <div className="dm-stats-grid" data-aos="fade-up">
          {stats.map((s, i) => (
            <div key={i} className="dm-stat-card">
              <div className="dm-stat-icon" style={{ background: s.color, boxShadow: `0 8px 24px color-mix(in srgb, ${s.color} 40%, transparent)` }}>{s.icon}</div>
              <div className="dm-stat-body">
                <span className="dm-stat-label">{s.label}</span>
                <span className="dm-stat-value">{s.value}</span>
              </div>
              <div className="dm-stat-glow" style={{ background: s.color }} />
            </div>
          ))}
        </div>

        {/* PERFORMANCE + OPERATIONS */}
        <div className="dm-mid-grid">

          <div className="dm-card" data-aos="fade-right">
            <div className="dm-card-header" style={{ '--dch': '#0066CC' }}>
              <div className="dm-card-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div>
                <h3 className="dm-card-title">{t('admin.database.performance.title') || 'Performance'}</h3>
                <p className="dm-card-sub">Real-time database metrics</p>
              </div>
            </div>
            <div className="dm-perf-list">
              {performanceMetrics.map((m, i) => (
                <div key={i} className="dm-perf-item">
                  <div className="dm-perf-left">
                    <div className="dm-perf-dot" style={{ background: m.color }} />
                    <span className="dm-perf-label">{m.label}</span>
                  </div>
                  <div className="dm-perf-right">
                    <span className="dm-perf-value" style={{ color: m.color }}>{m.value}</span>
                    <span className={`dm-perf-trend ${m.up ? 'up' : 'down'}`}>
                      {m.up
                        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      }
                      {m.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dm-card" data-aos="fade-left">
            <div className="dm-card-header" style={{ '--dch': '#10B981' }}>
              <div className="dm-card-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
              </div>
              <div>
                <h3 className="dm-card-title">{t('admin.database.operations.title') || 'Recent Operations'}</h3>
                <p className="dm-card-sub">Latest database tasks</p>
              </div>
            </div>
            <div className="dm-ops-list">
              {recentOperations.map(op => {
                const sc = statusCfg[op.status];
                return (
                  <div key={op.id} className="dm-op-item">
                    <div className="dm-op-type" style={{ color: op.color, background: `color-mix(in srgb, ${op.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${op.color} 22%, transparent)` }}>{op.type}</div>
                    <div className="dm-op-body">
                      <span className="dm-op-table">{op.table}</span>
                      <span className="dm-op-time">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {op.time}
                      </span>
                    </div>
                    <div className="dm-status-pill" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      {op.status === 'completed' ? <CheckIcon /> : <XIcon />}
                      {t(`admin.database.status.${op.status}`) || op.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* TABLES GRID */}
        <div className="dm-card dm-tables-card" data-aos="fade-up">
          <div className="dm-card-header" style={{ '--dch': '#8B5CF6' }}>
            <div className="dm-card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            </div>
            <div>
              <h3 className="dm-card-title">{t('admin.database.tables') || 'Database Tables'}</h3>
              <p className="dm-card-sub">{tables.length} tables · click to manage</p>
            </div>
          </div>
          <div className="dm-tables-grid">
            {tables.map((tbl, i) => (
              <div key={i} className="dm-table-card" data-aos="zoom-in" data-aos-delay={i * 50} style={{ '--tc': tbl.color }}>
                <div className="dm-table-top-bar" style={{ background: tbl.color }} />
                <div className="dm-table-header">
                  <div className="dm-table-icon" style={{ color: tbl.color, background: `color-mix(in srgb, ${tbl.color} 12%, transparent)` }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                  </div>
                  <span className="dm-table-name">{tbl.name}</span>
                </div>
                <div className="dm-table-stats">
                  <div className="dm-table-stat">
                    <span className="dm-ts-label">{t('admin.database.table.records') || 'Records'}</span>
                    <span className="dm-ts-val">{tbl.records.toLocaleString()}</span>
                  </div>
                  <div className="dm-table-stat">
                    <span className="dm-ts-label">{t('admin.database.table.size') || 'Size'}</span>
                    <span className="dm-ts-val">{tbl.size}</span>
                  </div>
                </div>
                <div className="dm-table-modified">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {tbl.lastModified}
                </div>
                <div className="dm-table-actions">
                  <button className="dm-tbl-btn optimize">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    {t('admin.database.action.optimize') || 'Optimize'}
                  </button>
                  <button className="dm-tbl-btn export">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {t('admin.database.action.export') || 'Export'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BACKUP HISTORY */}
        <div className="dm-card" data-aos="fade-up">
          <div className="dm-card-header" style={{ '--dch': '#F59E0B' }}>
            <div className="dm-card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            </div>
            <div>
              <h3 className="dm-card-title">{t('admin.database.backup.title') || 'Backup History'}</h3>
              <p className="dm-card-sub">Recent database snapshots</p>
            </div>
          </div>
          <div className="dm-backup-table-wrap">
            <table className="dm-backup-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>{t('admin.database.backup.status')   || 'Status'}</th>
                  <th>{t('admin.database.backup.size')     || 'Size'}</th>
                  <th>{t('admin.database.backup.duration') || 'Duration'}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {backupHistory.map(b => {
                  const sc = statusCfg[b.status];
                  return (
                    <tr key={b.id} className="dm-backup-row">
                      <td className="dm-mono">{b.timestamp}</td>
                      <td>
                        <span className={`dm-type-tag ${b.type === 'Manual' ? 'manual' : 'auto'}`}>{b.type}</span>
                      </td>
                      <td>
                        <div className="dm-status-pill" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                          {b.status === 'completed' ? <CheckIcon /> : <XIcon />}
                          {t(`admin.database.status.${b.status}`) || b.status}
                        </div>
                      </td>
                      <td className="dm-mono">{b.size}</td>
                      <td className="dm-mono">{b.duration}</td>
                      <td>
                        {b.status === 'completed' && (
                          <button className="dm-dl-btn">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            {t('admin.database.backup.download') || 'Download'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* BACKUP MODAL */}
        {showBackupModal && (
          <div className="modal-overlay" onClick={() => setShowBackupModal(false)}>
            <div className="dm-modal" onClick={e => e.stopPropagation()}>
              <div className="dm-modal-header">
                <div className="dm-modal-title-wrap">
                  <div className="dm-modal-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div>
                    <h2 className="dm-modal-title">{t('admin.database.action.backup') || 'Create Backup'}</h2>
                    <p className="dm-modal-sub">Full database snapshot</p>
                  </div>
                </div>
                <button className="dm-modal-close" onClick={() => setShowBackupModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="dm-modal-body">
                <div className="dm-modal-warning">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <p>This will create a full backup of the database. It may take several minutes depending on the database size.</p>
                </div>

                <div className="dm-modal-info-grid">
                  {[
                    { label:'Estimated Size', val:'~45 GB', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg> },
                    { label:'Estimated Time', val:'~12 min', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                    { label:'Destination',    val:'/backups/mysql/', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> },
                    { label:'Compression',   val:'gzip', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> },
                  ].map((item, i) => (
                    <div key={i} className="dm-modal-info-item">
                      <div className="dm-modal-info-label">
                        {item.icon}{item.label}
                      </div>
                      <div className="dm-modal-info-val">{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dm-modal-footer">
                <button className="dm-modal-cancel" onClick={() => setShowBackupModal(false)}>Cancel</button>
                <button className="dm-modal-start" onClick={executeBackup} disabled={backupRunning}>
                  {backupRunning
                    ? <><div className="dm-spin" />Running...</>
                    : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Start Backup</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DatabaseManagement;