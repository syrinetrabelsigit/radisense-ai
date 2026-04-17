import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API_URL = 'http://localhost:8000';

const PatientResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => { fetchResults(); }, [id]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_URL}/api/predict/${id}`, { headers: getHeaders() });
      if (!r.ok) throw new Error('Analysis not found');
      const analysis = await r.json();

      // Fetch radiologue info
      let radiologistName = 'Your Radiologist';
      if (analysis.user_id) {
        try {
          const ur = await fetch(`${API_URL}/api/users/${analysis.user_id}/public`, { headers: getHeaders() });
          if (ur.ok) {
            const u = await ur.json();
            radiologistName = `Dr. ${u.first_name} ${u.last_name}`;
          }
        } catch {}
      }

      setData({
        id:              analysis.id,
        date:            analysis.created_at,
        status:          analysis.status,
        notes:           analysis.notes || '',
        image:           analysis.image_path
          ? `${API_URL}/${analysis.image_path.replace(/\\/g, '/')}`
          : null,
        radiologist:     radiologistName,
        hasFindings:     analysis.notes && analysis.notes.trim().length > 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── LOADING ──
  if (loading) return (
    <div style={S.page}>
      <div className="container">
        <div style={S.centerWrap}>
          <div style={S.spinner} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#64748B', fontWeight: 600 }}>Loading your results…</p>
        </div>
      </div>
    </div>
  );

  // ── ERROR ──
  if (error) return (
    <div style={S.page}>
      <div className="container">
        <div style={S.centerWrap}>
          <div style={S.errorIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>Error Loading Results</h3>
          <p style={{ color: '#64748B', margin: 0 }}>{error}</p>
          <button style={S.btnPrimary} onClick={fetchResults}>Try Again</button>
        </div>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div style={S.page}>
      <div className="container">

        {/* HEADER */}
        <div style={S.header}>
          <div>
            <div style={S.badge}>
              <div style={S.badgeDot} />
              <span>Patient Portal</span>
            </div>
            <h1 style={S.title}>
              <span style={S.titleGrad}>My X-Ray Report</span>
            </h1>
            <p style={S.subtitle}>
              Analysis #{data.id} · {new Date(data.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button style={S.backBtn} onClick={() => navigate('/patient/analyses')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Analyses
          </button>
        </div>

        {/* STATUS CARD */}
        <div style={{ ...S.statusCard, ...(data.status === 'pending' ? S.statusPending : S.statusCompleted) }}>
          <div style={S.statusIcon}>
            {data.status === 'pending' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            )}
          </div>
          <div>
            <div style={S.statusTitle}>
              {data.status === 'pending' ? 'Analysis Pending' : 'Analysis Complete'}
            </div>
            <div style={S.statusSub}>
              {data.status === 'pending'
                ? 'Your radiologist is reviewing your X-ray. You will be notified once complete.'
                : `Reviewed by ${data.radiologist} on ${new Date(data.date).toLocaleDateString()}`
              }
            </div>
          </div>
        </div>

        <div style={S.grid}>

          {/* LEFT — X-Ray Image */}
          <div style={S.imageCard}>
            <div style={S.cardLabel}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Your Chest X-Ray
            </div>
            {data.image ? (
              <div style={S.imgWrap}>
                <img src={data.image} alt="X-Ray" style={S.img} />
                <div style={S.imgOverlay}>
                  <span style={S.imgBadge}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    AI Analyzed
                  </span>
                </div>
              </div>
            ) : (
              <div style={S.imgPlaceholder}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p style={{ color: '#64748B', fontSize: '0.82rem', margin: 0 }}>Image not available</p>
              </div>
            )}
            <div style={S.imgMeta}>
              <span style={{ color: '#64748B', fontSize: '0.78rem' }}>
                {new Date(data.date).toLocaleDateString()} at {new Date(data.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* RIGHT — Doctor's Report */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Radiologist info */}
            <div style={S.card}>
              <div style={S.cardLabel}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00BFA6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Reviewing Radiologist
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div style={S.radAvatar}>
                  {data.radiologist.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{data.radiologist}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Radiologist · RadiSense AI</div>
                </div>
              </div>
            </div>

            {/* Doctor's Notes */}
            <div style={S.card}>
              <div style={S.cardLabel}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                Doctor's Report & Recommendations
              </div>

              {data.status === 'pending' ? (
                <div style={S.pendingNotes}>
                  <div style={S.pendingIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>
                    Report not yet available
                  </p>
                  <p style={{ color: '#64748B', margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                    Your radiologist is currently reviewing your X-ray.<br />
                    You will receive the report once the analysis is complete.
                  </p>
                </div>
              ) : data.hasFindings && data.notes ? (
                <div style={S.notesContent}>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9375rem', margin: 0, whiteSpace: 'pre-line' }}>
                    {data.notes}
                  </p>
                </div>
              ) : (
                <div style={S.pendingNotes}>
                  <div style={S.pendingIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>No specific findings noted</p>
                  <p style={{ color: '#64748B', margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                    Your radiologist has completed the analysis. No written notes were added.<br />
                    Please contact your radiologist for more information if needed.
                  </p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div style={S.disclaimer}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ margin: 0, color: '#64748B', fontSize: '0.78rem', lineHeight: 1.6 }}>
                This report is generated with AI assistance and reviewed by a certified radiologist.
                Always consult your physician for medical decisions.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={{ ...S.btnPrimary, flex: 1 }} onClick={() => navigate('/patient/analyses')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                All Analyses
              </button>
              <button style={{ ...S.btnOutline, flex: 1 }} onClick={() => navigate('/patient/appointments')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Book Appointment
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

const S = {
  page:      { minHeight: 'calc(100vh - 80px)', padding: '3rem 0 5rem' },
  centerWrap:{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.25rem' },
  spinner:   { width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(0,102,204,0.2)', borderTopColor: '#0066CC', animation: 'spin 0.9s linear infinite' },
  errorIcon: { width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  header:    { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', gap: '2rem', flexWrap: 'wrap' },
  badge:     { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)', borderRadius: '100px', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot:  { width: 7, height: 7, borderRadius: '50%', background: '#00BFA6' },
  title:     { margin: 0, fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad: { background: 'linear-gradient(135deg,#0066CC,#00BFA6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle:  { color: '#64748B', fontSize: '0.9rem', margin: 0 },
  backBtn:   { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.625rem 1.25rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', flexShrink: 0 },

  statusCard:      { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', borderRadius: '16px', marginBottom: '2rem' },
  statusCompleted: { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' },
  statusPending:   { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' },
  statusIcon:      { width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statusTitle:     { fontWeight: 800, fontSize: '1rem', marginBottom: '0.2rem' },
  statusSub:       { fontSize: '0.82rem', opacity: 0.8 },

  grid:      { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', alignItems: 'start' },

  imageCard: { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  cardLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.07em' },
  imgWrap:   { position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-secondary)', aspectRatio: '1' },
  img:       { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  imgOverlay:{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)', display: 'flex', alignItems: 'flex-end', padding: '1rem' },
  imgBadge:  { display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.75rem', background: 'rgba(16,185,129,0.9)', borderRadius: '100px', color: 'white', fontSize: '0.72rem', fontWeight: 700 },
  imgPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: '12px', aspectRatio: '1' },
  imgMeta:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },

  card:       { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  radAvatar:  { width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', color: 'white', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  pendingNotes: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem 1rem', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center' },
  pendingIcon:  { width: 56, height: 56, borderRadius: '16px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  notesContent: { padding: '1.25rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderLeft: '3px solid #8B5CF6', borderRadius: '12px' },

  disclaimer: { display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.875rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '10px' },

  btnPrimary: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' },
  btnOutline: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' },
};

export default PatientResults;