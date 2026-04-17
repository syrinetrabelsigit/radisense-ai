import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analyticsService } from '../../services/analyticsService';
import { patientService } from '../../services/patientService';
import '../../styles/pages/radiologist/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAnalyses:0, accuracy:0, patients:0, pending:0 });
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [topPathologies, setTopPathologies] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      // Fetch dashboard stats from backend
      const dashboardData = await analyticsService.getDashboardStats();
      
      // Fetch total patients count
      const patientsData = await patientService.getPatients({ limit: 0 });
      
      setStats({
        totalAnalyses: dashboardData.total_predictions,
        accuracy: dashboardData.success_rate,
        patients: patientsData.total || 0,
        pending: dashboardData.total_predictions - Math.floor(dashboardData.total_predictions * dashboardData.success_rate / 100)
      });

      // Transform recent predictions for display
      setRecentAnalyses(dashboardData.recent_predictions.map(a => ({
        id: a.id,
        patient: `Patient #${a.id}`,
        date: a.created_at,
        pathology: a.predictions && a.predictions.length > 0 ? a.predictions[0].toLowerCase() : 'normal',        confidence: 85, // Default confidence
        status: a.status
      })));

      setTopPathologies(dashboardData.top_pathologies || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      // Fallback to mock data if backend fails
      setStats({ totalAnalyses:0, accuracy:0, patients:0, pending:0 });
      setRecentAnalyses([]);
      setLoading(false);
    }
  };

  const statusCfg = {
    completed: { color:'#10B981', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)', label: t('dashboard.status.completed') || 'Completed' },
    pending:   { color:'#F59E0B', bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.25)', label: t('dashboard.status.pending')   || 'Pending'   },
    failed:    { color:'#EF4444', bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.25)',  label: t('dashboard.status.failed')    || 'Failed'    },
  };

  const monthlyBars = [
    { label:'Jan', h:40 }, { label:'Feb', h:55 }, { label:'Mar', h:45 },
    { label:'Apr', h:70 }, { label:'May', h:65 }, { label:'Jun', h:80 },
  ];

  const statCards = [
    { label: t('dashboard.stats.totalAnalyses') || 'Total Analyses', val: stats.totalAnalyses, sub:`${t('dashboard.stats.change.total')||'Total predictions'}`, color:'#8B5CF6', positive:true,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { label: t('dashboard.stats.accuracy') || 'Success Rate',      val:`${stats.accuracy.toFixed(1)}%`, sub:`${t('dashboard.stats.change.completed')||'Completed rate'}`, color:'#0066CC', positive:true,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: t('dashboard.stats.patients') || 'Patients',          val: stats.patients,      sub:`${t('dashboard.stats.change.total')||'Total patients'}`, color:'#10B981', positive:true,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { label: t('dashboard.stats.pending') || 'Incomplete',         val: stats.pending,       sub: t('dashboard.stats.change.awaiting')||'Failed analyses', color:'#F59E0B', positive:false,
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  ];

  const quickActions = [
    { path:'/upload',    icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>, color:'#0066CC', title: t('dashboard.action.upload.title')||'Upload X-Ray',   desc: t('dashboard.action.upload.desc')   ||'Analyse a new image' },
    { path:'/patients',  icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, color:'#10B981', title: t('dashboard.action.patients.title')||'My Patients',   desc: t('dashboard.action.patients.desc') ||'Manage patients' },
    { path:'/analytics', icon:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, color:'#8B5CF6', title: t('dashboard.action.analytics.title')||'Analytics',     desc: t('dashboard.action.analytics.desc')||'View insights' },
  ];

  if (loading) return (
    <div className="db-page">
      <div className="container">
        <div className="db-loading">
          <div className="db-spin-rings">
            <div className="db-ring r1"/><div className="db-ring r2"/><div className="db-ring r3"/>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'relative',zIndex:1}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <p className="db-loading-label">Loading dashboard…</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="db-page">
      <div className="container">

        {/* HEADER */}
        <div className="db-header">
          <div>
            <div className="db-badge"><div className="db-badge-dot"/><span>{t('dashboard.badge') || 'Radiologist Portal'}</span></div>            <h1 className="db-title">
              {t('dashboard.welcome') || 'Welcome back'}, <span className="db-title-grad">{t('navbar.doctor') || 'Doctor'}</span>
            </h1>
            <p className="db-subtitle">{t('dashboard.subtitle') || "Here's your activity overview"}</p>
          </div>
          <button className="db-new-btn" onClick={() => navigate('/upload')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t('dashboard.newAnalysis') || 'New Analysis'}
          </button>
        </div>

        {/* STATS */}
        <div className="db-stats-grid">
          {statCards.map((s, i) => (
            <div key={i} className="db-stat-card" style={{ '--dsc': s.color }}>
              <div className="db-stat-glow" style={{ background: s.color }}/>
              <div className="db-stat-icon" style={{ background: s.color, boxShadow:`0 8px 24px color-mix(in srgb, ${s.color} 40%, transparent)` }}>{s.icon}</div>
              <div className="db-stat-body">
                <p className="db-stat-label">{s.label}</p>
                <h3 className="db-stat-val">{s.val}</h3>
                <div className={`db-stat-sub ${s.positive ? 'pos' : 'neutral'}`}>
                  {s.positive && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>}
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* QUICK ACTIONS */}
        <div className="db-section">
          <div className="db-section-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {t('dashboard.quickActions') || 'Quick Actions'}
          </div>
          <div className="db-actions-grid">
            {quickActions.map((a, i) => (
              <button key={i} className="db-action-card" style={{ '--dac': a.color }} onClick={() => navigate(a.path)}>
                <div className="db-action-icon" style={{ color: a.color, background:`color-mix(in srgb, ${a.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${a.color} 20%, transparent)` }}>{a.icon}</div>
                <h3 className="db-action-title">{a.title}</h3>
                <p className="db-action-desc">{a.desc}</p>
                <div className="db-action-arrow" style={{ color: a.color }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RECENT ANALYSES */}
        <div className="db-section">
          <div className="db-section-row">
            <div className="db-section-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {t('dashboard.recent') || 'Recent Analyses'}
            </div>
            <button className="db-view-all" onClick={() => navigate('/analytics')}>
              {t('dashboard.viewAll') || 'View All'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          <div className="db-table-card">
            {recentAnalyses.length > 0 ? (
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>{t('dashboard.table.patient')    || 'Patient'}</th>
                      <th>{t('dashboard.table.date')       || 'Date'}</th>
                      <th>{t('dashboard.table.pathology')  || 'Pathology'}</th>
                      <th>{t('dashboard.table.confidence') || 'Confidence'}</th>
                      <th>{t('dashboard.table.status')     || 'Status'}</th>
                      <th>{t('dashboard.table.actions')    || 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAnalyses.map((a, i) => {
                      const sc = statusCfg[a.status];
                      const isNormal = a.pathology === 'normal';
                      const confColor = a.confidence >= 85 ? '#10B981' : a.confidence >= 70 ? '#F59E0B' : '#EF4444';
                      return (
                        <tr key={a.id} className="db-row">
                          <td>
                            <div className="db-patient-cell">
                              <div className="db-patient-avatar">{a.patient.split(' ').map(w=>w[0]).join('')}</div>
                              <span className="db-patient-name">{a.patient}</span>
                            </div>
                          </td>
                          <td className="db-date">{new Date(a.date).toLocaleDateString()}</td>
                          <td>
                            <span className="db-path-pill" style={{ color: isNormal?'#10B981':'#EF4444', background: isNormal?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.12)', border:`1px solid ${isNormal?'rgba(16,185,129,0.25)':'rgba(239,68,68,0.25)'}` }}>
                            {t(`results.pathology.${a.pathology}`) || a.pathology.charAt(0).toUpperCase() + a.pathology.slice(1)}                            </span>
                          </td>
                          <td>
                            <div className="db-conf-wrap">
                              <div className="db-conf-bar">
                                <div className="db-conf-fill" style={{ width:`${a.confidence}%`, background: confColor }}/>
                              </div>
                              <span className="db-conf-val" style={{ color: confColor }}>{a.confidence}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="db-status-pill" style={{ color:sc.color, background:sc.bg, border:`1px solid ${sc.border}` }}>
                              <div className="db-status-dot" style={{ background:sc.color }}/>
                              {sc.label}
                            </span>
                          </td>
                          <td>
                            <button className="db-view-btn" onClick={() => navigate(`/results/${a.id}`)}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              {t('dashboard.table.view') || 'View'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="db-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin:'0 auto 1rem', opacity:0.3 }}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <p>No analyses yet. Upload an X-ray to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* CHARTS */}
        <div className="db-section">
          <div className="db-section-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
            {t('dashboard.charts.title') || 'Performance Charts'}
          </div>
          <div className="db-charts-grid">

            {/* BAR CHART */}
            <div className="db-chart-card">
              <h3 className="db-chart-title">{t('dashboard.charts.monthly') || 'Monthly Analyses'}</h3>
              <div className="db-bar-chart">
                {monthlyBars.map((b, i) => (
                  <div key={i} className="db-bar-col">
                    <div className="db-bar-track">
                      <div className="db-bar-fill" style={{ height:`${b.h}%` }}>
                        <span className="db-bar-tip">{b.h}</span>
                      </div>
                    </div>
                    <span className="db-bar-label">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DONUT CHART */}
            <div className="db-chart-card">
              <h3 className="db-chart-title">{t('dashboard.charts.distribution') || 'Top Pathologies'}</h3>
              <div className="db-donut-wrap">
                <div className="db-donut">
                  <div className="db-donut-center">
                    <span className="db-donut-val">{topPathologies.length}</span>
                    <span className="db-donut-sub">{t('dashboard.charts.pathologies') || 'Detected'}</span>
                  </div>
                </div>
                <div className="db-legend">
                  {topPathologies.slice(0, 3).map((l, i) => {
                    console.log('pathology raw:', JSON.stringify(l));
                    const colors = ['#EF4444', '#F59E0B', '#10B981'];
                    return (
                      <div key={i} className="db-legend-item">
                        <div className="db-legend-dot" style={{ background: colors[i] }}/>
                        <span>{t(`results.pathology.${l.name.toLowerCase().replace(/[^a-z]/g, '')}`) || l.name}</span>                        <span className="db-legend-pct" style={{ color: colors[i] }}>{l.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;