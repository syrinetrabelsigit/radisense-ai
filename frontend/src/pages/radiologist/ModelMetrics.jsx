import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/radiologist/ModelMetrics.css';

const ModelMetrics = () => {
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState('mobilenet');

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
  }, []);

  const models = {
    mobilenet: {
      name: 'MobileNet-V2', params: '2.2M', color: '#10B981',
      metrics: { auc:0.8114, accuracy:0.6988, precision:0.2892, recall:0.0760, f1:0.1065, speed:0.159 },
      aucPerPathology: { 'Atelectasis':0.7922,'Cardiomegaly':0.9320,'Effusion':0.9039,'Infiltration':0.6738,'Mass':0.8645,'Nodule':0.7930,'Pneumonia':0.6122,'Pneumothorax':0.8185,'Consolidation':0.7787,'Edema':0.8976,'Emphysema':0.8443,'Fibrosis':0.7636,'Pleural Thickening':0.7662,'Hernia':0.9194 },
      strengths:['Highest AUC-ROC (81.14%)','Fastest inference time','Best for Pneumothorax detection','Lightweight (2.2M params)'],
      bestFor:['Pneumothorax','Cardiomegaly','Hernia'],
      why:'Best overall AUC-ROC (81.14%) with fastest inference time. Recommended for production use.'
    },
    densenet: {
      name: 'DenseNet-121', params: '7.0M', color: '#0066CC',
      metrics: { auc:0.7943, accuracy:0.6991, precision:0.2484, recall:0.0848, f1:0.1112, speed:0.322 },
      aucPerPathology: { 'Atelectasis':0.8140,'Cardiomegaly':0.9206,'Effusion':0.9095,'Infiltration':0.6685,'Mass':0.8664,'Nodule':0.8062,'Pneumonia':0.5907,'Pneumothorax':0.8400,'Consolidation':0.7537,'Edema':0.8544,'Emphysema':0.8455,'Fibrosis':0.7367,'Pleural Thickening':0.7562,'Hernia':0.7577 },
      strengths:['Strong overall performance','Good multi-pathology detection','Balanced precision/recall','Medical imaging standard'],
      bestFor:['Cardiomegaly','Effusion','Pneumothorax'],
      why:'Medical imaging industry standard. Well-balanced performance across all 14 pathologies.'
    },
    resnet: {
      name: 'ResNet-50', params: '23.5M', color: '#8B5CF6',
      metrics: { auc:0.7912, accuracy:0.6899, precision:0.2075, recall:0.0934, f1:0.1110, speed:0.332 },
      aucPerPathology: { 'Atelectasis':0.8031,'Cardiomegaly':0.9004,'Effusion':0.9122,'Infiltration':0.6518,'Mass':0.8618,'Nodule':0.8040,'Pneumonia':0.6110,'Pneumothorax':0.7572,'Consolidation':0.7568,'Edema':0.9089,'Emphysema':0.7857,'Fibrosis':0.7460,'Pleural Thickening':0.7567,'Hernia':0.8221 },
      strengths:['Deep residual architecture','Strong generalization','Highest recall rate','Proven track record'],
      bestFor:['Edema','Effusion','Cardiomegaly'],
      why:'Proven deep architecture with excellent Edema detection. Best choice for high-recall scenarios.'
    },
    efficientnet: {
      name: 'EfficientNet-B0', params: '4.0M', color: '#F59E0B',
      metrics: { auc:0.7730, accuracy:0.6988, precision:0.2157, recall:0.0906, f1:0.1084, speed:0.220 },
      aucPerPathology: { 'Atelectasis':0.8135,'Cardiomegaly':0.9314,'Effusion':0.9067,'Infiltration':0.6703,'Mass':0.8681,'Nodule':0.7845,'Pneumonia':0.6253,'Pneumothorax':0.7787,'Consolidation':0.7665,'Edema':0.8326,'Emphysema':0.8518,'Fibrosis':0.7161,'Pleural Thickening':0.7533,'Hernia':0.5229 },
      strengths:['Efficient compound scaling','Good speed/accuracy tradeoff','Compact model size','Modern architecture'],
      bestFor:['Cardiomegaly','Effusion','Emphysema'],
      why:'Excellent efficiency ratio. Ideal when compute resources are limited without sacrificing quality.'
    },
  };

  const model = models[selectedModel];

  const metricsDef = [
    { key:'auc',      label:'AUC-ROC',   unit:'%',  fmt: v=>(v*100).toFixed(2), desc:'Area Under ROC Curve',          color:'#0066CC',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
    { key:'accuracy', label:'Accuracy',  unit:'%',  fmt: v=>(v*100).toFixed(2), desc:'Overall classification accuracy',color:'#10B981',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
    { key:'precision',label:'Precision', unit:'%',  fmt: v=>(v*100).toFixed(2), desc:'Positive predictive value',      color:'#8B5CF6',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
    { key:'recall',   label:'Recall',    unit:'%',  fmt: v=>(v*100).toFixed(2), desc:'Sensitivity / True positive rate',color:'#EF4444',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><polyline points="18 17 13 12 9 16 6 13"/></svg> },
    { key:'f1',       label:'F1-Score',  unit:'%',  fmt: v=>(v*100).toFixed(2), desc:'Harmonic mean of P/R',           color:'#F59E0B',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
    { key:'speed',    label:'Inference', unit:'ms', fmt: v=>(v*1000).toFixed(0),desc:'Average processing time',        color:'#00BFA6',
      icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  ];

  const sortedPathologies = Object.entries(model.aucPerPathology).sort(([,a],[,b]) => b - a);
  const maxAuc = Math.max(...sortedPathologies.map(([,v]) => v));

  return (
    <div className="rmm-page">
      <div className="container">

        {/* HEADER */}
        <div className="rmm-header" data-aos="fade-down">
          <div>
            <div className="rmm-badge"><div className="rmm-badge-dot"/><span>Model Evaluation</span></div>
            <h1 className="rmm-title"><span className="rmm-title-grad">Model Performance Metrics</span></h1>
            <p className="rmm-subtitle">Comprehensive evaluation on ChestX-ray14 · 14 pathologies · 30,805 images</p>
          </div>
          <div className="rmm-dataset-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            ChestX-ray14 · PyTorch · 224×224
          </div>
        </div>

        {/* MODEL SELECTOR */}
        <div className="rmm-selector" data-aos="fade-up">
          {Object.entries(models).map(([key, m]) => (
            <button key={key} className={`rmm-sel-card ${selectedModel === key ? 'active' : ''}`}
              style={{ '--rmc': m.color }} onClick={() => setSelectedModel(key)}>
              <div className="rmm-sel-glow" style={{ background: m.color }}/>
              <div className="rmm-sel-top">
                <div className="rmm-sel-dot" style={{ background: m.color, animation: selectedModel===key ? 'rmmPulse 2s ease infinite' : 'none' }}/>
                <h3 className="rmm-sel-name">{m.name}</h3>
                {key === 'mobilenet' && <span className="rmm-sel-best">BEST</span>}
              </div>
              <div className="rmm-sel-auc" style={{ color: m.color }}>{(m.metrics.auc * 100).toFixed(2)}<span>%</span></div>
              <div className="rmm-sel-sublabel">AUC-ROC</div>
              <div className="rmm-sel-params">{m.params} params</div>
              {/* mini bar */}
              <div className="rmm-sel-bar">
                <div style={{ width:`${m.metrics.auc * 100}%`, height:'100%', background:m.color, borderRadius:2, transition:'width 0.8s ease' }}/>
              </div>
            </button>
          ))}
        </div>

        {/* GLOBAL METRICS */}
        <div className="rmm-section" data-aos="fade-up">
          <div className="rmm-section-head">
            <h2 className="rmm-section-title" style={{ '--rmst': model.color }}>Global Performance</h2>
            <span className="rmm-section-model" style={{ color:model.color, background:`color-mix(in srgb, ${model.color} 10%, transparent)`, border:`1px solid color-mix(in srgb, ${model.color} 25%, transparent)` }}>{model.name}</span>
          </div>
          <div className="rmm-metrics-grid">
            {metricsDef.map((mt, i) => {
              const val = model.metrics[mt.key];
              const display = mt.fmt(val);
              const pct = mt.key === 'speed' ? Math.max(10, 100 - parseFloat(display)/5) : parseFloat(display);
              return (
                <div key={i} className="rmm-metric-card" data-aos="fade-up" data-aos-delay={i*60} style={{ '--rmc': model.color, '--rmmc': mt.color }}>
                  <div className="rmm-metric-top">
                    <div className="rmm-metric-icon" style={{ color:mt.color, background:`color-mix(in srgb, ${mt.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${mt.color} 20%, transparent)` }}>{mt.icon}</div>
                    <span className="rmm-metric-label">{mt.label}</span>
                  </div>
                  <div className="rmm-metric-val" style={{ color: mt.color }}>{display}<span className="rmm-metric-unit">{mt.unit}</span></div>
                  <div className="rmm-metric-desc">{mt.desc}</div>
                  <div className="rmm-metric-bar">
                    <div className="rmm-metric-fill" style={{ width:`${Math.min(pct,100)}%`, background:mt.color, boxShadow:`0 0 8px color-mix(in srgb, ${mt.color} 50%, transparent)` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="rmm-content-grid">

          {/* AUC PER PATHOLOGY */}
          <div data-aos="fade-right">
            <div className="rmm-section-head" style={{ marginBottom:'1.25rem' }}>
              <h2 className="rmm-section-title" style={{ '--rmst': model.color }}>AUC-ROC per Pathology</h2>
              <span className="rmm-path-count">{sortedPathologies.length} conditions</span>
            </div>
            <div className="rmm-card">
              <div className="rmm-path-list">
                {sortedPathologies.map(([pathology, auc], i) => {
                  const pct = (auc / maxAuc) * 100;
                  const risk = auc >= 0.85 ? { label:'High', color:'#10B981' } : auc >= 0.75 ? { label:'Good', color:'#F59E0B' } : { label:'Fair', color:'#EF4444' };
                  return (
                    <div key={i} className="rmm-path-item" data-aos="fade-right" data-aos-delay={i * 35}>
                      <div className="rmm-path-rank" style={{ color:model.color, background:`color-mix(in srgb, ${model.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${model.color} 20%, transparent)` }}>
                        {i + 1}
                      </div>
                      <div className="rmm-path-body">
                        <div className="rmm-path-top">
                          <span className="rmm-path-name">{pathology}</span>
                          <div className="rmm-path-right">
                            <span className="rmm-path-risk" style={{ color:risk.color, background:`color-mix(in srgb, ${risk.color} 10%, transparent)`, border:`1px solid color-mix(in srgb, ${risk.color} 20%, transparent)` }}>{risk.label}</span>
                            <span className="rmm-path-auc" style={{ color: model.color }}>{(auc * 100).toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className="rmm-path-bar">
                          <div className="rmm-path-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${model.color}, color-mix(in srgb, ${model.color} 70%, #00BFA6))`, boxShadow:`0 0 8px color-mix(in srgb, ${model.color} 40%, transparent)` }}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="rmm-right-col" data-aos="fade-left">

            {/* WHY THIS MODEL */}
            <div className="rmm-why-card" style={{ '--rmc': model.color }}>
              <div className="rmm-why-icon" style={{ background:`color-mix(in srgb, ${model.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${model.color} 25%, transparent)` }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={model.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <div className="rmm-why-label">Why {model.name}?</div>
                <p className="rmm-why-text">{model.why}</p>
              </div>
            </div>

            {/* STRENGTHS */}
            <div className="rmm-section-head" style={{ marginBottom:'1rem' }}>
              <h2 className="rmm-section-title" style={{ '--rmst': model.color }}>Key Advantages</h2>
            </div>
            <div className="rmm-card rmm-strengths-card">
              {model.strengths.map((s, i) => (
                <div key={i} className="rmm-strength-item">
                  <div className="rmm-strength-check" style={{ background:`color-mix(in srgb, ${model.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${model.color} 25%, transparent)` }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={model.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* BEST FOR */}
            <div className="rmm-section-head" style={{ margin:'1.5rem 0 1rem' }}>
              <h2 className="rmm-section-title" style={{ '--rmst': model.color }}>Best Performance</h2>
            </div>
            <div className="rmm-best-grid">
              {model.bestFor.map((p, i) => {
                const auc = model.aucPerPathology[p];
                return (
                  <div key={i} className="rmm-best-card" style={{ '--rmc': model.color }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={model.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span className="rmm-best-name">{p}</span>
                    <span className="rmm-best-auc" style={{ color: model.color }}>{auc ? (auc*100).toFixed(1)+'%' : '—'}</span>
                  </div>
                );
              })}
            </div>

            {/* DATASET INFO */}
            <div className="rmm-section-head" style={{ margin:'1.5rem 0 1rem' }}>
              <h2 className="rmm-section-title" style={{ '--rmst': model.color }}>Dataset Info</h2>
            </div>
            <div className="rmm-card">
              <div className="rmm-ds-grid">
                {[
                  { label:'Dataset',      val:'ChestX-ray14' },
                  { label:'Total Images', val:'30,805' },
                  { label:'Train',        val:'24,721' },
                  { label:'Validation',   val:'3,053' },
                  { label:'Test',         val:'3,031' },
                  { label:'Classes',      val:'14' },
                  { label:'Image Size',   val:'224×224' },
                  { label:'Framework',    val:'PyTorch' },
                ].map((it, i) => (
                  <div key={i} className="rmm-ds-item">
                    <div className="rmm-ds-label">{it.label}</div>
                    <div className="rmm-ds-val">{it.val}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ModelMetrics;