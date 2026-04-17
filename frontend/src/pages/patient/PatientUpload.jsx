import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8000';

const PatientUpload = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [radiologists, setRadiologists] = useState([]);
  const [selectedRadiologist, setSelectedRadiologist] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    fetchRadiologists();
  }, []);

  const fetchRadiologists = async () => {
    try {
      const r = await fetch(`${API}/api/patients/my-records`, {
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
      });
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

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowed.includes(f.type)) {
      setError('Only PNG, JPG, JPEG files are allowed.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }
    setError('');
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please select an X-ray image.'); return; }
    if (!selectedRadiologist) { setError('Please select a radiologist.'); return; }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('radiologist_id', selectedRadiologist.id);
      if (notes.trim()) formData.append('notes', notes.trim());

      const r = await fetch(`${API}/api/predict/submit-to-radiologist`, {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || 'Failed to submit');
      }

      const data = await r.json();
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setNotes('');
    setSelectedRadiologist(null);
    setSuccess(null);
    setError('');
  };

  // ── SUCCESS STATE ──
  if (success) {
    return (
      <div style={S.page}>
        <div className="container">
          <div style={S.successWrap}>
            <div style={S.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={S.successTitle}>X-Ray Submitted Successfully!</h2>
            <p style={S.successSub}>
              Your X-ray has been sent to <strong style={{ color: '#0066CC' }}>{success.radiologist}</strong>.<br/>
              You will be notified once the analysis is complete.
            </p>
            <div style={S.successCard}>
              <div style={S.successRow}>
                <span style={S.successKey}>Analysis ID</span>
                <span style={S.successVal}>#{success.id}</span>
              </div>
              <div style={S.successRow}>
                <span style={S.successKey}>Radiologist</span>
                <span style={S.successVal}>{success.radiologist}</span>
              </div>
              <div style={S.successRow}>
                <span style={S.successKey}>Status</span>
                <span style={{ ...S.successVal, color: '#F59E0B', fontWeight: 700 }}>Pending Review</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={S.btnOutline} onClick={handleReset}>Submit Another</button>
              <button style={S.btnPrimary} onClick={() => navigate('/patient/analyses')}>View My Analyses</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <span style={S.titleGrad}>Submit X-Ray</span>
            </h1>
            <p style={S.subtitle}>Upload your chest X-ray and send it to your radiologist for analysis</p>
          </div>
        </div>

        <div style={S.grid}>

          {/* LEFT — Upload zone + Notes */}
          <div style={S.left}>

            {/* Drop zone */}
            <div style={S.card}>
              <div style={S.cardLabel}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                X-Ray Image
              </div>

              {!preview ? (
                <div
                  style={{ ...S.dropzone, ...(dragOver ? S.dropzoneActive : {}) }}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={S.dropIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p style={S.dropTitle}>Drop your X-ray here</p>
                  <p style={S.dropSub}>or <span style={{ color: '#0066CC', fontWeight: 700 }}>browse files</span></p>
                  <p style={S.dropHint}>PNG, JPG, JPEG · Max 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div style={S.previewWrap}>
                  <img src={preview} alt="X-Ray preview" style={S.previewImg} />
                  <div style={S.previewOverlay}>
                    <button style={S.previewChange} onClick={() => fileInputRef.current?.click()}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Change Image
                    </button>
                    <button style={S.previewRemove} onClick={() => { setFile(null); setPreview(null); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Remove
                    </button>
                  </div>
                  <div style={S.previewFilename}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={S.card}>
              <div style={S.cardLabel}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Clinical Notes (Optional)
              </div>
              <textarea
                style={S.textarea}
                rows={4}
                placeholder="Describe your symptoms, concerns, or any relevant medical history..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* RIGHT — Radiologist selection + Submit */}
          <div style={S.right}>

            {/* Radiologist selection */}
            <div style={S.card}>
              <div style={S.cardLabel}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00BFA6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Select Radiologist
              </div>
              <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0 0 1rem' }}>
                Choose the radiologist who will review your X-ray
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {radiologists.map(rad => (
                  <button
                    key={rad.id}
                    style={{
                      ...S.radCard,
                      ...(selectedRadiologist?.id === rad.id ? S.radCardActive : {})
                    }}
                    onClick={() => setSelectedRadiologist(rad)}
                  >
                    <div style={S.radAvatar}>
                      {rad.name.split(' ').slice(1).map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{rad.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{rad.specialty || 'Radiologist'}</div>
                    </div>
                    {selectedRadiologist?.id === rad.id && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {(file || selectedRadiologist) && (
              <div style={S.summaryCard}>
                <div style={S.cardLabel}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={S.summaryRow}>
                    <span style={S.summaryKey}>Image</span>
                    <span style={{ ...S.summaryVal, color: file ? '#10B981' : '#EF4444' }}>
                      {file ? `✓ ${file.name}` : '✗ Not selected'}
                    </span>
                  </div>
                  <div style={S.summaryRow}>
                    <span style={S.summaryKey}>Radiologist</span>
                    <span style={{ ...S.summaryVal, color: selectedRadiologist ? '#10B981' : '#EF4444' }}>
                      {selectedRadiologist ? `✓ ${selectedRadiologist.name}` : '✗ Not selected'}
                    </span>
                  </div>
                  {notes && (
                    <div style={S.summaryRow}>
                      <span style={S.summaryKey}>Notes</span>
                      <span style={{ ...S.summaryVal, color: '#64748B' }}>✓ Added</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={S.errorBox}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              style={{
                ...S.btnPrimary,
                width: '100%',
                opacity: loading || !file || !selectedRadiologist ? 0.6 : 1,
                cursor: loading || !file || !selectedRadiologist ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSubmit}
              disabled={loading || !file || !selectedRadiologist}
            >
              {loading ? (
                <>
                  <div style={S.spinner} />
                  Submitting...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Submit to Radiologist
                </>
              )}
            </button>

            <button style={{ ...S.btnOutline, width: '100%' }} onClick={() => navigate('/patient/analyses')}>
              Cancel
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

const S = {
  page:     { minHeight: 'calc(100vh - 80px)', padding: '3rem 0 5rem' },
  header:   { marginBottom: '2.5rem' },
  badge:    { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)', borderRadius: '100px', color: '#60A5FA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot: { width: 7, height: 7, borderRadius: '50%', background: '#00BFA6' },
  title:    { margin: 0, fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad:{ background: 'linear-gradient(135deg,#0066CC,#00BFA6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { color: '#64748B', fontSize: '1rem', margin: 0 },

  grid:  { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'start' },
  left:  { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  right: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },

  card:      { background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '20px', padding: '1.5rem' },
  cardLabel: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' },

  dropzone:       { border: '2px dashed var(--border-primary)', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'var(--bg-secondary)' },
  dropzoneActive: { borderColor: '#0066CC', background: 'rgba(0,102,204,0.05)' },
  dropIcon:       { width: 64, height: 64, borderRadius: '16px', background: 'rgba(0,102,204,0.1)', border: '1px solid rgba(0,102,204,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' },
  dropTitle:      { fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', margin: '0 0 0.375rem' },
  dropSub:        { color: '#64748B', fontSize: '0.875rem', margin: '0 0 0.5rem' },
  dropHint:       { color: '#475569', fontSize: '0.75rem', margin: 0 },

  previewWrap:     { position: 'relative', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-secondary)' },
  previewImg:      { width: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' },
  previewOverlay:  { position: 'absolute', top: '0.75rem', right: '0.75rem', display: 'flex', gap: '0.5rem' },
  previewChange:   { display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '100px', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
  previewRemove:   { display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', background: 'rgba(239,68,68,0.8)', backdropFilter: 'blur(8px)', border: 'none', borderRadius: '100px', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' },
  previewFilename: { display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1rem', background: 'var(--bg-secondary)', fontSize: '0.78rem', color: '#10B981', fontWeight: 600 },

  textarea: { width: '100%', padding: '0.875rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.875rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },

  radCard:       { display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' },
  radCardActive: { borderColor: '#0066CC', background: 'rgba(0,102,204,0.06)' },
  radAvatar:     { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', color: 'white', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  summaryCard: { background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', padding: '1.25rem' },
  summaryRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  summaryKey:  { fontSize: '0.78rem', color: '#64748B', fontWeight: 600 },
  summaryVal:  { fontSize: '0.82rem', fontWeight: 700 },

  errorBox: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', color: '#EF4444', fontSize: '0.875rem', fontWeight: 600 },

  btnPrimary: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '12px', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,102,204,0.3)' },
  btnOutline: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },

  spinner: { width: 18, height: 18, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' },

  successWrap:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '4rem 2rem', maxWidth: 560, margin: '0 auto', textAlign: 'center' },
  successIcon:  { width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(16,185,129,0.4)' },
  successTitle: { fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 },
  successSub:   { color: '#64748B', fontSize: '1rem', lineHeight: 1.7, margin: 0 },
  successCard:  { width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '16px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  successRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  successKey:   { fontSize: '0.82rem', color: '#64748B', fontWeight: 600 },
  successVal:   { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' },
};

export default PatientUpload;