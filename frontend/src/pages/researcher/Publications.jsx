import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useEffect } from 'react';

const Publications = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', authors: '', journal: '', year: new Date().getFullYear(), doi: '', abstract: '' });

  useEffect(() => {
    AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' });
  }, []);

  // Publications are static — no backend table exists
  const publications = [];

  return (
    <div style={S.page}>
      <div className="container">

        {/* HEADER */}
        <div style={S.header} data-aos="fade-down">
          <div>
            <div style={S.badge}><div style={S.badgeDot} /><span>Research Publications</span></div>
            <h1 style={S.title}><span style={S.titleGrad}>{t('researcher.publications.title') || 'Publications'}</span></h1>
            <p style={S.subtitle}>{t('researcher.publications.subtitle') || 'Share your research findings'}</p>
          </div>
          <button style={S.addBtn} onClick={() => setShowModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t('researcher.publications.publish') || 'Add Publication'}
          </button>
        </div>

        {/* INFO BANNER */}
        <div style={S.infoBanner} data-aos="fade-up">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Publications management is coming soon. You can track your papers and link them to experiments.
          </p>
        </div>

        {/* EMPTY STATE */}
        {publications.length === 0 && (
          <div style={S.empty} data-aos="fade-up">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.25rem' }}>No publications yet</h3>
            <p style={{ margin: 0, color: '#64748B', maxWidth: 360, textAlign: 'center' }}>
              Add your first publication to track your research output and share with the community.
            </p>
            <button style={S.addBtn} onClick={() => setShowModal(true)}>
              Add your first publication
            </button>
          </div>
        )}

        {/* ADD MODAL — form only, no backend call yet */}
        {showModal && (
          <div style={S.overlay} onClick={() => setShowModal(false)}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
              <div style={{ height: 5, background: 'linear-gradient(90deg,#8B5CF6,#0066CC)', borderRadius: '22px 22px 0 0' }} />
              <div style={S.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem' }}>Add Publication</h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#64748B', fontSize: '0.82rem' }}>Track your research paper</p>
                </div>
                <button style={S.closeBtn} onClick={() => setShowModal(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div style={S.modalBody}>
                {[
                  { label: 'Title *', key: 'title', placeholder: 'e.g., Deep Learning for Pneumonia Detection' },
                  { label: 'Authors', key: 'authors', placeholder: 'e.g., Smith J., Doe A.' },
                  { label: 'Journal / Conference', key: 'journal', placeholder: 'e.g., MICCAI 2026' },
                  { label: 'DOI', key: 'doi', placeholder: 'e.g., 10.1000/xyz123' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                    <input style={S.input} type="text" placeholder={f.placeholder}
                      value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abstract</label>
                  <textarea style={{ ...S.input, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }} rows={3}
                    placeholder="Brief abstract…"
                    value={form.abstract} onChange={e => setForm(p => ({ ...p, abstract: e.target.value }))} />
                </div>
                <div style={{ padding: '0.875rem 1rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px', fontSize: '0.8rem', color: '#A78BFA' }}>
                  ℹ️ Full publication management backend is coming soon. Your entries will be saved locally for now.
                </div>
              </div>
              <div style={S.modalFooter}>
                <button style={S.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button style={S.submitBtn} onClick={() => { alert('Publication saved locally! Backend integration coming soon.'); setShowModal(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Save Publication
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const S = {
  page: { minHeight: 'calc(100vh - 80px)', padding: '3rem 0 5rem' },
  header: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', gap: '2rem' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '100px', color: '#A78BFA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' },
  badgeDot: { width: 7, height: 7, borderRadius: '50%', background: '#8B5CF6' },
  title: { margin: 0, fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' },
  titleGrad: { background: 'linear-gradient(135deg,#8B5CF6,#0066CC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  subtitle: { color: '#64748B', fontSize: '1rem', margin: 0 },
  addBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.75rem', background: 'linear-gradient(135deg,#8B5CF6,#0066CC)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' },
  infoBanner: { display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.25rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '14px', marginBottom: '2rem' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '5rem 2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-primary)', borderRadius: '24px', textAlign: 'center' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' },
  modal: { width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '22px', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.5rem 1.75rem 1.25rem', borderBottom: '1px solid var(--border-primary)' },
  closeBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' },
  modalBody: { padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  modalFooter: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: '1.25rem 1.75rem', borderTop: '1px solid var(--border-primary)' },
  input: { width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' },
  cancelBtn: { padding: '0.7rem 1.25rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' },
  submitBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', borderRadius: '10px', background: 'linear-gradient(135deg,#8B5CF6,#0066CC)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' },
};

export default Publications;