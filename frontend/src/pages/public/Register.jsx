import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import '../../styles/pages/public/Auth.css';

const API = 'http://localhost:8000';

const RADIOLOGIST_PLANS = [
  { 
    id: 'free', label: 'Free', monthlyUSD: 0, color: '#10B981',
    features: ['10 analyses/month', 'Basic pathology detection (5)', 'Standard heatmaps', 'Email support', 'Patient management']
  },
  { 
    id: 'pro', label: 'Pro', monthlyUSD: 79, yearlyUSD: Math.floor(79 * 0.8), color: '#0066CC', popular: true,
    features: ['500 analyses/month', 'All 14 pathologies', 'Advanced Grad-CAM heatmaps', 'Priority support', 'API access', 'PDF exports']
  },
  { 
    id: 'enterprise', label: 'Enterprise', monthlyUSD: 199, yearlyUSD: Math.floor(199 * 0.8), color: '#8B5CF6',
    features: ['Unlimited analyses', 'All 14 pathologies', 'Custom model training', 'Dedicated support', 'On-premise deployment']
  },
];

const RESEARCHER_PLANS = [
  { 
    id: 'free', label: 'Free', monthlyUSD: 0, color: '#10B981',
    features: ['Access to 5 oldest analyses (read-only)', 'Basic model comparison', 'Community support']
  },
  { 
    id: 'researcher_pro', label: 'Pro', monthlyUSD: 49, yearlyUSD: Math.floor(49 * 0.8), color: '#0066CC', popular: true,
    features: ['Access to 100 most recent analyses', 'Advanced analytics', 'Priority support', 'API access', 'Export results']
  },
  { 
    id: 'researcher_enterprise', label: 'Enterprise', monthlyUSD: 99, yearlyUSD: Math.floor(99 * 0.8), color: '#8B5CF6',
    features: ['Unlimited access to all analyses', 'Custom model training', 'Dedicated support', 'Raw data export', 'On-premise option']
  },
];

const PERSONAL_DOMAINS = ['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','live.com','msn.com','aol.com','mail.com','protonmail.com','ymail.com'];
const isPersonalEmail = (email) => PERSONAL_DOMAINS.includes(email.split('@')[1]?.toLowerCase());

const RADIOLOGIST_SPECIALTIES = [
  'Pulmonary Radiology',
  'Thoracic Imaging',
  'Chest Radiology',
  'Cardiothoracic Radiology',
  'Respiratory Radiology',
  'Lung & Airway Imaging'
];
const RESEARCH_DOMAINS = ['Medical Imaging AI','Deep Learning in Radiology','Computer-Aided Diagnosis','Pathology Detection','Medical Image Segmentation','Clinical Data Science','Healthcare AI','Biomedical Engineering','Epidemiology & Public Health','Other'];
const COUNTRIES = ['Algeria','Australia','Belgium','Brazil','Canada','China','Egypt','France','Germany','India','Italy','Japan','Jordan','Kuwait','Lebanon','Libya','Malaysia','Morocco','Netherlands','Nigeria','Oman','Pakistan','Qatar','Saudi Arabia','South Africa','Spain','Sweden','Switzerland','Tunisia','Turkey','UAE','United Kingdom','United States','Other'];

const getPlanPrice = (plan, billing, t) => {
  if (plan.monthlyUSD === 0) return t('pricing.free.price');
  if (billing === 'yearly') return `$${plan.yearlyUSD * 12}/year`; // ✅ total annuel
  return `$${plan.monthlyUSD}/mo`;
};

// ── SVG Icons ──────────────────────────────────────────────────────────────
const IconRadiologist = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const IconResearcher = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconShield = ({ color = 'currentColor', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconCheck = ({ color = 'currentColor', size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconArrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IconInfo = ({ color = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconMail = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLock = ({ color = '#10B981', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const IconStep = ({ n, color }) => (
  <div style={{ width:22, height:22, borderRadius:'50%', background:`rgba(${color},0.15)`, border:`1px solid rgba(${color},0.3)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.68rem', fontWeight:800, color:`rgb(${color})`, flexShrink:0 }}>{n}</div>
);
const IconWarning = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconLicense = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="12" y2="16"/>
  </svg>
);
const IconUser = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconPhone = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
  </svg>
);

const PlanSelector = ({ plans, selectedPlan, setSelectedPlan, billing, setBilling, t }) => (
  <div>
    {/* Billing toggle */}
    <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', background:'rgba(255,255,255,0.05)', borderRadius:'10px', padding:'4px' }}>
      {['monthly','yearly'].map(b => (
        <button key={b} type="button" onClick={() => setBilling(b)}
          style={{ flex:1, padding:'0.5rem', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', transition:'all 0.2s',
            background: billing === b ? 'rgba(0,102,204,0.9)' : 'transparent',
            color: billing === b ? 'white' : '#64748B' }}>
          {b === 'monthly' ? t('pricing.monthly') : t('pricing.yearly')}
          {b === 'yearly' && (
            <span style={{ marginLeft:'0.375rem', fontSize:'0.68rem', background:'#10B981', color:'white', borderRadius:'100px', padding:'1px 6px' }}>
              {t('pricing.save')}
            </span>
          )}
        </button>
      ))}
    </div>

    {/* Plans */}
    <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
      {plans.map(plan => {
        const isSel = selectedPlan === plan.id;
        const price = getPlanPrice(plan, billing, t);
        const yearlyTotal = plan.monthlyUSD > 0 && billing === 'yearly'
        ? `$${plan.yearlyUSD}/${t('register.mo')} × 12`
        : null;

        return (
          <button key={plan.id} type="button" onClick={() => setSelectedPlan(plan.id)}
            style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.875rem 1rem', borderRadius:'12px', cursor:'pointer', textAlign:'left', transition:'all 0.2s',
              background: isSel ? `color-mix(in srgb, ${plan.color} 10%, transparent)` : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${isSel ? plan.color : 'rgba(255,255,255,0.08)'}` }}>

            {/* Radio dot */}
            <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${isSel ? plan.color : '#475569'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {isSel && <div style={{ width:8, height:8, borderRadius:'50%', background:plan.color }} />}
            </div>

            {/* Label + first feature */}
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.125rem' }}>
                <span style={{ fontWeight:800, color:'white', fontSize:'0.9rem' }}>{plan.label}</span>
                {plan.popular && (
                  <span style={{ padding:'1px 8px', background:'#0066CC', borderRadius:'100px', color:'white', fontSize:'0.62rem', fontWeight:700 }}>
                    {t('pricing.mostPopular')}
                  </span>
                )}
              </div>
              <div style={{ fontSize:'0.72rem', color:'#64748B' }}>{plan.features[0]}</div>
            </div>

            {/* Price */}
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontWeight:900, color: plan.monthlyUSD === 0 ? '#10B981' : plan.color, fontSize:'0.9rem' }}>
                {price}
              </div>
              {yearlyTotal && (
                <div style={{ fontSize:'0.62rem', color:'#64748B' }}>{yearlyTotal}</div>
              )}
              {plan.monthlyUSD === 0 && (
                <div style={{ fontSize:'0.62rem', color:'#64748B' }}>{t('register.pro.forever')}</div>
              )}
              {plan.monthlyUSD > 0 && billing === 'monthly' && (
                <div style={{ fontSize:'0.62rem', color:'#64748B' }}>
                  {t('register.orYearly', { price: plan.yearlyUSD })}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>

    {/* Yearly savings banner */}
    {billing === 'yearly' && (
      <div style={{ marginTop:'0.75rem', padding:'0.5rem 0.875rem', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'8px', fontSize:'0.75rem', color:'#10B981', display:'flex', alignItems:'center', gap:'0.5rem' }}>
        🎉 {t('register.yearlySavings')}
      </div>
    )}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get('role');
  const planFromUrl = searchParams.get('plan') || 'free';

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(planFromUrl);
  const [billing, setBilling] = useState('monthly');

  const [radioForm, setRadioForm] = useState({ title:'Dr.', first_name:'', last_name:'', email:'', phone:'', specialty:'', license_number:'', hospital:'', city:'', country:'', years_experience:'', message:'' });
  const [researchForm, setResearchForm] = useState({ first_name:'', last_name:'', email:'', phone:'', institution:'', department:'', position:'', research_domain:'', orcid:'', publications_url:'', country:'', use_case:'' });

  useEffect(() => { AOS.init({ duration:600, once:true }); }, []);
  useEffect(() => {
  if (roleFromUrl === 'researcher') {
    setProfile('researcher');
    const researcherPlanMap = { free: 'free', pro: 'researcher_pro', enterprise: 'researcher_enterprise' };
    setSelectedPlan(researcherPlanMap[planFromUrl] || 'free');
    setStep(2);
  } else if (roleFromUrl === 'radiologist') {
    setProfile('radiologist');
    const validPlans = ['free', 'pro', 'enterprise'];
    setSelectedPlan(validPlans.includes(planFromUrl) ? planFromUrl : 'free');
    setStep(2);
  }
}, [roleFromUrl, planFromUrl]);

  const currentPlans = profile === 'researcher' ? RESEARCHER_PLANS : RADIOLOGIST_PLANS;
  const currentPlan = currentPlans.find(p => p.id === selectedPlan) || currentPlans[0];
  const isPaid = currentPlan.monthlyUSD > 0;

  const rf = (k) => (e) => { setRadioForm(f => ({ ...f, [k]:e.target.value })); setFieldErrors(fe => ({ ...fe, [k]:'' })); };
  const rsf = (k) => (e) => { setResearchForm(f => ({ ...f, [k]:e.target.value })); setFieldErrors(fe => ({ ...fe, [k]:'' })); };

  const validateRadio = () => {
    const e = {};
    if (!radioForm.first_name.trim()) e.first_name = t('register.validation.required');
    if (!radioForm.last_name.trim()) e.last_name = t('register.validation.required');
    if (!radioForm.email.trim()) e.email = t('register.validation.required');
    if (!radioForm.phone.trim()) e.phone = t('register.validation.required');
    if (!radioForm.specialty) e.specialty = t('register.validation.required');
    if (!radioForm.license_number.trim()) e.license_number = t('register.validation.required');
    if (!radioForm.hospital.trim()) e.hospital = t('register.validation.required');
    if (!radioForm.city.trim()) e.city = t('register.validation.required');
    if (!radioForm.country) e.country = t('register.validation.required');
    if (!radioForm.years_experience) e.years_experience = t('register.validation.required');
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateResearch = () => {
    const e = {};
    if (!researchForm.first_name.trim()) e.first_name = t('register.validation.required');
    if (!researchForm.last_name.trim()) e.last_name = t('register.validation.required');
    if (!researchForm.email.trim()) e.email = t('register.validation.required');
    if (!researchForm.institution.trim()) e.institution = t('register.validation.required');
    if (!researchForm.department.trim()) e.department = t('register.validation.required');
    if (!researchForm.position.trim()) e.position = t('register.validation.required');
    if (!researchForm.research_domain) e.research_domain = t('register.validation.required');
    if (!researchForm.country) e.country = t('register.validation.required');
    if (!researchForm.use_case.trim()) e.use_case = t('register.validation.required');
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => {
    if (profile === 'radiologist') {
      return {
        name: `${radioForm.title} ${radioForm.first_name} ${radioForm.last_name}`,
        email: radioForm.email,
        institution: `${radioForm.hospital}, ${radioForm.city}, ${radioForm.country}`,
        role: 'radiologist',
        message: `Specialty: ${radioForm.specialty} | License: ${radioForm.license_number} | Experience: ${radioForm.years_experience} | Phone: ${radioForm.phone}${radioForm.message ? ' | ' + radioForm.message : ''}`,
      };
    } else {
      return {
        name: `${researchForm.first_name} ${researchForm.last_name}`,
        email: researchForm.email,
        institution: `${researchForm.institution} — ${researchForm.department}`,
        role: 'researcher',
        message: `Domain: ${researchForm.research_domain} | Position: ${researchForm.position}${researchForm.orcid ? ' | ORCID: ' + researchForm.orcid : ''}${researchForm.publications_url ? ' | Pubs: ' + researchForm.publications_url : ''} | Use case: ${researchForm.use_case}`,
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const valid = profile === 'radiologist' ? validateRadio() : validateResearch();
    if (!valid) return;
    if (isPaid) { setStep(3); return; }
    setLoading(true);
    try {
      const payload = buildPayload();
      const r = await fetch(`${API}/api/access-requests/submit`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ ...payload, plan:'free', billing:'monthly' }),
      });
      if (!r.ok) { const err = await r.json(); throw new Error(err.detail || 'Failed'); }
      setStep(4);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handlePay = async () => {
    setLoading(true); setError('');
    try {
      const payload = buildPayload();

      // ✅ Vérifier email+role AVANT de rediriger vers Stripe
      const checkRes = await fetch(`${API}/api/access-requests/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, role: profile })
      });
      const checkData = await checkRes.json();

      if (checkData.exists) {
        setError(`An account with this email already exists as ${profile}. Please login instead.`);
        setLoading(false);
        return;
      }
      if (checkData.pending_request) {
        setError('A pending request already exists for this email. Please wait for admin review.');
        setLoading(false);
        return;
      }

      const r = await fetch(`${API}/api/access-requests/create-checkout`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ plan:selectedPlan, billing, email:payload.email, name:payload.name, currency:'usd' }),
      });
      if (!r.ok) { const err = await r.json(); throw new Error(err.detail || 'Failed'); }
      const d = await r.json();
      localStorage.setItem('pendingAccessRequest', JSON.stringify({ ...payload, plan:selectedPlan, billing }));
      window.location.href = d.checkout_url;
    } catch (err) { setError(err.message); setLoading(false); }
  };

  const Bg = () => (
    <div className="auth-bg">
      <div className="auth-bg-img" style={{ backgroundImage:`url(https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1920&h=1080&fit=crop)` }} />
      <div className="auth-bg-overlay" />
    </div>
  );

  const BackBtn = ({ to }) => (
    <button type="button" onClick={() => { setStep(to); setFieldErrors({}); setError(''); }}
      style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'#94a3b8', padding:'0.5rem 0.875rem', cursor:'pointer', fontSize:'0.82rem', marginBottom:'1.5rem', fontWeight:600 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
      {t('register.back')}
    </button>
  );

  const Err = ({ name }) => fieldErrors[name]
    ? <p style={{ margin:'0.3rem 0 0', color:'#EF4444', fontSize:'0.73rem', fontWeight:600, display:'flex', alignItems:'center', gap:'0.3rem' }}>
        <IconWarning size={12} />{fieldErrors[name]}
      </p>
    : null;

  const inp = (name) => ({
    style:{ width:'100%', padding:'0.75rem 1rem', background:'var(--bg-secondary)', border:`1.5px solid ${fieldErrors[name]?'#EF4444':'var(--border-primary)'}`, borderRadius:'10px', color:'var(--text-primary)', fontSize:'0.875rem', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  });
  const lbl = { display:'block', fontSize:'0.75rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.375rem', textTransform:'uppercase', letterSpacing:'0.05em' };
  const req = <span style={{ color:'#EF4444' }}> *</span>;

  // ══ STEP 1 ══════════════════════════════════════════════════════════════════
  if (step === 1) return (
    <div className="auth-page"><Bg />
      <div className="container auth-container" style={{ position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:820, margin:'0 auto', width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }} data-aos="fade-down">
            <div className="auth-badge" style={{ justifyContent:'center', marginBottom:'1.25rem' }}>
              <div className="auth-badge-dot" /><span>{t('register.professionalAccess')}</span>
            </div>
            <h1 style={{ fontSize:'clamp(2rem,5vw,3rem)', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.04em', marginBottom:'0.75rem' }}>
              {t('register.requestTitle')}
            </h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'1rem', maxWidth:520, margin:'0 auto' }}>
              {t('register.requestSubtitle')}
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'1.5rem', marginBottom:'1.75rem' }}>
            {[
              {
                id:'radiologist', color:'#0066CC',
                icon: <IconRadiologist />,
                titleKey: 'register.profiles.radiologist.title',
                subtitleKey: 'register.profiles.radiologist.subtitle',
                features: [
                  t('register.profiles.radiologist.f1'),
                  t('register.profiles.radiologist.f2'),
                  t('register.profiles.radiologist.f3'),
                  t('register.profiles.radiologist.f4'),
                ],
                badgeKey: 'register.profiles.radiologist.badge',
                noteKey: 'register.profiles.radiologist.note',
              },
              {
                id:'researcher', color:'#8B5CF6',
                icon: <IconResearcher />,
                titleKey: 'register.profiles.researcher.title',
                subtitleKey: 'register.profiles.researcher.subtitle',
                features: [
                  t('register.profiles.researcher.f1'),
                  t('register.profiles.researcher.f2'),
                  t('register.profiles.researcher.f3'),
                  t('register.profiles.researcher.f4'),
                ],
                badgeKey: 'register.profiles.researcher.badge',
                noteKey: 'register.profiles.researcher.note',
              },
            ].map((card, i) => (
              <button key={card.id} data-aos="fade-up" data-aos-delay={i * 100}
                onClick={() => { setProfile(card.id); setSelectedPlan(card.id === 'researcher' ? 'researcher_pro' : 'pro'); setStep(2); }}
                style={{ display:'flex', flexDirection:'column', gap:'1.25rem', padding:'2rem', background:'var(--bg-card)', border:`1.5px solid var(--border-primary)`, borderRadius:'24px', cursor:'pointer', transition:'all 0.3s', textAlign:'left' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=card.color; e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 20px 60px color-mix(in srgb, ${card.color} 15%, transparent)`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-primary)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem' }}>
                  <div style={{ width:64, height:64, borderRadius:'16px', background:`color-mix(in srgb, ${card.color} 12%, transparent)`, border:`1.5px solid color-mix(in srgb, ${card.color} 25%, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', color:card.color, flexShrink:0 }}>
                    {card.icon}
                  </div>
                  <div>
                    <h3 style={{ fontWeight:800, fontSize:'1.125rem', color:'var(--text-primary)', marginBottom:'0.25rem' }}>{t(card.titleKey)}</h3>
                    <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', margin:0 }}>{t(card.subtitleKey)}</p>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {card.features.map((f, fi) => (
                    <div key={fi} style={{ display:'flex', alignItems:'center', gap:'0.625rem', fontSize:'0.82rem', color:'#94a3b8' }}>
                      <IconCheck color={card.color} size={13} />{f}
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.625rem 0.875rem', background:`color-mix(in srgb, ${card.color} 6%, transparent)`, border:`1px solid color-mix(in srgb, ${card.color} 15%, transparent)`, borderRadius:'8px', fontSize:'0.75rem', color:'#94a3b8' }}>
                  <IconInfo color={card.color} size={13} />
                  {t(card.noteKey)}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'0.75rem', borderTop:`1px solid color-mix(in srgb, ${card.color} 15%, transparent)` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize:'0.75rem', fontWeight:700, color:card.color }}>
                    <IconShield color={card.color} size={13} />
                    {t(card.badgeKey)}
                  </div>
                  <span style={{ color:card.color }}><IconArrow /></span>
                </div>
              </button>
            ))}
          </div>

          {/* Patient note */}
          <div style={{ textAlign:'center', padding:'1.25rem', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', marginBottom:'1.5rem' }}>
            <p style={{ color:'#64748B', fontSize:'0.875rem', margin:0, lineHeight:1.6, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem' }}>
              <IconUser size={14} />
              <span>
                <strong style={{ color:'#94A3B8' }}>{t('register.patientNote.title')}</strong>{' '}
                {t('register.patientNote.desc')}
              </span>
            </p>
          </div>

          <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.875rem' }}>
            {t('register.alreadyAccount')}{' '}
            <button onClick={() => navigate('/login')} style={{ color:'#0066CC', background:'none', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.875rem' }}>{t('login.form.submit')}</button>
          </p>
        </div>
      </div>
    </div>
  );

  // ══ STEP 2 ══════════════════════════════════════════════════════════════════
  if (step === 2) return (
    <div className="auth-page"><Bg />
      <div className="container auth-container">
        <div className="auth-content">
          <div className="auth-info">
            <BackBtn to={1} />
            <div className="auth-badge">
              <div className="auth-badge-dot" />
              <span>{profile === 'radiologist' ? t('register.step2.radiologistBadge') : t('register.step2.researcherBadge')}</span>
            </div>
            <h1 className="auth-info-title">
              <span className="title-gradient-modern">
                {profile === 'radiologist' ? t('register.step2.radiologistTitle') : t('register.step2.researcherTitle')}
              </span>
            </h1>
            <p className="auth-info-subtitle" style={{ marginBottom:'1.5rem' }}>
              {profile === 'radiologist' ? t('register.step2.radiologistSubtitle') : t('register.step2.researcherSubtitle')}
            </p>
            <PlanSelector plans={currentPlans} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} billing={billing} setBilling={setBilling} t={t} />
            {isPaid
              ? <div style={{ marginTop:'1rem', padding:'0.875rem', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'10px', fontSize:'0.78rem', color:'#F59E0B', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <IconLock color="#F59E0B" size={14} />{t('register.step2.paymentNote')}
                </div>
              : <div style={{ marginTop:'1rem', padding:'0.875rem', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'10px', fontSize:'0.78rem', color:'#10B981', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <IconCheck color="#10B981" size={14} />{t('register.step2.freeNote')}
                </div>
            }
            <div style={{ marginTop:'1.5rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              {[
                t('register.process.step1'),
                t('register.process.step2'),
                t('register.process.step3'),
                t('register.process.step4'),
              ].map((s, i) => (
                <div key={i} style={{ display:'flex', gap:'0.625rem', alignItems:'center', fontSize:'0.78rem', color:'#64748B' }}>
                  <IconStep n={i+1} color="0,102,204" />{s}
                </div>
              ))}
            </div>
          </div>

          <div className="auth-form-card" style={{ maxHeight:'85vh', overflowY:'auto' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.875rem 1rem', background:`color-mix(in srgb, ${currentPlan.color} 8%, transparent)`, border:`1px solid color-mix(in srgb, ${currentPlan.color} 25%, transparent)`, borderRadius:'12px', marginBottom:'1.25rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={currentPlan.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:currentPlan.color, fontSize:'0.875rem' }}>{currentPlan.label} {t('register.planSelected')}</div>
                <div style={{ fontSize:'0.72rem', color:'#64748B' }}>{isPaid ? `${getPlanPrice(currentPlan, billing, t)} · ${t('register.stripeAfterForm')}` : t('register.freeNoCreditCard')}</div>
              </div>
            </div>

            {error && (
              <div className="auth-error" style={{ marginBottom:'1rem' }}>
                <IconInfo size={16} />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* ── RADIOLOGIST FORM ── */}
              {profile === 'radiologist' && (<>
                <div style={{ padding:'0.75rem 1rem', background:'rgba(0,102,204,0.06)', border:'1px solid rgba(0,102,204,0.15)', borderRadius:'10px', fontSize:'0.78rem', color:'#60A5FA', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <IconShield color="#60A5FA" size={14} />
                  {t('register.radio.securityNote')} <span style={{ color:'#EF4444' }}>*</span>
                </div>

                <div>
                  <label style={lbl}>{t('register.radio.fullName')}{req}</label>
                  <div style={{ display:'grid', gridTemplateColumns:'90px 1fr 1fr', gap:'0.5rem' }}>
                    <select value={radioForm.title} onChange={rf('title')} {...inp('title')}>
                      <option>Dr.</option><option>Prof.</option><option>Pr.</option><option>Ass. Prof.</option>
                    </select>
                    <div><input {...inp('first_name')} type="text" placeholder={t('register.placeholder.firstname')} value={radioForm.first_name} onChange={rf('first_name')} /><Err name="first_name" /></div>
                    <div><input {...inp('last_name')} type="text" placeholder={t('register.placeholder.lastname')} value={radioForm.last_name} onChange={rf('last_name')} /><Err name="last_name" /></div>
                  </div>
                </div>

                <div>
                  <label style={lbl}>{t('register.radio.professionalEmail')}{req}</label>
                  <input {...inp('email')} type="email" placeholder="dr.name@example.com"value={radioForm.email} onChange={rf('email')} />
                  <Err name="email" />
                  {!fieldErrors.email && <p style={{ margin:'0.25rem 0 0', fontSize:'0.72rem', color:'#64748B' }}>{t('register.radio.emailHint')}</p>}
                </div>

                <div>
                  <label style={lbl}>{t('register.radio.phone')}{req}</label>
                  <input {...inp('phone')} type="tel" placeholder="+1 (555) 000-0000" value={radioForm.phone} onChange={rf('phone')} />
                  <Err name="phone" />
                </div>

                <div>
                  <label style={lbl}>{t('register.radio.specialty')}{req}</label>
                  <select {...inp('specialty')} value={radioForm.specialty} onChange={rf('specialty')}>
                    <option value="">{t('register.radio.specialtyPlaceholder')}</option>
                    {RADIOLOGIST_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Err name="specialty" />
                </div>

                <div>
                  <label style={lbl}>{t('register.radio.licenseNumber')}{req}</label>
                  <div style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'#64748B' }}><IconLicense size={14} /></div>
                    <input {...inp('license_number')} style={{ ...inp('license_number').style, paddingLeft:'2.25rem' }} type="text" placeholder="e.g. MED-2024-00123" value={radioForm.license_number} onChange={rf('license_number')} />
                  </div>
                  <Err name="license_number" />
                  {!fieldErrors.license_number && <p style={{ margin:'0.25rem 0 0', fontSize:'0.72rem', color:'#64748B' }}>{t('register.radio.licenseHint')}</p>}
                </div>

                <div>
                  <label style={lbl}>{t('register.radio.experience')}{req}</label>
                  <select {...inp('years_experience')} value={radioForm.years_experience} onChange={rf('years_experience')}>
                    <option value="">{t('register.radio.experiencePlaceholder')}</option>
                    {['< 1 year','1–3 years','3–5 years','5–10 years','10–15 years','15–20 years','20+ years'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <Err name="years_experience" />
                </div>

                <div>
                  <label style={lbl}>{t('register.radio.hospital')}{req}</label>
                  <input {...inp('hospital')} type="text" placeholder={t('register.radio.hospitalPlaceholder')} value={radioForm.hospital} onChange={rf('hospital')} />
                  <Err name="hospital" />
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div>
                    <label style={lbl}>{t('register.radio.city')}{req}</label>
                    <input {...inp('city')} type="text" placeholder={t('register.radio.cityPlaceholder')} value={radioForm.city} onChange={rf('city')} />
                    <Err name="city" />
                  </div>
                  <div>
                    <label style={lbl}>{t('register.radio.country')}{req}</label>
                    <select {...inp('country')} value={radioForm.country} onChange={rf('country')}>
                      <option value="">{t('register.radio.countryPlaceholder')}</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Err name="country" />
                  </div>
                </div>

                <div>
                  <label style={lbl}>{t('register.radio.additionalInfo')} <span style={{ color:'#64748B', fontSize:'0.7rem', textTransform:'none', fontWeight:400 }}>({t('register.optional')})</span></label>
                  <textarea {...inp('message')} style={{ ...inp('message').style, resize:'vertical' }} rows={3} placeholder={t('register.radio.messagePlaceholder')} value={radioForm.message} onChange={rf('message')} />
                </div>
              </>)}

              {/* ── RESEARCHER FORM ── */}
              {profile === 'researcher' && (<>
                <div style={{ padding:'0.75rem 1rem', background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.15)', borderRadius:'10px', fontSize:'0.78rem', color:'#C4B5FD', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <IconShield color="#C4B5FD" size={14} />
                  {t('register.research.securityNote')} <span style={{ color:'#EF4444' }}>*</span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div><label style={lbl}>{t('register.placeholder.firstname')}{req}</label><input {...inp('first_name')} type="text" placeholder={t('register.placeholder.firstname')} value={researchForm.first_name} onChange={rsf('first_name')} /><Err name="first_name" /></div>
                  <div><label style={lbl}>{t('register.placeholder.lastname')}{req}</label><input {...inp('last_name')} type="text" placeholder={t('register.placeholder.lastname')} value={researchForm.last_name} onChange={rsf('last_name')} /><Err name="last_name" /></div>
                </div>

                <div>
                  <label style={lbl}>{t('register.research.institutionalEmail')}{req}</label>
                  <input {...inp('email')} type="email" placeholder="name@example.com" value={researchForm.email} onChange={rsf('email')} />
                  <Err name="email" />
                  {!fieldErrors.email && <p style={{ margin:'0.25rem 0 0', fontSize:'0.72rem', color:'#64748B' }}>{t('register.research.emailHint')}</p>}
                </div>

                <div>
                  <label style={lbl}>{t('register.research.phone')} <span style={{ color:'#64748B', fontSize:'0.7rem', textTransform:'none', fontWeight:400 }}>({t('register.optional')})</span></label>
                  <input {...inp('phone')} type="tel" placeholder="+1 (555) 000-0000" value={researchForm.phone} onChange={rsf('phone')} />
                </div>

                <div>
                  <label style={lbl}>{t('register.research.institution')}{req}</label>
                  <input {...inp('institution')} type="text" placeholder={t('register.research.institutionPlaceholder')} value={researchForm.institution} onChange={rsf('institution')} />
                  <Err name="institution" />
                </div>

                <div>
                  <label style={lbl}>{t('register.research.department')}{req}</label>
                  <input {...inp('department')} type="text" placeholder={t('register.research.departmentPlaceholder')} value={researchForm.department} onChange={rsf('department')} />
                  <Err name="department" />
                </div>

                <div>
                  <label style={lbl}>{t('register.research.position')}{req}</label>
                  <input {...inp('position')} type="text" placeholder={t('register.research.positionPlaceholder')} value={researchForm.position} onChange={rsf('position')} />
                  <Err name="position" />
                </div>

                <div>
                  <label style={lbl}>{t('register.research.domain')}{req}</label>
                  <select {...inp('research_domain')} value={researchForm.research_domain} onChange={rsf('research_domain')}>
                    <option value="">{t('register.research.domainPlaceholder')}</option>
                    {RESEARCH_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <Err name="research_domain" />
                </div>

                <div>
                  <label style={lbl}>{t('register.research.country')}{req}</label>
                  <select {...inp('country')} value={researchForm.country} onChange={rsf('country')}>
                    <option value="">{t('register.radio.countryPlaceholder')}</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Err name="country" />
                </div>

                <div>
                  <label style={lbl}>{t('register.research.orcid')} <span style={{ color:'#64748B', fontSize:'0.7rem', textTransform:'none', fontWeight:400 }}>({t('register.research.orcidRec')})</span></label>
                  <input {...inp('orcid')} type="text" placeholder="0000-0000-0000-0000" value={researchForm.orcid} onChange={rsf('orcid')} />
                  <p style={{ margin:'0.25rem 0 0', fontSize:'0.72rem', color:'#64748B' }}>{t('register.research.orcidHint')} <a href="https://orcid.org" target="_blank" rel="noreferrer" style={{ color:'#8B5CF6' }}>orcid.org</a></p>
                </div>

                <div>
                  <label style={lbl}>{t('register.research.publications')} <span style={{ color:'#64748B', fontSize:'0.7rem', textTransform:'none', fontWeight:400 }}>({t('register.optional')})</span></label>
                  <input {...inp('publications_url')} type="url" placeholder="https://scholar.google.com/..." value={researchForm.publications_url} onChange={rsf('publications_url')} />
                </div>

                <div>
                  <label style={lbl}>{t('register.research.useCase')}{req}</label>
                  <textarea {...inp('use_case')} style={{ ...inp('use_case').style, resize:'vertical' }} rows={4} placeholder={t('register.research.useCasePlaceholder')} value={researchForm.use_case} onChange={rsf('use_case')} />
                  <Err name="use_case" />
                </div>
              </>)}

              <button type="submit" className="auth-submit-btn" disabled={loading} style={{ marginTop:'0.5rem' }}>
                {loading ? <><span className="auth-spinner" />{t('register.processing')}</> :
                  isPaid
                    ? <>{t('register.reviewPay')} {getPlanPrice(currentPlan, billing, t)} <IconArrow /></>
                    : <>{t('register.submitApplication')} <IconArrow /></>
                }
              </button>
              <p style={{ textAlign:'center', color:'#64748B', fontSize:'0.75rem', marginTop:'0.25rem' }}>
                {isPaid ? t('register.stripeNote') : t('register.freeNote')}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  // ══ STEP 3 ══════════════════════════════════════════════════════════════════
  if (step === 3) {
    const yearlyTotal = Math.floor(currentPlan.monthlyUSD * 0.8 * 12);
    const displayPrice = billing === 'yearly' ? Math.floor(currentPlan.monthlyUSD * 0.8) : currentPlan.monthlyUSD;
    const savings = billing === 'yearly' ? (currentPlan.monthlyUSD * 12) - yearlyTotal : 0;
    const pld = buildPayload();

    return (
      <div className="auth-page"><Bg />
        <div className="container auth-container" style={{ position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:540, margin:'0 auto', width:'100%' }}>
            <div className="auth-form-card">
              <BackBtn to={2} />
              <h2 className="auth-form-title" style={{ marginBottom:'0.375rem' }}>{t('register.orderSummary')}</h2>
              <p className="auth-form-subtitle" style={{ marginBottom:'1.5rem' }}>{t('register.orderReview')}</p>
              {error && <div className="auth-error" style={{ marginBottom:'1rem' }}><IconInfo size={16} />{error}</div>}

              <div style={{ background:`color-mix(in srgb, ${currentPlan.color} 8%, transparent)`, border:`1.5px solid color-mix(in srgb, ${currentPlan.color} 25%, transparent)`, borderRadius:'16px', padding:'1.5rem', marginBottom:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
                  <div>
                    <div style={{ fontWeight:900, fontSize:'1.125rem', color:'var(--text-primary)' }}>
                      {currentPlan.label} {t('register.plan')}
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'#64748B', marginTop:'0.2rem' }}>
                      {profile === 'radiologist' ? t('register.profiles.radiologist.title') : t('register.profiles.researcher.title')} · {t(`pricing.${billing === 'monthly' ? 'billedMonthly' : 'billedYearly'}`)} · {t('register.cancelAnytime')}
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    {billing === 'yearly' ? (
                      <>
                        <div style={{ fontWeight:900, fontSize:'1.625rem', color:currentPlan.color }}>
                          ${yearlyTotal}<span style={{ fontSize:'0.875rem', color:'#64748B' }}>/{t('register.yr')}</span>
                        </div>
                        <div style={{ fontSize:'0.72rem', color:'#64748B' }}>
                          ${Math.floor(currentPlan.monthlyUSD * 0.8)}/{t('register.mo')} × 12
                        </div>
                      </>
                    ) : (
                      <div style={{ fontWeight:900, fontSize:'1.625rem', color:currentPlan.color }}>
                        ${displayPrice}<span style={{ fontSize:'0.875rem', color:'#64748B' }}>/{t('register.mo')}</span>
                      </div>
                    )}
                  </div>
                </div>
                {billing === 'yearly' && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'0.375rem', padding:'4px 10px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'100px', color:'#10B981', fontSize:'0.75rem', fontWeight:700, marginBottom:'1rem' }}>
                    <IconCheck color="#10B981" size={12} />{t('register.saveYear', { amount: savings })}
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {currentPlan.features.map((f,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.625rem', fontSize:'0.82rem', color:'#94a3b8' }}>
                      <IconCheck color={currentPlan.color} size={12} />{f}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:'var(--bg-secondary)', borderRadius:'12px', padding:'1rem', marginBottom:'1.25rem' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.75rem' }}>{t('register.applicationDetails')}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem', fontSize:'0.875rem', color:'var(--text-secondary)' }}>
                  <div><strong style={{ color:'var(--text-primary)' }}>{t('register.name')}:</strong> {pld.name}</div>
                  <div><strong style={{ color:'var(--text-primary)' }}>{t('register.email')}:</strong> {pld.email}</div>
                  <div><strong style={{ color:'var(--text-primary)' }}>{profile === 'radiologist' ? t('register.radio.hospital') : t('register.research.institution')}:</strong> {pld.institution}</div>
                  {profile === 'radiologist' && <div><strong style={{ color:'var(--text-primary)' }}>{t('register.radio.specialty')}:</strong> {radioForm.specialty}</div>}
                  {profile === 'radiologist' && <div><strong style={{ color:'var(--text-primary)' }}>{t('register.radio.licenseNumber')}:</strong> {radioForm.license_number}</div>}
                  {profile === 'researcher' && <div><strong style={{ color:'var(--text-primary)' }}>{t('register.research.domain')}:</strong> {researchForm.research_domain}</div>}
                </div>
              </div>

              <div style={{ display:'flex', gap:'0.625rem', padding:'0.875rem 1rem', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'10px', marginBottom:'1.25rem', fontSize:'0.78rem', color:'#F59E0B' }}>
                <IconInfo color="#F59E0B" size={16} />
                <span>{t('register.paymentWarning')}</span>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.75rem 1rem', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:'10px', marginBottom:'1.25rem', fontSize:'0.78rem', color:'#94a3b8' }}>
                <IconLock color="#10B981" size={14} />
                {t('register.stripeSecured')} · {t('register.testCard')} <strong style={{ color:'var(--text-primary)', fontFamily:'monospace' }}>4242 4242 4242 4242</strong>
              </div>

              <button className="auth-submit-btn" onClick={handlePay} disabled={loading}>
                {loading
                  ? <><span className="auth-spinner" />{t('register.redirectingStripe')}</>
                  : <>{t('register.payBtn')} {billing === 'yearly' 
                  ? `$${yearlyTotal}/${t('register.yr')}` 
                  : `$${displayPrice}/${t('register.mo')}`} <IconArrow /></>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ STEP 4 ══════════════════════════════════════════════════════════════════
  return (
    <div className="auth-page"><Bg />
      <div className="container auth-container" style={{ position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:520, margin:'0 auto', width:'100%' }}>
          <div className="auth-form-card" style={{ textAlign:'center', padding:'3.5rem 2.5rem' }}>
            <div style={{ width:90, height:90, borderRadius:'50%', background:'linear-gradient(135deg,#0066CC,#00BFA6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 2rem', boxShadow:'0 20px 60px rgba(0,102,204,0.35)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="auth-form-title" style={{ marginBottom:'0.75rem' }}>{t('register.success.title')}</h2>
            <p className="auth-form-subtitle" style={{ marginBottom:'1.75rem', lineHeight:1.7 }}>
              {t('register.success.desc', { role: profile === 'radiologist' ? t('register.success.medical') : t('register.success.research') })}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem', marginBottom:'2rem' }}>
              {[
                { icon: <IconMail size={16} />, text: t('register.success.emailSent') },
                { icon: <IconShield color="#94A3B8" size={16} />, text: t('register.success.verify', { type: profile === 'radiologist' ? t('register.success.license') : t('register.success.affiliation') }) },
                { icon: <IconLock color="#94A3B8" size={16} />, text: t('register.success.credentialsSent') },
                { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>, text: t('register.success.passwordChange') },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem 1rem', background:'var(--bg-secondary)', borderRadius:'10px', textAlign:'left', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                  <span style={{ color:'#94A3B8', flexShrink:0 }}>{item.icon}</span>{item.text}
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/')} className="auth-submit-btn">
              {t('register.success.backHome')} <IconArrow />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;