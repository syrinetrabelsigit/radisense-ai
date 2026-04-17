import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/admin/ReportsGenerator.css';

const ReportsGenerator = () => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState('usage');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    type: 'usage', dateRange: 'month', format: 'pdf', frequency: 'once', recipients: ''
  });

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
  }, []);

  const reportTypes = [
    { id:'usage',       label: t('admin.reports.type.usage')       || 'Usage Analytics',   desc:'User engagement and system usage metrics',      color:'#8B5CF6', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id:'performance', label: t('admin.reports.type.performance') || 'Performance',        desc:'System performance and response times',           color:'#0066CC', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { id:'financial',   label: t('admin.reports.type.financial')   || 'Financial',          desc:'Revenue, subscriptions and billing data',         color:'#10B981', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
    { id:'user',        label: t('admin.reports.type.user')        || 'User Activity',      desc:'User registration and activity logs',             color:'#F59E0B', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { id:'ml',          label: t('admin.reports.type.ml')          || 'ML Model Report',   desc:'Model accuracy, predictions and diagnostics',     color:'#00BFA6', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
    { id:'security',    label: t('admin.reports.type.security')    || 'Security Audit',    desc:'Security events, threats and audit logs',         color:'#EF4444', icon:<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  ];

  const recentReports = [
    { id:1, name:'Monthly Usage Report - February 2026', type:'usage',       generated:'2026-02-20 14:30', size:'2.4 MB', format:'PDF',   status:'completed' },
    { id:2, name:'ML Performance Q1 2026',               type:'ml',          generated:'2026-02-18 10:15', size:'5.8 MB', format:'Excel', status:'completed' },
    { id:3, name:'Security Audit - Week 8',              type:'security',    generated:'2026-02-17 08:00', size:'1.2 MB', format:'PDF',   status:'completed' },
    { id:4, name:'Financial Summary - January',          type:'financial',   generated:'2026-02-15 16:45', size:'3.6 MB', format:'Excel', status:'completed' },
    { id:5, name:'User Activity Report',                 type:'user',        generated:'2026-02-20 15:00', size:'…',      format:'PDF',   status:'processing' },
  ];

  const scheduledReports = [
    { id:1, name:'Weekly Usage Summary',    type:'usage',     frequency:'weekly',  nextRun:'2026-02-27 09:00', recipients:'admin@radisense.ai',                       status:'active' },
    { id:2, name:'Monthly Financial Report',type:'financial', frequency:'monthly', nextRun:'2026-03-01 00:00', recipients:'finance@radisense.ai, admin@radisense.ai', status:'active' },
    { id:3, name:'Daily Security Audit',    type:'security',  frequency:'daily',   nextRun:'2026-02-21 02:00', recipients:'security@radisense.ai',                    status:'paused' },
  ];

  const statusCfg = {
    completed:  { color:'#10B981', bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)',  label: t('admin.reports.status.completed')  || 'Completed'  },
    processing: { color:'#F59E0B', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)',  label: t('admin.reports.status.processing') || 'Processing' },
    failed:     { color:'#EF4444', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)',   label: t('admin.reports.status.failed')     || 'Failed'     },
    active:     { color:'#10B981', bg:'rgba(16,185,129,0.12)',  border:'rgba(16,185,129,0.25)',  label: t('admin.reports.scheduled.active')  || 'Active'     },
    paused:     { color:'#F59E0B', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)',  label: t('admin.reports.scheduled.paused')  || 'Paused'     },
  };

  const formatColors = { PDF:'#EF4444', Excel:'#10B981', CSV:'#0066CC', JSON:'#8B5CF6' };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  const currentType = reportTypes.find(rt => rt.id === selectedType);

  return (
    <div className="rg-page">
      <div className="container">

        {/* HEADER */}
        <div className="rg-header" data-aos="fade-down">
          <div>
            <div className="rg-badge"><div className="rg-badge-dot"/><span>Admin Console</span></div>
            <h1 className="rg-title"><span className="rg-title-grad">{t('admin.reports.title') || 'Reports Generator'}</span></h1>
            <p className="rg-subtitle">{t('admin.reports.subtitle') || 'Generate, schedule and export system reports'}</p>
          </div>
        </div>

        {/* REPORT TYPES */}
        <div className="rg-section" data-aos="fade-up">
          <div className="rg-section-header">
            <h3 className="rg-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {t('admin.reports.types.title') || 'Select Report Type'}
            </h3>
            <p className="rg-section-sub">Choose the type of report to generate</p>
          </div>
          <div className="rg-types-grid">
            {reportTypes.map((type, i) => (
              <button key={type.id} className={`rg-type-card ${selectedType === type.id ? 'selected' : ''}`}
                style={{ '--rtc': type.color }}
                onClick={() => { setSelectedType(type.id); setReportConfig(c => ({ ...c, type: type.id })); }}
                data-aos="zoom-in" data-aos-delay={i * 70}
              >
                {selectedType === type.id && (
                  <div className="rg-selected-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                <div className="rg-type-icon" style={{ background: type.color, boxShadow: `0 8px 24px color-mix(in srgb, ${type.color} 40%, transparent)` }}>
                  {type.icon}
                </div>
                <h4 className="rg-type-label">{type.label}</h4>
                <p className="rg-type-desc">{type.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* CONFIGURATION */}
        <div className="rg-card rg-config-card" data-aos="fade-up">
          <div className="rg-card-header" style={{ '--rch': currentType?.color || '#0066CC' }}>
            <div className="rg-card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
            </div>
            <div>
              <h3 className="rg-card-title">{t('admin.reports.filters.title') || 'Report Configuration'}</h3>
              <p className="rg-card-sub">Customize your report parameters</p>
            </div>
          </div>
          <div className="rg-config-grid">
            {[
              { label: t('admin.reports.filters.dateRange') || 'Date Range', key:'dateRange', opts:[
                { val:'today',   lbl: t('admin.reports.range.today')   || 'Today' },
                { val:'week',    lbl: t('admin.reports.range.week')    || 'This Week' },
                { val:'month',   lbl: t('admin.reports.range.month')   || 'This Month' },
                { val:'quarter', lbl: t('admin.reports.range.quarter') || 'This Quarter' },
                { val:'year',    lbl: t('admin.reports.range.year')    || 'This Year' },
                { val:'custom',  lbl: t('admin.reports.range.custom')  || 'Custom Range' },
              ]},
              { label: t('admin.reports.filters.format') || 'Output Format', key:'format', opts:[
                { val:'pdf',   lbl: t('admin.reports.format.pdf')   || 'PDF Document' },
                { val:'excel', lbl: t('admin.reports.format.excel') || 'Excel Spreadsheet' },
                { val:'csv',   lbl: t('admin.reports.format.csv')   || 'CSV File' },
                { val:'json',  lbl: t('admin.reports.format.json')  || 'JSON Data' },
              ]},
              { label: t('admin.reports.filters.frequency') || 'Frequency', key:'frequency', opts:[
                { val:'once',    lbl: t('admin.reports.freq.once')    || 'One Time' },
                { val:'daily',   lbl: t('admin.reports.freq.daily')   || 'Daily' },
                { val:'weekly',  lbl: t('admin.reports.freq.weekly')  || 'Weekly' },
                { val:'monthly', lbl: t('admin.reports.freq.monthly') || 'Monthly' },
              ]},
            ].map((field, i) => (
              <div key={i} className="rg-config-field">
                <label className="rg-config-label">{field.label}</label>
                <select className="rg-select" value={reportConfig[field.key]} onChange={e => setReportConfig(c => ({ ...c, [field.key]: e.target.value }))}>
                  {field.opts.map(o => <option key={o.val} value={o.val}>{o.lbl}</option>)}
                </select>
              </div>
            ))}

            <div className="rg-config-field">
              <label className="rg-config-label">{t('admin.reports.filters.recipients') || 'Email Recipients'}</label>
              <div className="rg-email-wrap">
                <svg className="rg-email-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input type="email" className="rg-email-input" placeholder="email@example.com" value={reportConfig.recipients} onChange={e => setReportConfig(c => ({ ...c, recipients: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="rg-config-actions">
            <button className="rg-schedule-btn" onClick={() => setShowScheduleModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {t('admin.reports.schedule') || 'Schedule Report'}
            </button>
            <button className="rg-generate-btn" onClick={handleGenerate} disabled={generating}>
              {generating
                ? <><div className="rg-spin"/>Generating…</>
                : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>{t('admin.reports.generate') || 'Generate Report'}</>
              }
            </button>
          </div>
        </div>

        {/* RECENT REPORTS */}
        <div className="rg-card" data-aos="fade-up">
          <div className="rg-card-header" style={{ '--rch': '#0066CC' }}>
            <div className="rg-card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <h3 className="rg-card-title">{t('admin.reports.recent.title') || 'Recent Reports'}</h3>
              <p className="rg-card-sub">Previously generated reports</p>
            </div>
          </div>
          <div className="rg-table-wrap">
            <table className="rg-table">
              <thead>
                <tr>
                  <th>{t('admin.reports.recent.name')      || 'Report Name'}</th>
                  <th>{t('admin.reports.recent.type')      || 'Format'}</th>
                  <th>{t('admin.reports.recent.generated') || 'Generated'}</th>
                  <th>{t('admin.reports.recent.size')      || 'Size'}</th>
                  <th>{t('admin.reports.recent.status')    || 'Status'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r, i) => {
                  const rt = reportTypes.find(x => x.id === r.type);
                  const sc = statusCfg[r.status];
                  const fc = formatColors[r.format] || '#6B7280';
                  return (
                    <tr key={r.id} className="rg-table-row" data-aos="fade-right" data-aos-delay={i * 50}>
                      <td className="rg-name-cell">
                        <div className="rg-name-icon" style={{ color: rt?.color, background: `color-mix(in srgb, ${rt?.color} 12%, transparent)` }}>
                          {rt?.icon}
                        </div>
                        <span className="rg-name-text">{r.name}</span>
                      </td>
                      <td>
                        <span className="rg-format-tag" style={{ color: fc, background: `color-mix(in srgb, ${fc} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${fc} 25%, transparent)` }}>{r.format}</span>
                      </td>
                      <td className="rg-mono">{r.generated}</td>
                      <td className="rg-mono">{r.size}</td>
                      <td>
                        <div className="rg-status-pill" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                          {r.status === 'processing' && <div className="rg-proc-dot" style={{ background: sc.color }} />}
                          {r.status === 'completed'  && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          {sc.label}
                        </div>
                      </td>
                      <td>
                        {r.status === 'completed' && (
                          <button className="rg-dl-btn">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            {t('admin.reports.download') || 'Download'}
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

        {/* SCHEDULED REPORTS */}
        <div className="rg-card" data-aos="fade-up">
          <div className="rg-card-header" style={{ '--rch': '#8B5CF6' }}>
            <div className="rg-card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <h3 className="rg-card-title">{t('admin.reports.scheduled.title') || 'Scheduled Reports'}</h3>
              <p className="rg-card-sub">Automated report delivery</p>
            </div>
          </div>
          <div className="rg-scheduled-list">
            {scheduledReports.map((rep, i) => {
              const rt = reportTypes.find(x => x.id === rep.type);
              const sc = statusCfg[rep.status];
              return (
                <div key={rep.id} className="rg-sched-item" data-aos="fade-right" data-aos-delay={i * 70}>
                  <div className="rg-sched-left">
                    <div className="rg-sched-icon" style={{ color: rt?.color, background: `color-mix(in srgb, ${rt?.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${rt?.color} 20%, transparent)` }}>
                      {rt?.icon}
                    </div>
                    <div className="rg-sched-info">
                      <h4 className="rg-sched-name">{rep.name}</h4>
                      <div className="rg-sched-meta">
                        <span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                          {rep.frequency}
                        </span>
                        <span className="rg-dot">·</span>
                        <span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Next: {rep.nextRun}
                        </span>
                        <span className="rg-dot">·</span>
                        <span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          {rep.recipients}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rg-sched-actions">
                    <div className="rg-status-pill" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <div className="rg-proc-dot" style={{ background: sc.color }} />
                      {sc.label}
                    </div>
                    <button className="rg-sched-btn edit">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      {t('admin.reports.scheduled.edit') || 'Edit'}
                    </button>
                    <button className={`rg-sched-btn ${rep.status === 'active' ? 'pause' : 'resume'}`}>
                      {rep.status === 'active'
                        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      }
                      {rep.status === 'active' ? (t('admin.reports.scheduled.pause') || 'Pause') : 'Resume'}
                    </button>
                    <button className="rg-sched-btn delete">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      {t('admin.reports.scheduled.delete') || 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SCHEDULE MODAL */}
        {showScheduleModal && (
          <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
            <div className="rg-modal" onClick={e => e.stopPropagation()}>
              <div className="rg-modal-header">
                <div className="rg-modal-title-wrap">
                  <div className="rg-modal-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <h2 className="rg-modal-title">{t('admin.reports.schedule') || 'Schedule Report'}</h2>
                    <p className="rg-modal-sub">Configure automatic delivery</p>
                  </div>
                </div>
                <button className="rg-modal-close" onClick={() => setShowScheduleModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="rg-modal-body">
                <h4 className="rg-modal-summary-title">Report Summary</h4>
                <div className="rg-summary-grid">
                  {[
                    { label:'Type',       val: currentType?.label || reportConfig.type },
                    { label:'Format',     val: reportConfig.format.toUpperCase() },
                    { label:'Frequency',  val: t(`admin.reports.freq.${reportConfig.frequency}`) || reportConfig.frequency },
                    { label:'Recipients', val: reportConfig.recipients || 'Not set' },
                  ].map((item, i) => (
                    <div key={i} className="rg-summary-item">
                      <span className="rg-summary-label">{item.label}</span>
                      <span className="rg-summary-val">{item.val}</span>
                    </div>
                  ))}
                </div>

                <div className="rg-modal-info">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p>This report will be automatically generated and sent to the specified recipients based on the selected frequency.</p>
                </div>
              </div>

              <div className="rg-modal-footer">
                <button className="rg-modal-cancel" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button className="rg-modal-confirm" onClick={() => setShowScheduleModal(false)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Confirm Schedule
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReportsGenerator;