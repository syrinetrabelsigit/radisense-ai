import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui';
import '../../styles/pages/public/Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const diagnoses = [
    { 
      name: t('results.pathology.pneumonia'),
      confidence: '94%', 
      color: '#EF4444',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop'
    },
    { 
      name: 'COVID-19', 
      confidence: '91%', 
      color: '#F59E0B',
      image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&h=400&fit=crop'
    },
    { 
      name: t('pathology.tuberculosis.name'),
      confidence: '88%', 
      color: '#10B981',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop'
    },
    { 
      name: t('results.pathology.cardiomegaly'),
      confidence: '86%', 
      color: '#8B5CF6',
      image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&h=400&fit=crop'
    },
    { 
      name: t('results.pathology.effusion'),
      confidence: '89%', 
      color: '#06B6D4',
      image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=600&h=400&fit=crop'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % diagnoses.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { 
      title: t('features.deeplearning.title'),
      desc: t('features.deeplearning.desc'),
      img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop'
    },
    { 
      title: t('features.instant.title'),
      desc: t('features.instant.desc'),
      img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop'
    },
    { 
      title: t('features.hipaa.title'),
      desc: t('features.hipaa.desc'),
      img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop'
    },
    { 
      title: t('features.pathologies.title'),
      desc: t('features.pathologies.desc'),
      img: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop'
    },
    { 
      title: t('features.analytics.title'),
      desc: t('features.analytics.desc'),
      img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
    },
    { 
      title: t('landing.features.cloud.title'),
      desc: t('landing.features.cloud.desc'),
      img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop'
    }
  ];

  return (
    <div className="landing-modern">
      {/* HERO */}
      <section className="hero-modern">
        <div className="hero-bg-image" style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=1080&fit=crop)`
        }}>
          <div className="hero-overlay-light"></div>
        </div>

        <div className="container hero-container-modern">
          <div className="hero-grid-modern">
            {/* LEFT */}
            <div className="hero-left-modern">
              <div className="badge-modern">
                <div className="badge-pulse"></div>
                <span>{t('hero.badge')}</span>
              </div>

              <h1 className="hero-title-xl">
                {t('landing.hero.line1')}
                <br />
                <span className="title-gradient-modern">{t('landing.hero.line2')}</span>
                <br />
                {t('landing.hero.line3')}
              </h1>

              <p className="hero-desc-modern">
                {t('hero.subtitle')}
              </p>

              <div className="cta-buttons-modern">
                <button className="btn-primary-modern" onClick={() => navigate('/register')}>
                  <span>{t('hero.cta.primary')}</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                  </svg>
                </button>
                <button className="btn-secondary-modern" onClick={() => navigate('/about')}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"/>
                  </svg>
                  <span>{t('landing.hero.watchDemo')}</span>
                </button>
              </div>

              <div className="stats-modern">
                <div className="stat-modern">
                  <div className="stat-val">30K+</div>
                  <div className="stat-lab">{t('landing.stats.scans')}</div>
                </div>
                <div className="stat-modern">
                  <div className="stat-val">&lt;3s</div>
                  <div className="stat-lab">{t('hero.stats.time')}</div>
                </div>
                <div className="stat-modern">
                  <div className="stat-val">84%</div>
                  <div className="stat-lab">{t('hero.stats.accuracy')}</div>
                </div>
              </div>
            </div>

            {/* RIGHT - CAROUSEL */}
            <div className="hero-right-modern">
              <div className="showcase-card-modern">
                <div className="image-display-modern">
                  <img 
                    src={diagnoses[currentSlide].image} 
                    alt={diagnoses[currentSlide].name}
                    className="showcase-image"
                  />
                  <div className="image-overlay-modern"></div>
                  <div className="scan-line-modern"></div>
                  <div className="ai-overlay-modern">
                    <div className="ai-points">
                      <div className="point point-1"></div>
                      <div className="point point-2"></div>
                      <div className="point point-3"></div>
                    </div>
                  </div>
                </div>

                <div className="result-display-modern">
                  <div className="result-header-modern">
                    <div className="status-badge-modern">
                      <div className="status-icon">✓</div>
                      <span>{t('landing.carousel.analysisComplete')}</span>
                    </div>
                    <div className="time-badge-modern">2.3s</div>
                  </div>

                  <div className="diagnosis-card-modern" style={{ borderColor: diagnoses[currentSlide].color }}>
                    <div className="diagnosis-info-modern">
                      <div className="diagnosis-name-modern">{diagnoses[currentSlide].name}</div>
                      <div className="diagnosis-meta-modern">{t('landing.carousel.highConfidence')}</div>
                    </div>
                    <div className="diagnosis-confidence-modern" style={{ color: diagnoses[currentSlide].color }}>
                      {diagnoses[currentSlide].confidence}
                    </div>
                  </div>
                </div>

                <div className="carousel-dots-modern">
                  {diagnoses.map((_, i) => (
                    <button
                      key={i}
                      className={`dot-modern ${i === currentSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(i)}
                      style={{ background: i === currentSlide ? diagnoses[i].color : 'var(--border-primary)' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title-modern">
            {t('landing.howItWorks.titleStart')} <span className="title-gradient-modern">RadiSense AI</span> {t('landing.howItWorks.titleEnd')}
          </h2>
          <p className="section-subtitle-modern">
            {t('landing.howItWorks.subtitle')}
          </p>

          <div className="steps-grid">
            <div className="step-card card">
              <div className="step-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=300&fit=crop" 
                  alt={t('landing.steps.upload.title')}
                  className="step-image"
                />
                <div className="step-number">1</div>
              </div>
              <div className="step-content">
                <h3 className="step-title">{t('landing.steps.upload.title')}</h3>
                <p className="step-desc">{t('landing.steps.upload.desc')}</p>
              </div>
            </div>

            <div className="step-card card">
              <div className="step-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=300&fit=crop" 
                  alt={t('landing.steps.ai.title')}
                  className="step-image"
                />
                <div className="step-number">2</div>
              </div>
              <div className="step-content">
                <h3 className="step-title">{t('landing.steps.ai.title')}</h3>
                <p className="step-desc">{t('landing.steps.ai.desc')}</p>
              </div>
            </div>

            <div className="step-card card">
              <div className="step-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop" 
                  alt={t('landing.steps.results.title')}
                  className="step-image"
                />
                <div className="step-number">3</div>
              </div>
              <div className="step-content">
                <h3 className="step-title">{t('landing.steps.results.title')}</h3>
                <p className="step-desc">{t('landing.steps.results.desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-modern">
        <div className="container">
          <h2 className="section-title-modern">
            {t('landing.featuresSection.titleStart')} <span className="title-gradient-modern">{t('landing.featuresSection.titleGradient')}</span>
          </h2>
          <p className="section-subtitle-modern">
            {t('landing.featuresSection.subtitle')}
          </p>

          <div className="features-grid-3">
            {features.map((feature, i) => (
              <div key={i} className="feature-card-image card">
                <div className="feature-image-wrapper">
                  <img src={feature.img} alt={feature.title} className="feature-img" />
                  <div className="feature-image-overlay"></div>
                </div>
                <div className="feature-content-modern">
                  <h3 className="feature-title-modern">{feature.title}</h3>
                  <p className="feature-desc-modern">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-modern" style={{
        backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=600&fit=crop)`
      }}>
        <div className="cta-overlay-modern"></div>
        <div className="container cta-container-modern">
          <h2 className="cta-title-modern">{t('cta.title')}</h2>
          <p className="cta-subtitle-modern">{t('cta.subtitle')}</p>
          <button className="btn-cta-modern" onClick={() => navigate('/register')}>
            {t('cta.button')} →
          </button>
        </div>
      </section>
    </div>
  );
};

export default Landing;