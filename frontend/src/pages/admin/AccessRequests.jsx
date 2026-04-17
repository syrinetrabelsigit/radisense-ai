import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../shared/Avatar';

const API = 'http://localhost:8000';

const AccessRequests = () => {
  const { t } = useTranslation();
  const [requests, setRequests]   = useState([]);
  const [stats, setStats]         = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('pending');
  const [selected, setSelected]   = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast]         = useState(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => { fetchRequests(); }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // ✅ Fetch toujours ALL pour les stats
      const allR = await fetch(`${API}/api/access-requests/`, {
        headers: getHeaders()
      });
      const allD = await allR.json();
      setStats({ 
        total: allD.total, 
        pending: allD.pending, 
        approved: allD.approved, 
        rejected: allD.rejected 
      });

      // ✅ Fetch filtrée pour la liste
      const r = await fetch(`${API}/api/access-requests/?${filter !== 'all' ? `status=${filter}` : ''}`, {
        headers: getHeaders()
      });
      if (!r.ok) throw new Error('Failed');
      const d = await r.json();
      setRequests(d.requests || []);
    } catch {}
    setLoading(false);
  };

  const handleApprove = async (req) => {
    setActionLoading(req.id);
    try {
      const r = await fetch(`${API}/api/access-requests/${req.id}/review`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'approve' })
      });
      const d = await r.json();
      if (r.ok) {
        showToast(t('admin.requests.approvedSuccess', { username: d.username }), 'success');
        setSelected(null);
        fetchRequests();
      } else {
        showToast(d.detail || 'Failed', 'error');
      }
    } catch { showToast('Error', 'error'); }
    setActionLoading(null);
  };

  const handleReject = async (req) => {
    if (!rejectReason.trim()) { showToast(t('admin.requests.reasonRequired'), 'error'); return; }
    setActionLoading(req.id);
    try {
      const r = await fetch(`${API}/api/access-requests/${req.id}/review`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ action: 'reject', rejection_reason: rejectReason })
      });
      if (r.ok) {
        showToast(t('admin.requests.rejectedSuccess'), 'info');
        setRejecting(null);
        setRejectReason('');
        setSelected(null);
        fetchRequests();
      }
    } catch { showToast('Error', 'error'); }
    setActionLoading(null);
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const roleColor = { radiologist: '#0066CC', researcher: '#8B5CF6', patient: '#10B981', institution: '#F59E0B' };
  const planColor = { free: '#10B981', pro: '#0066CC', enterprise: '#8B5CF6' };
  const planBg    = { free: 'rgba(16,185,129,0.1)', pro: 'rgba(0,102,204,0.1)', enterprise: 'rgba(139,92,246,0.1)' };
  const statusCfg = {
    pending:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  label: t('admin.requests.pending')  },
    approved: { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: t('admin.requests.approved') },
    rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: t('admin.requests.rejected') },
  };

  // Parse name into first/last
  const splitName = (fullName = '') => {
    const parts = fullName.trim().split(' ');
    return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
  };

  return (
    <div style={S.page}>
      <div className="container">

        {/* TOAST */}
        {toast && (
          <div style={{ ...S.toast, background: toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#0066CC' }}>
            {toast.msg}
          </div>
        )}

        {/* HEADER */}
        <div style={S.header}>
          <div>
            <div style={S.badge}>
              <div style={S.badgeDot} />
              <span>{t('navbar.admin')}</span>
            </div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('nav.requests')}</span></h1>
            <p style={S.subtitle}>{t('admin.requests.subtitle')}</p>
          </div>
          <button style={S.refreshBtn} onClick={fetchRequests}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            {t('admin.requests.refresh')}          </button>
        </div>

        {/* STATS */}
        <div style={S.statsRow}>
          {[
            { label: t('admin.requests.total'),    val: stats.total,    color: '#64748B' },
            { label: t('admin.requests.pending'),  val: stats.pending,  color: '#F59E0B' },
            { label: t('admin.requests.approved'), val: stats.approved, color: '#10B981' },
            { label: t('admin.requests.rejected'), val: stats.rejected, color: '#EF4444' },
          ].map((s, i) => (
            <div key={i} style={S.statCard}>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* FILTER TABS */}
        <div style={S.tabs}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} style={{ ...S.tab, ...(filter === f ? S.tabActive : {}) }} onClick={() => setFilter(f)}>
              {t(`admin.requests.${f}`)}
              {f === 'pending' && stats.pending > 0 && (
                <span style={S.tabBadge}>{stats.pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* LIST */}
        {loading ? (
          <div style={S.center}><div style={S.spinner} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
        ) : requests.length === 0 ? (
          <div style={S.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            <p style={{ color: '#64748B', margin: 0 }}>{t('admin.requests.noRequests', { filter: t(`admin.requests.${filter}`) })}</p>
          </div>
        ) : (
          <div style={S.list}>
            {requests.map(req => {
              const sc = statusCfg[req.status] || statusCfg.pending;
              const { first, last } = splitName(req.name);
              const color = roleColor[req.role] || '#0066CC';
              return (
                <div key={req.id} style={S.card}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#0066CC'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-primary)'}
                >
                  {/* Left — User info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
                      {/* ── Avatar ── */}
                      <Avatar
                        avatarUrl={null}
                        firstName={first}
                        lastName={last}
                        size={44}
                        color={color}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{req.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{req.email}</div>
                      </div>
                    </div>
                    {req.institution && (
                      <div style={{ display:'flex', alignItems:'center', gap:'0.375rem', fontSize: '0.78rem', color: '#64748B', marginBottom: '0.375rem' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        {req.institution}
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                      {new Date(req.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Middle — Plan & Payment */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 160 }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, background: planBg[req.plan] || planBg.free, color: planColor[req.plan] || '#64748B', width: 'fit-content', textTransform: 'uppercase' }}>
                      {req.plan}
                    </span>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, background: `rgba(${req.stripe_payment_status === 'paid' ? '16,185,129' : '245,158,11'},0.1)`, color: req.stripe_payment_status === 'paid' ? '#10B981' : '#F59E0B', width: 'fit-content', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                      {req.stripe_payment_status === 'paid'
                        ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Paid — ${req.amount}</>
                        : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg>Free</>
                      }
                    </span>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, background: `rgba(${req.role === 'radiologist' ? '0,102,204' : '139,92,246'},0.1)`, color: roleColor[req.role] || '#64748B', width: 'fit-content', textTransform: 'capitalize' }}>
                      {req.role}
                    </span>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.875rem', borderRadius: '100px', background: sc.bg, color: sc.color, fontSize: '0.78rem', fontWeight: 700, width: 'fit-content', height: 'fit-content' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                    {sc.label}
                  </div>

                  {/* Actions */}
                  {req.status === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button style={S.approveBtn} onClick={() => setSelected(req)} disabled={actionLoading === req.id}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        {t('admin.requests.review')}                      </button>
                      <button style={S.rejectBtnSmall} onClick={() => { setRejecting(req); setSelected(null); }}>
                        {t('admin.requests.quickReject')}
                      </button>
                    </div>
                  )}
                  {req.status !== 'pending' && (
                    <button style={S.viewBtn} onClick={() => setSelected(req)}>{t('admin.requests.view')}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* REVIEW MODAL */}
        {selected && (() => {
          const { first, last } = splitName(selected.name);
          const color = roleColor[selected.role] || '#0066CC';
          return (
            <div style={S.overlay} onClick={() => setSelected(null)}>
              <div style={S.modal} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                    <Avatar avatarUrl={null} firstName={first} lastName={last} size={52} color={color} />
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.125rem' }}>
                        {selected.name}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.82rem' }}>
                        Request #{selected.id} · Submitted {new Date(selected.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button style={S.closeBtn} onClick={() => setSelected(null)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                {/* Full details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    ['Name', selected.name],
                    ['Email', selected.email],
                    ['Institution', selected.institution || '—'],
                    ['Role', selected.role],
                    ['Plan', selected.plan.toUpperCase()],
                    ['Payment', selected.stripe_payment_status === 'paid' ? `Paid — $${selected.amount}` : 'Free'],
                    ['Billing', selected.billing || '—'],
                    ['Currency', (selected.currency || 'usd').toUpperCase()],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>{k}</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {selected.message && (
                  <div style={{ padding:'1rem', background:'rgba(0,102,204,0.06)', border:'1px solid rgba(0,102,204,0.15)', borderRadius:'10px', marginBottom:'1.25rem' }}>
                    <strong style={{ color:'var(--text-primary)', display:'block', marginBottom:'0.75rem', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>{t('admin.requests.professionalDetails')}</strong>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.375rem' }}>
                      {selected.message.split(' | ').map((item, i) => {
                        const [key, ...val] = item.split(': ');
                        return (
                          <div key={i} style={{ display:'flex', gap:'0.5rem', fontSize:'0.875rem' }}>
                            <span style={{ color:'#64748B', fontWeight:600, minWidth:100 }}>{key}:</span>
                            <span style={{ color:'var(--text-primary)' }}>{val.join(': ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selected.rejection_reason && (
                  <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#EF4444' }}>
                    <strong>{t('admin.requests.rejectionReason')}:</strong> {selected.rejection_reason}
                  </div>
                )}

                {selected.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      style={{ ...S.approveBtn, flex: 1, justifyContent: 'center', padding: '0.875rem' }}
                      onClick={() => handleApprove(selected)}
                      disabled={actionLoading === selected.id}
                    >
                      {actionLoading === selected.id ? t('register.processing') : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('admin.requests.approveCreate')}</>
                      )}
                    </button>
                    <button
                      style={{ ...S.rejectBtnSmall, flex: 1, padding: '0.875rem', justifyContent:'center' }}
                      onClick={() => { setRejecting(selected); setSelected(null); }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      {t('admin.requests.reject')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* REJECT MODAL */}
        {rejecting && (
          <div style={S.overlay} onClick={() => setRejecting(null)}>
            <div style={{ ...S.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t('admin.requests.rejectTitle')}</h3>
              <p style={{ color: '#64748B', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                {t('admin.requests.rejectingFrom')} <strong style={{ color: 'var(--text-primary)' }}>{rejecting.name}</strong>.<br/>
                {rejecting.stripe_payment_status === 'paid' && (
                  <span style={{ color: '#F59E0B', display:'flex', alignItems:'center', gap:'0.375rem', marginTop:'0.375rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {t('admin.requests.paidWarning')}
                  </span>
                )}
              </p>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '0.5rem' }}>
                  {t('admin.requests.rejectReason')}
                </label>
                <textarea
                  style={{ width: '100%', padding: '0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  rows={3}
                  placeholder="e.g. Unable to verify credentials, incomplete application..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button style={{ ...S.rejectBtnSmall, flex: 1, padding: '0.875rem', justifyContent: 'center' }}
                  onClick={() => handleReject(rejecting)}
                  disabled={actionLoading === rejecting.id}
                >
                  {actionLoading === rejecting.id ? t('register.processing') : t('admin.requests.confirmReject')}
                </button>
                <button style={{ ...S.viewBtn, flex: 1, padding: '0.875rem', justifyContent: 'center' }}
                  onClick={() => { setRejecting(null); setRejectReason(''); }}>
                  {t('patients.form.cancel')}                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const S = {
  page:      { minHeight: 'calc(100vh - 80px)', padding: '3rem 0 5rem' },
  header:    { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', gap: '2rem', flexWrap: 'wrap' },
  badge:     { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '100px', color: '#A78BFA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot:  { width: 7, height: 7, borderRadius: '50%', background: '#8B5CF6' },
  title:     { margin: 0, fontSize: 'clamp(2rem,4vw,2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad: { background: 'linear-gradient(135deg,#8B5CF6,#0066CC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle:  { color: '#64748B', fontSize: '0.9rem', margin: 0 },
  refreshBtn:{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.25rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  statsRow:  { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  statCard:  { flex: 1, minWidth: 100, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '14px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' },
  tabs:      { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab:       { padding: '0.5rem 1.25rem', borderRadius: '100px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: '#64748B', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  tabActive: { background: 'rgba(139,92,246,0.1)', borderColor: '#8B5CF6', color: '#A78BFA' },
  tabBadge:  { background: '#F59E0B', color: 'white', borderRadius: '100px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 800 },
  center:    { display: 'flex', justifyContent: 'center', padding: '4rem' },
  spinner:   { width: 44, height: 44, borderRadius: '50%', border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8B5CF6', animation: 'spin 0.8s linear infinite' },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '20px', textAlign: 'center' },
  list:      { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  card:      { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem 1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '16px', transition: 'border-color 0.2s', flexWrap: 'wrap' },
  approveBtn:    { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  rejectBtnSmall:{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  viewBtn:   { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' },
  overlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:     { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '20px', padding: '1.75rem', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' },
  closeBtn:  { width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  toast:     { position: 'fixed', top: '1.5rem', right: '1.5rem', padding: '0.875rem 1.5rem', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '0.875rem', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' },
};

export default AccessRequests;