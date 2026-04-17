import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/shared/AccountSettings.css';

const API = 'http://localhost:8000';

const PLAN_CONFIG = {
  free:                  { color: '#10B981', analyses: 10,   badgeKey: 'accountSettings.sub.badgeBasic' },
  pro:                   { color: '#0066CC', analyses: 500,  badgeKey: 'accountSettings.sub.badgePro' },
  enterprise:            { color: '#8B5CF6', analyses: null, badgeKey: 'accountSettings.sub.badgeEnterprise' },
  researcher_pro:        { color: '#0066CC', datasets: '100K+', badgeKey: 'accountSettings.sub.badgeResearchPro' },
  researcher_enterprise: { color: '#8B5CF6', datasets: null,    badgeKey: 'accountSettings.sub.badgeResearchEnterprise' },
};

const AccountSettings = ({ user }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword]   = useState('');
  const [deleteError, setDeleteError]         = useState('');
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    emailNotifications: true, smsNotifications: false,
    language: 'en', twoFactor: false
  });
  const [passwords, setPasswords]   = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError]       = useState('');
  const [pwSuccess, setPwSuccess]   = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]     = useState(false);

  const [subscription, setSubscription] = useState(null);
  const [analysesUsed, setAnalysesUsed] = useState(0);
  const [subLoading, setSubLoading]     = useState(false);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    if (user?.role === 'radiologist' || user?.role === 'researcher') {
      fetchSubscription();
    }
  }, [user]);

const fetchSubscription = async () => {
  setSubLoading(true);
  try {
    const token = localStorage.getItem('token');

    const [subRes, predictRes] = await Promise.all([
      fetch(`${API}/api/payments/my-subscription`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null),
      fetch(`${API}/api/predict/?skip=0&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    ]);

    if (subRes?.ok) {
      const sub = await subRes.json();
      setSubscription(sub);
    }

    if (predictRes.ok) {
      const d = await predictRes.json();
      const all = d.analyses || [];
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonth = all.filter(a => new Date(a.created_at) >= monthStart);
      setAnalysesUsed(thisMonth.length);
    }
  } catch {}
  setSubLoading(false);
};

  const handleChangePw = async () => {
  setPwError(''); setPwSuccess(false);
  if (!passwords.current)                   { setPwError(t('accountSettings.security.pw.errorCurrent')); return; }
  if (passwords.next.length < 6)            { setPwError(t('accountSettings.security.pw.errorLength'));  return; }
  if (passwords.next !== passwords.confirm) { setPwError(t('accountSettings.security.pw.errorMatch'));   return; }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API}/api/users/settings/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        current_password: passwords.current,
        new_password:     passwords.next,
        confirm_password: passwords.confirm,
      }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }
    setPwSuccess(true);
    setPasswords({ current: '', next: '', confirm: '' });
  } catch (err) {
    setPwError(err.message);
  }
};
const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError('Please enter your password to confirm.'); return; }
    setDeleteLoading(true); setDeleteError('');
    try {
      const token = localStorage.getItem('token');

      // ✅ Vérifier le mot de passe sans le changer
      const verifyRes = await fetch(`${API}/api/users/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!verifyRes.ok) { setDeleteError('Incorrect password.'); setDeleteLoading(false); return; }

      // ✅ Supprimer le compte
      const r = await fetch(`${API}/api/users/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.detail || 'Failed'); }

      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      setDeleteError(err.message);
      setDeleteLoading(false);
    }
  };

  const Toggle = ({ labelKey, descKey, stateKey, icon }) => (
    <div className="as-toggle-row">
      <div className="as-toggle-icon">{icon}</div>
      <div className="as-toggle-text">
        <span className="as-toggle-label">{t(labelKey)}</span>
        {descKey && <span className="as-toggle-desc">{t(descKey)}</span>}
      </div>
      <label className="as-toggle-switch">
        <input type="checkbox" checked={settings[stateKey]} onChange={e => setSettings(s => ({ ...s, [stateKey]: e.target.checked }))} />
        <span className="as-toggle-track"><span className="as-toggle-thumb" /></span>
      </label>
    </div>
  );

  const EyeIcon = ({ open }) => open
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  // ── Subscription Card ──────────────────────────────────────────────────────
  const SubscriptionCard = () => {
    const plan        = user?.plan || 'free';
    const cfg         = PLAN_CONFIG[plan] || PLAN_CONFIG.free;
    const isRadiolog  = user?.role === 'radiologist';
    const isEnterprise = plan === 'enterprise' || plan === 'researcher_enterprise';
    const quota       = cfg.analyses;
    const used        = analysesUsed;
    const remaining   = quota ? Math.max(0, quota - used) : null;
    const pct         = quota ? Math.min(100, Math.round((used / quota) * 100)) : 0;
    const barColor    = pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#10B981';
    const expDate     = subscription?.current_period_end
      ? new Date(subscription.current_period_end).toLocaleDateString(undefined, { day:'numeric', month:'long', year:'numeric' })
      : null;

    return (
      <div className="as-card" data-aos="fade-up" data-aos-delay="40">
        <div className="as-card-header">
          <div className="as-card-icon" style={{ '--aci': cfg.color }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div>
            <h3 className="as-card-title">{t('accountSettings.sub.title')}</h3>
            <p className="as-card-sub">{t('accountSettings.sub.subtitle')}</p>
          </div>
        </div>

        <div style={{ padding:'0 0 0.5rem' }}>
          {/* Badge + billing */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <div style={{ padding:'0.375rem 1rem', borderRadius:'100px', background:`color-mix(in srgb, ${cfg.color} 15%, transparent)`, border:`1px solid color-mix(in srgb, ${cfg.color} 35%, transparent)`, color:cfg.color, fontWeight:800, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:'0.375rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                {t(cfg.badgeKey)}
              </div>
              {subscription?.billing && (
                <span style={{ fontSize:'0.75rem', color:'#64748B', fontWeight:600 }}>
                  {subscription.billing === 'yearly' ? t('accountSettings.sub.billedYearly') : t('accountSettings.sub.billedMonthly')}
                </span>
              )}
            </div>
            {plan === 'free' && (
              <button onClick={() => navigate('/pricing')} style={{ padding:'0.375rem 1rem', borderRadius:'8px', background:'linear-gradient(135deg,#0066CC,#00BFA6)', border:'none', color:'white', fontWeight:700, fontSize:'0.78rem', cursor:'pointer' }}>
                {t('accountSettings.sub.upgrade')}
              </button>
            )}
          </div>

          {/* Quota bar — radiologue non-enterprise */}
          {isRadiolog && !isEnterprise && quota && (
            <div style={{ marginBottom:'1.25rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'0.82rem', color:'var(--text-secondary,#94A3B8)', fontWeight:600 }}>{t('accountSettings.sub.monthlyAnalyses')}</span>
                <span style={{ fontSize:'0.82rem', fontWeight:800, color: pct > 85 ? '#EF4444' : 'var(--text-primary,#fff)' }}>{used} / {quota}</span>
              </div>
              <div style={{ height:8, borderRadius:4, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:4, width:`${pct}%`, background:`linear-gradient(90deg,${barColor},color-mix(in srgb,${barColor} 70%,white))`, transition:'width 0.8s ease' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.375rem' }}>
                <span style={{ fontSize:'0.72rem', color:'#64748B' }}>{pct}% {t('accountSettings.sub.used')}</span>
                <span style={{ fontSize:'0.72rem', color: remaining === 0 ? '#EF4444' : remaining < 50 ? '#F59E0B' : '#10B981', fontWeight:700 }}>
                  {remaining === 0 ? t('accountSettings.sub.quotaReached') : `${remaining} ${t('accountSettings.sub.remaining')}`}
                </span>
              </div>
            </div>
          )}

          {/* Enterprise unlimited */}
          {isEnterprise && isRadiolog && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.75rem 1rem', background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'10px', marginBottom:'1.25rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <span style={{ fontSize:'0.82rem', color:'#A78BFA', fontWeight:600 }}>{t('accountSettings.sub.unlimited')}</span>
            </div>
          )}

          {/* Researcher datasets */}
          {user?.role === 'researcher' && cfg.datasets && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.75rem 1rem', background:`color-mix(in srgb,${cfg.color} 8%,transparent)`, border:`1px solid color-mix(in srgb,${cfg.color} 20%,transparent)`, borderRadius:'10px', marginBottom:'1.25rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              <span style={{ fontSize:'0.82rem', color:cfg.color, fontWeight:600 }}>{t('accountSettings.sub.datasetAccess')}: {cfg.datasets}</span>
            </div>
          )}

          {/* Stats grid */}
          {/* Stats grid — seulement pour radiologue */}
          {isRadiolog && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom: expDate ? '1.25rem' : 0 }}>
              <div style={{ background:'var(--bg-secondary,rgba(255,255,255,0.04))', borderRadius:'10px', padding:'0.875rem', textAlign:'center' }}>
                <p style={{ margin:0, fontSize:'1.375rem', fontWeight:900, color:cfg.color }}>{used}</p>
                <p style={{ margin:'2px 0 0', fontSize:'0.72rem', color:'#64748B', fontWeight:600 }}>
                  {t('accountSettings.sub.analysesMonth')}
                </p>
              </div>
              <div style={{ background:'var(--bg-secondary,rgba(255,255,255,0.04))', borderRadius:'10px', padding:'0.875rem', textAlign:'center' }}>
                <p style={{ margin:0, fontSize:'1.375rem', fontWeight:900, color:'var(--text-primary,#fff)' }}>
                  {isEnterprise || !quota ? '∞' : remaining}
                </p>
                <p style={{ margin:'2px 0 0', fontSize:'0.72rem', color:'#64748B', fontWeight:600 }}>
                  {t('accountSettings.sub.remaining')}
                </p>
              </div>
            </div>
          )}

          {/* Renewal date */}
          {expDate && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.625rem 0.875rem', background:'rgba(0,102,204,0.06)', border:'1px solid rgba(0,102,204,0.15)', borderRadius:'8px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style={{ fontSize:'0.75rem', color:'#64748B' }}>
                {t('accountSettings.sub.renewsOn')} <strong style={{ color:'var(--text-primary,#fff)' }}>{expDate}</strong>
              </span>
            </div>
          )}

          {subLoading && (
            <div style={{ display:'flex', justifyContent:'center', padding:'1rem' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid rgba(0,102,204,0.2)', borderTopColor:'#0066CC', animation:'as-spin 0.7s linear infinite' }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="as-page">
      <div className="container">

        <div className="as-header" data-aos="fade-down">
          <div>
            <div className="as-badge"><div className="as-badge-dot" /><span>{t('accountSettings.badge')}</span></div>
            <h1 className="as-title"><span className="as-title-grad">{t('accountSettings.title')}</span></h1>
            <p className="as-subtitle">{t('accountSettings.subtitle')}</p>
          </div>
        </div>

        <div className="as-layout">

          {/* SUBSCRIPTION */}
          {(user?.role === 'radiologist' || user?.role === 'researcher') && <SubscriptionCard />}

          {/* SECURITY */}
          <div className="as-card" data-aos="fade-up" data-aos-delay="80">
            <div className="as-card-header">
              <div className="as-card-icon" style={{ '--aci': '#10B981' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <h3 className="as-card-title">{t('accountSettings.security.title')}</h3>
                <p className="as-card-sub">{t('accountSettings.security.subtitle')}</p>
              </div>
            </div>
            <div className="as-toggles">
              <Toggle labelKey="accountSettings.security.twoFactor" descKey="accountSettings.security.twoFactorDesc" stateKey="twoFactor"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>} />
            </div>

            <div className="as-pw-section">
              <h4 className="as-pw-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                {t('accountSettings.security.pw.title')}
              </h4>

              {pwError   && <div className="as-pw-error"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{pwError}</div>}
              {pwSuccess && <div className="as-pw-success"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('accountSettings.security.pw.success')}</div>}

              {[
                { labelKey:'accountSettings.security.pw.current', key:'current', show:showCurrent, toggle:()=>setShowCurrent(s=>!s) },
                { labelKey:'accountSettings.security.pw.new',     key:'next',    show:showNext,    toggle:()=>setShowNext(s=>!s) },
                { labelKey:'accountSettings.security.pw.confirm', key:'confirm', show:showNext,    toggle:()=>setShowNext(s=>!s) },
              ].map((f,i) => (
                <div key={i} className="as-pw-field">
                  <label className="as-pw-label">{t(f.labelKey)}</label>
                  <div className="as-pw-wrap">
                    <input type={f.show?'text':'password'} className="as-pw-input" value={passwords[f.key]} onChange={e=>setPasswords(p=>({...p,[f.key]:e.target.value}))} placeholder="••••••••" />
                    <button type="button" className="as-pw-eye" onClick={f.toggle}><EyeIcon open={f.show}/></button>
                  </div>
                </div>
              ))}

              <button className="as-pw-btn" onClick={handleChangePw}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t('accountSettings.security.pw.submit')}
              </button>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="as-card as-danger-card" data-aos="fade-up" data-aos-delay="160">
            <div className="as-card-header">
              <div className="as-card-icon" style={{ '--aci': '#EF4444' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </div>
              <div>
                <h3 className="as-card-title as-danger-title">{t('accountSettings.danger.title')}</h3>
                <p className="as-card-sub">{t('accountSettings.danger.subtitle')}</p>
              </div>
            </div>
            <div className="as-danger-body">
              <div className="as-danger-text">
                <h4>{t('accountSettings.danger.deleteTitle')}</h4>
                <p>{t('accountSettings.danger.deleteDesc')}</p>
              </div>
              <button className="as-delete-btn" onClick={() => setShowDeleteModal(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                {t('accountSettings.danger.deleteBtn')}
              </button>
            </div>
          </div>

        </div>
      </div>
      <style>{`@keyframes as-spin { to { transform: rotate(360deg); } }`}</style>
    {/* ✅ DELETE ACCOUNT MODAL */}
        {showDeleteModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
            onClick={() => setShowDeleteModal(false)}>
            <div style={{ background:'var(--bg-card)', borderRadius:'16px', padding:'2rem', maxWidth:'420px', width:'100%', border:'1px solid rgba(239,68,68,0.3)' }}
              onClick={e => e.stopPropagation()}>
              
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
                <div style={{ width:48, height:48, borderRadius:'12px', background:'rgba(239,68,68,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </div>
                <div>
                  <h3 style={{ color:'#EF4444', fontWeight:800, marginBottom:'0.25rem' }}>Delete Account</h3>
                  <p style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>This action is permanent and cannot be undone.</p>
                </div>
              </div>

              <div style={{ padding:'1rem', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', marginBottom:'1.25rem' }}>
                <p style={{ color:'#EF4444', fontSize:'0.82rem', margin:0, lineHeight:1.6 }}>
                  All your data, analyses, patients and history will be permanently deleted. This cannot be reversed.
                </p>
              </div>

              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)', marginBottom:'0.5rem' }}>
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={deletePassword}
                  onChange={e => { setDeletePassword(e.target.value); setDeleteError(''); }}
                  style={{ width:'100%', padding:'0.75rem 1rem', background:'var(--bg-secondary)', border:`1px solid ${deleteError ? '#EF4444' : 'var(--border)'}`, borderRadius:'8px', color:'var(--text-primary)', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }}
                />
                {deleteError && <p style={{ color:'#EF4444', fontSize:'0.78rem', marginTop:'0.375rem', fontWeight:600 }}>{deleteError}</p>}
              </div>

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError(''); }}
                  style={{ flex:1, padding:'0.75rem', borderRadius:'8px', background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-primary)', fontWeight:700, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleDeleteAccount} disabled={deleteLoading}
                  style={{ flex:1, padding:'0.75rem', borderRadius:'8px', background:'linear-gradient(135deg,#EF4444,#DC2626)', border:'none', color:'white', fontWeight:700, cursor:'pointer', opacity: deleteLoading ? 0.7 : 1 }}>
                  {deleteLoading ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default AccountSettings;