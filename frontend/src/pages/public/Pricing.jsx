import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import '../../styles/pages/public/Pricing.css';

const API = 'http://localhost:8000';

const CURRENCIES = [
  { code: 'usd', symbol: '$',    label: 'USD — Dollar' },
  { code: 'eur', symbol: '€',    label: 'EUR — Euro' },
  { code: 'gbp', symbol: '£',    label: 'GBP — Pound' },
  { code: 'tnd', symbol: 'TND ', label: 'TND — Dinar' },
];
const RATES = { usd: 1, eur: 0.92, gbp: 0.79, tnd: 3.09 };

const Pricing = () => {
  const navigate    = useNavigate();
  const { t }       = useTranslation();
  const dropdownRef = useRef(null);

  const [billing,  setBilling]  = useState('monthly');
  const [currency, setCurrency] = useState('usd');
  const [showCurr, setShowCurr] = useState(false);
  const [openFaq,  setOpenFaq]  = useState(null);
  const [loading,  setLoading]  = useState(null);
  const [activeTab, setActiveTab] = useState('radiologist'); // 'radiologist' | 'researcher'

  useEffect(() => {
    AOS.init({ duration: 600, once: true });
    const handleClick = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowCurr(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const curr    = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  const rate    = RATES[currency] || 1;
  const convert = (usdPrice) => {
    const v = Math.floor(usdPrice * rate);
    return currency === 'tnd' ? `TND ${v}` : `${curr.symbol}${v}`;
  };

  // ─── Plans Radiologist ─────────────────────────────────────────────────────
  const radiologistPlans = [
    {
      id: 'free', stripeId: null, color: '#10B981', monthlyUSD: 0, yearlyUSD: 0,
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      name: 'Free',
      desc: 'Get started with AI radiology',
      features: ['10 analyses/month', 'Basic pathology detection (5)', 'Standard heatmaps', 'Email support', 'Patient management'],
    },
    {
      id: 'pro', stripeId: 'pro', color: '#0066CC', popular: true, monthlyUSD: 79, yearlyUSD: Math.floor(79 * 0.8),
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
      name: 'Pro',
      desc: 'For active radiologists',
      features: ['500 analyses/month', 'All 14 pathologies', 'Advanced Grad-CAM heatmaps', 'Priority support', 'API access', 'PDF exports', 'Analytics dashboard', 'Unlimited patients'],
    },
    {
      id: 'enterprise', stripeId: 'enterprise', color: '#8B5CF6', monthlyUSD: 199, yearlyUSD: Math.floor(199 * 0.8),
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      name: 'Enterprise',
      desc: 'For clinics & hospitals',
      features: ['Unlimited analyses', 'All 14 pathologies', 'Custom model training', 'Dedicated support', 'On-premise deployment', 'SLA guarantee', 'Full API access', 'Custom integrations'],
    },
  ];

  // ─── Plans Researcher ──────────────────────────────────────────────────────
  const researcherPlans = [
    {
      id: 'free', stripeId: null, color: '#10B981', monthlyUSD: 0, yearlyUSD: 0,
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
      name: 'Free',
      desc: 'Explore research tools',
      features: ['Access to 5 oldest analyses (read-only)', 'Basic model comparison', 'Community support', 'Standard visualizations', 'Public datasets only'],
    },
    {
      id: 'researcher_pro', stripeId: 'researcher_pro', color: '#0066CC', popular: true, monthlyUSD: 49, yearlyUSD: Math.floor(49 * 0.8),
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
      name: 'Pro',
      desc: 'For active researchers',
      features: ['Access to 100 most recent analyses', 'Advanced model comparison', 'Priority support', 'API access', 'Export results (CSV, JSON)', 'Private dataset upload', 'Experiment tracking'],
    },
    {
      id: 'researcher_enterprise', stripeId: 'researcher_enterprise', color: '#8B5CF6', monthlyUSD: 99, yearlyUSD: Math.floor(99 * 0.8),
      icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
      name: 'Enterprise',
      desc: 'For research institutions',
      features: ['Unlimited access to all analyses', 'Custom model training', 'Dedicated support', 'Raw data export', 'On-premise option', 'Multi-user workspace', 'Priority compute'],
    },
  ];

  const currentPlans = activeTab === 'radiologist' ? radiologistPlans : researcherPlans;

  const getDisplayPrice = (plan) => {
    if (plan.monthlyUSD === 0) return 'Free';
    if (billing === 'yearly') {
      return convert(plan.yearlyUSD * 12); // total annuel
    }
    return convert(plan.monthlyUSD);
  };

  const handleSubscribe = async (plan) => {
  if (plan.monthlyUSD === 0) {
    navigate(`/register?role=${activeTab}&plan=${plan.id}`);  // ✅ AJOUTE &plan=
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) {
    navigate(`/register?role=${activeTab}&plan=${plan.id}`);  // ✅ Change stripeId → id
    return;
  }
  
  // ✅ VÉRIFIER EMAIL AVANT PAIEMENT
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.email_verified) {
    alert('⚠️ Please verify your email first!\n\nWe sent you a verification link to ' + user.email + '. Check your inbox and spam folder.\n\nAfter verification, you can subscribe to a plan.');
    return;
  }
  
  setLoading(plan.id);
  try {
    const r = await fetch(`${API}/api/payments/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: plan.stripeId, billing, currency }),
    });
    if (!r.ok) { 
      const e = await r.json(); 
      // ✅ Afficher erreur si email non vérifié
      if (e.detail && e.detail.includes('verify')) {
        alert('⚠️ ' + e.detail);
        return;
      }
      throw new Error(e.detail || 'Failed'); 
    }
    const data = await r.json();
    window.location.href = data.checkout_url;
  } catch (err) { 
    alert('Error: ' + err.message); 
  } finally { 
    setLoading(null); 
  }
  };

  const faqs = [
    { q: 'Can I switch plans anytime?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
    { q: 'What happens if I exceed my quota?', a: 'Once you reach your monthly analysis limit, you will be notified and can upgrade your plan to continue.' },
    { q: 'Is there a free trial?', a: 'Yes, the Free plan is available forever with limited features. No credit card required.' },
    { q: 'How is billing handled?', a: 'Billing is handled securely via Stripe. You can cancel anytime before your next billing cycle.' },
    { q: 'Do radiologists and researchers have different plans?', a: 'Yes. Radiologist plans are focused on AI analysis quotas. Researcher plans are focused on dataset access and research tools.' },
    { q: 'Is my data secure?', a: 'All data is encrypted at rest and in transit. We comply with HIPAA and GDPR standards.' },
  ];

  return (
    <div className="pricing-page">

      {/* HERO */}
      <section className="pricing-hero">
        <div className="pricing-hero-bg" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1920&h=700&fit=crop)` }}>
          <div className="pricing-hero-overlay" />
        </div>
        <div className="container pricing-hero-inner" style={{ position: 'relative', zIndex: 10 }}>
          <div className="about-badge" data-aos="fade-up">
            <div className="about-badge-dot" />
            <span>Transparent Pricing</span>
          </div>
          <h1 className="pricing-hero-title" data-aos="fade-up" data-aos-delay="80">
            Simple, Transparent <span className="title-gradient-modern">Plans</span>
          </h1>
          <p className="pricing-hero-subtitle" data-aos="fade-up" data-aos-delay="160">
            Different plans for radiologists and researchers. Choose what fits your needs.
          </p>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }} data-aos="fade-up" data-aos-delay="240">
            <div className="billing-toggle">
              <button className={`billing-btn ${billing === 'monthly' ? 'active' : ''}`} onClick={() => setBilling('monthly')}>Monthly</button>
              <button className={`billing-btn ${billing === 'yearly' ? 'active' : ''}`} onClick={() => setBilling('yearly')}>
                Yearly <span className="save-chip">Save 20%</span>
              </button>
            </div>
            <div ref={dropdownRef} style={{ position: 'relative', zIndex: 9999, isolation: 'isolate' }}>
              <button onClick={() => setShowCurr(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '100px', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1.5px solid rgba(255,255,255,0.25)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                <span style={{ fontSize: '1rem' }}>{curr.symbol}</span>
                <span>{curr.code.toUpperCase()}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: showCurr ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showCurr && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: 'rgba(10,14,26,0.98)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', padding: '0.5rem', minWidth: '190px', zIndex: 9999, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
                  {CURRENCIES.map(c => (
                    <button key={c.code} onClick={() => { setCurrency(c.code); setShowCurr(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 1rem', borderRadius: '10px', width: '100%', background: currency === c.code ? 'rgba(0,102,204,0.2)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', color: currency === c.code ? '#60A5FA' : '#94A3B8', fontWeight: currency === c.code ? 700 : 500, fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 900, minWidth: 28, fontSize: '1rem' }}>{c.symbol}</span>
                      {c.label}
                      {currency === c.code && <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container pricing-content">

        {/* TAB SWITCHER */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }} data-aos="fade-up">
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '6px', gap: '6px' }}>
            {[
              { id: 'radiologist', label: 'Radiologist Plans', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, color: '#0066CC' },
              { id: 'researcher',  label: 'Researcher Plans',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, color: '#8B5CF6' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.2s',
                  background: activeTab === tab.id ? tab.color : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-muted)' }}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Context banner */}
        <div style={{ maxWidth: 700, margin: '0 auto 3rem', textAlign: 'center' }} data-aos="fade-up">
          {activeTab === 'radiologist' ? (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,102,204,0.06)', border: '1px solid rgba(0,102,204,0.2)', borderRadius: '14px', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.7 }}>
              <strong style={{ color: '#60A5FA' }}>For Radiologists</strong> — Plans are based on your monthly X-ray analysis quota. You manage your own patients and send them their results. The more analyses you need, the higher the plan.
            </div>
          ) : (
            <div style={{ padding: '1rem 1.5rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.7 }}>
              <strong style={{ color: '#C4B5FD' }}>For Researchers</strong> — Plans are based on dataset access and research tools. No analysis quota — designed for data science, model training, and medical research workflows.
            </div>
          )}
        </div>

        {/* PLANS GRID */}
        <div className="pricing-grid" style={{ marginBottom: '4rem' }}>
          {currentPlans.map((plan, index) => {
            const displayPrice = getDisplayPrice(plan);
            const isLoading    = loading === plan.id;
            const monthlyPrice = plan.monthlyUSD > 0 ? convert(plan.monthlyUSD) : null;
            const saving       = plan.monthlyUSD > 0 && billing === 'yearly' ? convert(plan.monthlyUSD - plan.yearlyUSD) : null;

            return (
              <div key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`} data-aos="fade-up" data-aos-delay={index * 100}>
                {plan.popular && (
                  <div className="popular-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Most Popular
                  </div>
                )}
                <div className="pricing-card-header">
                  <div className="plan-icon-wrap" style={{ background: `${plan.color}18`, borderColor: `${plan.color}30`, color: plan.color }}>
                    {plan.icon}
                  </div>
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-desc">{plan.desc}</p>
                </div>
                <div className="pricing-card-price">
                  <div className="price-wrapper">
                    <span className="price-amount" style={!plan.popular ? { backgroundImage: `linear-gradient(135deg, ${plan.color}, ${plan.color}aa)` } : {}}>
                      {displayPrice}
                    </span>
                    {plan.monthlyUSD > 0 && (
                      <span className="price-period">{billing === 'monthly' ? '/month' : '/year'}</span>
                    )}
                  </div>
                  {billing === 'yearly' && plan.monthlyUSD > 0 && (
                    <>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', padding: '0.25rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '100px', color: '#10B981', fontSize: '0.78rem', fontWeight: 700 }}>
                        🎉 Save {saving}/mo vs monthly
                      </div>
                      <p className="price-billing" style={{ marginTop: '0.375rem' }}>
                        {convert(plan.monthlyUSD)}/mo × 12 months
                      </p>
                    </>
                  )}
                  {billing === 'monthly' && plan.monthlyUSD > 0 && (
                    <p className="price-billing">Billed monthly · Cancel anytime</p>
                  )}
                </div>
                <div className="pricing-card-features">
                  {plan.features.map((f, i) => (
                    <div key={i} className="feature-item">
                      <div className="feature-check" style={{ background: `${plan.color}18`, color: plan.color }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span className="feature-text">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="pricing-card-footer">
                  <button
                    className={`plan-btn ${plan.popular ? 'plan-btn-primary' : 'plan-btn-outline'}`}
                    style={!plan.popular ? { borderColor: plan.color, color: plan.color } : {}}
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <><span className="auth-spinner" style={{ width: 16, height: 16, borderWidth: 2 }}/> Redirecting…</>
                      : plan.monthlyUSD === 0
                        ? 'Get Started Free'
                        : `Choose ${plan.name} — ${displayPrice}`
                    }
                  </button>
                  {plan.monthlyUSD > 0 && (
                    <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#475569', marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      Secured by Stripe · Cancel anytime
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* COMPARISON TABLE */}
        <div className="comparison-section" data-aos="fade-up" style={{ marginBottom: '5rem' }}>
          <h2 className="section-title-modern">
            Compare <span className="title-gradient-modern">{activeTab === 'radiologist' ? 'Radiologist' : 'Researcher'}</span> Plans
          </h2>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="feature-col">Feature</th>
                  <th>Free</th>
                  <th className="popular-col">Pro</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'radiologist' ? [
                  { key: 'Monthly analyses',     values: ['10', '500', 'Unlimited'] },
                  { key: 'Pathologies',          values: ['5 basic', 'All 14', 'All 14'] },
                  { key: 'Heatmaps',             values: ['Standard', 'Advanced', 'Advanced'] },
                  { key: 'Patient management',   values: [true, true, true] },
                  { key: 'Analytics dashboard',  values: [false, true, true] },
                  { key: 'API access',           values: [false, true, true] },
                  { key: 'PDF exports',          values: [false, true, true] },
                  { key: 'Custom training',      values: [false, false, true] },
                  { key: 'On-premise',           values: [false, false, true] },
                  { key: 'SLA guarantee',        values: [false, false, true] },
                ] : [
                  { key: 'Analyses access',      values: ['5 oldest', '100 recent', 'Unlimited'] },
                  { key: 'Model comparison',     values: ['Basic', 'Advanced', 'Advanced'] },
                  { key: 'API access',           values: [false, true, true] },
                  { key: 'Private datasets',     values: [false, true, true] },
                  { key: 'Experiment tracking',  values: [false, true, true] },
                  { key: 'Data export',          values: [false, 'CSV/JSON', 'All formats'] },
                  { key: 'Custom training',      values: [false, false, true] },
                  { key: 'Multi-user workspace', values: [false, false, true] },
                  { key: 'On-premise',           values: [false, false, true] },
                  { key: 'Priority compute',     values: [false, false, true] },
                ]).map((row, i) => (
                  <tr key={i}>
                    <td className="feature-name">{row.key}</td>
                    {row.values.map((val, j) => (
                      <td key={j} className={j === 1 ? 'popular-col' : ''}>
                        {val === true  && <span className="check-icon">✓</span>}
                        {val === false && <span className="cross-icon">✗</span>}
                        {val !== true && val !== false && val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '5rem' }} data-aos="fade-up">
          {[
            { icon: '🔒', text: 'SSL Encrypted' },
            { icon: '💳', text: 'Stripe Secured' },
            { icon: '🔄', text: 'Cancel Anytime' },
            { icon: '📧', text: 'Instant Confirmation' },
            { icon: '🌍', text: 'Multi-currency' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '100px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
              <span>{b.icon}</span> {b.text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="faq-section" data-aos="fade-up">
          <h2 className="section-title-modern">
            Frequently Asked <span className="title-gradient-modern">Questions</span>
          </h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div key={index} className={`faq-card ${openFaq === index ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                <div className="faq-question">
                  <h3>{faq.q}</h3>
                  <div className={`faq-icon ${openFaq === index ? 'open' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                <div className={`faq-answer ${openFaq === index ? 'visible' : ''}`}>
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;