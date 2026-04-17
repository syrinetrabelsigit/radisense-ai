import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import { useInView } from 'react-intersection-observer';
import '../../styles/pages/public/About.css';

const About = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [counters, setCounters] = useState({ analyses: 0, radiologists: 0, countries: 0 });

  useEffect(() => { AOS.init({ duration: 800, once: true }); }, []);

  useEffect(() => {
    if (inView) {
      const duration = 2000, steps = 60, interval = duration / steps;
      const targets = { analyses: 30000, radiologists: 500, countries: 15 };
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setCounters({
          analyses: Math.floor((targets.analyses / steps) * step),
          radiologists: Math.floor((targets.radiologists / steps) * step),
          countries: Math.floor((targets.countries / steps) * step)
        });
        if (step >= steps) clearInterval(timer);
      }, interval);
      return () => clearInterval(timer);
    }
  }, [inView]);

  // const timeline = [
  //   { period: '2023q1', year: '2023 Q1' },
  //   { period: '2023q3', year: '2023 Q3' },
  //   { period: '2024q1', year: '2024 Q1' },
  //   { period: '2024q3', year: '2024 Q3' },
  //   { period: '2025q2', year: '2025 Q2' },
  //   { period: '2026q1', year: '2026 Q1' }
  // ];

  const values = [
    {
      key: 'innovation', color: '#0066CC',
      img: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&h=220&fit=crop',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
      )
    },
    {
      key: 'accuracy', color: '#00BFA6',
      img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=500&h=220&fit=crop',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
        </svg>
      )
    },
    {
      key: 'speed', color: '#0066CC',
      img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=220&fit=crop',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      )
    },
    {
      key: 'accessibility', color: '#00BFA6',
      img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=220&fit=crop',
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="about-page">

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-bg" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=900&fit=crop)` }}>
          <div className="about-hero-overlay" />
        </div>
        <div className="container about-hero-inner">
          <div className="about-hero-content" data-aos="fade-up">
            <div className="about-badge">
              <div className="about-badge-dot" />
              <span>Leading AI Radiology Platform</span>
            </div>
            <h1 className="about-hero-title">
              {t('about.title').replace('RadiSense AI', '')}{' '}
              <span className="title-gradient-modern">RadiSense AI</span>
            </h1>
            <p className="about-hero-subtitle">
              {t('about.subtitle') || 'Transforming radiology through artificial intelligence and clinical expertise.'}
            </p>
            <p className="about-hero-tagline">
              {t('about.hero.tagline') || 'Built by radiologists, for radiologists.'}
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="about-stats-section" ref={ref}>
        <div className="container">
          <div className="about-stats-grid">
            {[
              { value: `${counters.analyses.toLocaleString()}+`, label: t('about.stats.analyses') || 'Scans Analysed' },
              { value: '84.5%', label: t('about.stats.accuracy') || 'Diagnostic Accuracy' },
              { value: `${counters.radiologists}+`, label: t('about.stats.radiologists') || 'Radiologists Worldwide' },
              { value: `${counters.countries}`, label: t('about.stats.countries') || 'Countries Served' }
            ].map((s, i) => (
              <div className="about-stat-card" key={i} data-aos="fade-up" data-aos-delay={i * 80}>
                <div className="about-stat-value">{s.value}</div>
                <div className="about-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="mission-section">
        <div className="container">
          <h2 className="section-title-modern" data-aos="fade-up">
            What <span className="title-gradient-modern">Drives Us</span>
          </h2>
          <p className="section-subtitle-modern" data-aos="fade-up" data-aos-delay="100">
            The purpose and ambition behind every line of code
          </p>
          <div className="mission-grid">
            <div className="mission-card" data-aos="fade-right">
              <div className="mission-card-img">
                <img src="https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&h=280&fit=crop" alt="Mission" />
                <div className="mission-card-img-overlay" />
              </div>
              <div className="mission-body">
                <div className="mission-icon-wrap">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <h2 className="mission-title">{t('about.mission.title') || 'Our Mission'}</h2>
                <p className="mission-text">{t('about.mission.text') || 'To make accurate AI-assisted radiology accessible to every healthcare provider — reducing diagnostic errors and saving lives at scale.'}</p>
              </div>
            </div>
            <div className="mission-card" data-aos="fade-left">
              <div className="mission-card-img">
                <img src="https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=280&fit=crop" alt="Vision" />
                <div className="mission-card-img-overlay" />
              </div>
              <div className="mission-body">
                <div className="mission-icon-wrap" style={{ background: 'rgba(0,191,166,0.1)', borderColor: 'rgba(0,191,166,0.2)', color: '#00BFA6' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                </div>
                <h2 className="mission-title">{t('about.vision.title') || 'Our Vision'}</h2>
                <p className="mission-text">{t('about.vision.text') || 'A world where no critical pathology is missed due to human fatigue or resource scarcity — where AI and clinicians work in perfect symbiosis.'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="values-section">
        <div className="container">
          <h2 className="section-title-modern" data-aos="fade-up">
            {t('about.values.title').replace('Values', '').replace('Valeurs', '')}
            <span className="title-gradient-modern">
              {t('about.values.title').includes('Valeurs') ? 'Valeurs' : 'Values'}
            </span>          </h2>
          <p className="section-subtitle-modern" data-aos="fade-up" data-aos-delay="100">
            The principles that guide every decision we make
          </p>
          <div className="values-grid">
            {values.map((v, i) => (
              <div className="value-card" key={v.key} data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="value-card-img-wrap">
                  <img src={v.img} alt={v.key} className="value-card-img" />
                  <div className="value-card-img-overlay" />
                </div>
                <div className="value-card-body">
                  <div className="value-icon-wrap" style={{ background: `${v.color}15`, borderColor: `${v.color}30`, color: v.color }}>
                    {v.icon}
                  </div>
                  <h3 className="value-title">{t(`about.value.${v.key}`) || v.key}</h3>
                  <p className="value-desc">{t(`about.value.${v.key}_desc`)}</p>                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE
      <section className="timeline-section">
        <div className="container">
          <h2 className="section-title-modern" data-aos="fade-up">
            Our <span className="title-gradient-modern">Journey</span>
          </h2>
          <p className="section-subtitle-modern" data-aos="fade-up" data-aos-delay="100">
            {t('about.timeline.title') || 'Key milestones in building the future of radiology'}
          </p>
          <div className="timeline">
            <div className="timeline-track" />
            {timeline.map((item, index) => (
              <div
                key={item.period}
                className={`timeline-item ${index % 2 === 0 ? 'left' : 'right'}`}
                data-aos={index % 2 === 0 ? 'fade-right' : 'fade-left'}
              >
                <div className="timeline-dot" />
                <div className="timeline-card">
                  <div className="timeline-year-badge">{item.year}</div>
                  <h3 className="timeline-title">{t(`about.timeline.${item.period}`) || `Milestone ${index + 1}`}</h3>
                  <p className="timeline-desc">{t(`about.timeline.${item.period}.desc`) || ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA */}
      <section
        className="about-cta-section"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=600&fit=crop)` }}
      >
        <div className="about-cta-overlay" />
        <div className="container about-cta-inner" data-aos="fade-up">
          <h2 className="cta-title-modern">{t('about.cta.title') || 'Ready to Transform Your Practice?'}</h2>
          <p className="cta-subtitle-modern">{t('about.cta.subtitle') || 'Join hundreds of radiologists leveraging AI for better patient outcomes'}</p>
          <button className="btn-cta-about" onClick={() => navigate('/register')}>
            <span>{t('about.cta.button') || "Get Started — It's Free"}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>
      </section>

    </div>
  );
};

export default About;