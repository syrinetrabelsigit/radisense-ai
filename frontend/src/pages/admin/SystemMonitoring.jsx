import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/admin/SystemMonitoring.css';

const SystemMonitoring = () => {
  const { t } = useTranslation();

  const [metrics, setMetrics] = useState({ cpu: 45, memory: 62, disk: 38, network: 128 });
  const [liveStats, setLiveStats] = useState({ activeUsers: 187, requestsPerMin: 924, avgResponseTime: 143, errorRate: 0.12 });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    const interval = setInterval(() => {
      setMetrics({
        cpu:     Math.floor(Math.random() * 30) + 40,
        memory:  Math.floor(Math.random() * 20) + 55,
        disk:    Math.floor(Math.random() * 10) + 35,
        network: Math.floor(Math.random() * 50) + 100,
      });
      setLiveStats({
        activeUsers:     Math.floor(Math.random() * 50)  + 150,
        requestsPerMin:  Math.floor(Math.random() * 200) + 800,
        avgResponseTime: Math.floor(Math.random() * 50)  + 120,
        errorRate:       parseFloat((Math.random() * 0.5).toFixed(2)),
      });
      setPulse(p => !p);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { name: t('admin.monitoring.apiServer') || 'API Server', status:'operational', uptime:'99.9%', lastCheck:'2s ago', port:'8000', color:'#10B981' },
    { name: t('admin.monitoring.database')  || 'Database',   status:'operational', uptime:'99.8%', lastCheck:'5s ago', port:'3307', color:'#0066CC' },
    { name: t('admin.monitoring.mlflow')    || 'ML Service', status:'operational', uptime:'99.7%', lastCheck:'3s ago', port:'5000', color:'#8B5CF6' },
    { name: t('admin.monitoring.redis')     || 'Redis Cache', status:'operational', uptime:'100%', lastCheck:'1s ago', port:'6379', color:'#F59E0B' },
    { name: t('admin.monitoring.nginx')     || 'Nginx',      status:'operational', uptime:'99.9%', lastCheck:'2s ago', port:'80',   color:'#00BFA6' },
  ];

  const logs = [
    { id:1, level:'info',    message:'User authentication successful',    timestamp:'2026-02-20 14:32:15', service:'API'      },
    { id:2, level:'info',    message:'New analysis request processed',    timestamp:'2026-02-20 14:31:45', service:'ML'       },
    { id:3, level:'warning', message:'High memory usage detected (78%)',  timestamp:'2026-02-20 14:30:22', service:'System'   },
    { id:4, level:'info',    message:'Database backup completed',         timestamp:'2026-02-20 14:28:10', service:'Database' },
    { id:5, level:'error',   message:'Failed to connect to external API', timestamp:'2026-02-20 14:25:33', service:'API'      },
  ];

  const metricColor = v => v < 50 ? '#10B981' : v < 75 ? '#F59E0B' : '#EF4444';

  const levelCfg = {
    info:    { color:'#0066CC', bg:'rgba(0,102,204,0.12)',   border:'rgba(0,102,204,0.25)',   label:'Info'    },
    warning: { color:'#F59E0B', bg:'rgba(245,158,11,0.12)',  border:'rgba(245,158,11,0.25)',  label:'Warning' },
    error:   { color:'#EF4444', bg:'rgba(239,68,68,0.12)',   border:'rgba(239,68,68,0.25)',   label:'Error'   },
  };

  const liveStatItems = [
    { label: t('admin.monitoring.activeUsers')     || 'Active Users',      val: liveStats.activeUsers,                    color:'#8B5CF6',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { label: t('admin.monitoring.requestsPerMin')  || 'Requests / Min',    val: liveStats.requestsPerMin,                 color:'#0066CC',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
    { label: t('admin.monitoring.avgResponseTime') || 'Avg Response',      val: `${liveStats.avgResponseTime}ms`,         color:'#10B981',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: t('admin.monitoring.errorRate')       || 'Error Rate',        val: `${liveStats.errorRate}%`,                color:'#F59E0B',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  ];

  const metricsConfig = [
    { label: t('admin.monitoring.cpu')     || 'CPU Usage',    key:'cpu',     unit:'%',    color: metricColor(metrics.cpu),    pct: metrics.cpu,
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg> },
    { label: t('admin.monitoring.memory')  || 'Memory',       key:'memory',  unit:'%',    color: metricColor(metrics.memory), pct: metrics.memory,
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 19v-3"/><path d="M10 19v-3"/><path d="M14 19v-3"/><path d="M18 19v-3"/><rect x="2" y="6" width="20" height="10" rx="2"/></svg> },
    { label: t('admin.monitoring.disk')    || 'Disk Usage',   key:'disk',    unit:'%',    color: metricColor(metrics.disk),   pct: metrics.disk,
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
    { label: t('admin.monitoring.network') || 'Network I/O',  key:'network', unit:' MB/s', color:'#0066CC',                   pct: Math.min(metrics.network / 2, 100),
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  ];

  return (
    <div className="sm-page">
      <div className="container">

        {/* HEADER */}
        <div className="sm-header" data-aos="fade-down">
          <div>
            <div className="sm-badge"><div className="sm-badge-dot"/><span>Live Monitoring</span></div>
            <h1 className="sm-title"><span className="sm-title-grad">{t('admin.monitoring.title') || 'System Monitoring'}</span></h1>
            <p className="sm-subtitle">{t('admin.monitoring.subtitle') || 'Real-time system health and performance'}</p>
          </div>
          <div className="sm-header-actions">
            <button className="sm-refresh-btn" onClick={() => window.location.reload()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
              Refresh
            </button>
            <button className="sm-export-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t('admin.monitoring.exportLogs') || 'Export Logs'}
            </button>
          </div>
        </div>

        {/* LIVE BANNER */}
        <div className="sm-live-banner" data-aos="fade-up">
          <div className="sm-live-pill">
            <div className="sm-live-dot" />
            LIVE
          </div>
          <div className="sm-live-grid">
            {liveStatItems.map((s, i) => (
              <div key={i} className="sm-live-stat" style={{ '--lsc': s.color }}>
                <div className="sm-live-icon">{s.icon}</div>
                <div className="sm-live-body">
                  <span className="sm-live-val">{s.val}</span>
                  <span className="sm-live-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PERFORMANCE METRICS */}
        <div className="sm-card" data-aos="fade-up">
          <div className="sm-card-header" style={{ '--sch': '#0066CC' }}>
            <div className="sm-card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <div>
              <h3 className="sm-card-title">{t('admin.monitoring.performance') || 'System Performance'}</h3>
              <p className="sm-card-sub">Live resource utilization — updates every 3s</p>
            </div>
            <div className="sm-updating-pill">
              <div className="sm-updating-dot" />
              Updating…
            </div>
          </div>
          <div className="sm-metrics-grid">
            {metricsConfig.map((m, i) => (
              <div key={i} className="sm-metric-card">
                <div className="sm-metric-top">
                  <div className="sm-metric-icon" style={{ color: m.color, background: `color-mix(in srgb, ${m.color} 12%, transparent)` }}>{m.icon}</div>
                  <div>
                    <span className="sm-metric-label">{m.label}</span>
                    <span className="sm-metric-val" style={{ color: m.color }}>{metrics[m.key]}{m.unit}</span>
                  </div>
                </div>
                <div className="sm-metric-bar-wrap">
                  <div className="sm-metric-bar">
                    <div className="sm-metric-fill" style={{ width: `${m.pct}%`, background: m.color, boxShadow: `0 0 10px color-mix(in srgb, ${m.color} 40%, transparent)` }} />
                  </div>
                  <span className="sm-metric-pct" style={{ color: m.color }}>{Math.round(m.pct)}%</span>
                </div>
                <div className="sm-metric-status">
                  <div className="sm-metric-status-dot" style={{ background: m.color }} />
                  <span>{m.pct < 50 ? 'Normal' : m.pct < 75 ? 'Elevated' : 'Critical'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SERVICES */}
        <div className="sm-card" data-aos="fade-up">
          <div className="sm-card-header" style={{ '--sch': '#10B981' }}>
            <div className="sm-card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
            </div>
            <div>
              <h3 className="sm-card-title">{t('admin.monitoring.services') || 'Service Status'}</h3>
              <p className="sm-card-sub">All {services.length} services operational</p>
            </div>
            <div className="sm-all-ok">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              All Systems Go
            </div>
          </div>
          <div className="sm-services-list">
            {services.map((svc, i) => (
              <div key={i} className="sm-service-item" data-aos="fade-right" data-aos-delay={i * 70}>
                <div className="sm-svc-indicator" style={{ background: svc.color }} />
                <div className="sm-svc-icon" style={{ color: svc.color, background: `color-mix(in srgb, ${svc.color} 12%, transparent)` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                </div>
                <div className="sm-svc-body">
                  <div className="sm-svc-name-row">
                    <span className="sm-svc-name">{svc.name}</span>
                    <span className="sm-svc-port">:{svc.port}</span>
                  </div>
                  <div className="sm-svc-meta">
                    <span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                      Uptime {svc.uptime}
                    </span>
                    <span className="sm-dot">·</span>
                    <span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {svc.lastCheck}
                    </span>
                  </div>
                </div>
                <div className="sm-svc-status" style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <div className="sm-svc-status-dot" />
                  Operational
                </div>
                <button className="sm-restart-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                  {t('admin.monitoring.restart') || 'Restart'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* LOGS */}
        <div className="sm-card" data-aos="fade-up">
          <div className="sm-card-header" style={{ '--sch': '#8B5CF6' }}>
            <div className="sm-card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <h3 className="sm-card-title">{t('admin.monitoring.recentLogs') || 'Recent Logs'}</h3>
              <p className="sm-card-sub">Latest system events</p>
            </div>
            <button className="sm-view-all-btn">
              {t('admin.monitoring.viewAllLogs') || 'View All'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div className="sm-logs-list">
            {logs.map((log, i) => {
              const lc = levelCfg[log.level];
              return (
                <div key={log.id} className="sm-log-item" data-aos="fade-right" data-aos-delay={i * 60}>
                  <div className="sm-log-level" style={{ color: lc.color, background: lc.bg, border: `1px solid ${lc.border}` }}>
                    {log.level === 'info'    && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                    {log.level === 'warning' && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>}
                    {log.level === 'error'   && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
                    {lc.label}
                  </div>
                  <div className="sm-log-body">
                    <span className="sm-log-msg">{log.message}</span>
                    <div className="sm-log-meta">
                      <span className="sm-log-service" style={{ color: lc.color }}>{log.service}</span>
                      <span className="sm-dot">·</span>
                      <span className="sm-log-ts">{log.timestamp}</span>
                    </div>
                  </div>
                  <div className="sm-log-dot" style={{ background: lc.color }} />
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SystemMonitoring;