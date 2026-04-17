import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';

const API = 'http://localhost:8000';

const RadiologistAppointments = () => {
  const { t } = useTranslation();

  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [data, setData]                   = useState({ upcoming: [], past: [], total: 0, pending_count: 0, confirmed_count: 0, today_count: 0 });
  const [activeTab, setActiveTab]         = useState('upcoming');
  const [selectedAppt, setSelectedAppt]   = useState(null);
  const [showDetails, setShowDetails]     = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [notesInput, setNotesInput]       = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget]       = useState(null);
  const [cancelReason, setCancelReason]       = useState('');
  const [cancelError, setCancelError]         = useState('');

  const initialized = useRef(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API}/api/appointments/radiologist/my-schedule`, { headers: getHeaders() });
      if (!r.ok) throw new Error('Failed to fetch schedule');
      setData(await r.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' });
    fetchSchedule();
  }, []);

  const doAction = async (apptId, action, body = {}) => {
    setActionLoading(apptId + action);
    try {
      const r = await fetch(`${API}/api/appointments/radiologist/${apptId}/${action}`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error('Action failed');
      await fetchSchedule();
      setShowDetails(false);
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };
  const openCancelModal = (appt) => {
    setCancelTarget(appt);
    setCancelReason('');
    setCancelError('');
    setShowCancelModal(true);
    setShowDetails(false);
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Please explain why you are cancelling this appointment.');
      return;
    }
    setActionLoading(cancelTarget.id + 'cancel');
    try {
      const r = await fetch(`${API}/api/appointments/radiologist/${cancelTarget.id}/cancel`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(typeof err.detail === 'object' ? err.detail.message : err.detail);
      }
      await fetchSchedule();
      setShowCancelModal(false);
      setCancelTarget(null);
    } catch (err) { setCancelError(err.message); }
    finally { setActionLoading(null); }
  };
  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Remove this cancelled appointment from your list?')) return;
    setActionLoading(appointmentId + 'delete');
    try {
      const r = await fetch(`${API}/api/appointments/radiologist/${appointmentId}`, {
        method: 'DELETE', headers: getHeaders(),
      });
      if (!r.ok) throw new Error('Failed to delete');
      await fetchSchedule();
    } catch (err) { alert(err.message); }
    finally { setActionLoading(null); }
  };
  const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');

  const statusCfg = {
    pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: t('dashboard.radiologist.schedule.actions.confirm') },
    confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  label: t('admin.appointments.status.confirmed') },
    completed: { color: '#0066CC', bg: 'rgba(0,102,204,0.12)',   border: 'rgba(0,102,204,0.3)',   label: t('admin.appointments.status.completed') },
    cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   label: t('admin.appointments.status.cancelled') },
  };

  // status labels séparés pour les pills (sans l'action)
  const statusLabels = {
    pending:   t('admin.appointments.status.pending'),
    confirmed: t('admin.appointments.status.confirmed'),
    completed: t('admin.appointments.status.completed'),
    cancelled: t('admin.appointments.status.cancelled'),
  };

  const statCards = [
    {
      label: t('dashboard.radiologist.schedule.stats.total'),
      val: data.total, color: '#0066CC',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    },
    {
      label: t('dashboard.radiologist.schedule.stats.pending'),
      val: data.pending_count, color: '#F59E0B',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    },
    {
      label: t('dashboard.radiologist.schedule.stats.confirmed'),
      val: data.confirmed_count, color: '#10B981',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    },
    {
      label: t('dashboard.radiologist.schedule.stats.today'),
      val: data.today_count, color: '#8B5CF6',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
    },
  ];

  if (loading) return (
    <div style={S.page}><div style={S.loaderWrap}>
      <div style={S.spinner} /><p style={{ color: '#64748B' }}>{t('dashboard.radiologist.schedule.loading')}</p>
    </div></div>
  );

  if (error) return (
    <div style={S.page}><div style={S.loaderWrap}>
      <p style={{ color: '#EF4444' }}>{error}</p>
      <button style={S.retryBtn} onClick={fetchSchedule}>Retry</button>
    </div></div>
  );

  const list = activeTab === 'upcoming' ? data.upcoming : data.past;

  return (
    <div style={S.page}>
      <div className="container">

        {/* HEADER */}
        <div style={S.header} data-aos="fade-down">
          <div>
            <div style={S.badge}><div style={S.badgeDot} /><span>{t('dashboard.radiologist.schedule.badge')}</span></div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('dashboard.radiologist.schedule.title')}</span></h1>
            <p style={S.subtitle}>{t('dashboard.radiologist.schedule.subtitle')}</p>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={S.statsGrid} data-aos="fade-up">
          {statCards.map((s, i) => (
            <div key={i} style={{ ...S.statCard, borderColor: s.color + '40' }}>
              <div style={{ ...S.statIcon, background: s.color, boxShadow: `0 8px 24px color-mix(in srgb, ${s.color} 40%, transparent)` }}>
                {s.icon}
              </div>
              <div>
                <p style={S.statLabel}>{s.label}</p>
                <h3 style={{ ...S.statVal, color: s.color }}>{s.val}</h3>
              </div>
              <div style={{ ...S.statGlow, background: s.color }} />
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={S.tabs} data-aos="fade-up">
          {[
            { key: 'upcoming', label: t('dashboard.radiologist.schedule.tabs.upcoming'), count: data.upcoming.length },
            { key: 'past',     label: t('dashboard.radiologist.schedule.tabs.past'),     count: data.past.length },
          ].map(tab => (
            <button
              key={tab.key}
              style={{ ...S.tab, ...(activeTab === tab.key ? S.tabActive : {}) }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span style={{ ...S.tabCount, ...(activeTab === tab.key ? { background: 'rgba(255,255,255,0.25)', color: 'white' } : {}) }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* LIST */}
        {list.length === 0 ? (
          <div style={S.empty} data-aos="fade-up">
            <div style={S.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
              {t('dashboard.radiologist.schedule.empty', { tab: activeTab })}
            </p>
            <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
              {t('dashboard.radiologist.schedule.emptySubtitle')}
            </p>
          </div>
        ) : (
          <div style={S.list}>
            {list.map((appt, i) => {
              const sc = statusCfg[appt.status] || statusCfg.pending;
              const slabel = statusLabels[appt.status] || appt.status;
              return (
                <div key={appt.id} style={S.card} data-aos="fade-up" data-aos-delay={i * 50}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Date */}
                  <div style={S.dateCol}>
                    <span style={S.dateDay}>{new Date(appt.date).getDate()}</span>
                    <span style={S.dateMonth}>{new Date(appt.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                    <span style={S.dateYear}>{new Date(appt.date).getFullYear()}</span>
                  </div>

                  {/* Patient */}
                  <div style={S.patientCol}>
                    <div style={{ ...S.avatar, background: `hsl(${(appt.patient?.id || 0) * 47 % 360}, 65%, 50%)` }}>
                      {getInitials(appt.patient?.name || '?')}
                    </div>
                    <div>
                      <p style={S.patientName}>{appt.patient?.name || 'Unknown'}</p>
                      <p style={S.patientId}>{appt.patient?.patient_id}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={S.infoCol}>
                    <div style={S.infoRow}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{appt.time}</span>
                    </div>
                    <div style={S.infoRow}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{appt.type}</span>
                    </div>
                    {appt.location && (
                      <div style={S.infoRow}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{appt.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div style={{ ...S.statusPill, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                    {slabel}
                  </div>

                  {/* Actions */}
                  <div style={S.actionsCol}>
                    <button style={S.detailBtn} onClick={() => { setSelectedAppt(appt); setShowDetails(true); setNotesInput(appt.notes || ''); }}>
                      {t('dashboard.radiologist.schedule.actions.details')}
                    </button>
                    {appt.status === 'pending' && (
                      <button style={S.confirmBtn} onClick={() => doAction(appt.id, 'confirm')} disabled={!!actionLoading}>
                        {actionLoading === appt.id + 'confirm' ? '…' : (
                          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t('dashboard.radiologist.schedule.actions.confirm')}</>
                        )}
                      </button>
                    )}
                    {appt.status === 'confirmed' && (
                      <button style={S.completeBtn} onClick={() => doAction(appt.id, 'complete')} disabled={!!actionLoading}>
                        {actionLoading === appt.id + 'complete' ? '…' : (
                          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> {t('dashboard.radiologist.schedule.actions.complete')}</>
                        )}
                      </button>
                    )}
                    {(appt.status === 'pending' || appt.status === 'confirmed') && (
                      <button style={S.cancelBtn} onClick={() => openCancelModal(appt)} disabled={!!actionLoading}>
                      {actionLoading === appt.id + 'cancel' ? '…' : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel</>
                      )}
                    </button>
                    )}
                    {appt.status === 'cancelled' && (
                    <div style={{ width:'100%', marginTop:'0.5rem' }}>
                      <div style={{ padding:'0.625rem 0.875rem', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:'8px', marginBottom:'0.5rem' }}>
                        <p style={{ margin:'0 0 0.2rem', color:'#EF4444', fontSize:'0.78rem', fontWeight:700 }}>Cancelled</p>
                        {appt.cancellation_reason && (
                          <p style={{ margin:0, color:'#94A3B8', fontSize:'0.75rem', lineHeight:1.5 }}>
                            {appt.cancellation_reason}
                          </p>
                        )}
                      </div>
                      <button style={{ ...S.cancelBtn, width:'100%', justifyContent:'center' }}
                        onClick={() => handleDeleteAppointment(appt.id)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                        Remove
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DETAILS MODAL */}
        {showDetails && selectedAppt && (
          <div style={S.overlay} onClick={() => setShowDetails(false)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={S.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.25rem' }}>
                    {t('dashboard.radiologist.schedule.modal.title')}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                    {new Date(selectedAppt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedAppt.time}
                  </p>
                </div>
                <button style={S.closeBtn} onClick={() => setShowDetails(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div style={S.modalBody}>
                <div style={S.detailSection}>
                  <p style={S.detailLabel}>{t('dashboard.radiologist.schedule.modal.patient')}</p>
                  <div style={S.detailBox}>
                    <div style={{ ...S.avatar, width: 48, height: 48, fontSize: '1rem', background: `hsl(${(selectedAppt.patient?.id || 0) * 47 % 360}, 65%, 50%)` }}>
                      {getInitials(selectedAppt.patient?.name || '?')}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedAppt.patient?.name}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>{selectedAppt.patient?.patient_id} · {selectedAppt.patient?.phone}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={S.detailSection}>
                    <p style={S.detailLabel}>{t('dashboard.radiologist.schedule.modal.type')}</p>
                    <p style={S.detailVal}>{selectedAppt.type}</p>
                  </div>
                  <div style={S.detailSection}>
                    <p style={S.detailLabel}>{t('dashboard.radiologist.schedule.modal.status')}</p>
                    <div style={{ ...S.statusPill, color: statusCfg[selectedAppt.status]?.color, background: statusCfg[selectedAppt.status]?.bg, border: `1px solid ${statusCfg[selectedAppt.status]?.border}`, width: 'fit-content' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusCfg[selectedAppt.status]?.color }} />
                      {statusLabels[selectedAppt.status]}
                    </div>
                  </div>
                  <div style={S.detailSection}>
                    <p style={S.detailLabel}>{t('dashboard.radiologist.schedule.modal.location')}</p>
                    <p style={S.detailVal}>{selectedAppt.location || '—'}</p>
                  </div>
                  <div style={S.detailSection}>
                    <p style={S.detailLabel}>{t('dashboard.radiologist.schedule.modal.time')}</p>
                    <p style={S.detailVal}>{selectedAppt.time}</p>
                  </div>
                </div>

                <div style={S.detailSection}>
                  <p style={S.detailLabel}>{t('dashboard.radiologist.schedule.modal.notes')}</p>
                  <textarea
                    style={S.notesInput}
                    value={notesInput}
                    onChange={e => setNotesInput(e.target.value)}
                    placeholder={t('dashboard.radiologist.schedule.modal.notesPlaceholder')}
                    rows={3}
                  />
                </div>
              </div>

              <div style={S.modalFooter}>
                <button style={S.modalCancelBtn} onClick={() => setShowDetails(false)}>
                  {t('dashboard.radiologist.schedule.actions.close')}
                </button>
                {selectedAppt.status === 'pending' && (
                  <button style={S.confirmBtn} onClick={() => doAction(selectedAppt.id, 'confirm')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {t('dashboard.radiologist.schedule.actions.confirmAppt')}
                  </button>
                )}
                {selectedAppt.status === 'confirmed' && (
                  <button style={S.completeBtn} onClick={() => doAction(selectedAppt.id, 'complete', { notes: notesInput })}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {t('dashboard.radiologist.schedule.actions.markComplete')}
                  </button>
                )}
                {(selectedAppt.status === 'pending' || selectedAppt.status === 'confirmed') && (
                  <button style={S.cancelBtnFull} onClick={() => openCancelModal(selectedAppt)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    {t('dashboard.radiologist.schedule.actions.cancelAppt')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      {showCancelModal && cancelTarget && (
        <div style={S.overlay} onClick={() => setShowCancelModal(false)}>
          <div style={{ ...S.modal, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div style={S.modalHeader}>
              <div>
                <h3 style={{ margin:0, color:'#EF4444', fontWeight:800, fontSize:'1.1rem' }}>Cancel Appointment</h3>
                <p style={{ margin:'0.25rem 0 0', color:'#64748B', fontSize:'0.82rem' }}>
                  {cancelTarget.patient?.name} — {new Date(cancelTarget.date).toLocaleDateString()} at {cancelTarget.time}
                </p>
              </div>
              <button style={S.closeBtn} onClick={() => setShowCancelModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding:'1.5rem 1.75rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'flex', gap:'0.75rem', padding:'0.875rem 1rem', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p style={{ margin:0, color:'#EF4444', fontSize:'0.82rem', lineHeight:1.5 }}>
                  {cancelTarget.status === 'confirmed'
                    ? 'This appointment is already confirmed. The patient will be notified of your cancellation.'
                    : 'The patient will be notified of your cancellation.'}
                </p>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.78rem', fontWeight:800, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.5rem' }}>
                  Reason for cancellation <span style={{ color:'#EF4444' }}>*</span>
                </label>
                <textarea style={{ ...S.notesInput, borderColor: cancelError ? 'rgba(239,68,68,0.5)' : 'var(--border-primary)' }}
                  rows={4}
                  placeholder="e.g. Medical emergency, scheduling conflict, unavailable at this time..."
                  value={cancelReason}
                  onChange={e => { setCancelReason(e.target.value); setCancelError(''); }}
                  autoFocus />
                {cancelError && <p style={{ margin:'0.375rem 0 0', color:'#EF4444', fontSize:'0.78rem', fontWeight:600 }}>{cancelError}</p>}
              </div>
            </div>
            <div style={S.modalFooter}>
              <button style={S.modalCancelBtn} onClick={() => setShowCancelModal(false)}>Keep Appointment</button>
              <button style={S.cancelBtnFull} onClick={confirmCancel} disabled={!!actionLoading}>
                {actionLoading ? '…' : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Confirm Cancellation</>}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const S = {
  page: { minHeight: 'calc(100vh - 80px)', padding: '3rem 0 5rem' },
  loaderWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' },
  spinner: { width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(0,102,204,0.2)', borderTopColor: '#0066CC', animation: 'spin 0.8s linear infinite' },
  retryBtn: { padding: '0.75rem 2rem', background: '#0066CC', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 },
  header: { marginBottom: '2rem' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)', borderRadius: '100px', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot: { width: 7, height: 7, borderRadius: '50%', background: '#00BFA6' },
  title: { margin: 0, fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad: { background: 'linear-gradient(135deg,#0066CC,#00BFA6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { color: '#64748B', fontSize: '1rem', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: { position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', background: 'var(--bg-card)', border: '1px solid', borderRadius: '20px', transition: 'all 0.25s' },
  statIcon: { width: 48, height: 48, borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' },
  statVal: { margin: 0, fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 },
  statGlow: { position: 'absolute', bottom: -16, right: -16, width: 60, height: 60, borderRadius: '50%', opacity: 0.08, filter: 'blur(14px)' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' },
  tab: { display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: '1px solid transparent', color: 'white', boxShadow: '0 6px 20px rgba(0,102,204,0.3)' },
  tabCount: { padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', fontWeight: 800 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '20px', textAlign: 'center' },
  emptyIcon: { width: 80, height: 80, borderRadius: '20px', background: 'rgba(0,102,204,0.08)', border: '1px solid rgba(0,102,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.875rem' },
  card: { display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', transition: 'all 0.2s', flexWrap: 'wrap' },
  dateCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52, padding: '0.5rem 0.875rem', background: 'rgba(0,102,204,0.08)', borderRadius: '12px', border: '1px solid rgba(0,102,204,0.15)' },
  dateDay:   { fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 },
  dateMonth: { fontSize: '0.6rem', fontWeight: 700, color: '#0066CC', letterSpacing: '0.08em' },
  dateYear:  { fontSize: '0.6rem', color: '#64748B' },
  patientCol: { display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 180, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 },
  patientName: { margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' },
  patientId:   { margin: 0, fontSize: '0.75rem', color: '#64748B' },
  infoCol: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 },
  infoRow: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.875rem', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' },
  actionsCol: { display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 },
  detailBtn:   { padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },
  confirmBtn:  { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  completeBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'rgba(0,102,204,0.12)', border: '1px solid rgba(0,102,204,0.3)', color: '#0066CC', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  cancelBtn:   { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' },
  cancelBtnFull: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
  modal: { width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '24px', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.75rem 1.75rem 1.25rem', borderBottom: '1px solid var(--border-primary)' },
  closeBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' },
  modalBody: { padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  modalFooter: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-primary)', flexWrap: 'wrap' },
  modalCancelBtn: { padding: '0.75rem 1.25rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  cancelBtn: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.875rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  detailLabel: { margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' },
  detailVal:   { margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' },
  detailBox:   { display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: '12px' },
  notesInput:  { background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '10px', color: 'var(--text-primary)', padding: '0.75rem 1rem', fontSize: '0.875rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
};

export default RadiologistAppointments;