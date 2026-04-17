import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/patient/MedicalRecords.css';
import Avatar from '../shared/Avatar';

const MedicalRecords = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/patients/my-records', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 404) {
        setPatientInfo(null);
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch medical records');

      const data = await response.json();
      
      // Transform API data to component state
      setPatientInfo({
        firstName: data.personal_info.first_name,
        lastName: data.personal_info.last_name,
        dateOfBirth: data.personal_info.date_of_birth,
        gender: data.personal_info.gender,
        age: data.personal_info.age,
        bloodType: data.medical_info.blood_type || 'N/A',
        height: data.medical_info.height || 'N/A',
        weight: data.medical_info.weight || 'N/A',
        email: data.personal_info.email || 'Not specified',
        phone: data.personal_info.phone || 'Not specified',
        address: data.personal_info.address || 'Not specified',
        emergencyContact: data.personal_info.emergency_contact || 'Not specified', 
        allergies: data.medical_info.allergies,
        medications: data.medical_info.medications,
        conditions: data.medical_info.conditions,
        medicalHistory: data.medical_info.medical_history,
        totalAnalyses: data.stats.total_analyses,
        radiologists: data.radiologists
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch medical records:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="mr-page">
      <div className="container">
        <div className="mr-loader-wrap">
          <div className="mr-loader-ring" />
          <p>Loading your medical records...</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="mr-page">
      <div className="container">
        <div className="mr-error-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Error Loading Records</h3>
          <p>{error}</p>
          <button onClick={fetchMedicalRecords} className="mr-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );

  if (!patientInfo) return (
    <div className="mr-page"><div className="container">
      <div style={{ textAlign:'center', padding:'5rem', color:'#94A3B8' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:'1rem' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <h3 style={{ color:'white', marginBottom:'0.5rem' }}>No Medical Records Yet</h3>
        <p>Your medical records will appear here once your radiologist adds them.</p>
      </div>
    </div></div>
  );

  const Field = ({ label, value, fullWidth = false }) => (
    <div className={`mr-field ${fullWidth ? 'full' : ''}`}>
      <label className="mr-label">{label}</label>
      <div className="mr-value">
        {value === 'N/A' || value === 'Not specified' 
          ? <span style={{ color: '#94A3B8' }}>{value}</span>
          : value
        }
      </div>
    </div>
  );

  const vitalStats = [
    { 
      label: 'Blood Type', 
      value: patientInfo.bloodType, 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9.96 9.96 0 00-7.07 2.93C2.11 7.75 1 10.76 1 14a11 11 0 0022 0c0-3.24-1.11-6.25-3.93-9.07A9.96 9.96 0 0012 2z"/></svg>, 
      color: '#EF4444', 
      unit: '' 
    },
    { 
      label: 'Height', 
      value: patientInfo.height, 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="7 7 12 2 17 7"/><polyline points="7 17 12 22 17 17"/></svg>, 
      color: '#0066CC', 
      unit: 'cm' 
    },
    { 
      label: 'Weight', 
      value: patientInfo.weight, 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3"/><path d="M3 21l2-8h14l2 8"/></svg>, 
      color: '#10B981', 
      unit: 'kg' 
    },
    { 
      label: 'Age', 
      value: patientInfo.age, 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, 
      color: '#8B5CF6', 
      unit: 'yrs' 
    },
  ];

  return (
    <div className="mr-page">
      <div className="container">

        {/* HEADER */}
        <div className="mr-header" data-aos="fade-down">
          <div className="mr-header-left">
            <div className="mr-badge">
              <div className="mr-badge-dot" />
              <span>Patient Portal</span>
            </div>
            <h1 className="mr-title">
              <span className="mr-title-grad">{t('patient.records.title') || 'Medical Records'}</span>
            </h1>
            <p className="mr-subtitle">{t('patient.records.subtitle') || 'Your complete health profile and medical history'}</p>
          </div>
        </div>

        {/* VITAL STATS STRIP */}
        <div className="mr-vitals" data-aos="fade-up">
          {vitalStats.map((v, i) => (
            <div key={i} className="mr-vital-card" data-aos="fade-up" data-aos-delay={i * 80}>
              <div className="mr-vital-icon" style={{ '--vc': v.color }}>{v.icon}</div>
              <div className="mr-vital-body">
                <span className="mr-vital-label">{v.label}</span>
                <span className="mr-vital-value" style={{ color: v.color }}>
                  {v.value}<span className="mr-vital-unit">{v.unit}</span>
                </span>
              </div>
              <div className="mr-vital-glow" style={{ background: v.color }} />
            </div>
          ))}
        </div>

        <div className="mr-grid">

          {/* PERSONAL INFO */}
          <div className="mr-card" data-aos="fade-right">
            <div className="mr-card-header">
              <div className="mr-card-icon" style={{ '--ci': '#0066CC' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <h3 className="mr-card-title">{t('patient.records.personalInfo') || 'Personal Information'}</h3>
                <p className="mr-card-sub">Basic identity and physical details</p>
              </div>
            </div>
            <div className="mr-fields-grid">
              <Field label="First Name" value={patientInfo.firstName} />
              <Field label="Last Name" value={patientInfo.lastName} />
              <Field 
                label="Date of Birth" 
                value={new Date(patientInfo.dateOfBirth).toLocaleDateString('en-US', { 
                  year:'numeric', 
                  month:'long', 
                  day:'numeric' 
                })} 
              />
              <Field label="Gender" value={patientInfo.gender} />
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="mr-card" data-aos="fade-left">
            <div className="mr-card-header">
              <div className="mr-card-icon" style={{ '--ci': '#10B981' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
              </div>
              <div>
                <h3 className="mr-card-title">Contact Information</h3>
                <p className="mr-card-sub">How we reach you</p>
              </div>
            </div>
            <div className="mr-fields-grid">
              <Field label="Email" value={patientInfo.email} fullWidth />
              <Field label="Phone" value={patientInfo.phone} fullWidth />
              <Field label="Address" value={patientInfo.address} fullWidth />
              <Field label={t('patient.records.emergencyContact') || 'Emergency Contact'} value={patientInfo.emergencyContact} fullWidth />
            </div>
          </div>

          {/* MEDICAL HISTORY */}
          <div className="mr-card mr-full" data-aos="fade-up">
            <div className="mr-card-header">
              <div className="mr-card-icon" style={{ '--ci': '#8B5CF6' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <div>
                <h3 className="mr-card-title">{t('patient.records.medicalHistory') || 'Medical History'}</h3>
                <p className="mr-card-sub">Conditions, medications & clinical background</p>
              </div>
            </div>

            <div className="mr-medical-grid">
              {[
                { label: t('patient.records.allergies') || 'Allergies', value: patientInfo.allergies, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, color: '#EF4444' },
                { label: t('patient.records.medications') || 'Current Medications', value: patientInfo.medications, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v3"/><circle cx="18" cy="18" r="4"/><path d="M15.5 18H18m0 0h2.5M18 18v-2.5M18 18v2.5"/></svg>, color: '#0066CC' },
                { label: t('patient.records.conditions') || 'Chronic Conditions', value: patientInfo.conditions, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, color: '#F59E0B' },
                { label: 'Medical History', value: patientInfo.medicalHistory, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>, color: '#8B5CF6' },
              ].map((item, i) => (
                <div key={i} className="mr-medical-field">
                  <div className="mr-medical-label">
                    <span className="mr-medical-icon" style={{ color: item.color, background: `color-mix(in srgb, ${item.color} 12%, transparent)` }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <div className="mr-medical-value">
                    {item.value === 'Not specified' 
                      ? <span style={{ color: '#94A3B8' }}>{item.value}</span>
                      : item.value
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RADIOLOGISTS */}
          {patientInfo.radiologists && patientInfo.radiologists.length > 0 && (
            <div className="mr-card mr-full" data-aos="fade-up">
              <div className="mr-card-header">
                <div className="mr-card-icon" style={{ '--ci': '#00BFA6' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                </div>
                <div>
                  <h3 className="mr-card-title">Assigned Radiologists</h3>
                  <p className="mr-card-sub">Healthcare professionals managing your care</p>
                </div>
              </div>

              <div className="mr-radiologists-grid">
                {patientInfo.radiologists.map((radiologist, i) => (
                  <div key={i} className="mr-radiologist-card">
                    <Avatar
                      avatarUrl={radiologist.avatar_url}
                      firstName={radiologist.first_name}
                      lastName={radiologist.last_name}
                      size={48}
                      color="#0066CC"
                      className="mr-radiologist-avatar"
                    />
                    <div className="mr-radiologist-info">
                      <h4 className="mr-radiologist-name">
                        {radiologist.name}
                        {radiologist.is_primary && (
                          <span className="mr-primary-badge">Primary</span>
                        )}
                      </h4>
                      <p className="mr-radiologist-specialty">
                        {radiologist.specialty || 'Radiologist'}
                      </p>
                      <p className="mr-radiologist-email">{radiologist.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;