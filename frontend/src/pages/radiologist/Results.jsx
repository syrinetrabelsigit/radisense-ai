import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { predictionService } from '../../services/predictionService';
import { patientService } from '../../services/patientService';
import { jsPDF } from 'jspdf';
import '../../styles/pages/radiologist/Results.css';
import Toast, { useToast } from '../../components/Toast';

const Results = () => {
  const { toasts, toast, removeToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [patient, setPatient] = useState(null);
  const [sliderValue, setSliderValue] = useState(50);

  // Model metrics (from evaluation_results.json)
  const modelMetrics = {
    mobilenet: { 
      name: 'MobileNet-V2',
      auc: 0.8114, 
      acc: 0.6988, 
      precision: 0.2892,
      recall: 0.0760,
      f1: 0.1065,
      speed: 0.159, 
      params: '2.2M' 
    },
    densenet: { 
      name: 'DenseNet-121',
      auc: 0.7943, 
      acc: 0.6991, 
      precision: 0.2484,
      recall: 0.0848,
      f1: 0.1112,
      speed: 0.322, 
      params: '7.0M' 
    },
    resnet: { 
      name: 'ResNet-50',
      auc: 0.7912, 
      acc: 0.6899, 
      precision: 0.2075,
      recall: 0.0934,
      f1: 0.1110,
      speed: 0.332, 
      params: '23.5M' 
    },
    efficientnet: { 
      name: 'EfficientNet-B0',
      auc: 0.7730, 
      acc: 0.6988, 
      precision: 0.2157,
      recall: 0.0906,
      f1: 0.1084,
      speed: 0.220, 
      params: '4.0M' 
    },
  };

  useEffect(() => { fetchResults(); }, [id]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch analysis from backend
      const analysis = await predictionService.getPrediction(id);
      console.log('Analysis data:', analysis);
      
      // Fetch patient data
      let patientData = null;
      if (analysis.patient_id) {
        try {
          patientData = await patientService.getPatient(analysis.patient_id);
        } catch (err) {
          console.error('Failed to fetch patient:', err);
        }
      }

      // Transform confidence scores to pathologies array
      const pathologies = Object.entries(analysis.confidence_scores || {})
        .map(([name, confidence]) => ({
          name: name.toLowerCase(),
          confidence: confidence * 100, // Convert to percentage
          risk: confidence > 0.15 ? 'high' : confidence > 0.10 ? 'medium' : 'low'
        }))
        .sort((a, b) => b.confidence - a.confidence);

      // Get model metrics - USE THE ACTUAL MODEL FROM BACKEND
      const modelKey = (analysis.model_version || 'mobilenet').toLowerCase();
      const metrics = modelMetrics[modelKey] || modelMetrics.mobilenet;

      // Calculate average confidence for detected pathologies
      const detectedPathologies = pathologies.filter(p => p.confidence > 10);
      const avgConfidence = detectedPathologies.length > 0
        ? detectedPathologies.reduce((sum, p) => sum + p.confidence, 0) / detectedPathologies.length
        : 0;

      setData({
        id: analysis.id,
        patient: {
          name: patientData ? `${patientData.first_name} ${patientData.last_name}` : 'Unknown Patient',
          age: patientData?.date_of_birth ? new Date().getFullYear() - new Date(patientData.date_of_birth).getFullYear() : 'N/A',
          gender: patientData?.gender || 'N/A',
          id: patientData?.patient_id || 'N/A'
        },
        date: analysis.created_at,
        model: metrics.name,  // ✅ UTILISE LE NOM DU MODÈLE DEPUIS modelMetrics
        modelMetrics: metrics,
        status: analysis.status,
        confidence: avgConfidence.toFixed(1),
        image: `http://localhost:8000/${analysis.image_path.replace(/\\/g, '/')}`,
        heatmap: analysis.heatmap_path ? `http://localhost:8000/${analysis.heatmap_path.replace(/\\/g, '/')}` : null,
        pathologies,
        processingTime: analysis.processing_time,
      findings: detectedPathologies.length > 0
          ? `AI detected ${detectedPathologies.length} finding${detectedPathologies.length > 1 ? 's' : ''} above 10% confidence. Top findings: ${detectedPathologies.slice(0, 3).map(p => `${p.name.charAt(0).toUpperCase() + p.name.slice(1)} (${p.confidence.toFixed(1)}%)`).join(', ')}.`
          : 'No significant pathologies detected. Image appears within normal limits.',
        recommendation: detectedPathologies.length > 0
          ? (() => {
              const top = detectedPathologies[0];
              const highRisk = detectedPathologies.filter(p => p.risk === 'high');
              const medRisk  = detectedPathologies.filter(p => p.risk === 'medium');
              if (highRisk.length > 0)
                return `⚠️ Urgent attention recommended. High confidence findings detected: ${highRisk.map(p => `${p.name.charAt(0).toUpperCase() + p.name.slice(1)} (${p.confidence.toFixed(1)}%)`).join(', ')}. Immediate clinical correlation and further imaging advised.`;
              if (medRisk.length > 0)
                return `Clinical correlation recommended. Medium confidence findings: ${medRisk.map(p => `${p.name.charAt(0).toUpperCase() + p.name.slice(1)} (${p.confidence.toFixed(1)}%)`).join(', ')}. Follow-up imaging may be warranted based on patient symptoms.`;
              return `Low confidence findings detected: ${detectedPathologies.slice(0, 3).map(p => `${p.name.charAt(0).toUpperCase() + p.name.slice(1)} (${p.confidence.toFixed(1)}%)`).join(', ')}. No immediate follow-up required. Routine monitoring suggested.`;
            })()
          : 'No significant pathologies detected above 10% threshold. Image appears within normal limits. Always correlate with clinical presentation.',
        notes: analysis.notes || ''
        });

      setPatient(patientData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setError(err.detail || 'Failed to load analysis results');
      setLoading(false);
    }
  };

  const riskCfg = {
    high:   { color:'#EF4444', bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.25)',  label: t('results.pathologies.high')   || 'High Risk'   },
    medium: { color:'#F59E0B', bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.25)', label: t('results.pathologies.medium') || 'Medium Risk' },
    low:    { color:'#10B981', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.25)', label: t('results.pathologies.low')    || 'Low Risk'    },
  };

  const tabs = [
    { key:'overview',    icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { key:'pathologies', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { key:'model',       icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
    { key:'report',      icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
  ];

  const handleDownloadReport = () => {
    if (!data) return;
    
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text('RADISENSE AI - MEDICAL REPORT', 20, 20);
    doc.setFontSize(14); doc.text('PATIENT INFORMATION', 20, 40);
    doc.setFontSize(10);
    doc.text(`Name: ${data.patient.name}`, 20, 50);
    doc.text(`ID: ${data.patient.id}`, 20, 56);
    doc.text(`Age: ${data.patient.age} years`, 20, 62);
    doc.text(`Gender: ${data.patient.gender}`, 20, 68);
    doc.setFontSize(14); doc.text('ANALYSIS DETAILS', 20, 85);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(data.date).toLocaleString()}`, 20, 95);
    doc.text(`Model: ${data.model}`, 20, 101);
    doc.text(`Processing Time: ${data.processingTime}s`, 20, 107);
    doc.text(`Avg Confidence: ${data.confidence}%`, 20, 113);
    doc.setFontSize(14); doc.text('KEY FINDINGS', 20, 130);
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(data.findings, 170), 20, 140);
    doc.setFontSize(14); doc.text('DETECTED PATHOLOGIES', 20, 165);
    doc.setFontSize(10);
    let y = 175;
    data.pathologies.forEach(p => {
      doc.text(`- ${p.name}: ${p.confidence.toFixed(1)}%`, 20, y); y += 6;
    });
    doc.setFontSize(14); doc.text('RECOMMENDATION', 20, y + 10);
    doc.setFontSize(10); doc.text(doc.splitTextToSize(data.recommendation, 170), 20, y + 20);
    doc.save(`RadiSense_Report_${data.patient.id}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return (
    <div className="rs-page">
      <div className="container">
        <div className="rs-loading">
          <div className="rs-spin-rings">
            <div className="rs-ring r1"/><div className="rs-ring r2"/><div className="rs-ring r3"/>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'relative',zIndex:1}}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <p className="rs-loading-label">Loading results…</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="rs-page">
      <div className="container">
        <div className="rs-loading">
          <div className="rs-error-card">
            <div className="rs-error-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h3>Error Loading Results</h3>
            <p>{error}</p>
            <button className="rs-retry-btn" onClick={fetchResults}>Try Again</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="rs-page">
      <div className="container">

        {/* HEADER */}
        <div className="rs-header">
          <div>
            <div className="rs-badge"><div className="rs-badge-dot"/><span>Diagnostic Report</span></div>
            <h1 className="rs-title"><span className="rs-title-grad">{t('results.title') || 'Analysis Results'}</span></h1>
            <p className="rs-subtitle">{t('results.subtitle') || 'AI-powered radiology interpretation'}</p>
          </div>
          <div className="rs-header-actions">
            <button className="rs-action-btn" onClick={() => window.print()}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              {t('results.actions.print') || 'Print'}
            </button>
            <button className="rs-new-btn" onClick={() => navigate('/upload')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {t('results.actions.newAnalysis') || 'New Analysis'}
            </button>
          </div>
        </div>

        {/* INFO CARDS - ✅ CORRIGÉ : AGE ET GENDER AU LIEU DE ID */}
        <div className="rs-info-grid">
          {[
            { label: t('results.patient')||'Patient',    val: data.patient.name,                          meta:`${data.patient.age} years • ${data.patient.gender}`,            color:'#0066CC',
              icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
            { label: t('results.date')||'Date',          val: new Date(data.date).toLocaleDateString(),   meta: new Date(data.date).toLocaleTimeString(), color:'#8B5CF6',
              icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
            { label: t('results.model')||'AI Model',     val: data.model,                                 meta:`AUC: ${(data.modelMetrics.auc * 100).toFixed(1)}%`,                         color:'#00BFA6',
              icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
            { label: t('results.processing')||'Processing', val:`${data.processingTime.toFixed(2)}s`,     meta: `${data.confidence}% avg confidence`,   color:'#10B981', isGrad:true,
              icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
          ].map((c, i) => (
            <div key={i} className="rs-info-card" style={{ '--ric': c.color }}>
              <div className="rs-info-icon" style={{ color:c.color, background:`color-mix(in srgb, ${c.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${c.color} 20%, transparent)` }}>{c.icon}</div>
              <div className="rs-info-label">{c.label}</div>
              <div className="rs-info-val" style={ c.isGrad ? { background:'linear-gradient(135deg,#0066CC,#00BFA6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' } : { color:c.color } }>{c.val}</div>
              <div className="rs-info-meta">{c.meta}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="rs-tabs-wrap">
          {tabs.map(tab => (
            <button key={tab.key} className={`rs-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}>
              {tab.icon}
              {t(`results.tab.${tab.key}`) || tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="rs-tab-content" key={activeTab}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="rs-overview-grid">
              <div className="rs-card rs-findings-card">
                <div className="rs-card-section">
                  <div className="rs-section-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {t('results.overview.findings') || 'Key Findings'}
                  </div>
                  <p className="rs-text">{data.findings}</p>
                </div>
                <div className="rs-card-section">
                  <div className="rs-section-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {t('results.overview.recommendation') || 'Recommendation'}
                  </div>
                  <p className="rs-text">{data.recommendation}</p>
                </div>
                <div className="rs-card-section">
                  <div className="rs-section-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {t('results.overview.notes') || 'Notes for Patient'}
                  </div>
                  <textarea
                    className="rs-text"
                    style={{ width:'100%', minHeight:'100px', padding:'0.75rem', background:'var(--bg-secondary)', border:'1px solid var(--border-primary)', borderRadius:'10px', color:'var(--text-primary)', fontSize:'0.9375rem', lineHeight:1.8, resize:'vertical', outline:'none', fontFamily:'inherit' }}
                    placeholder="Write your clinical notes, recommendations and instructions for the patient..."
                    value={data.notes}
                    onChange={e => setData(d => ({ ...d, notes: e.target.value }))}
                  />
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('token');
                      const r = await fetch(`http://localhost:8000/api/predict/${data.id}/notes`, {
                        method: 'PUT',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ notes: data.notes })
                      });
                      if (r.ok) toast.success('Notes saved!', 'Patient will see your notes.');
                      else toast.error('Failed to save notes', 'Please try again.');
                    }}
                    style={{ marginTop:'0.5rem', padding:'0.5rem 1.25rem', borderRadius:'8px', background:'linear-gradient(135deg,#0066CC,#00BFA6)', border:'none', color:'white', fontWeight:700, cursor:'pointer', fontSize:'0.82rem' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'6px',verticalAlign:'middle'}}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save Notes for Patient
                  </button>
                </div>
              </div>

              <div className="rs-image-card">
                <div className="rs-img-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Chest X-Ray
                </div>
                <div className="rs-img-wrap">
                  <img src={data.image} alt="X-Ray" className="rs-xray-img" />
                  <div className="rs-img-overlay">
                    <span className="rs-img-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      AI Analyzed
                    </span>
                  </div>
                </div>
                <div className="rs-img-meta">
                  <span>{data.patient.name} · {new Date(data.date).toLocaleDateString()}</span>
                  <span className="rs-img-conf" style={{ color:'#10B981' }}>{data.processingTime}s processing</span>
                </div>
              </div>
            </div>
          )}

          {/* PATHOLOGIES */}
          {activeTab === 'pathologies' && (
            <div className="rs-card" style={{ padding:'2rem' }}>
              <div className="rs-path-header">
                <div>
                  <h3 className="rs-card-title">{t('results.pathologies.title') || 'Detected Pathologies'}</h3>
                  <p className="rs-card-sub">Sorted by confidence score • Threshold: 10%</p>
                </div>
                <div className="rs-path-summary">
                  {Object.entries(riskCfg).map(([risk, cfg]) => {
                    const cnt = data.pathologies.filter(p => p.risk === risk && p.confidence > 30).length;
                    if (cnt === 0) return null;
                    return (
                      <span key={risk} className="rs-risk-pill" style={{ color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}` }}>
                        <div style={{ width:6, height:6, borderRadius:'50%', background:cfg.color, display:'inline-block', marginRight:4 }}/>
                        {cnt} {cfg.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="rs-path-grid">
                {data.pathologies.map((p, i) => {
                  const rc = riskCfg[p.risk];
                  return (
                    <div key={i} className="rs-path-item" style={{ '--rpc': rc.color }}>
                      <div className="rs-path-rank" style={{ color:rc.color, background:rc.bg }}>{i+1}</div>
                      <div className="rs-path-body">
                        <div className="rs-path-row">
                          <span className="rs-path-name">{t(`results.pathology.${p.name}`) || p.name.charAt(0).toUpperCase() + p.name.slice(1)}</span>
                          <div className="rs-path-right">
                            <span className="rs-path-risk" style={{ color:rc.color, background:rc.bg, border:`1px solid ${rc.border}` }}>{rc.label}</span>
                            <span className="rs-path-pct" style={{ color:rc.color }}>{p.confidence.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="rs-path-bar">
                          <div className="rs-path-fill" style={{ width:`${p.confidence}%`, background:rc.color, boxShadow:`0 0 8px color-mix(in srgb, ${rc.color} 40%, transparent)` }}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* {data.pathologies.filter(p => p.confidence > 30).length === 0 && (
                <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin:'0 auto 1rem', opacity:0.3 }}>
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <p>No pathologies detected above 30% confidence threshold</p>
                </div>
              )} */}
            </div>
          )}

          {/* MODEL METRICS */}
          {activeTab === 'model' && (
            <div className="rs-card" style={{ padding:'2rem' }}>
              <div className="rs-model-perf-header">
                <div>
                  <h3 className="rs-card-title">Model Performance Metrics</h3>
                  <p className="rs-card-sub">{data.model} · Evaluated on ChestX-ray14 dataset</p>
                </div>
              </div>

              {/* 4 METRIC CARDS EN GRILLE */}
              <div className="rs-metrics-grid">
                {[
                  { label:'AUC-ROC',    val:(data.modelMetrics.auc * 100).toFixed(2), unit:'%',  color:'#0066CC', desc:'Area Under ROC Curve',
                    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
                  { label:'Accuracy',   val:(data.modelMetrics.acc * 100).toFixed(2), unit:'%',  color:'#10B981', desc:'Overall classification accuracy',
                    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                  { label:'Inference',  val:(data.modelMetrics.speed * 1000).toFixed(0), unit:'ms', color:'#F59E0B', desc:'Average processing time',
                    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
                  { label:'Parameters', val:data.modelMetrics.params, unit:'',  color:'#8B5CF6', desc:'Model size',
                    icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
                ].map((m, i) => (
                  <div key={i} className="rs-metric-card" style={{ '--mc': m.color }}>
                    <div className="rs-metric-glow" style={{ background: m.color }}/>
                    <div className="rs-metric-top-row">
                      <div className="rs-metric-icon" style={{ color:m.color, background:`color-mix(in srgb, ${m.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${m.color} 20%, transparent)` }}>{m.icon}</div>
                      <span className="rs-metric-label">{m.label}</span>
                    </div>
                    <div className="rs-metric-val" style={{ color: m.color }}>
                      {m.val}<span className="rs-metric-unit">{m.unit}</span>
                    </div>
                    <div className="rs-metric-desc">{m.desc}</div>
                    <div className="rs-metric-bar">
                      <div className="rs-metric-fill" style={{
                        width: m.unit === '%' ? `${Math.min(parseFloat(m.val), 100)}%`
                            : m.label === 'Inference' ? `${Math.max(10, 100 - parseFloat(m.val)/5)}%`
                            : '70%',
                        background: m.color,
                        boxShadow:`0 0 8px color-mix(in srgb, ${m.color} 50%, transparent)`
                      }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* WHY THIS MODEL - ✅ CORRIGÉ : UTILISE data.model AU LIEU DE COMPARER AVEC 'Mobilenet' */}
              <div className="rs-model-why" style={{ '--mc': '#0066CC' }}>
                <div className="rs-why-icon" style={{ background:'rgba(0,102,204,0.12)', border:'1px solid rgba(0,102,204,0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div>
                  <div className="rs-why-label">Why {data.model}?</div>
                  <p className="rs-why-text">
                    {data.model === 'MobileNet-V2'    && 'Best overall AUC-ROC (81.14%) with fastest inference time. Recommended for production use.'}
                    {data.model === 'DenseNet-121'    && 'Strong balanced performance with good multi-pathology detection. Medical imaging standard.'}
                    {data.model === 'ResNet-50'       && 'Deep architecture with proven track record. Excellent for Edema and Effusion detection.'}
                    {data.model === 'EfficientNet-B0' && 'Efficient architecture with good speed/accuracy tradeoff. Compact and modern design.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* REPORT */}
          {activeTab === 'report' && (
            <div className="rs-card" style={{ padding:'2rem' }}>
              <div className="rs-report-header">
                <div>
                  <h3 className="rs-card-title">{t('results.report.title') || 'Medical Report'}</h3>
                  <p className="rs-card-sub">Generated by RadiSense AI · {new Date(data.date).toLocaleString()}</p>
                </div>
                <button className="rs-download-btn" onClick={handleDownloadReport}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {t('results.actions.download') || 'Download PDF'}
                </button>
              </div>

              <div className="rs-report-body">
                {[
                  { title:'Patient Information', color:'#0066CC', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                    rows:[['Name',data.patient.name],['Patient ID',data.patient.id],['Age',`${data.patient.age} years`],['Gender',data.patient.gender]] },
                  { title:'Analysis Details',    color:'#8B5CF6', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
                    rows:[['Date',new Date(data.date).toLocaleString()],['Model',data.model],['Processing Time',`${data.processingTime}s`],['Status','Completed']] },
                ].map((sec, i) => (
                  <div key={i} className="rs-report-section" style={{ '--rsc': sec.color }}>
                    <div className="rs-report-sec-header">
                      <div className="rs-report-sec-icon" style={{ color:sec.color, background:`color-mix(in srgb, ${sec.color} 12%, transparent)` }}>{sec.icon}</div>
                      <h4 className="rs-report-sec-title">{sec.title}</h4>
                    </div>
                    <div className="rs-report-rows">
                      {sec.rows.map(([k,v], ri) => (
                        <div key={ri} className="rs-report-row">
                          <span className="rs-report-key">{k}</span>
                          <span className="rs-report-val">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="rs-report-section" style={{ '--rsc':'#10B981' }}>
                  <div className="rs-report-sec-header">
                    <div className="rs-report-sec-icon" style={{ color:'#10B981', background:'rgba(16,185,129,0.12)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <h4 className="rs-report-sec-title">Key Findings</h4>
                  </div>
                  <p className="rs-report-prose">{data.findings}</p>
                </div>

                <div className="rs-report-section" style={{ '--rsc':'#EF4444' }}>
                  <div className="rs-report-sec-header">
                    <div className="rs-report-sec-icon" style={{ color:'#EF4444', background:'rgba(239,68,68,0.12)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </div>
                    <h4 className="rs-report-sec-title">Detected Pathologies (conf. &gt;30%)</h4>
                  </div>
                  <div className="rs-report-path-list">
                    {data.pathologies.map((p, i) => {
                      const rc = riskCfg[p.risk];
                      return (
                        <div key={i} className="rs-report-path-row">
                          <div className="rs-rp-dot" style={{ background:rc.color }}/>
                          <span className="rs-rp-name">{p.name.charAt(0).toUpperCase() + p.name.slice(1)}</span>
                          <div className="rs-rp-bar"><div style={{ width:`${p.confidence}%`, background:rc.color }}/></div>
                          <span className="rs-rp-pct" style={{ color:rc.color }}>{p.confidence.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rs-report-section" style={{ '--rsc':'#0066CC' }}>
                  <div className="rs-report-sec-header">
                    <div className="rs-report-sec-icon" style={{ color:'#0066CC', background:'rgba(0,102,204,0.12)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <h4 className="rs-report-sec-title">Recommendation</h4>
                  </div>
                  <p className="rs-report-prose">{data.recommendation}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Results;