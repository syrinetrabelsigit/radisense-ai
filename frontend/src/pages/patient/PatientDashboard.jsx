import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/patient/PatientDashboard.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [userRes, apptRes, analysesRes] = await Promise.all([
        fetch('http://localhost:8000/api/users/me', { headers: getHeaders() }),
        fetch('http://localhost:8000/api/appointments/my-appointments', { headers: getHeaders() }),
        fetch('http://localhost:8000/api/predict/my-patient-analyses?skip=0&limit=1000', { headers: getHeaders() }),
      ]);

      const userData     = userRes.ok     ? await userRes.json()     : null;
      const apptData     = apptRes.ok     ? await apptRes.json()     : { upcoming: [], past: [] };
      const analysesData = analysesRes.ok ? await analysesRes.json() : { total: 0, analyses: [] };

      const allAnalyses = analysesData.analyses || [];
      const pending     = allAnalyses.filter(a => a.status === 'pending').length;

      setPatientData({
        name: userData ? `${userData.first_name} ${userData.last_name}` : 'Patient',
        age: userData?.date_of_birth ? new Date().getFullYear() - new Date(userData.date_of_birth).getFullYear() : null,
        stats: {
          totalAnalyses:  analysesData.total || 0,
          pendingResults: pending,
          appointments: apptData.upcoming?.filter(a => a.status === 'pending' || a.status === 'confirmed').length || 0,
          reports:        apptData.past?.length || 0,
        },
        recentAnalyses:  allAnalyses.slice(0, 3),
        nextAppointment: apptData.upcoming?.find(a => a.status === 'pending' || a.status === 'confirmed') || null,      });
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="pd-page">
      <div className="pd-loader-wrap">
        <div className="pd-loader-ring" />
        <p>{t('patient.dashboard.loading') || 'Loading your dashboard...'}</p>
      </div>
    </div>
  );

  if (!patientData) return null;

  const stats = [
    { label: t('patient.stats.totalAnalyses') || 'Total Analyses', value: patientData.stats.totalAnalyses, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, color: '#0066CC', delay: 0 },
    { label: t('patient.stats.pendingResults') || 'Pending Results', value: patientData.stats.pendingResults, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, color: '#F59E0B', delay: 80 },
    { label: t('patient.stats.appointments') || 'Appointments', value: patientData.stats.appointments, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, color: '#10B981', delay: 160 },
    { label: t('patient.stats.reports') || 'Medical Reports', value: patientData.stats.reports, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>, color: '#8B5CF6', delay: 240 },
  ];

  const actions = [
    { label: t('patient.actions.bookAppointment') || 'Book Appointment', path: '/patient/appointments', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, color: '#0066CC' },
    { label: t('patient.actions.viewRecords') || 'Medical Records', path: '/patient/records', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, color: '#10B981' },
    { label: t('patient.actions.viewAnalyses') || 'My Analyses', path: '/patient/analyses', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, color: '#00BFA6' },
    { label: t('patient.actions.contact') || 'My Radiologists', path: '/patient/radiologists', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, color: '#8B5CF6' },
  ];

  // ── Helper: parse appointment date safely ──
  const parseApptDate = (raw) => {
    if (!raw) return null;
    // Handle "2026-04-15" format
    const d = new Date(raw.includes('T') ? raw : raw + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  };

  const apptDate = patientData.nextAppointment
    ? parseApptDate(patientData.nextAppointment.date)
    : null;

  return (
    <div className="pd-page">
      <div className="container">

        {/* HERO HEADER */}
        <div className="pd-header" data-aos="fade-down">
          <div className="pd-header-left">
            <div className="pd-header-badge">
              <div className="pd-badge-dot" />
              <span>Patient Portal</span>
            </div>
            <h1 className="pd-welcome">
              {t('patient.dashboard.welcome') || 'Welcome back'},<br/>
              <span className="pd-name-gradient">{patientData.name}</span>
            </h1>
            <p className="pd-subtitle">{t('patient.dashboard.subtitle') || 'Track your medical analyses and health records'}</p>
          </div>
          <div className="pd-avatar-wrap">
            <div className="pd-avatar">
              {patientData.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="pd-avatar-ring" />
          </div>
        </div>

        {/* STATS */}
        <div className="pd-stats-grid">
          {stats.map((s, i) => (
            <div className="pd-stat-card" key={i} data-aos="fade-up" data-aos-delay={s.delay}>
              <div className="pd-stat-icon" style={{ '--stat-color': s.color }}>
                {s.icon}
              </div>
              <div className="pd-stat-body">
                <span className="pd-stat-label">{s.label}</span>
                <span className="pd-stat-value" style={{ color: s.color }}>{s.value}</span>
              </div>
              <div className="pd-stat-glow" style={{ background: s.color }} />
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="pd-main-grid">

          {/* Quick Actions */}
          <div className="pd-actions-card" data-aos="fade-right">
            <div className="pd-card-header">
              <h3 className="pd-card-title">{t('patient.actions.title') || 'Quick Actions'}</h3>
              <div className="pd-card-line" />
            </div>
            <div className="pd-actions-grid">
              {actions.map((a, i) => (
                <button key={i} className="pd-action-btn" onClick={() => navigate(a.path)}>
                  <div className="pd-action-icon" style={{ '--action-color': a.color }}>
                    {a.icon}
                  </div>
                  <span className="pd-action-label">{a.label}</span>
                  <svg className="pd-action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Next Appointment */}
          <div className={`pd-appt-card ${!patientData.nextAppointment ? 'pd-appt-empty' : ''}`} data-aos="fade-left">
            <div className="pd-card-header">
              <h3 className="pd-card-title">{t('patient.appointments.upcoming') || 'Next Appointment'}</h3>
              <div className="pd-card-line" />
            </div>
            {!patientData.nextAppointment ? (
              <div className="pd-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>{t('patient.appointments.noUpcoming') || 'No upcoming appointments'}</p>
                <button className="pd-appt-btn" onClick={() => navigate('/patient/appointments')}>
                  {t('patient.appointments.book') || 'Book Appointment'}
                </button>
              </div>
            ) : (
              <div className="pd-appt-info">
                {/* Date block */}
                <div className="pd-appt-date-block">
                  <div className="pd-appt-day">
                    {apptDate ? apptDate.toLocaleDateString('en-US', { weekday: 'short' }) : '—'}
                  </div>
                  <div className="pd-appt-num">
                    {apptDate ? apptDate.getDate() : '?'}
                  </div>
                  <div className="pd-appt-month">
                    {apptDate ? apptDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                  </div>
                </div>

                {/* Details */}
                <div className="pd-appt-details">
                  <div className="pd-appt-time">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {patientData.nextAppointment.time || 'TBD'}
                  </div>
                  <div className="pd-appt-type">
                    {patientData.nextAppointment.appointment_type || 'Consultation'}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700,
                    background: patientData.nextAppointment.status === 'confirmed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    color: patientData.nextAppointment.status === 'confirmed' ? '#10B981' : '#F59E0B',
                    border: `1px solid ${patientData.nextAppointment.status === 'confirmed' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    marginTop: '0.5rem', textTransform: 'capitalize', width: 'fit-content'
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                    {patientData.nextAppointment.status}
                  </div>
                </div>

                <button className="pd-appt-btn" onClick={() => navigate('/patient/appointments')}>
                  View All Appointments
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Analyses */}
        <div className="pd-analyses-section" data-aos="fade-up">
          <div className="pd-section-header">
            <div>
              <h2 className="pd-section-title">{t('patient.recentAnalyses.title') || 'Recent Analyses'}</h2>
              <p className="pd-section-sub">{t('patient.recentAnalyses.subtitle') || 'Your latest chest X-ray results'}</p>
            </div>
            <button className="pd-view-all-btn" onClick={() => navigate('/patient/analyses')}>
              {t('patient.recentAnalyses.viewAll') || 'View All'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          {patientData.recentAnalyses.length === 0 ? (
            <div className="pd-empty-analyses">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              <h3>{t('patient.recentAnalyses.noResults') || 'No analyses yet'}</h3>
              <p>{t('patient.recentAnalyses.noResultsDesc') || 'Your analysis results will appear here'}</p>
            </div>
          ) : (
            <div className="pd-recent-list">
              {patientData.recentAnalyses.map((a, i) => {
                const predictions = a.predictions || [];
                const isNormal = predictions.length === 0;
                const topConf = a.confidence_scores && Object.keys(a.confidence_scores).length > 0
                  ? Math.round(Math.max(...Object.values(a.confidence_scores)) * 100)
                  : null;
                const confColor = topConf && topConf >= 15 ? '#EF4444' : '#10B981';
                return (
                  <div
                    key={a.id}
                    className="pd-recent-item"
                    onClick={() => navigate(`/patient/results/${a.id}`)}
                  >
                    {/* Thumbnail */}
                    <div className="pd-recent-img">
                      <img
                        src={a.image_path ? `http://localhost:8000/${a.image_path.replace(/\\/g, '/')}` : ''}
                        alt="X-Ray"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>

                    {/* Info */}
                    <div className="pd-recent-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Chest X-Ray</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {isNormal ? (
                          <span style={{ padding: '0.2rem 0.625rem', borderRadius: 100, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>
                            ✓ Normal
                          </span>
                        ) : (
                          predictions.slice(0, 2).map((p, pi) => (
                            <span key={pi} style={{ padding: '0.2rem 0.625rem', borderRadius: 100, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                              {p}
                            </span>
                          ))
                        )}
                        {topConf && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: confColor, marginLeft: 'auto' }}>
                            {topConf}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientDashboard;