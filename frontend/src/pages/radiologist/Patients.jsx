import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { patientService } from '../../services/patientService';
import '../../styles/pages/radiologist/Patients.css';
import Toast, { useToast } from '../../components/Toast';

const FormField = ({ label, children }) => (
  <div className="pt-field">
    <label className="pt-label">{label}</label>
    {children}
  </div>
);

const Patients = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingNationalId, setCheckingNationalId] = useState(false);  // ✅ NOUVEAU
  const [nationalIdWarning, setNationalIdWarning] = useState(null);
  const { toasts, toast, removeToast } = useToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);      // ✅ NOUVEAU
  const [formData, setFormData] = useState({
    patient_id: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    email: '',
    phone: '',
    address: '',
    medical_history: '',
    national_id: ''  // ✅ NOUVEAU
  });

  useEffect(() => { fetchPatients(); }, []);
  useEffect(() => { applyFilters(); }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      const data = await patientService.getPatients();
      
      const transformedPatients = data.patients.map(p => ({
        id: p.id,
        patientId: p.patient_id,
        firstName: p.first_name,
        lastName: p.last_name,
        age: p.date_of_birth ? new Date().getFullYear() - new Date(p.date_of_birth).getFullYear() : 'N/A',
        gender: p.gender.toLowerCase(),
        analyses: p.analysis_count || 0,
        lastVisit: p.created_at,
        email: p.email,
        phone: p.phone,
        dateOfBirth: p.date_of_birth,
        address: p.address,
        medicalHistory: p.medical_history,
        nationalId: p.national_id,
        blood_type: p.blood_type || '',
        height: p.height || '',
        weight: p.weight || '',
        allergies: p.allergies || '',
        medications: p.medications || '',
        conditions: p.conditions || '',
        emergency_contact: p.emergency_contact || '',  // ✅ NOUVEAU
      }));
      
      setPatients(transformedPatients);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setPatients([]);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let f = patients;
    if (searchTerm) f = f.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFiltered(f);
  };

  const openAdd = () => {
    setEditingPatient(null);
    setNationalIdWarning(null);  // ✅ RESET WARNING
    setFormData({
      patient_id: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: 'Male',
      email: '',
      phone: '',
      address: '',
      medical_history: '',
      national_id: '',
      blood_type: '',
      height: '',
      weight: '',
      allergies: '',
      medications: '',
      conditions: '',
      emergency_contact: ''
    });
    setShowModal(true);
  };

const openEdit = p => {
    setEditingPatient(p);
    setNationalIdWarning(null);
    setFormData({
      patient_id: p.patientId,
      first_name: p.firstName,
      last_name: p.lastName,
      date_of_birth: p.dateOfBirth || '',
      gender: p.gender.charAt(0).toUpperCase() + p.gender.slice(1),
      email: p.email,
      phone: p.phone,
      address: p.address || '',
      medical_history: p.medicalHistory || '',
      national_id: p.nationalId || '',
      emergency_contact: p.emergency_contact || '',
      // ✅ Champs médicaux
      blood_type: p.blood_type || '',
      height: p.height || '',
      weight: p.weight || '',
      allergies: p.allergies || '',
      medications: p.medications || '',
      conditions: p.conditions || '',
    });
    setShowModal(true);
  };

  const openDetails = (p) => {
    setSelectedPatient(p);
    setShowDetailModal(true);
  };

  // ✅ VÉRIFIER SI NATIONAL_ID EXISTE
  const checkNationalId = async (nationalId) => {
    if (!nationalId || nationalId.length < 5) {
      setNationalIdWarning(null);
      return;
    }

    setCheckingNationalId(true);
    try {
      const response = await patientService.checkNationalId(nationalId);
      
      if (response.exists) {
        if (response.has_access) {
          setNationalIdWarning({
            type: 'info',
            message: `Patient already exists: ${response.patient.first_name} ${response.patient.last_name} (${response.patient.patient_id}). You already have access.`
          });
        } else {
          setNationalIdWarning({
            type: 'warning',
            message: `Patient already exists: ${response.patient.first_name} ${response.patient.last_name} (${response.patient.patient_id}). Created by another radiologist.`
          });
        }
      } else {
        setNationalIdWarning(null);
      }
    } catch (err) {
      console.error('Failed to check national ID:', err);
    }
    setCheckingNationalId(false);
  };

 const handleSave = async () => {
    try {
      if (editingPatient) {
        await patientService.updatePatient(editingPatient.id, formData);
        toast.success('Patient updated successfully');
      } else {
        await patientService.createPatient(formData);
        toast.success('Patient created successfully');
      }
      setShowModal(false);
      setNationalIdWarning(null);
      fetchPatients();
    } catch (err) {
      toast.error('Failed to save patient', err.detail || err.message);
    }
  };

  const handleDelete = (patientId, patient) => {
    setPatientToDelete({ id: patientId, ...patient });
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const r = await fetch(
        `http://localhost:8000/api/patients/${patientToDelete.id}/unassign-radiologist/${user.id}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || 'Failed');
      }
      toast.success('Patient removed from your list');
      setShowConfirmModal(false);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      toast.error('Failed to remove patient', err.message);
      setShowConfirmModal(false);
    }
  };

  const upd = (field, val) => setFormData(f => ({ ...f, [field]: val }));

  const genderIcon = g => g === 'female'
    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><line x1="12" y1="14" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>
    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="6"/><line x1="21" y1="3" x2="15" y2="9"/><polyline points="16 3 21 3 21 8"/></svg>;

  if (loading) return (
    <div className="pt-page">
      <div className="container">
        <div className="pt-loading">
          <div className="pt-spin-rings">
            <div className="pt-ring r1"/><div className="pt-ring r2"/><div className="pt-ring r3"/>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'relative',zIndex:1}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <p className="pt-loading-label">Loading patients…</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-page">
      <div className="container">

        {/* HEADER */}
        <div className="pt-header">
          <div>
            <div className="pt-badge"><div className="pt-badge-dot"/><span>Patient Management</span></div>
            <h1 className="pt-title"><span className="pt-title-grad">{t('patients.title') || 'Patients'}</span></h1>
            <p className="pt-subtitle">{t('patients.subtitle') || 'Manage your patient records'}</p>
          </div>
          <button className="pt-add-btn" onClick={openAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {t('patients.addNew') || 'Add Patient'}
          </button>
        </div>

        {/* FILTERS */}
        <div className="pt-filters-card">
          <div className="pt-search-wrap">
            <svg className="pt-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="pt-search" type="text" placeholder={t('patients.search') || 'Search by name or ID…'}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {searchTerm && (
              <button className="pt-search-clear" onClick={() => setSearchTerm('')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          <div className="pt-results-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            Showing <strong>{filtered.length}</strong> of <strong>{patients.length}</strong> patients
          </div>
        </div>

        {/* TABLE */}
        <div className="pt-table-card">
          <div className="pt-table-wrap">
            <table className="pt-table">
              <thead>
                <tr>
                  <th>{t('patients.table.id')        || 'ID'}</th>
                  <th>{t('patients.table.name')      || 'Name'}</th>
                  <th>{t('patients.table.age')       || 'Age'}</th>
                  <th>{t('patients.table.gender')    || 'Gender'}</th>
                  <th>{t('patients.table.analyses')  || 'Analyses'}</th>
                  <th>{t('patients.table.lastVisit') || 'Last Visit'}</th>
                  <th>{t('patients.table.actions')   || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const initials = `${p.firstName[0]}${p.lastName[0]}`;
                  const avatarColors = ['#0066CC','#10B981','#8B5CF6','#F59E0B','#EF4444'];
                  const ac = avatarColors[i % avatarColors.length];
                  return (
                    <tr key={p.id} className="pt-row">
                      <td><span className="pt-id">{p.patientId}</span></td>
                      <td>
                        <div className="pt-patient-cell">
                          <div className="pt-avatar" style={{ background: ac }}>{initials}</div>
                          <div>
                            <div className="pt-patient-name">{p.firstName} {p.lastName}</div>
                            <div className="pt-patient-email">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="pt-age">{p.age} {t('patients.years')||'yrs'}</span></td>
                      <td>
                        <span className="pt-gender" style={{ color: p.gender === 'female' ? '#EC4899' : '#0066CC', background: p.gender === 'female' ? 'rgba(236,72,153,0.1)' : 'rgba(0,102,204,0.1)' }}>
                          {genderIcon(p.gender)}
                          {t(`patients.gender.${p.gender}`) || p.gender}
                        </span>
                      </td>
                      <td>
                        <div className="pt-analyses">
                          <span className="pt-analyses-val">{p.analyses}</span>
                          <div className="pt-analyses-bar"><div style={{ width:`${Math.min(p.analyses/20*100,100)}%`, background:'#0066CC' }}/></div>
                        </div>
                      </td>
                      <td className="pt-date">{new Date(p.lastVisit).toLocaleDateString()}</td>
                      <td>
                        <div className="pt-actions">
                          <button className="pt-action-btn view" title={t('patients.action.view') || 'View'} onClick={() => openDetails(p)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button className="pt-action-btn edit" title="Edit" onClick={() => openEdit(p)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="pt-action-btn delete" title="Delete" onClick={() => handleDelete(p.id, p)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="pt-empty">
                <div className="pt-empty-icon">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <h4>No patients found</h4>
                <p>Try adjusting your search</p>
                <button className="pt-empty-btn" onClick={() => setSearchTerm('')}>Clear Search</button>
              </div>
            )}
          </div>
        </div>

        {/* ✅ MODAL DÉTAILS PATIENT */}
        {showDetailModal && selectedPatient && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="pt-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              
              <div className="pt-modal-header">
                <div className="pt-modal-title-wrap">
                  <div className="pt-modal-icon" style={{ background: '#0066CC' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="pt-modal-title">Patient Details</h2>
                    <p className="pt-modal-sub">{selectedPatient.patientId}</p>
                  </div>
                </div>
                <button className="pt-modal-close" onClick={() => setShowDetailModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="pt-modal-body">
                <div style={{ background: 'rgba(0,102,204,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div className="pt-avatar" style={{ 
                      background: '#0066CC', 
                      width: '60px', 
                      height: '60px', 
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      color: 'white',
                      fontWeight: '600'
                    }}>
                      {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {selectedPatient.age} years • {selectedPatient.gender}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="pt-field">
                    <label className="pt-label">Email</label>
                    <div style={{ 
                      padding: '10px 14px', 
                      background: 'var(--input-bg)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}>
                      {selectedPatient.email || 'N/A'}
                    </div>
                  </div>

                  <div className="pt-field">
                    <label className="pt-label">Phone</label>
                    <div style={{ 
                      padding: '10px 14px', 
                      background: 'var(--input-bg)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}>
                      {selectedPatient.phone || 'N/A'}
                    </div>
                  </div>

                  <div className="pt-field">
                    <label className="pt-label">Date of Birth</label>
                    <div style={{ 
                      padding: '10px 14px', 
                      background: 'var(--input-bg)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}>
                      {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  <div className="pt-field">
                    <label className="pt-label">Total Analyses</label>
                    <div style={{ 
                      padding: '10px 14px', 
                      background: 'var(--input-bg)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px',
                      color: '#0066CC',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      {selectedPatient.analyses}
                    </div>
                  </div>
                </div>

                <div className="pt-field" style={{ marginBottom: '20px' }}>
                  <label className="pt-label">Address</label>
                  <div style={{ 
                    padding: '10px 14px', 
                    background: 'var(--input-bg)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}>
                    {selectedPatient.address || 'N/A'}
                  </div>
                </div>

                <div className="pt-field">
                  <label className="pt-label">Medical History</label>
                  <div style={{ 
                    padding: '14px', 
                    background: 'var(--input-bg)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    minHeight: '80px',
                    lineHeight: '1.6'
                  }}>
                    {selectedPatient.medicalHistory || 'No medical history recorded'}
                  </div>
                </div>
{/* ✅ Champs médicaux */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginTop:'16px' }}>
                  <div className="pt-field">
                    <label className="pt-label">Blood Type</label>
                    <div style={{ padding:'10px 14px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', fontSize:'14px' }}>
                      {selectedPatient.blood_type || 'N/A'}
                    </div>
                  </div>
                  <div className="pt-field">
                    <label className="pt-label">Height</label>
                    <div style={{ padding:'10px 14px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', fontSize:'14px' }}>
                      {selectedPatient.height ? `${selectedPatient.height} cm` : 'N/A'}
                    </div>
                  </div>
                  <div className="pt-field">
                    <label className="pt-label">Weight</label>
                    <div style={{ padding:'10px 14px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', fontSize:'14px' }}>
                      {selectedPatient.weight ? `${selectedPatient.weight} kg` : 'N/A'}
                    </div>
                  </div>
                </div>

                {selectedPatient.allergies && (
                  <div className="pt-field" style={{ marginTop:'12px' }}>
                    <label className="pt-label">Allergies</label>
                    <div style={{ padding:'10px 14px', background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', color:'var(--text-primary)', fontSize:'14px' }}>
                      {selectedPatient.allergies}
                    </div>
                  </div>
                )}

                {selectedPatient.medications && (
                  <div className="pt-field" style={{ marginTop:'12px' }}>
                    <label className="pt-label">Current Medications</label>
                    <div style={{ padding:'10px 14px', background:'rgba(0,102,204,0.05)', border:'1px solid rgba(0,102,204,0.2)', borderRadius:'8px', color:'var(--text-primary)', fontSize:'14px' }}>
                      {selectedPatient.medications}
                    </div>
                  </div>
                )}

                {selectedPatient.conditions && (
                  <div className="pt-field" style={{ marginTop:'12px' }}>
                    <label className="pt-label">Chronic Conditions</label>
                    <div style={{ padding:'10px 14px', background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'8px', color:'var(--text-primary)', fontSize:'14px' }}>
                      {selectedPatient.conditions}
                    </div>
                  </div>
                )}

                {selectedPatient.emergency_contact && (
                  <div className="pt-field" style={{ marginTop:'12px' }}>
                    <label className="pt-label">Emergency Contact</label>
                    <div style={{ padding:'10px 14px', background:'var(--input-bg)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text-primary)', fontSize:'14px' }}>
                      {selectedPatient.emergency_contact}
                    </div>
                  </div>
                )}
                <div style={{ 
                  marginTop: '20px', 
                  padding: '12px', 
                  background: 'rgba(16,185,129,0.05)', 
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#10B981'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Last visit: {new Date(selectedPatient.lastVisit).toLocaleDateString()}
                </div>
              </div>

              <div className="pt-modal-footer">
                <button className="pt-modal-cancel" onClick={() => setShowDetailModal(false)}>Close</button>
                <button className="pt-modal-save" onClick={() => {
                  setShowDetailModal(false);
                  openEdit(selectedPatient);
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Patient
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL ADD/EDIT */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="pt-modal" onClick={e => e.stopPropagation()}>

              <div className="pt-modal-header">
                <div className="pt-modal-title-wrap">
                  <div className="pt-modal-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {editingPatient
                        ? <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                        : <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>
                      }
                    </svg>
                  </div>
                  <div>
                    <h2 className="pt-modal-title">{editingPatient ? (t('patients.modal.edit')||'Edit Patient') : (t('patients.modal.title')||'Add Patient')}</h2>
                    <p className="pt-modal-sub">{editingPatient ? `${editingPatient.firstName} ${editingPatient.lastName}` : 'Enter patient details below'}</p>
                  </div>
                </div>
                <button className="pt-modal-close" onClick={() => setShowModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="pt-modal-body">
                <div className="pt-form-row">
                  <FormField label={t('patients.form.firstName')||'First Name'}>
                    <input className="pt-input" type="text" value={formData.first_name} placeholder="John" onChange={e => upd('first_name', e.target.value)} />
                  </FormField>
                  <FormField label={t('patients.form.lastName')||'Last Name'}>
                    <input className="pt-input" type="text" value={formData.last_name} placeholder="Doe" onChange={e => upd('last_name', e.target.value)} />
                  </FormField>
                </div>

                <div className="pt-form-row">
                  <FormField label={t('patients.form.dateOfBirth')||'Date of Birth'}>
                    <input className="pt-input" type="date" value={formData.date_of_birth} onChange={e => upd('date_of_birth', e.target.value)} />
                  </FormField>
                  <FormField label={t('patients.form.gender')||'Gender'}>
                    <select className="pt-select" value={formData.gender} onChange={e => upd('gender', e.target.value)}>
                      <option value="Male">{t('patients.gender.male')||'Male'}</option>
                      <option value="Female">{t('patients.gender.female')||'Female'}</option>
                      <option value="Other">{t('patients.gender.other')||'Other'}</option>
                    </select>
                  </FormField>
                </div>

                {/* ✅ NOUVEAU CHAMP NATIONAL_ID */}
                <FormField label="National ID (Optional)">
                  <div className="pt-input-icon-wrap">
                    <svg className="pt-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="7" y1="8" x2="17" y2="8"/>
                      <line x1="7" y1="12" x2="17" y2="12"/>
                      <line x1="7" y1="16" x2="12" y2="16"/>
                    </svg>
                    <input 
                      className="pt-input has-icon" 
                      type="text" 
                      value={formData.national_id} 
                      placeholder="12345678" 
                      onChange={e => {
                        upd('national_id', e.target.value);
                        checkNationalId(e.target.value);
                      }}
                    />
                    {checkingNationalId && (
                      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                        <div className="up-spinner" style={{ width: '16px', height: '16px' }}/>
                      </div>
                    )}
                  </div>
                  {nationalIdWarning && (
                    <div style={{
                      marginTop: '8px',
                      padding: '10px 12px',
                      background: nationalIdWarning.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)',
                      border: `1px solid ${nationalIdWarning.type === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`,
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: nationalIdWarning.type === 'warning' ? '#F59E0B' : '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {nationalIdWarning.message}
                    </div>
                  )}
                </FormField>

                <div className="pt-form-row">
                  <FormField label={t('patients.form.email')||'Email (Optional)'}>
                    <div className="pt-input-icon-wrap">
                      <svg className="pt-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input className="pt-input has-icon" type="email" value={formData.email} placeholder="patient@email.com" onChange={e => upd('email', e.target.value)} />
                    </div>
                  </FormField>
                  <FormField label={t('patients.form.phone')||'Phone (Optional)'}>
                    <div className="pt-input-icon-wrap">
                      <svg className="pt-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .03h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.9v2z"/></svg>
                      <input className="pt-input has-icon" type="tel" value={formData.phone} placeholder="+216 12 345 678" onChange={e => upd('phone', e.target.value)} />
                    </div>
                  </FormField>
                  <FormField label="Emergency Contact (Optional)">
                    <div className="pt-input-icon-wrap">
                      <svg className="pt-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81"/><circle cx="12" cy="12" r="10"/></svg>
                      <input className="pt-input has-icon" type="text" value={formData.emergency_contact || ''} placeholder="Name — Phone number" onChange={e => upd('emergency_contact', e.target.value)} />
                    </div>
                  </FormField>
                </div>

                <FormField label={t('patients.form.address')||'Address (Optional)'}>
                  <div className="pt-input-icon-wrap">
                    <svg className="pt-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <input className="pt-input has-icon" type="text" value={formData.address} placeholder="123 Main St, City" onChange={e => upd('address', e.target.value)} />
                  </div>
                </FormField>

                <FormField label={t('patients.form.medicalHistory')||'Medical History (Optional)'}>
                  <textarea className="pt-input pt-textarea" rows="3" value={formData.medical_history}
                    placeholder="Relevant medical conditions, allergies, previous treatments…"
                    onChange={e => upd('medical_history', e.target.value)} />
                </FormField>

                <div className="pt-form-row">
                  <FormField label="Blood Type">
                    <select className="pt-select" value={formData.blood_type || ''} onChange={e => upd('blood_type', e.target.value)}>
                      <option value="">Unknown</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Gender">
                    <select className="pt-select" value={formData.gender} onChange={e => upd('gender', e.target.value)}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormField>
                </div>

                <div className="pt-form-row">
                  <FormField label="Height (cm)">
                    <input className="pt-input" type="text" value={formData.height || ''} placeholder="175" onChange={e => upd('height', e.target.value)} />
                  </FormField>
                  <FormField label="Weight (kg)">
                    <input className="pt-input" type="text" value={formData.weight || ''} placeholder="70" onChange={e => upd('weight', e.target.value)} />
                  </FormField>
                </div>

                <FormField label="Allergies (Optional)">
                  <textarea className="pt-input pt-textarea" rows="2" value={formData.allergies || ''}
                    placeholder="Penicillin, peanuts, latex…"
                    onChange={e => upd('allergies', e.target.value)} />
                </FormField>

                <FormField label="Current Medications (Optional)">
                  <textarea className="pt-input pt-textarea" rows="2" value={formData.medications || ''}
                    placeholder="Aspirin 100mg daily…"
                    onChange={e => upd('medications', e.target.value)} />
                </FormField>

                <FormField label="Chronic Conditions (Optional)">
                  <textarea className="pt-input pt-textarea" rows="2" value={formData.conditions || ''}
                    placeholder="Diabetes, hypertension…"
                    onChange={e => upd('conditions', e.target.value)} />
                </FormField>
              </div>

              <div className="pt-modal-footer">
                <button className="pt-modal-cancel" onClick={() => setShowModal(false)}>{t('patients.form.cancel')||'Cancel'}</button>
                <button className="pt-modal-save" onClick={handleSave}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {t('patients.form.save') || (editingPatient ? 'Save Changes' : 'Add Patient')}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
      {/* ✅ CONFIRM MODAL */}
        {showConfirmModal && patientToDelete && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="pt-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
              <div className="pt-modal-header">
                <div className="pt-modal-title-wrap">
                  <div className="pt-modal-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="pt-modal-title">Remove Patient</h2>
                    <p className="pt-modal-sub">{patientToDelete.firstName} {patientToDelete.lastName}</p>
                  </div>
                </div>
                <button className="pt-modal-close" onClick={() => setShowConfirmModal(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="pt-modal-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  This will remove <strong style={{ color: 'var(--text-primary)' }}>{patientToDelete.firstName} {patientToDelete.lastName}</strong> from your patient list. The patient record will remain accessible to other radiologists and admins.
                </p>
              </div>
              <div className="pt-modal-footer">
                <button className="pt-modal-cancel" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button className="pt-modal-save" style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)' }} onClick={confirmDelete}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  Remove Patient
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ TOAST */}
        <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Patients;