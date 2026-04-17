import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Avatar from '../shared/Avatar';
import '../../styles/pages/public/Landing.css';
import '../../styles/pages/public/Partners.css';

const API = 'http://localhost:8000';

const Partners = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const res = await fetch(`${API}/api/users/partners`);
      if (!res.ok) throw new Error('Failed to fetch partners');
      const data = await res.json();
      setPartners(data.partners || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const specialties = ['all', ...new Set(partners.map(p => p.specialty).filter(Boolean))];

  const filtered = partners.filter(p => {
    const matchFilter = filter === 'all' || p.specialty === filter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q
      || p.name?.toLowerCase().includes(q)
      || p.cabinet_name?.toLowerCase().includes(q)
      || p.country?.toLowerCase().includes(q)
      || p.city?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalAnalyses = partners.reduce((acc, p) => acc + (p.analyses_count || 0), 0);
  const countriesCount = new Set(partners.map(p => p.country).filter(Boolean)).size;

  const globalStats = [
    { val: `${partners.length}+`, label: t('partners.stats.partners') },
    { val: countriesCount > 0 ? `${countriesCount}+` : `${partners.length}+`, label: t('partners.stats.countries') },
    { val: totalAnalyses >= 1000 ? `${(totalAnalyses / 1000).toFixed(1)}K+` : `${totalAnalyses}+`, label: t('partners.stats.analyses') },
    { val: '95%', label: t('partners.stats.accuracy') },
  ];

  const planInfo = (plan) => ({
    enterprise:            { label: 'Enterprise', color: '#8B5CF6' },
    pro:                   { label: 'Pro',        color: '#0066CC' },
    researcher_pro:        { label: 'Pro',        color: '#0066CC' },
    researcher_enterprise: { label: 'Enterprise', color: '#8B5CF6' },
    free:                  { label: 'Free',       color: '#10B981' },
  }[plan] || { label: 'Free', color: '#10B981' });

  const CARD_COLORS = ['#0066CC','#8B5CF6','#00BFA6','#F59E0B','#EF4444','#10B981','#06B6D4'];
  const cardColor = (i) => CARD_COLORS[i % CARD_COLORS.length];

  const whyCards = [
    { img:'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&h=300&fit=crop', n:'01', titleKey:'partners.why.b1.title', descKey:'partners.why.b1.desc' },
    { img:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',    n:'02', titleKey:'partners.why.b2.title', descKey:'partners.why.b2.desc' },
    { img:'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&h=300&fit=crop',    n:'03', titleKey:'partners.why.b3.title', descKey:'partners.why.b3.desc' },
  ];

  return (
    <div className="landing-modern partners-page">

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="hero-modern" style={{ minHeight:'80vh' }}>
        <div className="hero-bg-image" style={{ backgroundImage:`url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&h=1080&fit=crop)` }}>
          <div className="hero-overlay-light" />
        </div>
        <div className="container hero-container-modern" style={{ width:'100%' }}>
          <div className="partners-hero-center" data-aos="fade-up">
            <div className="badge-modern" style={{ margin:'0 auto 2rem' }}>
              <div className="badge-pulse" />
              <span>{t('partners.hero.badge')}</span>
            </div>
            <h1 className="hero-title-xl" style={{ textAlign:'center', fontSize:'clamp(2.75rem,6vw,5rem)' }}>
              {t('partners.hero.title')}
              <br />
              <span className="title-gradient-modern">{t('partners.hero.titleGradient')}</span>
            </h1>
            <p className="hero-desc-modern" style={{ textAlign:'center', margin:'0 auto 3.5rem', maxWidth:680 }}>
              {t('partners.hero.subtitle')}
            </p>
            {!loading && (
              <div className="partners-stats-strip">
                {globalStats.map((s, i) => (
                  <div key={i} className="partners-stat-item" data-aos="fade-up" data-aos-delay={i * 80}>
                    <div className="stat-val">{s.val}</div>
                    <div className="stat-lab">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ FILTER BAR ════════════════════════════════════════════════════ */}
      <section className="partners-filter-section">
        <div className="container">
          <div className="partners-filter-bar" data-aos="fade-up">
            <div className="partners-search-wrap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="partners-search-icon">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                className="partners-search-input"
                placeholder={t('partners.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="partners-pills">
              {specialties.map(s => (
                <button key={s} className={`partners-pill ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                  {s === 'all' ? t('partners.filterAll') : s}
                </button>
              ))}
            </div>
          </div>
          {!loading && (
            <p className="partners-count" data-aos="fade-up">
              {t('partners.showing')} <strong>{filtered.length}</strong> {t('partners.of')} <strong>{partners.length}</strong> {t('partners.radiologists')}
            </p>
          )}
        </div>
      </section>

      {/* ══ CONTENT ════════════════════════════════════════════════════════ */}
      <section className="partners-grid-section">
        <div className="container">

          {/* Loading */}
          {loading && (
            <div className="partners-loading">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="partner-card-skeleton card" />
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="partners-empty" data-aos="fade-up">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <h3>Failed to load partners</h3>
              <p>{error}</p>
              <button className="partners-reset-btn" onClick={fetchPartners}>Try Again</button>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className="partners-grid">
              {filtered.map((p, i) => {
                const plan = planInfo(p.plan);
                const color = cardColor(i);
                return (
                  <div key={p.id} className="partner-card card" data-aos="fade-up" data-aos-delay={(i % 3) * 80}>

                    {/* Top colored bar */}
                    <div className="partner-card-top-bar" style={{ background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, #00BFA6))` }} />

                    {/* Plan badge */}
                    <div className="partner-plan-badge" style={{ background:`color-mix(in srgb, ${plan.color} 15%, transparent)`, border:`1px solid color-mix(in srgb, ${plan.color} 40%, transparent)`, color:plan.color }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      {plan.label}
                    </div>

                    {/* Card body */}
                    <div className="partner-card-body">

                      {/* Avatar + name */}
                      <div className="partner-header-row">
                        <Avatar
                          avatarUrl={p.avatar_url}
                          firstName={p.first_name}
                          lastName={p.last_name}
                          size={64}
                          color={color}
                          style={{ border:`3px solid color-mix(in srgb, ${color} 30%, transparent)`, boxShadow:`0 4px 16px color-mix(in srgb, ${color} 25%, transparent)` }}
                        />
                        <div>
                          <h3 className="partner-name">{p.name}</h3>
                          {p.years_experience && (
                            <span className="partner-exp">{p.years_experience} experience</span>
                          )}
                        </div>
                      </div>

                      {/* Specialty */}
                      <div className="partner-specialty" style={{ color }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        {p.specialty}
                      </div>

                      {/* Cabinet */}
                      {(p.cabinet_name || p.city) && (
                        <div className="partner-location">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span>
                            {p.cabinet_name && <strong>{p.cabinet_name}</strong>}
                            {p.cabinet_name && (p.city || p.country) && ' · '}
                            {[p.city, p.region, p.country].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Cabinet phone */}
                      {p.cabinet_phone && (
                        <div className="partner-location">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                          {p.cabinet_phone}
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="partner-metrics">
                        <div className="partner-metric">
                          <span className="partner-metric-val" style={{ color }}>{p.analyses_count > 0 ? p.analyses_count.toLocaleString() : '—'}</span>
                          <span className="partner-metric-lab">{t('partners.analyses')}</span>
                        </div>
                        <div className="partner-metric-divider" />
                        <div className="partner-metric">
                          <span className="partner-metric-val" style={{ color }}>{p.member_since || '—'}</span>
                          <span className="partner-metric-lab">{t('partners.memberSince')}</span>
                        </div>
                      </div>

                      {/* Verified */}
                      <div className="partner-verified">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        {t('partners.verified')}
                      </div>
                    </div>

                    <div className="partner-glow" style={{ background:color }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="partners-empty" data-aos="fade-up">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <h3>{t('partners.noResults')}</h3>
              <p>{t('partners.noResultsSub')}</p>
              <button className="partners-reset-btn" onClick={() => { setFilter('all'); setSearchQuery(''); }}>
                {t('partners.resetFilters')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══ WHY JOIN ═══════════════════════════════════════════════════════ */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title-modern" data-aos="fade-up">
            {t('partners.why.title')} <span className="title-gradient-modern">{t('partners.why.titleGradient')}</span>
          </h2>
          <p className="section-subtitle-modern" data-aos="fade-up">{t('partners.why.subtitle')}</p>
          <div className="steps-grid">
            {whyCards.map((c, i) => (
              <div key={i} className="step-card card" data-aos="fade-up" data-aos-delay={i * 100}>
                <div className="step-image-wrapper">
                  <img src={c.img} alt={t(c.titleKey)} className="step-image" />
                  <div className="step-number">{c.n}</div>
                </div>
                <div className="step-content">
                  <h3 className="step-title">{t(c.titleKey)}</h3>
                  <p className="step-desc">{t(c.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ════════════════════════════════════════════════════════════ */}
      <section className="cta-modern" style={{ backgroundImage:`url(https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1920&h=600&fit=crop)` }}>
        <div className="cta-overlay-modern" />
        <div className="container cta-container-modern" data-aos="fade-up">
          <h2 className="cta-title-modern">{t('partners.cta.title')}</h2>
          <p className="cta-subtitle-modern">{t('partners.cta.subtitle')}</p>
          <button className="btn-cta-modern" onClick={() => navigate('/register?role=radiologist')}>
            {t('partners.cta.button')}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ marginLeft:'0.75rem', display:'inline' }}>
              <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Partners;