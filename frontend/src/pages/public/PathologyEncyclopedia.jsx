import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import '../../styles/pages/public/PathologyEncyclopedia.css';

const PathologyEncyclopedia = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPathology, setSelectedPathology] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
  }, []);

  useEffect(() => {
    if (selectedPathology) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedPathology]);

  const pathologies = [
    {
      id: 'pneumonia', color: '#EF4444', severity: 'serious',
      prevalence: '450M cases/year', mortality: '2.5%', aiAccuracy: '89.2%',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=350&fit=crop',
      symptoms: ['Fever and chills', 'Productive cough', 'Shortness of breath', 'Chest pain'],
      causes: 'Bacterial (Streptococcus pneumoniae), viral (influenza, COVID-19), or fungal infection of lung tissue.',
      treatment: 'Antibiotics for bacterial pneumonia, antivirals for viral causes, supportive care, and hospitalization in severe cases.',
      xrayFindings: 'Lobar or segmental consolidation, air bronchograms, and increased opacity in affected lung regions.'
    },
    {
      id: 'effusion', color: '#F59E0B', severity: 'common',
      prevalence: '1.5M cases/year', mortality: '1.8%', aiAccuracy: '87.5%',
      image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&h=350&fit=crop',
      symptoms: ['Shortness of breath', 'Chest heaviness', 'Dry cough', 'Reduced breath sounds'],
      causes: 'Heart failure, pneumonia, malignancy, pulmonary embolism, or autoimmune conditions causing fluid accumulation in pleural space.',
      treatment: 'Thoracentesis for large effusions, treatment of underlying cause, diuretics for heart failure-related cases.',
      xrayFindings: 'Blunting of costophrenic angle, meniscus sign, mediastinal shift in large effusions.'
    },
    {
      id: 'atelectasis', color: '#10B981', severity: 'common',
      prevalence: '2M cases/year', mortality: '0.5%', aiAccuracy: '82.1%',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=350&fit=crop',
      symptoms: ['Mild dyspnea', 'Decreased breath sounds', 'Cyanosis in severe cases', 'Low-grade fever'],
      causes: 'Airway obstruction, post-surgical complications, prolonged bed rest, or mucus plugging causing lung collapse.',
      treatment: 'Deep breathing exercises, chest physiotherapy, bronchoscopy for obstruction removal, incentive spirometry.',
      xrayFindings: 'Increased opacity, displacement of fissures, elevation of hemidiaphragm, mediastinal shift toward affected side.'
    },
    {
      id: 'cardiomegaly', color: '#3B82F6', severity: 'serious',
      prevalence: '64M cases/year', mortality: '8.5%', aiAccuracy: '86.7%',
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=350&fit=crop',
      symptoms: ['Shortness of breath', 'Fatigue', 'Peripheral edema', 'Palpitations'],
      causes: 'Heart failure, hypertension, valvular disease, cardiomyopathy, or chronic anemia leading to cardiac enlargement.',
      treatment: 'ACE inhibitors, beta-blockers, diuretics, lifestyle modification, and treatment of underlying cause.',
      xrayFindings: 'Cardiothoracic ratio > 0.5, enlarged cardiac silhouette, pulmonary vascular congestion.'
    },
    {
      id: 'infiltration', color: '#8B5CF6', severity: 'common',
      prevalence: '800K cases/year', mortality: '1.2%', aiAccuracy: '84.3%',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=350&fit=crop',
      symptoms: ['Cough', 'Low-grade fever', 'Fatigue', 'Mild breathlessness'],
      causes: 'Infection, aspiration, pulmonary edema, or hemorrhage causing fluid or cellular material to fill alveolar spaces.',
      treatment: 'Depends on etiology — antibiotics, anti-inflammatory agents, or supportive care.',
      xrayFindings: 'Hazy, ill-defined opacities that do not obscure underlying vasculature, often bilateral.'
    },
    {
      id: 'mass', color: '#EC4899', severity: 'serious',
      prevalence: '2.2M cases/year', mortality: '15.3%', aiAccuracy: '85.9%',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=350&fit=crop',
      symptoms: ['Persistent cough', 'Hemoptysis', 'Weight loss', 'Chest pain'],
      causes: 'Primary lung malignancy, metastatic disease, benign tumors, or infectious granulomas > 3cm in diameter.',
      treatment: 'Surgical resection, chemotherapy, radiation, targeted therapy depending on histology and staging.',
      xrayFindings: 'Well or poorly-defined opacity > 3cm, possible spiculated margins, mediastinal involvement.'
    },
    {
      id: 'nodule', color: '#14B8A6', severity: 'common',
      prevalence: '1.6M cases/year', mortality: '3.2%', aiAccuracy: '83.4%',
      image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&h=350&fit=crop',
      symptoms: ['Usually asymptomatic', 'Incidental finding', 'Rare cough or hemoptysis'],
      causes: 'Granulomas (histoplasmosis, TB), hamartomas, carcinoid tumors, or metastatic deposits < 3cm.',
      treatment: 'Surveillance CT at 3–6 months, PET scan, CT-guided biopsy or surgical resection based on risk stratification.',
      xrayFindings: 'Discrete round opacity ≤ 3cm, may be calcified (benign) or spiculated (suspicious for malignancy).'
    },
    {
      id: 'pneumothorax', color: '#F97316', severity: 'serious',
      prevalence: '700K cases/year', mortality: '2.1%', aiAccuracy: '88.3%',
      image: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&h=350&fit=crop',
      symptoms: ['Sudden sharp chest pain', 'Acute dyspnea', 'Tachycardia', 'Decreased breath sounds'],
      causes: 'Spontaneous rupture of blebs, trauma, mechanical ventilation, or underlying lung disease (COPD, cystic fibrosis).',
      treatment: 'Observation for small cases, needle aspiration, chest tube drainage, pleurodesis for recurrent cases.',
      xrayFindings: 'Visceral pleural line visible, absence of lung markings peripherally, mediastinal shift in tension pneumothorax.'
    },
    {
      id: 'consolidation', color: '#06B6D4', severity: 'common',
      prevalence: '1.2M cases/year', mortality: '1.5%', aiAccuracy: '84.7%',
      image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&h=350&fit=crop',
      symptoms: ['Productive cough', 'High fever', 'Pleuritic chest pain', 'Dullness on percussion'],
      causes: 'Pneumonia, pulmonary hemorrhage, aspiration, or neoplasm filling alveolar spaces with solid material.',
      treatment: 'Antibiotics for infectious cause, bronchoscopy, supportive oxygen therapy.',
      xrayFindings: 'Homogeneous opacity with air bronchograms, lobar distribution, obscures vascular markings.'
    },
    {
      id: 'edema', color: '#6366F1', severity: 'serious',
      prevalence: '6.2M cases/year', mortality: '12.5%', aiAccuracy: '86.1%',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=350&fit=crop',
      symptoms: ['Severe dyspnea', 'Orthopnea', 'Pink frothy sputum', 'Crackles on auscultation'],
      causes: 'Left heart failure, ARDS, fluid overload, renal failure, or low oncotic pressure causing alveolar flooding.',
      treatment: 'Diuretics, oxygen therapy, CPAP/BiPAP, vasodilators, treat underlying cardiac cause.',
      xrayFindings: 'Bilateral perihilar "bat-wing" opacities, Kerley B lines, upper lobe vascular diversion, cardiomegaly.'
    },
    {
      id: 'emphysema', color: '#84CC16', severity: 'serious',
      prevalence: '24M cases/year', mortality: '4.8%', aiAccuracy: '81.9%',
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=350&fit=crop',
      symptoms: ['Progressive dyspnea', 'Barrel chest', 'Pursed-lip breathing', 'Reduced exercise tolerance'],
      causes: 'Long-term smoking (primary cause), alpha-1 antitrypsin deficiency, air pollution causing alveolar wall destruction.',
      treatment: 'Smoking cessation, bronchodilators, pulmonary rehabilitation, lung volume reduction surgery, oxygen therapy.',
      xrayFindings: 'Hyperinflated lungs, flattened diaphragm, increased AP diameter, bullae, decreased vascular markings.'
    },
    {
      id: 'fibrosis', color: '#A855F7', severity: 'serious',
      prevalence: '200K cases/year', mortality: '7.2%', aiAccuracy: '83.6%',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=350&fit=crop',
      symptoms: ['Chronic dry cough', 'Progressive dyspnea', 'Clubbing of fingers', 'Fatigue'],
      causes: 'Idiopathic pulmonary fibrosis, autoimmune disease, chronic hypersensitivity pneumonitis, drug toxicity.',
      treatment: 'Antifibrotic agents (pirfenidone, nintedanib), pulmonary rehabilitation, lung transplant in end-stage disease.',
      xrayFindings: 'Basal-predominant reticular opacities, honeycombing, traction bronchiectasis, volume loss.'
    },
    {
      id: 'pleural_thickening', color: '#F43F5E', severity: 'common',
      prevalence: '900K cases/year', mortality: '0.8%', aiAccuracy: '80.4%',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=350&fit=crop',
      symptoms: ['Chest pain', 'Mild dyspnea', 'Often asymptomatic', 'Reduced chest expansion'],
      causes: 'Prior pleural effusion, asbestos exposure, empyema, haemothorax, or tuberculosis causing fibrous pleural scarring.',
      treatment: 'Usually conservative management; decortication surgery for restrictive cases causing significant dyspnea.',
      xrayFindings: 'Irregular pleural opacity, blunting of costophrenic angle, calcified plaques in asbestos-related disease.'
    },
    {
      id: 'hernia', color: '#0EA5E9', severity: 'common',
      prevalence: '60M cases/year', mortality: '0.3%', aiAccuracy: '79.8%',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=350&fit=crop',
      symptoms: ['Heartburn', 'Chest discomfort', 'Dysphagia', 'Often asymptomatic'],
      causes: 'Hiatal hernia (stomach herniation through diaphragm), diaphragmatic defects, or post-traumatic herniation.',
      treatment: 'Lifestyle modification, antacids/PPIs for hiatal hernia, surgical repair for symptomatic or large hernias.',
      xrayFindings: 'Retrocardiac opacity, air-fluid level, bowel gas above diaphragm, mediastinal widening.'
    },
    {
      id: 'tuberculosis', color: '#F59E0B', severity: 'serious',
      prevalence: '10M cases/year', mortality: '6.8%', aiAccuracy: '91.0%',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop',
      popupImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=350&fit=crop',
      symptoms: ['Chronic productive cough', 'Night sweats', 'Weight loss', 'Hemoptysis'],
      causes: 'Mycobacterium tuberculosis infection, spread via respiratory droplets, reactivation of latent TB in immunocompromised patients.',
      treatment: 'Standard 6-month RIPE regimen (Rifampicin, Isoniazid, Pyrazinamide, Ethambutol), DOT supervision.',
      xrayFindings: 'Upper lobe infiltrates, cavitation, miliary pattern, hilar lymphadenopathy, pleural effusion.'
    }
  ];

  const filteredPathologies = pathologies.filter(p => {
    const matchesSearch =
      t(`pathology.${p.id}.name`).toLowerCase().includes(searchTerm.toLowerCase()) ||
      t(`pathology.${p.id}.desc`).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || p.severity === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="pathology-encyclopedia-page">

      {/* HERO */}
      <section className="pathology-hero">
        <div
          className="pathology-hero-bg"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=700&fit=crop)` }}
        >
          <div className="pathology-hero-overlay" />
        </div>
        <div className="container pathology-hero-inner">
          <div className="about-badge" data-aos="fade-up">
            <div className="about-badge-dot" />
            <span>AI-Powered Detection</span>
          </div>
          <h1 className="pathology-hero-title" data-aos="fade-up" data-aos-delay="80">
            {t('pathology.encyclopedia').replace('Encyclopedia', '').replace('Encyclopédie', '').replace('des pathologies', '')}
            <span className="title-gradient-modern">
              {t('pathology.encyclopedia').includes('Encyclopédie') ? 'Encyclopédie' : 'Encyclopedia'}
            </span>
          </h1>
          <p className="pathology-hero-subtitle" data-aos="fade-up" data-aos-delay="160">
            {t('pathology.subtitle') || '15 thoracic pathologies detected and explained — powered by DenseNet-121 deep learning.'}
          </p>
        </div>
      </section>

      <div className="container pathology-content">

        {/* SEARCH & FILTERS */}
        <div className="pathology-controls" data-aos="fade-up">
          <div className="search-wrap">
            <svg className="search-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder={t('pathology.searchPlaceholder') || 'Search pathologies...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pathology-search-input"
            />
          </div>
          <div className="filter-chips">
            {['all', 'common', 'serious'].map(f => (
              <button
                key={f}
                className={`filter-chip ${selectedFilter === f ? 'active' : ''}`}
                onClick={() => setSelectedFilter(f)}
              >
                {f === 'all'     && (t('pathology.filterAll')     || 'All Pathologies')}
                {f === 'common'  && (t('pathology.filterCommon')  || 'Common')}
                {f === 'serious' && (t('pathology.filterSerious') || 'Serious')}
              </button>
            ))}
          </div>
        </div>

        {/* GRID */}
        <div className="pathologies-grid">
          {filteredPathologies.map((pathology, index) => (
            <div
              key={pathology.id}
              className="pathology-card"
              data-aos="fade-up"
              data-aos-delay={index * 40}
            >
              <div className="pathology-card-img-wrap">
                <img src={pathology.image} alt={pathology.id} className="pathology-card-img" />
                <div className="pathology-card-img-overlay" />
                <div className="pathology-severity-badge" data-severity={pathology.severity}>
                  {pathology.severity === 'serious' ? 'Serious' : 'Common'}
                </div>
                <div className="pathology-accuracy-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {pathology.aiAccuracy} AI accuracy
                </div>
              </div>

              <div className="pathology-card-body">
                <h3 className="pathology-card-title">
                  {t(`pathology.${pathology.id}.name`) || pathology.id}
                </h3>
                <p className="pathology-card-desc">
                  {t(`pathology.${pathology.id}.desc`) || pathology.causes}
                </p>

                <div className="pathology-stats-mini">
                  <div className="stat-mini">
                    <div className="stat-mini-icon-wrap" style={{ background: '#0066CC15', color: '#0066CC' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
                      </svg>
                    </div>
                    <div>
                      <span className="stat-mini-label">{t('pathology.prevalence') || 'Prevalence'}</span>
                      <span className="stat-mini-value">{pathology.prevalence}</span>
                    </div>
                  </div>
                  <div className="stat-mini">
                    <div className="stat-mini-icon-wrap" style={{ background: '#0066CC15', color: '#0066CC' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </div>
                    <div>
                      <span className="stat-mini-label">{t('pathology.mortality') || 'Mortality'}</span>
                      <span className="stat-mini-value">{pathology.mortality}</span>
                    </div>
                  </div>
                </div>

                <button
                  className="pathology-learn-btn"
                  onClick={() => setSelectedPathology(pathology)}
                >
                  <span>{t('pathology.learnMore') || 'Learn More'}</span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                  </svg>
                </button>
              </div>

              <div className="pathology-card-glow" style={{ background: pathology.color }} />
            </div>
          ))}
        </div>

        {/* DISCLAIMER */}
        <div className="disclaimer-card" data-aos="fade-up">
          <div className="disclaimer-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
          <p className="disclaimer-text">
            <strong>Medical Disclaimer — </strong>
            {t('pathology.medicalAdvice') || 'This encyclopedia is for informational purposes only. Always consult a qualified radiologist or physician for diagnosis and treatment.'}
          </p>
        </div>

      </div>

      {/* POPUP MODAL */}
      {selectedPathology && (
        <div className="modal-backdrop" onClick={() => setSelectedPathology(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>

            <div className="modal-img-wrap">
              <img src={selectedPathology.popupImage} alt={selectedPathology.id} className="modal-img" />
              <div className="modal-img-overlay" />
              <button className="modal-close-btn" onClick={() => setSelectedPathology(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
              <div className="modal-img-badges">
                <div className="pathology-severity-badge" data-severity={selectedPathology.severity}>
                  {selectedPathology.severity === 'serious' ? 'Serious' : 'Common'}
                </div>
                <div className="pathology-accuracy-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {selectedPathology.aiAccuracy} AI accuracy
                </div>
              </div>
            </div>

            <div className="modal-body">
              <h2 className="modal-title">
                {t(`pathology.${selectedPathology.id}.name`) || selectedPathology.id}
              </h2>

              <div className="modal-stats-row">
                <div className="modal-stat">
                  <span className="modal-stat-label">Prevalence</span>
                  <span className="modal-stat-value">{selectedPathology.prevalence}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">Mortality Rate</span>
                  <span className="modal-stat-value">{selectedPathology.mortality}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">AI Detection</span>
                  <span className="modal-stat-value" style={{ color: '#00BFA6' }}>{selectedPathology.aiAccuracy}</span>
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Symptoms
                </h4>
                <div className="modal-symptoms">
                  {selectedPathology.symptoms.map((s, i) => (
                    <span key={i} className="modal-symptom-tag">{s}</span>
                  ))}
                </div>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                  </svg>
                  Causes
                </h4>
                <p className="modal-text">{selectedPathology.causes}</p>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  </svg>
                  Treatment
                </h4>
                <p className="modal-text">{selectedPathology.treatment}</p>
              </div>

              <div className="modal-section">
                <h4 className="modal-section-title">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
                  </svg>
                  X-Ray Findings
                </h4>
                <p className="modal-text">{selectedPathology.xrayFindings}</p>
              </div>

              {/* <button className="modal-cta-btn" onClick={() => { setSelectedPathology(null); navigate(`/pathology/${selectedPathology.id}`); }}>
                View Full Clinical Report
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                </svg>
              </button> */}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PathologyEncyclopedia;