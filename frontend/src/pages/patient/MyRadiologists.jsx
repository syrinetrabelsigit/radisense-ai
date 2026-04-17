import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Avatar from '../shared/Avatar'; //s
import '../../styles/pages/patient/MyRadiologists.css';
import Toast, { useToast } from '../../components/Toast';

const MyRadiologists = () => {
  const navigate = useNavigate();
  const { toasts, toast, removeToast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSecondOpinionModal, setShowSecondOpinionModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [radiologists, setRadiologists] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchRadiologists();
  }, []);

  const fetchRadiologists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/patients/my-records', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 404) { setRadiologists([]); setLoading(false); return; }
      if (!response.ok) throw new Error('Failed to fetch radiologists');

      const data = await response.json();
      const COLORS = ['#0066CC', '#8B5CF6', '#00BFA6', '#F59E0B', '#EF4444'];

      const transformed = (data.radiologists || []).map((r, i) => ({
        id:            r.id,
        user_id:       r.user_id,
        name:          r.name,
        first_name:    r.first_name || r.name.split(' ')[0],
        last_name:     r.last_name  || r.name.split(' ').slice(1).join(' '),
        avatar_url:    r.avatar_url || null,
        specialty:     r.specialty  || 'Radiologist',
        experience:    r.years_experience || '10+ yrs',
        rating:        4.8 + (i * 0.1),
        reviews:       200 + (i * 50),
        analysesCount: Math.floor(Math.random() * 10),
        availability:  'Available',
        languages:     ['English', 'French'],
        education:     'Medical School',
        certifications:['Board Certified Radiologist'],
        about:         r.bio || 'Specializing in diagnostic imaging with expertise in AI-powered diagnostics.',
        email:         r.email,
        phone:         r.cabinet_phone || r.phone || '+1 (555) 123-4567',
        cabinet:       r.cabinet_name  || '',
        address:       r.cabinet_address || '',
        city:          r.city    || '',
        country:       r.country || '',
        nextAvailable: 'Available for appointments',
        focus:         r.specialty || 'Diagnostic Imaging',
        color:         COLORS[i % COLORS.length],
        is_primary:    r.is_primary,
      }));

      setRadiologists(transformed);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) { 
      toast.warning('Please write a message');
      return; 
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/messages/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipient_id: selectedDoctor.user_id, 
          recipient_type: 'radiologist', 
          subject: 'Message from patient', 
          message: messageText 
        })
      });
      if (!response.ok) throw new Error('Failed to send message');
      toast.success(`Message sent to ${selectedDoctor.name}!`);
      setShowMessageModal(false);
      setMessageText('');
    } catch (err) { 
      toast.error('Failed to send message', 'Please try again.');
    }
  };

  const handleRequestSecondOpinion = async () => {
    try {
      const token = localStorage.getItem('token');
      const r = await fetch('http://localhost:8000/api/patients/second-opinion-request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Failed to submit request');
      toast.success(
        'Second Opinion Requested!',
        'Our team will review your case and contact you within 48 hours.'
      );
      setShowSecondOpinionModal(false);
    } catch (err) {
      toast.error('Failed to submit request', 'Please try again later.');
      setShowSecondOpinionModal(false);
    }
  };

  const stars = (r) => Array.from({ length: 5 }, (_, i) => (
    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.floor(r) ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ));

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="myr-page"><div className="container">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem' }}>
        <div style={{ width:60, height:60, border:'4px solid rgba(0,102,204,0.2)', borderTop:'4px solid #0066CC', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:'#94A3B8' }}>Loading your radiologists...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div></div>
  );

  if (error) return (
    <div className="myr-page"><div className="container">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem', textAlign:'center' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3 style={{ color:'white' }}>Error Loading Radiologists</h3>
        <p style={{ color:'#94A3B8' }}>{error}</p>
        <button onClick={fetchRadiologists} style={{ padding:'0.75rem 2rem', background:'#0066CC', color:'white', border:'none', borderRadius:'8px', cursor:'pointer' }}>Try Again</button>
      </div>
    </div></div>
  );

  const primary = radiologists.find(r => r.is_primary) || radiologists[0];
  const specialists = radiologists.filter(r => !r.is_primary);

  if (!primary) return (
    <div className="myr-page"><div className="container">
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem', textAlign:'center' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        <h3 style={{ color:'white' }}>No Radiologists Assigned</h3>
        <p style={{ color:'#94A3B8' }}>You don't have any radiologists assigned yet. Please contact administration.</p>
      </div>
    </div></div>
  );

  // ── Modal Avatar helper ────────────────────────────────────────────────────
  const ModalAvatar = ({ doc, size = 56 }) => (
    <Avatar
      avatarUrl={doc.avatar_url}
      firstName={doc.first_name}
      lastName={doc.last_name}
      size={size}
      color={doc.color}
    />
  );

  return (
    <div className="myr-page">
      <div className="container">

        {/* HEADER */}
        <div className="myr-header" data-aos="fade-down">
          <div className="myr-header-left">
            <div className="myr-badge"><div className="myr-badge-dot" /><span>Patient Portal</span></div>
            <h1 className="myr-title"><span className="myr-title-grad">{t('patient.radiologists.title') || 'My Radiologists'}</span></h1>
            <p className="myr-subtitle">{t('patient.radiologists.subtitle') || 'Your dedicated medical team'}</p>
          </div>
          <button className="myr-book-btn" onClick={() => navigate('/patient/appointments')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Book Appointment
          </button>
        </div>

        {/* PRIMARY RADIOLOGIST HERO */}
        <div className="myr-hero" data-aos="fade-up">
          <div className="myr-hero-crown">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {t('patient.radiologists.primary') || 'Primary Radiologist'}
          </div>

          <div className="myr-hero-body">
            {/* Left */}
            <div className="myr-hero-left">
              <div className="myr-hero-img-wrap">
                {/* ── Avatar principal ── */}
                <Avatar
                  avatarUrl={primary.avatar_url}
                  firstName={primary.first_name}
                  lastName={primary.last_name}
                  size={180}
                  color={primary.color}
                  style={{
                    border: '5px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 20px 56px rgba(0,0,0,0.35)',
                    animation: 'myrFloat 6s ease-in-out infinite',
                  }}
                />
                <div className="myr-hero-online">
                  <div className="myr-online-dot" />{primary.availability}
                </div>
              </div>

              <div className="myr-hero-stats">
                {[
                  { val: primary.analysesCount, label: 'Analyses' },
                  { val: primary.experience,    label: 'Experience' },
                  { val: `${primary.rating}★`,  label: `${primary.reviews} reviews` },
                ].map((s, i) => (
                  <div key={i} className="myr-hero-stat">
                    <span className="myr-hstat-val">{s.val}</span>
                    <span className="myr-hstat-label">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="myr-hero-certs">
                {primary.certifications.map((c, i) => (
                  <div key={i} className="myr-cert">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="myr-hero-right">
              <div>
                <h2 className="myr-hero-name">{primary.name}</h2>
                <p className="myr-hero-spec">{primary.specialty}</p>
              </div>

              <div className="myr-hero-info-grid">
                {[
                  { label:'Education', val:primary.education,            icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>, color:'#8B5CF6' },
                  { label:'Languages', val:primary.languages.join(', '),  icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, color:'#10B981' },
                  { label:'Email',     val:primary.email,                 icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, color:'#0066CC' },
                  { label:'Phone',     val:primary.phone,                 icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>, color:'#00BFA6' },
                  ...(primary.cabinet ? [{ label:'Cabinet', val:primary.cabinet, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, color:'#F59E0B' }] : []),
                ].map((item, i) => (
                  <div key={i} className="myr-info-item">
                    <div className="myr-info-icon" style={{ '--ic': item.color }}>{item.icon}</div>
                    <div><span className="myr-info-label">{item.label}</span><span className="myr-info-val">{item.val}</span></div>
                  </div>
                ))}
              </div>

              <div className="myr-hero-about"><h4>About</h4><p>{primary.about}</p></div>

              <div className="myr-next-avail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Next Available: <strong>{primary.nextAvailable}</strong>
              </div>

              <div className="myr-hero-actions">
                <button className="myr-action-primary" onClick={() => navigate('/patient/appointments')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Book Appointment
                </button>
                <button className="myr-action-outline" onClick={() => { setSelectedDoctor(primary); setShowMessageModal(true); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  {t('patient.radiologists.message') || 'Message'}
                </button>
                <button className="myr-action-outline" onClick={() => { setSelectedDoctor(primary); setShowProfileModal(true); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {t('patient.radiologists.viewProfile') || 'View Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SPECIALISTS GRID */}
        {specialists.length > 0 && (
          <div className="myr-specialists-section">
            <div className="myr-section-header" data-aos="fade-right">
              <h2 className="myr-section-title">{t('patient.radiologists.specialists') || 'Your Care Team'}</h2>
              <p className="myr-section-sub">Specialists assigned to your treatment</p>
            </div>
            <div className="myr-specialists-grid">
              {specialists.map((doc, i) => (
                <div key={doc.id} className="myr-spec-card" data-aos="fade-up" data-aos-delay={i * 100}>
                  <div className="myr-spec-bar" style={{ background: doc.color }} />

                  <div className="myr-spec-img-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240, background:'var(--bg-secondary)' }}>
                    {/* ── Avatar specialist ── */}
                    <Avatar
                      avatarUrl={doc.avatar_url}
                      firstName={doc.first_name}
                      lastName={doc.last_name}
                      size={120}
                      color={doc.color}
                      style={{ boxShadow:`0 8px 32px color-mix(in srgb, ${doc.color} 30%, transparent)` }}
                    />
                    <div className={`myr-spec-avail ${doc.availability === 'Available' ? 'green' : 'orange'}`} style={{ position:'absolute', bottom:'1rem', left:'50%', transform:'translateX(-50%)' }}>
                      <div className="myr-avail-dot" />{doc.availability}
                    </div>
                  </div>

                  <div className="myr-spec-body">
                    <h3 className="myr-spec-name">{doc.name}</h3>
                    <span className="myr-spec-specialty" style={{ color: doc.color }}>{doc.specialty}</span>
                    <div className="myr-spec-rating">
                      <div className="myr-stars">{stars(doc.rating)}</div>
                      <span className="myr-rating-text">{doc.rating} ({doc.reviews})</span>
                    </div>
                    <div className="myr-spec-stats">
                      <div className="myr-spec-stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                        {doc.experience}
                      </div>
                      <div className="myr-spec-stat">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        {doc.analysesCount} analyses
                      </div>
                    </div>
                    <div className="myr-spec-focus" style={{ borderColor: doc.color, background:`color-mix(in srgb, ${doc.color} 8%, transparent)` }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={doc.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                      <span style={{ color: doc.color }}>{doc.focus}</span>
                    </div>
                    <div className="myr-spec-langs">
                      {doc.languages.map((l, li) => <span key={li} className="myr-lang-tag">{l}</span>)}
                    </div>
                    <div className="myr-spec-actions">
                      <button className="myr-spec-book" style={{ background: doc.color }} onClick={() => navigate('/patient/appointments')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Book
                      </button>
                      <button className="myr-spec-msg" onClick={() => { setSelectedDoctor(doc); setShowMessageModal(true); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECOND OPINION CTA */}
        <div className="myr-cta" data-aos="zoom-in">
          <div className="myr-cta-bg" />
          <div className="myr-cta-content">
            <div className="myr-cta-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <div>
              <h3>{t('patient.radiologists.requestSecondOpinion') || 'Request a Second Opinion'}</h3>
              <p>Get expert review from our panel of radiologists for important medical decisions</p>
            </div>
            <button className="myr-cta-btn" onClick={() => setShowSecondOpinionModal(true)}>
              Request Second Opinion
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* ── MESSAGE MODAL ── */}
        {showMessageModal && selectedDoctor && (
          <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
            <div className="myr-modal" onClick={e => e.stopPropagation()}>
              <div className="myr-modal-header">
                <div className="myr-modal-doctor">
                  <ModalAvatar doc={selectedDoctor} size={56} />
                  <div>
                    <h3 className="myr-modal-name">{selectedDoctor.name}</h3>
                    <p className="myr-modal-spec">{selectedDoctor.specialty}</p>
                  </div>
                </div>
                <button className="myr-modal-close" onClick={() => setShowMessageModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="myr-modal-body">
                <div className="myr-modal-field">
                  <label className="myr-modal-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Your Message
                  </label>
                  <textarea className="myr-modal-textarea" rows="5" placeholder="Type your message here..." value={messageText} onChange={e => setMessageText(e.target.value)} />
                </div>
                <div className="myr-modal-tips">
                  <div className="myr-tips-header">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Tips for your message
                  </div>
                  {['Be specific about your concerns or questions', 'Mention relevant symptoms or medical history', 'Include dates of previous consultations if applicable'].map((tip, i) => (
                    <div key={i} className="myr-tip">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
              <div className="myr-modal-footer">
                <button className="myr-modal-cancel" onClick={() => setShowMessageModal(false)}>Cancel</button>
                <button className="myr-modal-send" onClick={handleSendMessage}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE MODAL ── */}
        {showProfileModal && selectedDoctor && (
          <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="myr-modal" onClick={e => e.stopPropagation()}>
              <div className="myr-modal-header">
                <div className="myr-modal-doctor">
                  <ModalAvatar doc={selectedDoctor} size={56} />
                  <div>
                    <h3 className="myr-modal-name">{selectedDoctor.name}</h3>
                    <p className="myr-modal-spec">{selectedDoctor.specialty}</p>
                  </div>
                </div>
                <button className="myr-modal-close" onClick={() => setShowProfileModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="myr-modal-body" style={{ maxHeight:'60vh', overflowY:'auto' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                  {[
                    { title:'ABOUT', val: selectedDoctor.about },
                    { title:'EDUCATION', val: selectedDoctor.education },
                    { title:'LANGUAGES', val: selectedDoctor.languages.join(', ') },
                    { title:'EXPERIENCE', val: selectedDoctor.experience },
                    ...(selectedDoctor.cabinet ? [{ title:'CABINET / CLINIC', val: selectedDoctor.cabinet + (selectedDoctor.address ? ' — ' + selectedDoctor.address : '') }] : []),
                  ].map((item, i) => (
                    <div key={i}>
                      <h4 style={{ fontSize:'0.875rem', fontWeight:800, color:'var(--text-primary)', marginBottom:'0.5rem' }}>{item.title}</h4>
                      <p style={{ fontSize:'0.9375rem', color:'var(--text-secondary)', lineHeight:'1.7', margin:0 }}>{item.val}</p>
                    </div>
                  ))}
                  <div>
                    <h4 style={{ fontSize:'0.875rem', fontWeight:800, color:'var(--text-primary)', marginBottom:'0.5rem' }}>CERTIFICATIONS</h4>
                    {selectedDoctor.certifications.map((cert, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem', background:'var(--bg-secondary)', borderRadius:'8px', marginBottom:'0.375rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)' }}>{cert}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 style={{ fontSize:'0.875rem', fontWeight:800, color:'var(--text-primary)', marginBottom:'0.5rem' }}>CONTACT</h4>
                    <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', margin:'0 0 0.375rem' }}>{selectedDoctor.email}</p>
                    <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', margin:0 }}>{selectedDoctor.phone}</p>
                  </div>
                </div>
              </div>
              <div className="myr-modal-footer">
                <button className="myr-modal-cancel" onClick={() => setShowProfileModal(false)}>Close</button>
                <button className="myr-modal-send" onClick={() => { setShowProfileModal(false); navigate('/patient/appointments'); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SECOND OPINION MODAL ── */}
        {showSecondOpinionModal && (
          <div className="modal-overlay" onClick={() => setShowSecondOpinionModal(false)}>
            <div className="myr-modal" onClick={e => e.stopPropagation()}>
              <div className="myr-modal-header">
                <div><h3 className="myr-modal-name">Request Second Opinion</h3><p className="myr-modal-spec">Expert panel review for your case</p></div>
                <button className="myr-modal-close" onClick={() => setShowSecondOpinionModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="myr-modal-body">
                <div className="myr-modal-tips" style={{ marginBottom:'1.5rem' }}>
                  <div className="myr-tips-header">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    What happens next?
                  </div>
                  {['Our panel of expert radiologists will review your case','You will receive a comprehensive second opinion within 48 hours','All your medical records and analyses will be examined','A detailed report will be sent to your email'].map((tip, i) => (
                    <div key={i} className="myr-tip">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {tip}
                    </div>
                  ))}
                </div>
                <div style={{ padding:'1rem', background:'rgba(0,102,204,0.06)', borderRadius:'12px', border:'1px solid rgba(0,102,204,0.15)' }}>
                  <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:'1.6', margin:0 }}>
                    By clicking "Request Second Opinion", you authorize our panel of expert radiologists to review your complete medical history, analyses, and records.
                  </p>
                </div>
              </div>
              <div className="myr-modal-footer">
                <button className="myr-modal-cancel" onClick={() => setShowSecondOpinionModal(false)}>Cancel</button>
                <button className="myr-modal-send" onClick={handleRequestSecondOpinion}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Request Second Opinion
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default MyRadiologists;