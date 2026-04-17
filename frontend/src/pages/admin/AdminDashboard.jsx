import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/admin/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [systemStatus] = useState({
    api: 'operational', database: 'operational',
    storage: 'operational', ml: 'operational'
  });
  const [systemStats, setSystemStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchSystemStats();
    fetchRecentActivity();
  }, []);

  // ✅ Recharge les activités quand la langue change
  useEffect(() => {
    if (systemStats) { // Seulement si les stats sont déjà chargées
      fetchRecentActivity();
    }
  }, [i18n.language]);

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/system/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setSystemStats(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch system stats:', err);
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/audit-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      const activities = data.logs.slice(0, 5).map(log => {
        const timestamp = new Date(log.timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - timestamp) / 60000);

        let timeAgo;
        const isFrench = i18n.language === 'fr';
        
        if (diffMinutes < 1) {
          timeAgo = isFrench ? 'À l\'instant' : 'Just now';
        } else if (diffMinutes < 60) {
          timeAgo = isFrench 
            ? `Il y a ${diffMinutes} min` 
            : `${diffMinutes} min ago`;
        } else if (diffMinutes < 1440) {
          const hours = Math.floor(diffMinutes / 60);
          timeAgo = isFrench 
            ? `Il y a ${hours} h` 
            : `${hours} hr ago`;
        } else {
          const days = Math.floor(diffMinutes / 1440);
          timeAgo = isFrench 
            ? `Il y a ${days} jour${days > 1 ? 's' : ''}` 
            : `${days} day${days > 1 ? 's' : ''} ago`;
        }

        const statusText = log.status === 'completed' 
          ? (isFrench ? 'Analyse terminée' : 'Analysis completed')
          : (isFrench ? 'Analyse en cours' : 'Analysis pending');

        return {
          id: log.id,
          user: log.user_name || (isFrench ? `Utilisateur #${log.user_id}` : `User #${log.user_id}`),
          action: statusText,
          time: timeAgo,
          type: log.status === 'completed' 
            ? (isFrench ? 'Analyse' : 'Analysis')
            : (isFrench ? 'Système' : 'System'),
          color: log.status === 'completed' ? '#10B981' : '#F59E0B',
          icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          )
        };
      });

      setRecentActivity(activities);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
    }
  };

  // ✅ Défini DANS le composant pour accéder à t() et systemStats
  const stats = systemStats ? [
    {
      label: t('admin.stats.totalUsers'),
      value: systemStats.users?.total?.toLocaleString() || '0',
      change: '+12.5%',
      trend: 'up',
      color: '#8B5CF6',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      )
    },
    {
      label: t('admin.stats.totalAnalyses'),
      value: systemStats.analyses?.total?.toLocaleString() || '0',
      change: '+8.2%',
      trend: 'up',
      color: '#0066CC',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      )
    },
    {
      label: t('dashboard.stats.patients'),
      value: systemStats.patients?.total?.toLocaleString() || '0',
      change: '+15.3%',
      trend: 'up',
      color: '#10B981',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      )
    },
    {
      label: t('analytics.stats.totalAnalyses'),
      value: systemStats.analyses?.today?.toLocaleString() || '0',
      change: '+5.1%',
      trend: 'up',
      color: '#F59E0B',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        </svg>
      )
    },
  ] : [];

  // ✅ Défini DANS le composant pour accéder à t()
  const quickActions = [
    {
      label: t('admin.actions.manageUsers'),
      path: '/admin/users',
      color: '#8B5CF6',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      )
    },
    {
      label: 'Access Requests',
      path: '/admin/requests',
      color: '#F59E0B',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      )
    },
    {
      label: t('patients.title'),
      path: '/admin/patients',
      color: '#10B981',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
      )
    },
    {
      label: t('admin.logs.title'),
      path: '/admin/logs',
      color: '#0066CC',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      )
    },
  ];

  const statusConfig = {
    operational: { color: '#10B981', label: t('admin.system.operational'), pct: 100 },
    warning:     { color: '#F59E0B', label: t('admin.system.warning'),     pct: 60  },
    error:       { color: '#EF4444', label: t('admin.system.error'),       pct: 30  },
  };

  // ✅ Défini DANS le composant pour accéder à t()
  const systemServices = [
    {
      key: 'api',
      name: t('admin.system.api'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      )
    },
    {
      key: 'database',
      name: t('admin.system.database'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>
      )
    },
    {
      key: 'storage',
      name: t('admin.system.storage'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/>
          <line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
      )
    },
    {
      key: 'ml',
      name: t('admin.system.ml'),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a9.96 9.96 0 00-7.07 2.93C2.11 7.75 1 10.76 1 14a11 11 0 0022 0c0-3.24-1.11-6.25-3.93-9.07A9.96 9.96 0 0012 2z"/>
        </svg>
      )
    },
  ];

  if (loading) {
    return (
      <div className="ad-page">
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', border: '4px solid var(--border-primary)', borderTopColor: '#0066CC', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{t('admin.dashboard.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ad-page">
      <div className="container">

        {/* HEADER */}
        <div className="ad-header" data-aos="fade-down">
          <div className="ad-header-left">
            <div className="ad-badge">
              <div className="ad-badge-dot" />
              <span>{t('admin.dashboard.title')}</span>
            </div>
            <h1 className="ad-title">
              <span className="ad-title-grad">{t('admin.dashboard.title')}</span>
            </h1>
            <p className="ad-subtitle">{t('admin.dashboard.subtitle')}</p>
          </div>
          <div className="ad-admin-crown">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {t('navbar.admin')}
          </div>
        </div>

        {/* STATS */}
        <div className="ad-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="ad-stat-card" data-aos="fade-up" data-aos-delay={i * 80}>
              <div className="ad-stat-icon" style={{ background: s.color, boxShadow: `0 10px 28px color-mix(in srgb, ${s.color} 40%, transparent)` }}>
                {s.icon}
              </div>
              <div className="ad-stat-body">
                <span className="ad-stat-label">{s.label}</span>
                <span className="ad-stat-value">{s.value}</span>
                <div className="ad-stat-change">
                  <span className={`ad-change-pill ${s.trend}`}>
                    {s.trend === 'up'
                      ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    }
                    {s.change}
                  </span>
                  <span className="ad-change-period">{t('dashboard.stats.change.month')}</span>
                </div>
              </div>
              <div className="ad-stat-glow" style={{ background: s.color }} />
            </div>
          ))}
        </div>

        {/* MIDDLE GRID */}
        <div className="ad-mid-grid">

          {/* QUICK ACTIONS */}
          <div className="ad-card" data-aos="fade-right">
            <div className="ad-card-header" style={{ '--ch': '#8B5CF6' }}>
              <div className="ad-card-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div>
                <h3 className="ad-card-title">{t('admin.actions.title')}</h3>
                <p className="ad-card-sub">{t('admin.dashboard.subtitle')}</p>
              </div>
            </div>
            <div className="ad-actions-grid">
              {quickActions.map((a, i) => (
                <button key={i} className="ad-action-btn" style={{ '--ab': a.color }} onClick={() => navigate(a.path)}>
                  <div className="ad-action-icon">{a.icon}</div>
                  <span className="ad-action-label">{a.label}</span>
                  <svg className="ad-action-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* SYSTEM STATUS */}
          <div className="ad-card" data-aos="fade-left">
            <div className="ad-card-header" style={{ '--ch': '#10B981' }}>
              <div className="ad-card-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h3 className="ad-card-title">{t('admin.system.title')}</h3>
                <p className="ad-card-sub">{t('admin.monitoring.subtitle')}</p>
              </div>
            </div>
            <div className="ad-status-list">
              {systemServices.map((svc) => {
                const cfg = statusConfig[systemStatus[svc.key]];
                return (
                  <div key={svc.key} className="ad-status-item">
                    <div className="ad-status-left">
                      <div className="ad-status-svc-icon" style={{ color: cfg.color, background: `color-mix(in srgb, ${cfg.color} 12%, transparent)` }}>
                        {svc.icon}
                      </div>
                      <span className="ad-status-name">{svc.name}</span>
                    </div>
                    <div className="ad-status-right">
                      <div className="ad-status-pill" style={{ color: cfg.color, background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)` }}>
                        <div className="ad-status-dot" style={{ background: cfg.color }} />
                        {cfg.label}
                      </div>
                    </div>
                    <div className="ad-status-bar-wrap">
                      <div className="ad-status-bar">
                        <div className="ad-status-fill" style={{ width: `${cfg.pct}%`, background: cfg.color }} />
                      </div>
                      <span className="ad-status-pct" style={{ color: cfg.color }}>{cfg.pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="ad-uptime-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{t('admin.system.operational')} — <strong>{t('admin.stats.uptime')}</strong></span>
            </div>
          </div>

        </div>

        {/* RECENT ACTIVITY */}
        <div className="ad-card ad-activity-card" data-aos="fade-up">
          <div className="ad-activity-header">
            <div className="ad-card-header" style={{ '--ch': '#0066CC', marginBottom: 0 }}>
              <div className="ad-card-icon-wrap">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div>
                <h3 className="ad-card-title">{t('admin.activity.title')}</h3>
                <p className="ad-card-sub">{t('admin.logs.subtitle')}</p>
              </div>
            </div>
            <button className="ad-view-all-btn" onClick={() => navigate('/admin/logs')}>
              {t('admin.activity.viewAll')}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div className="ad-activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, i) => (
                <div key={act.id} className="ad-activity-item" data-aos="fade-right" data-aos-delay={i * 60}>
                  <div className="ad-activity-icon" style={{ color: act.color, background: `color-mix(in srgb, ${act.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${act.color} 20%, transparent)` }}>
                    {act.icon}
                  </div>
                  <div className="ad-activity-body">
                    <div className="ad-activity-text">
                      <strong>{act.user}</strong> {act.action}
                    </div>
                    <div className="ad-activity-time">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {act.time}
                    </div>
                  </div>
                  <div className="ad-activity-type" style={{ color: act.color, background: `color-mix(in srgb, ${act.color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${act.color} 20%, transparent)` }}>
                    {act.type}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {t('dashboard.recent')}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;