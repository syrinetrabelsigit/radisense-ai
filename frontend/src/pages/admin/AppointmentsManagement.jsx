import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';

const API = 'http://localhost:8000';

const IconCalendar = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconClock    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconCheck    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconFlag     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
const IconX        = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
const IconToday    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>;

const AppointmentsManagement = () => {
  const { t } = useTranslation();

  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError]                   = useState(null);
  const [appointments, setAppointments]     = useState([]);
  const [total, setTotal]                   = useState(0);
  const [stats, setStats]                   = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, today: 0 });
  const [statusFilter, setStatusFilter]     = useState('');
  const [selectedAppt, setSelectedAppt]     = useState(null);
  const [showDetails, setShowDetails]       = useState(false);
  const [actionLoading, setActionLoading]   = useState(null);

  const initialized = useRef(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  const fetchStats = async () => {
    try {
      const r = await fetch(`${API}/api/appointments/admin/stats`, { headers: getHeaders() });
      if (r.ok) setStats(await r.json());
    } catch {}
  };

  const fetchAppointments = async (filter) => {
    try {
      const params = new URLSearchParams({ limit: '100', skip: '0' });
      if (filter) params.append('status_filter', filter);
      const r = await fetch(`${API}/api/appointments/admin/all?${params}`, { headers: getHeaders() });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setAppointments(d.appointments || []);
      setTotal(d.total || 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' });
    Promise.all([fetchStats(), fetchAppointments('')]).finally(() => setInitialLoading(false));
  }, []);

  const handleFilter = (f) => {
    setStatusFilter(f);
    fetchAppointments(f);
  };

  const updateStatus = async (apptId, newStatus) => {
    setActionLoading(apptId + newStatus);
    try {
      const r = await fetch(`${API}/api/appointments/admin/${apptId}/status?new_status=${newStatus}`, {
        method: 'PUT', headers: getHeaders()
      });
      if (!r.ok) throw new Error('Failed');
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus } : a));
      setSelectedAppt(prev => prev?.id === apptId ? { ...prev, status: newStatus } : prev);
      fetchStats();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAppt = async (apptId) => {
    if (!window.confirm('Delete this appointment permanently?')) return;
    setActionLoading(apptId + 'del');
    try {
      const r = await fetch(`${API}/api/appointments/admin/${apptId}`, { method: 'DELETE', headers: getHeaders() });
      if (!r.ok) throw new Error('Failed');
      setAppointments(prev => prev.filter(a => a.id !== apptId));
      setTotal(prev => prev - 1);
      setShowDetails(false);
      fetchStats();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');

  // status config avec traductions
  const statusCfg = {
    pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: t('admin.appointments.status.pending') },
    confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  label: t('admin.appointments.status.confirmed') },
    completed: { color: '#0066CC', bg: 'rgba(0,102,204,0.12)',   border: 'rgba(0,102,204,0.3)',   label: t('admin.appointments.status.completed') },
    cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   label: t('admin.appointments.status.cancelled') },
  };

  const statCards = [
    { label: t('admin.appointments.stats.total'),     val: stats.total,     color: '#0066CC', icon: <IconCalendar />, filter: null },
    { label: t('admin.appointments.stats.pending'),   val: stats.pending,   color: '#F59E0B', icon: <IconClock />,    filter: 'pending' },
    { label: t('admin.appointments.stats.confirmed'), val: stats.confirmed, color: '#10B981', icon: <IconCheck />,    filter: 'confirmed' },
    { label: t('admin.appointments.stats.completed'), val: stats.completed, color: '#8B5CF6', icon: <IconFlag />,     filter: 'completed' },
    { label: t('admin.appointments.stats.cancelled'), val: stats.cancelled, color: '#EF4444', icon: <IconX />,        filter: 'cancelled' },
    { label: t('admin.appointments.stats.today'),     val: stats.today,     color: '#00BFA6', icon: <IconToday />,    filter: null },
  ];

  const filterButtons = [
    { val: '',          label: t('admin.appointments.filter.all') },
    { val: 'pending',   label: t('admin.appointments.status.pending') },
    { val: 'confirmed', label: t('admin.appointments.status.confirmed') },
    { val: 'completed', label: t('admin.appointments.status.completed') },
    { val: 'cancelled', label: t('admin.appointments.status.cancelled') },
  ];

  const displayed = statusFilter
    ? appointments.filter(a => a.status === statusFilter)
    : appointments;

  if (initialLoading) return (
    <div style={S.page}>
      <div style={S.loaderWrap}>
        <div style={S.spinner} />
        <p style={{ color: '#64748B' }}>{t('admin.appointments.loading')}</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div className="container">

        {/* HEADER */}
        <div style={S.header} data-aos="fade-down">
          <div>
            <div style={S.badge}><div style={S.badgeDot} /><span>{t('admin.appointments.badge')}</span></div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('admin.appointments.title')}</span></h1>
            <p style={S.subtitle}>{t('admin.appointments.subtitle')}</p>
          </div>
        </div>

        {/* STATS */}
        <div style={S.statsGrid} data-aos="fade-up">
          {statCards.map((s, i) => (
            <div
              key={i}
              style={{
                ...S.statCard,
                borderColor: statusFilter === s.filter && s.filter ? s.color : s.color + '35',
                cursor: s.filter ? 'pointer' : 'default',
                transform: statusFilter === s.filter && s.filter ? 'translateY(-4px)' : 'none',
                boxShadow: statusFilter === s.filter && s.filter ? `0 10px 30px ${s.color}30` : 'none',
              }}
              onClick={() => s.filter && handleFilter(statusFilter === s.filter ? '' : s.filter)}
            >
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

        {/* FILTER BAR */}
        <div style={S.filterBar} data-aos="fade-up">
          <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
            {displayed.length} {t('admin.appointments.title').toLowerCase()}{statusFilter ? ` · ${statusFilter}` : ''}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#64748B', fontSize: '0.8rem' }}>{t('admin.appointments.filter.label')}</span>
            {filterButtons.map(f => (
              <button
                key={f.val}
                style={{ ...S.filterBtn, ...(statusFilter === f.val ? S.filterBtnActive : {}) }}
                onClick={() => handleFilter(f.val)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '1rem', color: '#EF4444', background: 'rgba(239,68,68,0.08)', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* TABLE */}
        {displayed.length === 0 ? (
          <div style={S.empty}>
            <div style={S.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0, fontSize: '1.1rem' }}>
              {t('admin.appointments.empty')}
            </p>
            {statusFilter && <button style={S.retryBtn} onClick={() => handleFilter('')}>{t('admin.appointments.filter.all')}</button>}
          </div>
        ) : (
          <div style={S.tableWrap} data-aos="fade-up">
            <table style={S.table}>
              <thead>
                <tr style={S.thead}>
                  {[
                    t('admin.appointments.table.dateTime'),
                    t('admin.appointments.table.patient'),
                    t('admin.appointments.table.radiologist'),
                    t('admin.appointments.table.type'),
                    t('admin.appointments.table.status'),
                    t('admin.appointments.table.actions'),
                  ].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((appt, i) => {
                  const sc = statusCfg[appt.status] || statusCfg.pending;
                  return (
                    <tr key={appt.id} style={{ ...S.tr, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,102,204,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                    >
                      <td style={S.td}>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {new Date(appt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>{appt.time}</p>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ ...S.avatar, background: `hsl(${(appt.patient?.id || 0) * 47 % 360}, 60%, 50%)` }}>
                            {getInitials(appt.patient?.name || '?')}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{appt.patient?.name}</p>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>{appt.patient?.patient_id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <div style={{ ...S.avatar, background: 'linear-gradient(135deg,#0066CC,#00BFA6)' }}>
                            {getInitials(appt.doctor?.name || '?')}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{appt.doctor?.name}</p>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>{appt.doctor?.specialty}</p>
                          </div>
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{appt.type}</span>
                      </td>
                      <td style={S.td}>
                        <div style={{ ...S.statusPill, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, width: 'fit-content' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                          {sc.label}
                        </div>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button style={S.detailBtn} onClick={() => { setSelectedAppt(appt); setShowDetails(true); }}>
                            {t('admin.appointments.modal.title').replace('#', '').trim() || 'Details'}
                          </button>
                          <button style={S.deleteBtn} onClick={() => deleteAppt(appt.id)} disabled={!!actionLoading}>
                            {actionLoading === appt.id + 'del' ? '…' : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* DETAILS MODAL */}
        {showDetails && selectedAppt && (
          <div style={S.overlay} onClick={() => setShowDetails(false)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={S.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>
                    {t('admin.appointments.modal.title')}{selectedAppt.id}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.82rem' }}>
                    {new Date(selectedAppt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {selectedAppt.time}
                  </p>
                </div>
                <button style={S.closeBtn} onClick={() => setShowDetails(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={S.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { label: t('admin.appointments.modal.patient'),     val: selectedAppt.patient?.name,    sub: selectedAppt.patient?.email },
                    { label: t('admin.appointments.modal.radiologist'), val: selectedAppt.doctor?.name,     sub: selectedAppt.doctor?.specialty },
                    { label: t('admin.appointments.modal.type'),        val: selectedAppt.type },
                    { label: t('admin.appointments.modal.location'),    val: selectedAppt.location || '—' },
                  ].map((d, i) => (
                    <div key={i} style={S.detailSection}>
                      <p style={S.detailLabel}>{d.label}</p>
                      <p style={S.detailVal}>{d.val}</p>
                      {d.sub && <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>{d.sub}</p>}
                    </div>
                  ))}
                </div>
                {selectedAppt.notes && (
                  <div style={S.detailSection}>
                    <p style={S.detailLabel}>{t('admin.appointments.modal.notes')}</p>
                    <p style={{ ...S.detailVal, padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: '10px', lineHeight: 1.5 }}>
                      {selectedAppt.notes}
                    </p>
                  </div>
                )}
                {selectedAppt.cancellation_reason && (
                  <div style={S.detailSection}>
                    <p style={S.detailLabel}>Cancellation Reason</p>
                    <div style={{ padding: '0.875rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px' }}>
                      <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.875rem', lineHeight: 1.6 }}>
                        {selectedAppt.cancellation_reason}
                      </p>
                    </div>
                  </div>
                )}
                <div style={S.detailSection}>
                  <p style={S.detailLabel}>{t('admin.appointments.modal.changeStatus')}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['pending', 'confirmed', 'completed', 'cancelled'].map(s => {
                      const cfg = statusCfg[s];
                      const isActive = selectedAppt.status === s;
                      return (
                        <button key={s} style={{ padding: '0.5rem 0.875rem', borderRadius: '8px', cursor: isActive ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.8rem', color: isActive ? 'white' : cfg.color, background: isActive ? cfg.color : cfg.bg, border: `1px solid ${cfg.border}`, opacity: actionLoading ? 0.6 : 1 }}
                          onClick={() => !isActive && !actionLoading && updateStatus(selectedAppt.id, s)}
                          disabled={!!actionLoading || isActive}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={S.modalFooter}>
                <button style={S.modalCancelBtn} onClick={() => setShowDetails(false)}>
                  {t('admin.appointments.modal.close')}
                </button>
                <button style={S.deleteFullBtn} onClick={() => deleteAppt(selectedAppt.id)} disabled={!!actionLoading}>
                  {actionLoading === selectedAppt.id + 'del' ? '…' : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg> {t('admin.appointments.modal.delete')}</>
                  )}
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
  spinner: { width: 44, height: 44, borderRadius: '50%', border: '4px solid rgba(0,102,204,0.2)', borderTopColor: '#0066CC', animation: 'spin 0.8s linear infinite' },
  retryBtn: { padding: '0.6rem 1.5rem', background: '#0066CC', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' },
  header: { marginBottom: '2.5rem' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)', borderRadius: '100px', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot: { width: 7, height: 7, borderRadius: '50%', background: '#00BFA6' },
  title: { margin: 0, fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad: { background: 'linear-gradient(135deg,#0066CC,#00BFA6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { color: '#64748B', fontSize: '1rem', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '1rem', marginBottom: '2rem' },
  statCard: { position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid', borderRadius: '20px', transition: 'all 0.25s ease' },
  statIcon: { width: 48, height: 48, borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { margin: 0, fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' },
  statVal: { margin: 0, fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 },
  statGlow: { position: 'absolute', bottom: -16, right: -16, width: 60, height: 60, borderRadius: '50%', opacity: 0.08, filter: 'blur(14px)' },
  filterBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '14px', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  filterBtn: { padding: '0.375rem 0.875rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' },
  filterBtnActive: { background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: '1px solid transparent', color: 'white' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.875rem', padding: '4rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '20px', textAlign: 'center' },
  emptyIcon: { width: 80, height: 80, borderRadius: '20px', background: 'rgba(0,102,204,0.08)', border: '1px solid rgba(0,102,204,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tableWrap: { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: 'rgba(0,102,204,0.06)' },
  th: { padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border-primary)' },
  tr: { borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' },
  td: { padding: '1rem 1.25rem', verticalAlign: 'middle' },
  avatar: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.72rem', flexShrink: 0 },
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700 },
  detailBtn: { padding: '0.4rem 0.75rem', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
  deleteBtn: { padding: '0.4rem 0.6rem', borderRadius: '7px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
  modal: { width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '22px', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid var(--border-primary)' },
  closeBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' },
  modalBody: { padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  modalFooter: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-primary)' },
  modalCancelBtn: { padding: '0.7rem 1.25rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  deleteFullBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' },
  detailSection: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  detailLabel: { margin: 0, fontSize: '0.68rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' },
  detailVal: { margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' },
};

export default AppointmentsManagement;