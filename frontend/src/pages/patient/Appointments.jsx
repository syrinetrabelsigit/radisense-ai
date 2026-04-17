import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/patient/Appointments.css';

const API = 'http://localhost:8000';

const Appointments = () => {
  const { t } = useTranslation();
  const [loading, setLoading]                         = useState(true);
  const [error, setError]                             = useState(null);
  const [showModal, setShowModal]                     = useState(false);
  const [showDetailsModal, setShowDetailsModal]       = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeTab, setActiveTab]                     = useState('upcoming');
  const [appointments, setAppointments]               = useState({ upcoming: [], past: [] });
  const [radiologists, setRadiologists]               = useState([]);
  const [availableSlots, setAvailableSlots]           = useState([]);
  const [bookedSlots, setBookedSlots]                 = useState([]);
  const [slotsLoading, setSlotsLoading]               = useState(false);
  const [formError, setFormError]                     = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget]       = useState(null);
  const [cancelReason, setCancelReason]       = useState('');
  const [cancelError, setCancelError]         = useState('');
  const [cancelLoading, setCancelLoading]     = useState(false);
  const [formData, setFormData] = useState({
    radiologist_id: '', appointment_date: '', appointment_time: '',
    appointment_type: 'Consultation', notes: '',
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  const getInitials = (name) => name.split(' ').slice(1).map(n => n[0]).join('');

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchAppointments();
    fetchRadiologists();
  }, []);

  const fetchAppointments = async () => {
    try {
      const r = await fetch(`${API}/api/appointments/my-appointments`, { headers: getHeaders() });
      if (r.status === 404) {
        setAppointments({ upcoming: [], past: [] });
        setLoading(false);
        return;
      }
      if (!r.ok) throw new Error('Failed to fetch appointments');
      setAppointments(await r.json());
      setLoading(false);
    } catch (err) { setError(err.message); setLoading(false); }
  };

  const fetchRadiologists = async () => {
    try {
      const r = await fetch(`${API}/api/patients/my-records`, { headers: getHeaders() });
      if (r.status === 404) { setRadiologists([]); return; }
      if (!r.ok) return;
      const data = await r.json();
      setRadiologists((data.radiologists || []).map(rad => ({
        id: rad.id,
        name: rad.name,
        specialty: rad.specialty || 'Radiologist',
      })));
    } catch {}
  };

  // ── Fetch booked slots from backend ──────────────────────────────────────────
  const fetchBookedSlots = async (radiologistId, date) => {
    if (!radiologistId || !date) return;
    setSlotsLoading(true);
    try {
      const r = await fetch(
        `${API}/api/appointments/radiologist/${radiologistId}/booked-slots?appointment_date=${date}`,
        { headers: getHeaders() }
      );
      if (r.ok) {
        const data = await r.json();
        setBookedSlots(data.booked_slots || []);
      }
    } catch {}
    setSlotsLoading(false);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++)
      for (let minute = 0; minute < 60; minute += 30)
        slots.push(`${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`);
    return slots;
  };

  const handleRadiologistChange = async (radiologistId) => {
    setFormData(f => ({ ...f, radiologist_id: parseInt(radiologistId), appointment_time: '' }));
    if (radiologistId && formData.appointment_date) {
      await fetchBookedSlots(radiologistId, formData.appointment_date);
      setAvailableSlots(generateTimeSlots());
    }
  };

  const handleDateChange = async (date) => {
    setFormData(f => ({ ...f, appointment_date: date, appointment_time: '' }));
    if (formData.radiologist_id && date) {
      await fetchBookedSlots(formData.radiologist_id, date);
      setAvailableSlots(generateTimeSlots());
    }
  };

  const isSlotBooked = (slot) => bookedSlots.includes(slot);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setFormError('');

    if (isSlotBooked(formData.appointment_time)) {
      setFormError('This time slot is already taken. Please choose a different slot.');
      return;
    }

    try {
      const r = await fetch(`${API}/api/appointments/`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify(formData),
      });
      if (!r.ok) {
        const err = await r.json();
        const msg = typeof err.detail === 'object' ? err.detail.message : err.detail;
        throw new Error(msg || 'Failed to create appointment');
      }
      await fetchAppointments();
      setFormData({ radiologist_id: '', appointment_date: '', appointment_time: '', appointment_type: 'Consultation', notes: '' });
      setAvailableSlots([]);
      setBookedSlots([]);
      setShowModal(false);
    } catch (err) { setFormError(err.message); }
  };

  const handleCancelAppointment = (appt) => {
    if (appt.status === 'confirmed') {
      setCancelTarget(appt);
      setCancelReason('');
      setCancelError('');
      setShowCancelModal(true);
    } else {
      if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
      doPatientCancel(appt.id, '');
    }
  };

  const doPatientCancel = async (appointmentId, reason) => {
    setCancelLoading(true);
    try {
      const r = await fetch(`${API}/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(typeof err.detail === 'object' ? err.detail.message : err.detail || 'Failed to cancel');
      }
      await fetchAppointments();
      setShowCancelModal(false);
      setCancelTarget(null);
    } catch (err) { setCancelError(err.message); }
    finally { setCancelLoading(false); }
  };
  const handleDeleteAppointment = async (appointmentId) => {
      if (!window.confirm('Remove this appointment from your list?')) return;
      try {
        const r = await fetch(`${API}/api/appointments/${appointmentId}`, {
          method: 'DELETE', headers: getHeaders(),
        });
        if (!r.ok) throw new Error('Failed to delete');
        await fetchAppointments();
      } catch (err) { alert(err.message); }
    };
  const confirmPatientCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError(t('patient.appointments.cancelReasonLabel'));
      return;
    }
    await doPatientCancel(cancelTarget.id, cancelReason.trim());
  };

  if (loading) return (
    <div className="appt-page"><div className="container"><div className="appt-loader-wrap">
      <div className="appt-loader-ring" /><p>Loading your appointments...</p>
    </div></div></div>
  );

  if (error) return (
    <div className="appt-page"><div className="container"><div className="appt-error-card">
      <h3>Error</h3><p>{error}</p>
      <button onClick={fetchAppointments} className="appt-retry-btn">Try Again</button>
    </div></div></div>
  );

  const getDaysUntil = (date) => {
    const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { label: 'Today', urgent: true };
    if (diff === 1) return { label: 'Tomorrow', urgent: true };
    if (diff < 7)  return { label: `In ${diff} days`, urgent: false };
    return { label: `In ${Math.ceil(diff / 7)} weeks`, urgent: false };
  };

  const statusConfig = {
    confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: t('patient.appointments.confirmed') || 'Confirmed' },
    pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  label: t('patient.appointments.pending')   || 'Pending' },
    completed: { color: '#0066CC', bg: 'rgba(0,102,204,0.12)',   border: 'rgba(0,102,204,0.3)',   label: 'Completed' },
    cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   label: 'Cancelled' },
  };

  const typeIcons = {
    'Follow-up Consultation': <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    'Annual Checkup':         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    'X-Ray Screening':        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>,
    'Consultation':           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    'Follow-up':              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>,
  };

  return (
    <div className="appt-page">
      <div className="container">

        {/* HEADER */}
        <div className="appt-header" data-aos="fade-down">
          <div className="appt-header-left">
            <div className="appt-badge"><div className="appt-badge-dot" /><span>Patient Portal</span></div>
            <h1 className="appt-title"><span className="appt-title-grad">{t('patient.appointments.title')}</span></h1>
            <p className="appt-subtitle">{t('patient.appointments.subtitle')}</p>
          </div>
          <button className="appt-book-btn" onClick={() => { setFormError(''); setShowModal(true); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
            {t('patient.appointments.book')}
          </button>
        </div>

        {/* TABS */}
        <div className="appt-tabs" data-aos="fade-up">
          {[
            { key: 'upcoming', label: t('patient.appointments.upcoming'), count: appointments.upcoming.length, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
            { key: 'past',     label: t('patient.appointments.past'),     count: appointments.past.length,     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> },
          ].map(tab => (
            <button key={tab.key} className={`appt-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              <div className="appt-tab-icon">{tab.icon}</div>
              <div className="appt-tab-body">
                <span className="appt-tab-label">{tab.label}</span>
                <span className="appt-tab-count">{tab.count}</span>
              </div>
              {activeTab === tab.key && <div className="appt-tab-indicator" />}
            </button>
          ))}
        </div>

        {/* UPCOMING */}
        {activeTab === 'upcoming' && (
          <div className="appt-grid">
            {appointments.upcoming.length === 0 ? (
              <div className="appt-empty" data-aos="fade-up">
                <div className="appt-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                <h3>{t('patient.appointments.noUpcoming')}</h3>
                <p>Book your first appointment with one of our specialists</p>
                <button className="appt-book-btn" onClick={() => setShowModal(true)}>{t('patient.appointments.book')}</button>
              </div>
            ) : appointments.upcoming.map((appt, i) => {
              const days = getDaysUntil(appt.date);
              const sc   = statusConfig[appt.status] || statusConfig.pending;
              return (
                <div key={appt.id} className="appt-card" data-aos="fade-up" data-aos-delay={i * 100}>
                  <div className="appt-card-bar" />
                  <div className="appt-card-head">
                    <div className="appt-date-block">
                      <span className="appt-date-day">{new Date(appt.date).getDate()}</span>
                      <span className="appt-date-month">{new Date(appt.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                    </div>
                    <div className="appt-head-right">
                      <div className="appt-time">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {appt.time}
                      </div>
                      <div className="appt-status-pill" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                        <div className="appt-status-dot" style={{ background: sc.color }} />
                        {sc.label}
                      </div>
                    </div>
                  </div>

                  <div className={`appt-countdown ${days.urgent ? 'urgent' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>{days.label}</span>
                  </div>

                  <div className="appt-doctor">
                    <div className="appt-doctor-img-wrap" style={{ width:'64px', height:'64px', flexShrink:0 }}>
                      {appt.doctor.avatar_url
                        ? <img src={appt.doctor.avatar_url} alt={appt.doctor.name} style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} />
                        : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'linear-gradient(135deg,#0066CC,#00BFA6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', fontWeight:'800', color:'white' }}>
                            {getInitials(appt.doctor.name)}
                          </div>
                      }
                      <div className="appt-doctor-online" />
                    </div>
                    <div className="appt-doctor-info">
                      <h4 className="appt-doctor-name">{appt.doctor.name}</h4>
                      <span className="appt-doctor-specialty">{appt.doctor.specialty}</span>
                    </div>
                  </div>

                  <div className="appt-details">
                    <div className="appt-detail-row">
                      <div className="appt-detail-icon" style={{ color: '#0066CC' }}>{typeIcons[appt.type] || typeIcons['Consultation']}</div>
                      <div>
                        <span className="appt-detail-label">{t('patient.appointments.type')}</span>
                        <span className="appt-detail-val">{appt.type}</span>
                      </div>
                    </div>
                    {appt.notes && (
                      <div className="appt-notes">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span>{appt.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="appt-card-actions">
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <>
                        <button className="appt-action-btn reschedule" onClick={() => { setFormError(''); setShowModal(true); }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                          {t('patient.appointments.reschedule')}
                        </button>
                        <button className="appt-action-btn cancel" onClick={() => handleCancelAppointment(appt)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          {t('patient.appointments.cancel')}
                        </button>
                      </>
                    )}
                    {appt.status === 'cancelled' && (
                      <div style={{ width:'100%' }}>
                        <div style={{ padding:'0.75rem 1rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', marginBottom:'0.5rem' }}>
                          <p style={{ margin:'0 0 0.25rem', color:'#EF4444', fontSize:'0.8rem', fontWeight:700 }}>{t('admin.appointments.status.cancelled')}</p>
                          {appt.cancellation_reason && (
                            <p style={{ margin:0, color:'#94A3B8', fontSize:'0.78rem', lineHeight:1.5 }}>
                              {t('admin.appointments.modal.cancellationReason')}: {appt.cancellation_reason}
                            </p>
                          )}
                        </div>
                        <button
                          className="appt-action-btn cancel"
                          style={{ width:'100%', justifyContent:'center' }}
                          onClick={() => handleDeleteAppointment(appt.id)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          {t('admin.appointments.modal.delete')}
                        </button>
                      </div>
                    )}
                    {appt.status === 'completed' && (
                      <button className="appt-action-btn" style={{ width:'100%', background:'rgba(0,102,204,0.1)', color:'#0066CC', border:'1px solid rgba(0,102,204,0.2)' }}
                        onClick={() => { setSelectedAppointment(appt); setShowDetailsModal(true); }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAST */}
        {activeTab === 'past' && (
          <div className="appt-past-list">
            {appointments.past.length === 0 ? (
              <div className="appt-empty" data-aos="fade-up">
                <div className="appt-empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg></div>
                <h3>No past appointments</h3>
              </div>
            ) : appointments.past.map((appt, i) => {
              const sc = statusConfig[appt.status] || statusConfig.completed;
              return (
                <div key={appt.id} className="appt-past-card" data-aos="fade-up" data-aos-delay={i * 80}>
                  <div className="appt-past-date">
                    <span className="appt-past-day">{new Date(appt.date).getDate()}</span>
                    <span className="appt-past-month">{new Date(appt.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                    <span className="appt-past-year">{new Date(appt.date).getFullYear()}</span>
                  </div>
                  <div className="appt-past-divider" />
                  <div className="appt-past-doctor">
                    <div style={{ width:'56px', height:'56px', borderRadius:'50%', flexShrink:0, overflow:'hidden' }}>
                      {appt.doctor.avatar_url
                        ? <img src={appt.doctor.avatar_url} alt={appt.doctor.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'linear-gradient(135deg,#0066CC,#00BFA6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:'800', color:'white' }}>
                            {getInitials(appt.doctor.name)}
                          </div>
                      }
                    </div>
                    <div>
                      <h4 className="appt-past-name">{appt.doctor.name}</h4>
                      <span className="appt-past-spec">{appt.doctor.specialty}</span>
                    </div>
                  </div>
                  <div className="appt-past-meta">
                    <span className="appt-past-type">{appt.type}</span>
                    <span className="appt-past-sep">·</span>
                    <span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline', verticalAlign:'middle', marginRight:'3px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {appt.time}
                    </span>
                    {appt.notes && <><span className="appt-past-sep">·</span><span className="appt-past-note">{appt.notes}</span></>}
                  </div>
                  <div className="appt-past-right">
                    <div className="appt-status-pill" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <div className="appt-status-dot" style={{ background: sc.color }} />
                      {sc.label}
                    </div>
                    <button className="appt-view-btn" onClick={() => { setSelectedAppointment(appt); setShowDetailsModal(true); }}>
                      View Details
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOOKING MODAL */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="appt-modal" onClick={e => e.stopPropagation()}>
              <div className="appt-modal-header">
                <div>
                  <h2 className="appt-modal-title">{t('patient.appointments.book')}</h2>
                  <p className="appt-modal-sub">Schedule a new consultation with our specialists</p>
                </div>
                <button className="appt-modal-close" onClick={() => setShowModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <form onSubmit={handleCreateAppointment}>
                <div className="appt-modal-body">

                  {/* Form error */}
                  {formError && (
                    <div style={{ padding:'0.875rem 1rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'10px', color:'#EF4444', fontSize:'0.875rem', fontWeight:600, display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {formError}
                    </div>
                  )}

                  {/* Doctor */}
                  <div className="appt-form-field">
                    <label className="appt-form-label">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Select Doctor
                    </label>
                    <select className="appt-form-input" required value={formData.radiologist_id}
                      onChange={e => handleRadiologistChange(e.target.value)}>
                      <option value="">Choose a radiologist...</option>
                      {radiologists.map(r => (
                        <option key={r.id} value={r.id}>{r.name} — {r.specialty}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date + Time */}
                  <div className="appt-form-row">
                    <div className="appt-form-field">
                      <label className="appt-form-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {t('patient.appointments.date')}
                      </label>
                      <input type="date" className="appt-form-input" required
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.appointment_date}
                        onChange={e => handleDateChange(e.target.value)} />
                    </div>

                    <div className="appt-form-field">
                      <label className="appt-form-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {t('patient.appointments.time')}
                      </label>
                      <select className="appt-form-input" required
                        value={formData.appointment_time}
                        onChange={e => setFormData(f => ({ ...f, appointment_time: e.target.value }))}
                        disabled={!formData.radiologist_id || !formData.appointment_date || slotsLoading}>
                        <option value="">
                          {slotsLoading ? 'Loading slots...' :
                           !formData.radiologist_id || !formData.appointment_date ? 'Select doctor and date first...' : 'Choose a time slot...'}
                        </option>
                        {availableSlots.map(slot => {
                          const booked = isSlotBooked(slot);
                          return (
                            <option key={slot} value={slot} disabled={booked}
                              style={{ color: booked ? '#EF4444' : 'inherit' }}>
                              {new Date(`2000-01-01T${slot}`).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })}
                              {booked ? ' — Unavailable' : ''}
                            </option>
                          );
                        })}
                      </select>

                      {/* Slots legend */}
                      {availableSlots.length > 0 && !slotsLoading && (
                        <div style={{ marginTop:'0.5rem', display:'flex', gap:'1rem', fontSize:'0.78rem' }}>
                          <span style={{ color:'#10B981', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                            <div style={{ width:8, height:8, borderRadius:'50%', background:'#10B981' }} />
                            {availableSlots.length - bookedSlots.length} available
                          </span>
                          {bookedSlots.length > 0 && (
                            <span style={{ color:'#EF4444', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                              <div style={{ width:8, height:8, borderRadius:'50%', background:'#EF4444' }} />
                              {bookedSlots.length} taken
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type */}
                  <div className="appt-form-field">
                    <label className="appt-form-label">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      Appointment Type
                    </label>
                    <select className="appt-form-input" value={formData.appointment_type}
                      onChange={e => setFormData(f => ({ ...f, appointment_type: e.target.value }))}>
                      <option>Consultation</option>
                      <option>Follow-up</option>
                      <option>Follow-up Consultation</option>
                      <option>X-Ray Screening</option>
                      <option>Annual Checkup</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="appt-form-field">
                    <label className="appt-form-label">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Notes (Optional)
                    </label>
                    <textarea className="appt-form-input appt-form-textarea" rows="3"
                      placeholder="Any specific concerns or questions..."
                      value={formData.notes}
                      onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>

                <div className="appt-modal-footer">
                  <button type="button" className="appt-modal-cancel" onClick={() => setShowModal(false)}>
                    {t('patient.appointments.cancel')}
                  </button>
                  <button type="submit" className="appt-modal-confirm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Confirm Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DETAILS MODAL */}
        {showDetailsModal && selectedAppointment && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="appt-modal" onClick={e => e.stopPropagation()}>
              <div className="appt-modal-header">
                <div>
                  <h2 className="appt-modal-title">Appointment Details</h2>
                  <p className="appt-modal-sub">
                    {new Date(selectedAppointment.date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} at {selectedAppointment.time}
                  </p>
                </div>
                <button className="appt-modal-close" onClick={() => setShowDetailsModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="appt-modal-body" style={{ maxHeight:'60vh', overflowY:'auto' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

                  {/* Doctor */}
                  <div>
                    <h4 style={{ fontSize:'0.875rem', fontWeight:'800', color:'var(--text-primary)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>DOCTOR</h4>
                    <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem', background:'var(--bg-secondary)', borderRadius:'12px' }}>
                      <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,#0066CC,#00BFA6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', fontWeight:'800', color:'white', flexShrink:0 }}>
                        {getInitials(selectedAppointment.doctor.name)}
                      </div>
                      <div>
                        <h4 style={{ fontSize:'1.125rem', fontWeight:'700', color:'var(--text-primary)', marginBottom:'0.25rem' }}>{selectedAppointment.doctor.name}</h4>
                        <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)' }}>{selectedAppointment.doctor.specialty}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h4 style={{ fontSize:'0.875rem', fontWeight:'800', color:'var(--text-primary)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>STATUS</h4>
                    <div className="appt-status-pill" style={{ color:statusConfig[selectedAppointment.status]?.color, background:statusConfig[selectedAppointment.status]?.bg, border:`1px solid ${statusConfig[selectedAppointment.status]?.border}`, display:'inline-flex', padding:'0.625rem 1.25rem', fontSize:'0.9375rem' }}>
                      <div className="appt-status-dot" style={{ background:statusConfig[selectedAppointment.status]?.color }} />
                      {statusConfig[selectedAppointment.status]?.label}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <h4 style={{ fontSize:'0.875rem', fontWeight:'800', color:'var(--text-primary)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>TYPE</h4>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem', background:'var(--bg-secondary)', borderRadius:'12px' }}>
                      <div style={{ color:'#0066CC' }}>{typeIcons[selectedAppointment.type] || typeIcons['Consultation']}</div>
                      <span style={{ fontSize:'0.9375rem', fontWeight:'600', color:'var(--text-primary)' }}>{selectedAppointment.type}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedAppointment.notes && (
                    <div>
                      <h4 style={{ fontSize:'0.875rem', fontWeight:'800', color:'var(--text-primary)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>NOTES</h4>
                      <div style={{ padding:'1rem 1.25rem', background:'rgba(0,102,204,0.06)', border:'1px solid rgba(0,102,204,0.15)', borderRadius:'12px', fontSize:'0.9375rem', color:'var(--text-secondary)', lineHeight:'1.6' }}>
                        {selectedAppointment.notes}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="appt-modal-footer">
                <button type="button" className="appt-modal-cancel" onClick={() => setShowDetailsModal(false)}>Close</button>
                {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                  <button type="button" className="appt-modal-confirm"
                    onClick={() => { setShowDetailsModal(false); setFormError(''); setShowModal(true); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                    Reschedule
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {showCancelModal && cancelTarget && (
          <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="appt-modal" onClick={e => e.stopPropagation()}>
              <div className="appt-modal-header">
                <div>
                  <h2 className="appt-modal-title" style={{ color: '#EF4444' }}>{t('patient.appointments.cancelConfirmedTitle')}</h2>
                  <p className="appt-modal-sub">{cancelTarget.doctor?.name} — {new Date(cancelTarget.date).toLocaleDateString()} at {cancelTarget.time}</p>
                </div>
                <button className="appt-modal-close" onClick={() => setShowCancelModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="appt-modal-body">
                <div style={{ display:'flex', gap:'0.75rem', padding:'0.875rem 1rem', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', marginBottom:'1rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ margin:0, color:'#EF4444', fontSize:'0.82rem', lineHeight:1.5 }}>
                    {t('patient.appointments.cancelConfirmedWarning')}
                  </p>
                </div>
                <div className="appt-form-field">
                  <label className="appt-form-label">{t('patient.appointments.cancelReasonLabel')} <span style={{ color:'#EF4444' }}>*</span></label>
                  <textarea className="appt-form-input appt-form-textarea" rows={4}
                    placeholder={t('patient.appointments.cancelReasonPlaceholder')}
                    value={cancelReason}
                    onChange={e => { setCancelReason(e.target.value); setCancelError(''); }}
                    autoFocus />
                  {cancelError && <p style={{ margin:'0.375rem 0 0', color:'#EF4444', fontSize:'0.78rem', fontWeight:600 }}>{cancelError}</p>}
                </div>
              </div>
              <div className="appt-modal-footer">
                <button className="appt-modal-cancel" onClick={() => setShowCancelModal(false)}>{t('patient.appointments.keepAppointment')}</button>
                <button className="appt-modal-confirm" style={{ background:'linear-gradient(135deg,#EF4444,#DC2626)' }}
                  onClick={confirmPatientCancel} disabled={cancelLoading}>
                  {cancelLoading ? '…' : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> {t('patient.appointments.confirmCancellation')}</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;