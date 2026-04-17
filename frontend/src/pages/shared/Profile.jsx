import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Avatar from './Avatar';
import '../../styles/pages/shared/Profile.css';

const API = 'http://localhost:8000';

const SectionHeader = ({ color, icon, title, subtitle }) => (
  <div className="pf-section-header">
    <div className="pf-section-icon" style={{ '--sc': color }}>{icon}</div>
    <div>
      <h3 className="pf-section-title">{title}</h3>
      <p className="pf-section-sub">{subtitle}</p>
    </div>
  </div>
);

const Field = ({ label, fieldKey, type = 'text', fullWidth = false, textarea = false, required = false, editing, profileData, upd, emptyLabel }) => (
  <div className={`pf-field ${fullWidth ? 'full' : ''}`}>
    <label className="pf-label">
      {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
    </label>
    {editing
      ? textarea
        ? <textarea className="pf-input pf-textarea" rows="4" value={profileData[fieldKey]} onChange={e => upd(fieldKey, e.target.value)} />
        : <input type={type} className="pf-input" value={profileData[fieldKey]} onChange={e => upd(fieldKey, e.target.value)} />
      : <div className="pf-value">{profileData[fieldKey] || <span className="pf-empty">{emptyLabel}</span>}</div>
    }
  </div>
);

const Profile = ({ user, onUserUpdate }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [editing, setEditing]                   = useState(false);
  const [saving, setSaving]                     = useState(false);
  const [uploadingAvatar, setUploadingAvatar]   = useState(false);
  const [avatarUrl, setAvatarUrl]               = useState(user?.avatar_url || null);
  const [saveError, setSaveError]               = useState('');
  const [saveSuccess, setSaveSuccess]           = useState('');
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState(null);

  const [profileData, setProfileData] = useState({
    firstName:      user?.first_name       || '',
    lastName:       user?.last_name        || '',
    email:          user?.email            || '',
    phone:          user?.phone            || '',
    bio:            user?.bio              || '',
    city:           user?.city             || '',
    country:        user?.country          || '',
    yearsExp:       user?.years_experience || '',
    specialty:      user?.specialty        || '',
    license:        user?.license_number   || '',
    cabinetName:    user?.cabinet_name     || '',
    cabinetAddress: user?.cabinet_address  || '',
    cabinetPhone:   user?.cabinet_phone    || '',
    region:         user?.region           || '',
    institution:    user?.institution      || '',
    orcid:          user?.orcid            || '',
  });

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
  }, []);

  const upd = (k, v) => setProfileData(p => ({ ...p, [k]: v }));

  const roleConfig = {
    radiologist: {
      color: '#0066CC', label: 'Radiologist',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    },
    researcher: {
      color: '#8B5CF6', label: 'Researcher',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    },
    patient: {
      color: '#10B981', label: 'Patient',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    },
    admin: {
      color: '#EF4444', label: 'Admin',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    },
  };
  const rc = roleConfig[user?.role] || roleConfig.patient;

  const handleSave = async () => {
    setSaving(true); setSaveError(''); setSaveSuccess('');
    try {
      const token = localStorage.getItem('token');
      const body = {
        first_name:       profileData.firstName,
        last_name:        profileData.lastName,
        phone:            profileData.phone,
        bio:              profileData.bio,
        city:             profileData.city,
        country:          profileData.country,
        years_experience: profileData.yearsExp,
        specialty:        profileData.specialty,
        license_number:   profileData.license,
        cabinet_name:     profileData.cabinetName,
        cabinet_address:  profileData.cabinetAddress,
        cabinet_phone:    profileData.cabinetPhone,
        region:           profileData.region,
        institution:      profileData.institution,
        orcid:            profileData.orcid,
      };
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed'); }

      if (onUserUpdate) onUserUpdate({
        first_name:       profileData.firstName,
        last_name:        profileData.lastName,
        phone:            profileData.phone,
        bio:              profileData.bio,
        city:             profileData.city,
        country:          profileData.country,
        years_experience: profileData.yearsExp,
        specialty:        profileData.specialty,
        license_number:   profileData.license,
        cabinet_name:     profileData.cabinetName,
        cabinet_address:  profileData.cabinetAddress,
        cabinet_phone:    profileData.cabinetPhone,
        region:           profileData.region,
        institution:      profileData.institution,
        orcid:            profileData.orcid,
      });

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        first_name:       profileData.firstName,
        last_name:        profileData.lastName,
        phone:            profileData.phone,
        bio:              profileData.bio,
        city:             profileData.city,
        country:          profileData.country,
        years_experience: profileData.yearsExp,
        specialty:        profileData.specialty,
        license_number:   profileData.license,
        cabinet_name:     profileData.cabinetName,
        cabinet_address:  profileData.cabinetAddress,
        cabinet_phone:    profileData.cabinetPhone,
        region:           profileData.region,
        institution:      profileData.institution,
        orcid:            profileData.orcid,
      }));

      setSaveSuccess(t('profile.saveSuccess'));
      setEditing(false);
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAvatarUrl(previewUrl);
    setUploadingAvatar(true); setSaveError(''); setSaveSuccess('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/api/users/profile/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Upload failed'); }
      const data = await res.json();
      setAvatarUrl(data.avatar_url);
      setPendingAvatarUrl(data.avatar_url);
      setSaveSuccess(t('profile.photoUploaded'));
    } catch (err) {
      setAvatarUrl(user?.avatar_url || null);
      setSaveError(err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="pf-page">
      <div className="container">

        {/* HEADER */}
        <div className="pf-header" data-aos="fade-down">
          <div>
            <div className="pf-badge">
              <div className="pf-badge-dot" />
              <span>{t('profile.badge')}</span>
            </div>
            <h1 className="pf-title">
              <span className="pf-title-grad">{t('profile.title')}</span>
            </h1>
            <p className="pf-subtitle">{t('profile.subtitle')}</p>
          </div>
          <div className="pf-header-actions">
            {saveError   && <span style={{ color:'#EF4444', fontSize:'0.82rem' }}>{saveError}</span>}
            {saveSuccess && <span style={{ color:'#10B981', fontSize:'0.82rem' }}>{saveSuccess}</span>}
            {editing && (
              <button className="pf-cancel-btn" onClick={() => { setEditing(false); setSaveError(''); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                {t('profile.cancel')}
              </button>
            )}
            <button className={`pf-edit-btn ${editing ? 'save' : ''}`} onClick={editing ? handleSave : () => setEditing(true)} disabled={saving}>
              {saving ? t('profile.saving') : editing
                ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{t('profile.saveChanges')}</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>{t('profile.editProfile')}</>
              }
            </button>
          </div>
        </div>

        <div className="pf-grid">

          {/* LEFT — Avatar card */}
          <div className="pf-avatar-card" data-aos="fade-right">

            <div className="pf-avatar-wrap" style={{ position:'relative', display:'inline-block' }}>
              <Avatar
                avatarUrl={avatarUrl}
                firstName={profileData.firstName}
                lastName={profileData.lastName}
                size={96}
                color={rc.color}
                className="pf-avatar"
              />
              <div className="pf-avatar-ring" />
              {uploadingAvatar && (
                <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
                  <div style={{ width:22, height:22, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'pf-spin 0.7s linear infinite' }} />
                </div>
              )}
            </div>

            <h2 className="pf-name">{profileData.firstName} {profileData.lastName}</h2>

            <div className="pf-role-pill" style={{ color:rc.color, background:`color-mix(in srgb, ${rc.color} 12%, transparent)`, border:`1px solid color-mix(in srgb, ${rc.color} 25%, transparent)` }}>
              {rc.icon}{rc.label}
            </div>

            <div style={{ marginTop:'1.25rem', width:'100%', textAlign:'center' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display:'none' }}
                onChange={handleAvatarChange}
              />
              <button className="pf-photo-btn" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                {uploadingAvatar ? t('profile.uploading') : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    {avatarUrl ? t('profile.changePhoto') : t('profile.uploadPhoto')}
                  </>
                )}
              </button>
              {pendingAvatarUrl && (
                <button
                  className="pf-photo-btn"
                  style={{ marginTop:'0.5rem', background:'linear-gradient(135deg,#10B981,#00BFA6)', border:'none' }}
                  onClick={() => {
                    if (onUserUpdate) onUserUpdate({ avatar_url: pendingAvatarUrl });
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    localStorage.setItem('user', JSON.stringify({ ...currentUser, avatar_url: pendingAvatarUrl }));
                    setPendingAvatarUrl(null);
                    setSaveSuccess(t('profile.photoSaved'));
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {t('profile.savePhoto')}
                </button>
              )}
              {user?.role === 'radiologist' && !avatarUrl && (
                <p style={{ fontSize:'0.72rem', color:'#EF4444', marginTop:'0.5rem' }}>
                  {t('profile.photoRequired')}
                </p>
              )}
              <p style={{ fontSize:'0.7rem', color:'#64748B', marginTop:'0.375rem' }}>
                {t('profile.photoHint')}
              </p>
            </div>

            <div className="pf-avatar-info">
              {profileData.email && (
                <div className="pf-av-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <span>{profileData.email}</span>
                </div>
              )}
              {profileData.phone && (
                <div className="pf-av-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  <span>{profileData.phone}</span>
                </div>
              )}
              {profileData.city && profileData.country && (
                <div className="pf-av-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>{profileData.city}, {profileData.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Info card */}
          <div className="pf-info-card" data-aos="fade-left">

            <div className="pf-section">
              <SectionHeader
                color="#0066CC"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                title={t('profile.sections.personal.title')}
                subtitle={t('profile.sections.personal.subtitle')}
              />
              <div className="pf-fields-grid">
                <Field label={t('profile.fields.firstName')} fieldKey="firstName" editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                <Field label={t('profile.fields.lastName')}  fieldKey="lastName"  editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                <Field label={t('profile.fields.email')}     fieldKey="email" type="email" editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                <Field label={t('profile.fields.phone')}     fieldKey="phone" type="tel"   editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                <Field label={t('profile.fields.city')}      fieldKey="city"    editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                <Field label={t('profile.fields.country')}   fieldKey="country" editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                <Field label={t('profile.fields.bio')}       fieldKey="bio" fullWidth textarea editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
              </div>
            </div>

            {user?.role === 'radiologist' && (<>
              <div className="pf-section">
                <SectionHeader
                  color="#0066CC"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                  title={t('profile.sections.medical.title')}
                  subtitle={t('profile.sections.medical.subtitle')}
                />
                <div className="pf-fields-grid">
                  <Field label={t('profile.fields.specialty')} fieldKey="specialty" required editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                  <Field label={t('profile.fields.license')}   fieldKey="license"   required editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                  <Field label={t('profile.fields.yearsExp')}  fieldKey="yearsExp"  editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                  <Field label={t('profile.fields.region')}    fieldKey="region"    editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                </div>
              </div>

              <div className="pf-section">
                <SectionHeader
                  color="#00BFA6"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                  title={t('profile.sections.cabinet.title')}
                  subtitle={t('profile.sections.cabinet.subtitle')}
                />
                <div className="pf-fields-grid">
                  <Field label={t('profile.fields.cabinetName')}    fieldKey="cabinetName"    fullWidth editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                  <Field label={t('profile.fields.cabinetAddress')} fieldKey="cabinetAddress" fullWidth editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                  <Field label={t('profile.fields.cabinetPhone')}   fieldKey="cabinetPhone" type="tel" editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                </div>
              </div>
            </>)}

            {user?.role === 'researcher' && (
              <div className="pf-section">
                <SectionHeader
                  color="#8B5CF6"
                  icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
                  title={t('profile.sections.research.title')}
                  subtitle={t('profile.sections.research.subtitle')}
                />
                <div className="pf-fields-grid">
                  <Field label={t('profile.fields.institution')}      fieldKey="institution" fullWidth editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                  <Field label={t('profile.fields.orcid')}            fieldKey="orcid"       editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                  <Field label={t('profile.fields.yearsExpResearch')} fieldKey="yearsExp"    editing={editing} profileData={profileData} upd={upd} emptyLabel={t('profile.notProvided')} />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      <style>{`@keyframes pf-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Profile;