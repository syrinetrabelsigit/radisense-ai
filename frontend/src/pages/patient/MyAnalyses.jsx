import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/patient/MyAnalyses.css';

const MyAnalyses = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/predict/my-patient-analyses?skip=0&limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 404) {
        setAnalyses([]);
        setError(null);
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch analyses');
      const data = await response.json();

      // Fetch radiologist names
    const userIds = [...new Set((data.analyses || []).map(a => a.user_id).filter(Boolean))];
    const radiologistMap = {};
    await Promise.all(userIds.map(async (uid) => {
      try {
        const ur = await fetch(`http://localhost:8000/api/users/${uid}/public`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ur.ok) {
          const u = await ur.json();
          radiologistMap[uid] = `Dr. ${u.first_name} ${u.last_name}`;
        }
      } catch {}
    }));

    const transformed = (data.analyses || []).map(analysis => {
      const predictions = Array.isArray(analysis.predictions) ? analysis.predictions : [];
      const mainPathology = predictions.length > 0 ? predictions[0] : 'Normal';
      const scores = analysis.confidence_scores ? Object.values(analysis.confidence_scores) : [];
      const topConfidence = scores.length > 0 ? Math.max(...scores) * 100 : null;
      return {
        id:          analysis.id,
        date:        analysis.created_at,
        type:        'Chest X-Ray',
        status:      analysis.status,
        pathology:   mainPathology,
        confidence:  topConfidence && topConfidence > 0 ? Math.round(topConfidence) : null,
        radiologist: radiologistMap[analysis.user_id] || 'Dr. RadiSense AI',
        image:       analysis.image_path
          ? `http://localhost:8000/${analysis.image_path.replace(/\\/g, '/')}`
          : null
      };
    });

      setAnalyses(transformed);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch analyses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConf = (c) =>
    c >= 85 ? { color: '#10B981', label: 'High' }
    : c >= 65 ? { color: '#F59E0B', label: 'Medium' }
    : { color: '#EF4444', label: 'Low' };

  const pathologyColor = (p) => {
    if (p === 'Normal') return { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
    if (p === 'Processing...') return { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
    return { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
  };

  if (loading) return (
    <div className="ma-page">
      <div className="container">
        <div className="ma-loader-wrap">
          <div className="ma-loader-ring" />
          <p>Loading your analyses...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="ma-page">
      <div className="container">
        <div className="ma-error-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Error Loading Analyses</h3>
          <p>{error}</p>
          <button onClick={fetchAnalyses} className="ma-retry-btn">Try Again</button>
        </div>
      </div>
    </div>
  );

  const filtered = analyses
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .sort((a, b) => sortBy === 'date'
      ? new Date(b.date) - new Date(a.date)
      : a.status.localeCompare(b.status));

  return (
    <div className="ma-page">
      <div className="container">

        {/* HEADER */}
        <div className="ma-header" data-aos="fade-down">
          <div className="ma-header-left">
            <div className="ma-badge">
              <div className="ma-badge-dot" />
              <span>Patient Portal</span>
            </div>
            <h1 className="ma-title">
              <span className="ma-title-grad">{t('patient.myAnalyses.title') || 'My Analyses'}</span>
            </h1>
            <p className="ma-subtitle">{t('patient.myAnalyses.subtitle') || 'View and track all your chest X-ray analyses performed by your radiologist'}</p>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="ma-filters" data-aos="fade-up">
          <div className="ma-filters-left">
            <span className="ma-filter-label">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filter
            </span>
            <div className="ma-filter-btns">
              {['all', 'completed', 'pending'].map(s => (
                <button
                  key={s}
                  className={`ma-filter-btn ${filterStatus === s ? 'active' : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === 'all'
                    ? (t('patient.myAnalyses.filterAll') || 'All')
                    : s === 'completed'
                      ? (t('patient.myAnalyses.filterCompleted') || 'Completed')
                      : (t('patient.myAnalyses.filterPending') || 'Pending')}
                </button>
              ))}
            </div>
          </div>
          <div className="ma-filters-right">
            <span className="ma-filter-label">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              Sort
            </span>
            <select className="ma-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date">{t('patient.myAnalyses.sortDate') || 'Date'}</option>
              <option value="status">{t('patient.myAnalyses.sortStatus') || 'Status'}</option>
            </select>
            <span className="ma-count">
              <strong>{filtered.length}</strong> / {analyses.length} analyses
            </span>
          </div>
        </div>

        {/* ANALYSES LIST */}
        {filtered.length === 0 ? (
          <div className="ma-empty" data-aos="fade-up">
            <div className="ma-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3>No analyses yet</h3>
            <p>Your radiologist hasn't performed any analyses for you yet.<br/>Contact your radiologist to schedule an examination.</p>
          </div>
        ) : (
          <div className="ma-list">
            {filtered.map((a, i) => {
              const conf = a.confidence ? getConf(a.confidence) : null;
              const pc = pathologyColor(a.pathology);
              return (
                <div
                  key={a.id}
                  className={`ma-card ${a.status === 'completed' ? 'clickable' : ''}`}
                  data-aos="fade-up"
                  data-aos-delay={i * 60}
                  onClick={() => a.status === 'completed' && navigate(`/patient/results/${a.id}`)}
                >
                  {/* Left: image */}
                  <div className="ma-img-wrap">
                    <img src={a.image} alt="X-Ray" className="ma-img" />
                    <div className="ma-img-overlay" />
                    <div className={`ma-status-pill ${a.status}`}>
                      {a.status === 'completed'
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <div className="ma-spin-dot" />}
                      {a.status}
                    </div>
                    {a.confidence && (
                      <div className="ma-img-conf" style={{ color: conf.color }}>{a.confidence}%</div>
                    )}
                  </div>

                  {/* Center: info */}
                  <div className="ma-info">
                    <div className="ma-info-top">
                      <div>
                        <h3 className="ma-type">{a.type}</h3>
                        <div className="ma-date">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {new Date(a.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="ma-pathology-badge" style={{ color: pc.color, background: pc.bg, border: `1px solid ${pc.border}` }}>
                        {a.pathology === 'Normal'
                          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : a.status === 'pending'
                            ? <div className="ma-spin-dot" style={{ borderTopColor: pc.color }} />
                            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                        {a.pathology}
                      </div>
                    </div>

                    <div className="ma-details-row">
                      <div className="ma-detail">
                        <span className="ma-detail-label">Radiologist</span>
                        <div className="ma-radiologist">
                          <div className="ma-radio-avatar">
                            {a.radiologist.split(' ').slice(1).map(n => n[0]).join('')}
                          </div>
                          <span>{a.radiologist}</span>
                        </div>
                      </div>
                      {a.confidence && (
                        <div className="ma-detail">
                          <span className="ma-detail-label">AI Confidence</span>
                          <div className="ma-conf-row">
                            <div className="ma-conf-track">
                              <div className="ma-conf-fill" style={{ width: `${a.confidence}%`, background: conf.color }} />
                            </div>
                            <span className="ma-conf-val" style={{ color: conf.color }}>{a.confidence}%</span>
                            <span className="ma-conf-label" style={{ color: conf.color }}>{conf.label}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {a.status === 'pending' && (
                      <div className="ma-pending">
                        <div className="ma-pending-ring" />
                        <span>Analysis in progress — results will appear soon</span>
                      </div>
                    )}
                  </div>

                  {/* Right: action */}
                  <div className="ma-action-col">
                    {a.status === 'completed' ? (
                      <>
                        <button className="ma-view-btn">
                          View Report
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </button>
                        <span className="ma-action-hint">Click anywhere to open</span>
                      </>
                    ) : (
                      <div className="ma-pending-badge">
                        <div className="ma-pending-ring" />
                        Processing
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyAnalyses;