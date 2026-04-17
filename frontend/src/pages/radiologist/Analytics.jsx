import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import analyticsService from '../../services/analyticsService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../../styles/pages/radiologist/Analytics.css';

const Analytics = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true); setError(null);
    try {
      const [dashboardData, pathologyData, modelStats] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getPathologyDistribution({ period }),
        analyticsService.getModelStats()  // ✅ NOUVEAU !
      ]);
      setStats({
        totalAnalyses:      dashboardData.total_predictions || 0,
        avgAccuracy:        84.5,
        totalPatients:      dashboardData.total_patients || 0,
        avgProcessingTime:  dashboardData.avg_processing_time || 0,
        topPathologies: pathologyData.distribution?.map(p => ({
          name: p.name.toLowerCase(), 
          cases: p.count, 
          accuracy: 85, 
          percentage: p.percentage
        })) || [],
        modelComparison: [
          { 
            model:'MobileNet-V2', 
            accuracy:81.14, 
            speed: modelStats.models.find(m => m.model === 'mobilenet')?.avg_processing_time || 0.20, 
            analyses: modelStats.models.find(m => m.model === 'mobilenet')?.count || 0 
          },
          { 
            model:'DenseNet-121', 
            accuracy:79.43, 
            speed: modelStats.models.find(m => m.model === 'densenet')?.avg_processing_time || 0.30, 
            analyses: modelStats.models.find(m => m.model === 'densenet')?.count || 0 
          },
          { 
            model:'ResNet-50', 
            accuracy:79.12, 
            speed: modelStats.models.find(m => m.model === 'resnet')?.avg_processing_time || 0.25, 
            analyses: modelStats.models.find(m => m.model === 'resnet')?.count || 0 
          },
          { 
            model:'EfficientNet-B0', 
            accuracy:77.30, 
            speed: modelStats.models.find(m => m.model === 'efficientnet')?.avg_processing_time || 0.22, 
            analyses: modelStats.models.find(m => m.model === 'efficientnet')?.count || 0 
          },
        ]
      });
      setLoading(false);
    } catch (err) {
      setError(err.detail || 'Failed to load analytics data');
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await analyticsService.exportReport('csv');
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.setAttribute('download', `analytics_${period}.csv`);
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
    } catch (err) { 
      console.error('Export failed:', err);
      alert('CSV export failed');
    }
  };

  const handleExportPDF = () => {
  try {
    const doc = new jsPDF();
    let yPos = 20;
    
    // En-tête
    doc.setFontSize(24);
    doc.setTextColor(0, 102, 204);
    doc.text('RadiSense AI', 105, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Rapport Analytique', 105, yPos, { align: 'center' });
    
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 102, 204);
    doc.line(20, yPos, 190, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    const periodText = {
      '7days': '7 derniers jours',
      '30days': '30 derniers jours',
      '3months': '3 derniers mois',
      'year': 'Cette annee',
      'all': 'Tout le temps'
    };
    doc.text(`Periode: ${periodText[period] || period}`, 20, yPos);
    yPos += 5;
    doc.text(`Genere le: ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`, 20, yPos);
    
    // Statistiques globales
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('STATISTIQUES GLOBALES', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.text(`Total des analyses: ${stats.totalAnalyses}`, 25, yPos);
    yPos += 7;
    doc.text(`Precision moyenne: ${stats.avgAccuracy}%`, 25, yPos);
    yPos += 7;
    doc.text(`Total des patients: ${stats.totalPatients}`, 25, yPos);
    yPos += 7;
    doc.text(`Temps de traitement moyen: ${stats.avgProcessingTime.toFixed(2)}s`, 25, yPos);
    
    // Pathologies
    if (stats.topPathologies && stats.topPathologies.length > 0) {
      yPos += 15;
      doc.setFontSize(14);
      doc.setTextColor(0, 102, 204);
      doc.text('PRINCIPALES PATHOLOGIES DETECTEES', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(80);
      
      stats.topPathologies.slice(0, 10).forEach((p, i) => {
        const pathName = t(`results.pathology.${p.name}`) || p.name.charAt(0).toUpperCase() + p.name.slice(1);
        doc.text(`${i + 1}. ${pathName}`, 25, yPos);
        doc.text(`${p.cases} cas (${p.percentage.toFixed(1)}%)`, 130, yPos);
        yPos += 6;
      });
    }
    
    // Nouvelle page pour les modèles
    doc.addPage();
    yPos = 20;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('COMPARAISON DES MODELES IA', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(80);
    
    if (stats.modelComparison && stats.modelComparison.length > 0) {
      stats.modelComparison.forEach((m, i) => {
        doc.setTextColor(0, 102, 204);
        doc.setFontSize(11);
        doc.text(m.model, 25, yPos);
        
        doc.setTextColor(80);
        doc.setFontSize(10);
        yPos += 6;
        doc.text(`  Precision: ${m.accuracy}%`, 30, yPos);
        yPos += 5;
        doc.text(`  Vitesse: ${m.speed}s`, 30, yPos);
        yPos += 5;
        doc.text(`  Analyses: ${m.analyses}`, 30, yPos);
        yPos += 10;
      });
    }
    
    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('(c) 2026 RadiSense AI - Rapport Confidentiel', 105, 285, { align: 'center' });
    
    // Sauvegarder
    doc.save(`RadiSense_Analytics_${period}_${new Date().toISOString().split('T')[0]}.pdf`);
    
  } catch (err) {
    console.error('Erreur generation PDF:', err);
    alert(`Erreur: ${err.message}`);
  }
};

  const modelColors = ['#10B981','#0066CC','#8B5CF6','#F59E0B'];

  if (loading) return (
    <div className="an-page">
      <div className="container">
        <div className="an-loading">
          <div className="an-spin-rings">
            <div className="an-ring r1"/><div className="an-ring r2"/><div className="an-ring r3"/>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'relative',zIndex:1}}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <p className="an-loading-label">Loading analytics…</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="an-page">
      <div className="container">
        <div className="an-loading">
          <div className="an-error-card">
            <div className="an-error-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h3>Error Loading Analytics</h3>
            <p>{error}</p>
            <button className="an-retry-btn" onClick={fetchAnalytics}>Try Again</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!stats) return null;

  const statCards = [
    { label: t('analytics.stats.totalAnalyses') || 'Total Analyses',    val: stats.totalAnalyses.toLocaleString(), sub:'Real-time data',  color:'#8B5CF6',
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { label: t('analytics.stats.avgAccuracy')    || 'Avg. Accuracy',     val:`${stats.avgAccuracy}%`,              sub:'AI Performance',  color:'#0066CC',
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { label: t('analytics.stats.totalPatients')  || 'Total Patients',    val: stats.totalPatients,                 sub:'Active patients', color:'#10B981',
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    { label: t('analytics.stats.avgProcessing')  || 'Avg. Processing',   val:`${stats.avgProcessingTime.toFixed(2)}s`, sub:'Ultra-fast',  color:'#F59E0B',
      icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  ];

  return (
    <div className="an-page">
      <div className="container">

        {/* HEADER */}
        <div className="an-header">
          <div>
            <div className="an-badge"><div className="an-badge-dot"/><span>Analytics Dashboard</span></div>
            <h1 className="an-title"><span className="an-title-grad">{t('analytics.title') || 'Analytics'}</span></h1>
            <p className="an-subtitle">{t('analytics.subtitle') || 'Track performance and insights'}</p>
          </div>
          <div className="an-controls">
            <div className="an-select-wrap">
              <svg className="an-select-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <select className="an-select" value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="7days">{t('analytics.period.7days')   || 'Last 7 days'}</option>
                <option value="30days">{t('analytics.period.30days') || 'Last 30 days'}</option>
                <option value="3months">{t('analytics.period.3months')||'Last 3 months'}</option>
                <option value="year">{t('analytics.period.year')     || 'This year'}</option>
                <option value="all">{t('analytics.period.all')       || 'All time'}</option>
              </select>
            </div>
            <button className="an-export-btn" onClick={handleExportCSV}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t('analytics.export.csv') || 'Export CSV'}
            </button>
          </div>
        </div>

        {/* OVERVIEW STATS */}
        <div className="an-section">
          <div className="an-section-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            {t('analytics.overview.title') || 'Overview'}
          </div>
          <div className="an-stats-grid">
            {statCards.map((s, i) => (
              <div key={i} className="an-stat-card" style={{ '--scc': s.color }}>
                <div className="an-stat-glow" style={{ background: s.color }} />
                <div className="an-stat-icon" style={{ background: s.color, boxShadow:`0 8px 24px color-mix(in srgb, ${s.color} 40%, transparent)` }}>{s.icon}</div>
                <div className="an-stat-body">
                  <p className="an-stat-label">{s.label}</p>
                  <h3 className="an-stat-val">{s.val}</h3>
                  <div className="an-stat-sub">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP PATHOLOGIES */}
        {stats.topPathologies.length > 0 && (
          <div className="an-section">
            <div className="an-section-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              {t('analytics.pathology.title') || 'Top Pathologies'}
            </div>
            <div className="an-card">
              <div className="an-pathology-list">
                {stats.topPathologies.map((p, i) => {
                  const colors = ['#0066CC','#10B981','#8B5CF6','#F59E0B','#EF4444','#00BFA6'];
                  const c = colors[i % colors.length];
                  return (
                    <div key={i} className="an-path-item">
                      <div className="an-path-rank" style={{ color: c, background: `color-mix(in srgb, ${c} 12%, transparent)` }}>{i + 1}</div>
                      <div className="an-path-body">
                        <div className="an-path-header">
                          <span className="an-path-name">{t(`results.pathology.${p.name.toLowerCase().replace(/_/g, '')}`) || p.name.charAt(0).toUpperCase() + p.name.slice(1)}</span>
                          <div className="an-path-right">
                            <span className="an-path-cases">{p.cases} {t('analytics.pathology.cases') || 'cases'}</span>
                            <span className="an-path-pct" style={{ color: c }}>{p.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="an-path-bar">
                          <div className="an-path-fill" style={{ width:`${p.percentage}%`, background: c }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MODEL COMPARISON */}
        <div className="an-section">
          <div className="an-section-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            {t('analytics.model.title') || 'Model Comparison'}
          </div>
          <div className="an-model-grid">
            {stats.modelComparison.map((m, i) => {
              const c = modelColors[i];
              const isActive = i === 0;
              return (
                <div key={i} className={`an-model-card ${isActive ? 'active' : ''}`} style={{ '--mc': c }}>
                  {isActive && <div className="an-model-glow" style={{ background: c }} />}
                  <div className="an-model-header">
                    <h4 className="an-model-name">{m.model}</h4>
                    <span className="an-model-badge" style={{ color: isActive ? '#10B981' : '#F59E0B', background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border:`1px solid ${isActive ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                      {isActive ? '🏆 Active' : `#${i+1}`}
                    </span>
                  </div>
                  <div className="an-model-stats">
                    <div className="an-model-stat">
                      <div className="an-model-stat-header">
                        <span className="an-model-stat-label">{t('analytics.model.accuracy') || 'Accuracy'}</span>
                        <span className="an-model-stat-val" style={{ color: c }}>{m.accuracy}%</span>
                      </div>
                      <div className="an-model-bar">
                        <div className="an-model-fill" style={{ width:`${m.accuracy}%`, background: c }} />
                      </div>
                    </div>
                    <div className="an-model-row">
                      <div className="an-model-mini">
                        <span className="an-model-stat-label">{t('analytics.model.speed') || 'Speed'}</span>
                        <span className="an-model-big">{m.speed}s</span>
                      </div>
                      <div className="an-model-mini">
                        <span className="an-model-stat-label">{t('analytics.model.analyses') || 'Analyses'}</span>
                        <span className="an-model-big">{m.analyses.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* EXPORT */}
        <div className="an-export-card">
          <div className="an-export-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div className="an-export-body">
            <h3 className="an-export-title">{t('analytics.export.title') || 'Export Data'}</h3>
            <p className="an-export-desc">Download your analytics in your preferred format</p>
          </div>
          <div className="an-export-actions">
            <button className="an-csv-btn" onClick={handleExportCSV}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {t('analytics.export.csv') || 'Export CSV'}
            </button>
            <button className="an-pdf-btn" onClick={handleExportPDF}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t('analytics.export.pdf') || 'Export PDF'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;