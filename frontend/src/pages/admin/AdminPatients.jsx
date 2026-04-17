import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/admin/AdminPatients.css';
import Toast, { useToast } from '../../components/Toast';

const AdminPatients = () => {
  const [viewPatient, setViewPatient] = useState(null);
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [radiologists, setRadiologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRadiologistsModal, setShowRadiologistsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRadiologists, setPatientRadiologists] = useState([]);

  // Form states
  const [selectedRadiologist, setSelectedRadiologist] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [availableRadiologists, setAvailableRadiologists] = useState([]);
  const { toasts, toast, removeToast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchStats();
    fetchPatients();
    fetchRadiologists();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/patients/admin/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/patients/admin/all', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setPatients(data.patients);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setLoading(false);
    }
  };

  const fetchRadiologists = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/users?role=radiologist', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setRadiologists(data.users || []);
    } catch (err) {
      console.error('Failed to fetch radiologists:', err);
    }
  };

  const openCreateAccount = (patient) => {
    handleCreateAccountDirect(patient);
  };

  const handleCreateAccountDirect = async (patient) => {
    if (!patient.email) {
      toast.error('No email address', 'Please edit the patient and add an email first.');
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:8000/api/patients/${patient.id}/create-account`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.ok) {
        const data = await response.json();
        toast.success('Account created!', `Username: ${data.username} · Sent to ${data.email}`);
        fetchPatients();
        fetchStats();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create account');
      }
    } catch { toast.error('Error creating account'); }
  };

  const openAssignModal = async (patient) => {
    setSelectedPatient(patient);
    setSelectedRadiologist('');
    setAssignNotes('');
    try {
      const r = await fetch(`http://localhost:8000/api/patients/${patient.id}/radiologists`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await r.json();
      const alreadyAssigned = data.radiologists || [];
      setPatientRadiologists(alreadyAssigned);

      // ✅ Filtrer avec les données fraîches directement
      const assignedIds = alreadyAssigned.map(rad => rad.id);
      const available = radiologists.filter(r => !assignedIds.includes(r.id));
      setAvailableRadiologists(available);

      if (available.length === 0) {
        toast.info('All radiologists are already assigned to this patient');
        return;
      }

      setShowAssignModal(true);
    } catch {
      setPatientRadiologists([]);
      setAvailableRadiologists(radiologists);
      setShowAssignModal(true);
    }
  };

  const handleAssign = async () => {
    if (!selectedRadiologist) {
      toast.error('Please select a radiologist');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/patients/${selectedPatient.id}/assign-radiologist?radiologist_id=${selectedRadiologist}&notes=${encodeURIComponent(assignNotes)}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.ok) {
        toast.success('Radiologist assigned successfully!');
        setShowAssignModal(false);
        fetchPatients();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to assign radiologist');
      }
    } catch (err) {
      console.error('Failed to assign patient:', err);
      toast.error('Failed to assign radiologist');
    }
  };

  const viewRadiologists = async (patient) => {
    setSelectedPatient(patient);
    try {
      const response = await fetch(
        `http://localhost:8000/api/patients/${patient.id}/radiologists`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();
      setPatientRadiologists(data.radiologists || []);
      setShowRadiologistsModal(true);
    } catch (err) {
      console.error('Failed to fetch radiologists:', err);
      toast.error('Failed to load radiologists');
    }
  };
  const handleAdminDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const r = await fetch(`http://localhost:8000/api/patients/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || 'Failed');
      }
      toast.success('Patient deleted successfully');
      setDeleteConfirm(null);
      fetchPatients();
      fetchStats();
    } catch (err) {
      toast.error('Failed to delete patient', err.message);
      setDeleteConfirm(null);
    }
  };

  const filteredPatients = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.national_id && p.national_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="app-page">
        <div className="container">
          <div className="app-loading">
            <div className="app-spinner"/>
            <p>{t('admin.dashboard.subtitle')}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="container">

        {/* HEADER */}
        <div className="ad-header" data-aos="fade-down">
          <div className="ad-header-left">
            <div className="ad-badge">
              <div className="ad-badge-dot"/>
              <span>{t('admin.users.title')}</span>
            </div>
            <h1 className="ad-title">
              <span className="ad-title-grad">{t('patients.title')}</span>
            </h1>
            <p className="ad-subtitle">{t('patients.subtitle')}</p>
          </div>
          <div className="ad-admin-crown">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {t('navbar.admin')}
          </div>
        </div>

        {/* STATS - SEULEMENT 3 CARTES (SANS "INACTIFS") */}
        {stats && (
          <div className="ad-stats-grid">
            <div className="ad-stat-card" data-aos="fade-up" data-aos-delay="0">
              <div className="ad-stat-icon" style={{ background: '#8B5CF6', boxShadow: '0 10px 28px rgba(139,92,246,0.4)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div className="ad-stat-body">
                <span className="ad-stat-label">{t('dashboard.stats.patients')}</span>
                <span className="ad-stat-value">{stats.total_patients}</span>
              </div>
              <div className="ad-stat-glow" style={{ background: '#8B5CF6' }}/>
            </div>

            <div className="ad-stat-card" data-aos="fade-up" data-aos-delay="80">
              <div className="ad-stat-icon" style={{ background: '#10B981', boxShadow: '0 10px 28px rgba(16,185,129,0.4)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="ad-stat-body">
                <span className="ad-stat-label">{t('admin.patients.withAccounts')}</span>
                <span className="ad-stat-value">{stats.patients_with_accounts}</span>
              </div>
              <div className="ad-stat-glow" style={{ background: '#10B981' }}/>
            </div>

            <div className="ad-stat-card" data-aos="fade-up" data-aos-delay="160">
              <div className="ad-stat-icon" style={{ background: '#0066CC', boxShadow: '0 10px 28px rgba(0,102,204,0.4)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div className="ad-stat-body">
                <span className="ad-stat-label">{t('admin.stats.totalAnalyses')}</span>
                <span className="ad-stat-value">{stats.total_analyses}</span>
              </div>
              <div className="ad-stat-glow" style={{ background: '#0066CC' }}/>
            </div>
          </div>
        )}

        {/* SEARCH */}
        <div className="app-search-card" data-aos="fade-up">
          <svg className="app-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="app-search"
            type="text"
            placeholder={t('patients.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="app-search-clear" onClick={() => setSearchTerm('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
          <div className="app-results-count">
            {filteredPatients.length} / {patients.length} {t('patients.title').toLowerCase()}
          </div>
        </div>

        {/* TABLE */}
        <div className="ad-card" data-aos="fade-up">
          <div className="ad-card-header" style={{ '--ch': '#8B5CF6' }}>
            <div className="ad-card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <div>
              <h3 className="ad-card-title">{t('patients.title')}</h3>
              <p className="ad-card-sub">{t('patients.subtitle')}</p>
            </div>
          </div>

          <div className="app-table-wrap">
            <table className="app-table">
              <thead>
                <tr>
                  <th>{t('patients.table.id')}</th>
                  <th>{t('patients.table.name')}</th>
                  <th>{t('patients.form.firstName')}</th>
                  <th>{t('nav.radiologists')}</th>
                  <th>{t('admin.stats.totalAnalyses')}</th>
                  <th>{t('patients.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p, i) => (
                  <tr key={p.id} className="app-table-row" data-aos="fade-up" data-aos-delay={i * 40}>
                    <td>
                      <span className="app-patient-id">{p.patient_id}</span>
                    </td>
                    <td>
                      <div className="app-patient-name-cell">
                        <div className="app-avatar" style={{ background: `hsl(${(i * 50) % 360}, 70%, 55%)` }}>
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div>
                          <div className="app-name">{p.first_name} {p.last_name}</div>
                          <div className="app-email">{p.email || p.national_id || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="app-creator">{p.creator_name || '-'}</span>
                    </td>
                    <td>
                      <button className="app-radio-count" onClick={() => viewRadiologists(p)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        {p.radiologist_count}
                      </button>
                    </td>
                    <td>
                      <span className="app-analyses">{p.analysis_count}</span>
                    </td>
                    <td>
                      <div className="app-actions">
                        {!p.user_id && (
                          <button className="app-action-btn create" onClick={() => handleCreateAccountDirect(p)} title="Create Account">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                            </svg>
                          </button>
                        )}
                        <button className="app-action-btn assign" onClick={() => openAssignModal(p)} title={t('admin.patients.assignRadiologist')}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <line x1="19" y1="8" x2="19" y2="14"/>
                            <line x1="22" y1="11" x2="16" y2="11"/>
                          </svg>
                        </button>
                        {/* ✅ BOUTON VIEW */}
                        <button className="app-action-btn view" onClick={() => setViewPatient(p)} title="View Patient">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        {/* ✅ BOUTON DELETE ADMIN */}
                        <button className="app-action-btn delete" onClick={() => setDeleteConfirm(p)} title="Delete Patient">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPatients.length === 0 && (
              <div className="app-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <h4>{t('patient.recentAnalyses.noResults')}</h4>
                <p>{t('patients.search')}</p>
              </div>
            )}
          </div>
        </div>


        {/* MODAL: ASSIGN TO RADIOLOGIST */}
        {showAssignModal && (
          <div className="app-modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="app-modal" onClick={(e) => e.stopPropagation()}>
              <div className="app-modal-header">
                <h3>{t('admin.patients.assignTitle')}</h3>
                <button className="app-modal-close" onClick={() => setShowAssignModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="app-modal-body">
                <p className="app-modal-subtitle">
                  <strong>{selectedPatient?.first_name} {selectedPatient?.last_name}</strong> ({selectedPatient?.patient_id})
                </p>

                <div className="app-form-field">
                  <label>{t('nav.radiologists')}</label>
                  <select className="app-input" value={selectedRadiologist}
                    onChange={(e) => setSelectedRadiologist(e.target.value)}>
                    <option value="">{t('admin.patients.chooseRadiologist')}</option>
                    {availableRadiologists.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.first_name} {r.last_name} — {r.email}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div className="app-form-field">
                  <label>{t('upload.notes')}</label>
                  <textarea className="app-input"
                    placeholder={t('upload.notesPlaceholder')}
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="app-modal-footer">
                <button className="app-btn-cancel" onClick={() => setShowAssignModal(false)}>{t('patients.form.cancel')}</button>
                <button className="app-btn-save" onClick={handleAssign}>{t('admin.patients.assignRadiologist')}</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: VIEW RADIOLOGISTS */}
        {showRadiologistsModal && (
          <div className="app-modal-overlay" onClick={() => setShowRadiologistsModal(false)}>
            <div className="app-modal" onClick={(e) => e.stopPropagation()}>
              <div className="app-modal-header">
                <h3>{t('patient.radiologists.title')}</h3>
                <button className="app-modal-close" onClick={() => setShowRadiologistsModal(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="app-modal-body">
                <p className="app-modal-subtitle">
                  <strong>{selectedPatient?.first_name} {selectedPatient?.last_name}</strong> ({selectedPatient?.patient_id})
                </p>
                <div className="app-radio-list">
                  {patientRadiologists.map((r, i) => (
                    <div key={i} className="app-radio-item">
                      <div className="app-radio-info">
                        <div className="app-radio-name">
                          {r.name}
                          {r.is_primary && (
                            <span className="app-primary-badge">{t('patient.radiologists.primary')}</span>
                          )}
                        </div>
                        <div className="app-radio-email">{r.email}</div>
                        {r.notes && <div className="app-radio-notes">📝 {r.notes}</div>}
                      </div>
                      <div className="app-radio-date">
                        {t('patients.table.lastVisit')}: {new Date(r.assigned_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="app-modal-footer">
                <button className="app-btn-cancel" onClick={() => setShowRadiologistsModal(false)}>{t('patients.form.cancel')}</button>
              </div>
            </div>
          </div>
        )}
        {/* ✅ CONFIRM DELETE MODAL */}
        {deleteConfirm && (
          <div className="app-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="app-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
              <div className="app-modal-header">
                <h3 style={{ color: '#EF4444' }}>Delete Patient</h3>
                <button className="app-modal-close" onClick={() => setDeleteConfirm(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="app-modal-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Are you sure you want to permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="app-modal-footer">
                <button className="app-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="app-btn-save" style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)' }} onClick={handleAdminDelete}>
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ✅ VIEW PATIENT MODAL */}
        {viewPatient && (
          <div className="app-modal-overlay" onClick={() => setViewPatient(null)}>
            <div className="app-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
              <div className="app-modal-header">
                <h3>Patient Details — {viewPatient.patient_id}</h3>
                <button className="app-modal-close" onClick={() => setViewPatient(null)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="app-modal-body" style={{ maxHeight:'70vh', overflowY:'auto' }}>

                {/* Avatar + nom */}
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem', background:'rgba(0,102,204,0.05)', borderRadius:'12px', marginBottom:'1.25rem' }}>
                  <div style={{ width:56, height:56, borderRadius:'50%', background:`hsl(${(viewPatient.id * 50) % 360}, 70%, 55%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', fontWeight:700, color:'white', flexShrink:0 }}>
                    {viewPatient.first_name[0]}{viewPatient.last_name[0]}
                  </div>
                  <div>
                    <h3 style={{ color:'var(--text-primary)', fontWeight:700, marginBottom:'0.25rem' }}>{viewPatient.first_name} {viewPatient.last_name}</h3>
                    <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>{viewPatient.patient_id} · Created by {viewPatient.creator_name}</p>
                  </div>
                  {viewPatient.user_id && (
                    <span style={{ marginLeft:'auto', padding:'4px 12px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'100px', color:'#10B981', fontSize:'0.75rem', fontWeight:700 }}>
                      Has Account
                    </span>
                  )}
                </div>

                {/* Infos perso */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'1rem' }}>
                  {[
                    { label:'Email', val: viewPatient.email || 'N/A' },
                    { label:'Phone', val: viewPatient.phone || 'N/A' },
                    { label:'National ID', val: viewPatient.national_id || 'N/A' },
                    { label:'Gender', val: viewPatient.gender || 'N/A' },
                    { label:'Date of Birth', val: viewPatient.date_of_birth ? new Date(viewPatient.date_of_birth).toLocaleDateString() : 'N/A' },
                    { label:'Address', val: viewPatient.address || 'N/A' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding:'10px 14px', background:'var(--bg-secondary)', borderRadius:'8px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.25rem' }}>{item.label}</div>
                      <div style={{ fontSize:'0.875rem', color:'var(--text-primary)' }}>{item.val}</div>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'1rem' }}>
                  {[
                    { label:'Blood Type', val: viewPatient.blood_type || 'N/A', color:'#EF4444' },
                    { label:'Height', val: viewPatient.height ? `${viewPatient.height} cm` : 'N/A', color:'#0066CC' },
                    { label:'Weight', val: viewPatient.weight ? `${viewPatient.weight} kg` : 'N/A', color:'#10B981' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding:'10px 14px', background:'var(--bg-secondary)', borderRadius:'8px', border:`1px solid var(--border)`, textAlign:'center' }}>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748B', textTransform:'uppercase', marginBottom:'0.25rem' }}>{item.label}</div>
                      <div style={{ fontSize:'1rem', fontWeight:700, color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>

                {/* Médical */}
                {[
                  { label:'Medical History', val: viewPatient.medical_history, color:'rgba(139,92,246,0.1)', border:'rgba(139,92,246,0.2)' },
                  { label:'Allergies', val: viewPatient.allergies, color:'rgba(239,68,68,0.05)', border:'rgba(239,68,68,0.2)' },
                  { label:'Current Medications', val: viewPatient.medications, color:'rgba(0,102,204,0.05)', border:'rgba(0,102,204,0.2)' },
                  { label:'Chronic Conditions', val: viewPatient.conditions, color:'rgba(245,158,11,0.05)', border:'rgba(245,158,11,0.2)' },
                  { label:'Emergency Contact', val: viewPatient.emergency_contact, color:'rgba(16,185,129,0.05)', border:'rgba(16,185,129,0.2)' },
                ].filter(item => item.val).map((item, i) => (
                  <div key={i} style={{ padding:'12px 14px', background: item.color, border:`1px solid ${item.border}`, borderRadius:'8px', marginBottom:'8px' }}>
                    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#64748B', textTransform:'uppercase', marginBottom:'0.375rem' }}>{item.label}</div>
                    <div style={{ fontSize:'0.875rem', color:'var(--text-primary)', lineHeight:1.6 }}>{item.val}</div>
                  </div>
                ))}

                {/* Stats analyses */}
                <div style={{ display:'flex', gap:'1rem', padding:'1rem', background:'rgba(0,102,204,0.05)', borderRadius:'10px', marginTop:'0.5rem' }}>
                  <div style={{ textAlign:'center', flex:1 }}>
                    <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#0066CC' }}>{viewPatient.analysis_count}</div>
                    <div style={{ fontSize:'0.75rem', color:'#64748B' }}>Analyses</div>
                  </div>
                  <div style={{ textAlign:'center', flex:1 }}>
                    <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#8B5CF6' }}>{viewPatient.radiologist_count}</div>
                    <div style={{ fontSize:'0.75rem', color:'#64748B' }}>Radiologists</div>
                  </div>
                </div>
              </div>
              <div className="app-modal-footer">
                <button className="app-btn-cancel" onClick={() => setViewPatient(null)}>Close</button>
                <button className="app-btn-save" onClick={() => { setViewPatient(null); openAssignModal(viewPatient); }}>
                  Assign Radiologist
                </button>
              </div>
            </div>
          </div>
        )}
      <Toast toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
};

export default AdminPatients;