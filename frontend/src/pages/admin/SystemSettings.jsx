import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../../styles/pages/admin/SystemSettings.css';

const SystemSettings = () => {
  const { t } = useTranslation();
  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [settings, setSettings] = useState({
    general:  { siteName:'RadiSense AI', siteUrl:'https://radisense.ai', adminEmail:'admin@radisense.ai', timezone:'UTC', language:'en', maintenanceMode:false },
    security: { jwtExpiry:'24', maxLoginAttempts:'5', sessionTimeout:'30', twoFactor:true, ipWhitelist:'' },
    ml:       { defaultModel:'DenseNet-121', confidenceThreshold:'80', maxBatchSize:'32', autoRetrain:true, gpuAcceleration:true },
    email:    { smtpHost:'smtp.gmail.com', smtpPort:'587', smtpUser:'notifications@radisense.ai', smtpPassword:'', fromAddress:'noreply@radisense.ai', fromName:'RadiSense AI' },
    storage:  { provider:'local', maxFileSize:'10', allowedFormats:'.jpg, .jpeg, .png, .dcm', compressionEnabled:true, retentionPeriod:'365' },
    backup:   { autoBackup:true, frequency:'daily', retention:'30', location:'/backups/mysql/' },
    notifications: { emailNotifications:true, slackWebhook:'', criticalAlerts:true, weeklyReports:false },
  });

  useEffect(() => {
    AOS.init({ duration: 700, once: true, easing: 'ease-out-cubic' });
  }, []);

  const upd = (section, field, value) => {
    setSettings(s => ({ ...s, [section]: { ...s[section], [field]: value } }));
    setHasChanges(true); setSaved(false);
  };

  const handleSave = () => {
    setSaved(true); setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestEmail = () => {
    setTestEmailSent(true);
    setTimeout(() => setTestEmailSent(false), 3000);
  };

  // Reusable field components
  const Field = ({ label, desc, section, field, type='text', full=false, children }) => (
    <div className={`ss-field ${full ? 'full' : ''}`}>
      <label className="ss-label">{label}</label>
      {desc && <p className="ss-desc">{desc}</p>}
      {children || (
        <input type={type} className="ss-input" value={settings[section][field]}
          onChange={e => upd(section, field, e.target.value)} />
      )}
    </div>
  );

  const UnitField = ({ label, section, field, unit, type='number' }) => (
    <div className="ss-field">
      <label className="ss-label">{label}</label>
      <div className="ss-unit-wrap">
        <input type={type} className="ss-input has-unit" value={settings[section][field]}
          onChange={e => upd(section, field, e.target.value)} />
        <span className="ss-unit">{unit}</span>
      </div>
    </div>
  );

  const Toggle = ({ label, desc, section, field, color='#0066CC' }) => (
    <div className="ss-toggle-row">
      <div className="ss-toggle-info">
        <span className="ss-toggle-label">{label}</span>
        {desc && <p className="ss-desc">{desc}</p>}
      </div>
      <label className="ss-toggle">
        <input type="checkbox" checked={settings[section][field]} onChange={e => upd(section, field, e.target.checked)} />
        <span className="ss-toggle-track" style={{ '--tc': color }}>
          <span className="ss-toggle-thumb" />
        </span>
      </label>
    </div>
  );

  const Select = ({ label, section, field, opts, full=false }) => (
    <div className={`ss-field ${full ? 'full' : ''}`}>
      <label className="ss-label">{label}</label>
      <select className="ss-select" value={settings[section][field]} onChange={e => upd(section, field, e.target.value)}>
        {opts.map(o => <option key={o.val} value={o.val}>{o.lbl}</option>)}
      </select>
    </div>
  );

  const sectionConfigs = [
    { key:'general',  color:'#0066CC', label: t('admin.settings.general.title')  || 'General Settings',  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg> },
    { key:'security', color:'#EF4444', label: t('admin.settings.security.title') || 'Security',          icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { key:'ml',       color:'#8B5CF6', label: t('admin.settings.ml.title')       || 'ML Configuration',  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
    { key:'email',    color:'#10B981', label: t('admin.settings.email.title')     || 'Email / SMTP',      icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
    { key:'storage',  color:'#00BFA6', label: t('admin.settings.storage.title')  || 'Storage',           icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg> },
    { key:'backup',   color:'#F59E0B', label: t('admin.settings.backup.title')   || 'Backup',            icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
  ];

  const getSecCfg = key => sectionConfigs.find(s => s.key === key);

  const CardHeader = ({ sectionKey, extra }) => {
    const cfg = getSecCfg(sectionKey);
    return (
      <div className="ss-card-header" style={{ '--ssh': cfg.color }}>
        <div className="ss-card-icon">{cfg.icon}</div>
        <div className="ss-card-title-wrap">
          <h3 className="ss-card-title">{cfg.label}</h3>
        </div>
        {extra}
      </div>
    );
  };

  return (
    <div className="ss-page">
      <div className="container">

        {/* HEADER */}
        <div className="ss-header" data-aos="fade-down">
          <div>
            <div className="ss-badge"><div className="ss-badge-dot"/><span>Admin Console</span></div>
            <h1 className="ss-title"><span className="ss-title-grad">{t('admin.settings.title') || 'System Settings'}</span></h1>
            <p className="ss-subtitle">{t('admin.settings.subtitle') || 'Configure platform behavior and integrations'}</p>
          </div>
          <div className="ss-header-actions">
            <button className="ss-reset-btn" onClick={() => { if(window.confirm('Reset all settings to default?')) setHasChanges(false); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
              {t('admin.settings.reset') || 'Reset Defaults'}
            </button>
            <button className={`ss-save-btn ${saved ? 'saved' : ''}`} onClick={handleSave} disabled={!hasChanges && !saved}>
              {saved
                ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Saved!</>
                : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>{t('admin.settings.save') || 'Save Changes'}</>
              }
            </button>
          </div>
        </div>

        {/* UNSAVED BANNER */}
        {hasChanges && (
          <div className="ss-changes-banner" data-aos="fade-down">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            You have unsaved changes
            <button className="ss-banner-save" onClick={handleSave}>Save Now</button>
          </div>
        )}

        {/* GENERAL */}
        <div className="ss-card" data-aos="fade-up">
          <CardHeader sectionKey="general" />
          <div className="ss-grid">
            <Field label={t('admin.settings.general.siteName')   || 'Site Name'}      section="general" field="siteName" />
            <Field label={t('admin.settings.general.siteUrl')    || 'Site URL'}       section="general" field="siteUrl" type="url" />
            <Field label={t('admin.settings.general.adminEmail') || 'Admin Email'}    section="general" field="adminEmail" type="email" />
            <Select label={t('admin.settings.general.timezone')  || 'Timezone'}       section="general" field="timezone"
              opts={[{ val:'UTC', lbl:'UTC' }, { val:'America/New_York', lbl:'EST (New York)' }, { val:'Europe/Paris', lbl:'CET (Paris)' }, { val:'Asia/Tokyo', lbl:'JST (Tokyo)' }]} />
            <Select label={t('admin.settings.general.language')  || 'Language'}       section="general" field="language"
              opts={[{ val:'en', lbl:'English' }, { val:'fr', lbl:'Français' }]} />
            <Toggle label={t('admin.settings.general.maintenanceMode') || 'Maintenance Mode'}
              desc="Temporarily disable access for non-admins" section="general" field="maintenanceMode" color="#EF4444" />
          </div>
        </div>

        {/* SECURITY */}
        <div className="ss-card" data-aos="fade-up">
          <CardHeader sectionKey="security" />
          <div className="ss-grid">
            <UnitField label={t('admin.settings.security.jwtExpiry')         || 'JWT Token Expiry'}    section="security" field="jwtExpiry"         unit="hours" />
            <Field     label={t('admin.settings.security.maxLoginAttempts')  || 'Max Login Attempts'}  section="security" field="maxLoginAttempts"  type="number" />
            <UnitField label={t('admin.settings.security.sessionTimeout')    || 'Session Timeout'}     section="security" field="sessionTimeout"    unit="min" />
            <Toggle    label={t('admin.settings.security.twoFactor')         || 'Two-Factor Auth'}     desc="Require 2FA for all admin accounts" section="security" field="twoFactor" color="#EF4444" />
            <div className="ss-field full">
              <label className="ss-label">{t('admin.settings.security.ipWhitelist') || 'IP Whitelist'}</label>
              <p className="ss-desc">Enter allowed IP addresses, one per line</p>
              <textarea className="ss-input ss-textarea" rows="3" placeholder="192.168.1.1&#10;10.0.0.0/24"
                value={settings.security.ipWhitelist} onChange={e => upd('security', 'ipWhitelist', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ML */}
        <div className="ss-card" data-aos="fade-up">
          <CardHeader sectionKey="ml" />
          <div className="ss-grid">
            <Select    label={t('admin.settings.ml.defaultModel')          || 'Default Model'}         section="ml" field="defaultModel"
              opts={[{ val:'DenseNet-121', lbl:'DenseNet-121' }, { val:'ResNet-50', lbl:'ResNet-50' }, { val:'EfficientNet-B4', lbl:'EfficientNet-B4' }]} />
            <UnitField label={t('admin.settings.ml.confidenceThreshold')   || 'Confidence Threshold'}  section="ml" field="confidenceThreshold" unit="%" />
            <Field     label={t('admin.settings.ml.maxBatchSize')          || 'Max Batch Size'}         section="ml" field="maxBatchSize" type="number" />
            <div className="ss-field" />
            <Toggle    label={t('admin.settings.ml.autoRetrain')           || 'Auto Retrain'}          desc="Automatically retrain models weekly"        section="ml" field="autoRetrain"     color="#8B5CF6" />
            <Toggle    label={t('admin.settings.ml.gpuAcceleration')       || 'GPU Acceleration'}      desc="Use GPU hardware for faster inference"       section="ml" field="gpuAcceleration" color="#8B5CF6" />
          </div>
        </div>

        {/* EMAIL */}
        <div className="ss-card" data-aos="fade-up">
          <CardHeader sectionKey="email" extra={
            <button className={`ss-test-email-btn ${testEmailSent ? 'sent' : ''}`} onClick={handleTestEmail}>
              {testEmailSent
                ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Sent!</>
                : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>{t('admin.settings.email.testEmail') || 'Send Test'}</>
              }
            </button>
          } />
          <div className="ss-grid">
            <Field label={t('admin.settings.email.smtpHost')     || 'SMTP Host'}      section="email" field="smtpHost" />
            <Field label={t('admin.settings.email.smtpPort')     || 'SMTP Port'}      section="email" field="smtpPort" type="number" />
            <Field label={t('admin.settings.email.smtpUser')     || 'SMTP Username'}  section="email" field="smtpUser" type="email" />
            <Field label={t('admin.settings.email.smtpPassword') || 'SMTP Password'}  section="email" field="smtpPassword" type="password" />
            <Field label={t('admin.settings.email.fromAddress')  || 'From Address'}   section="email" field="fromAddress" type="email" />
            <Field label={t('admin.settings.email.fromName')     || 'From Name'}      section="email" field="fromName" />
          </div>
        </div>

        {/* STORAGE + BACKUP */}
        <div className="ss-two-col">

          <div className="ss-card" data-aos="fade-right">
            <CardHeader sectionKey="storage" />
            <div className="ss-grid one-col">
              <Select label={t('admin.settings.storage.provider')   || 'Storage Provider'} section="storage" field="provider" full
                opts={[{ val:'local', lbl:'Local Storage' }, { val:'s3', lbl:'AWS S3' }, { val:'azure', lbl:'Azure Blob' }]} />
              <UnitField label={t('admin.settings.storage.maxFileSize') || 'Max File Size'} section="storage" field="maxFileSize" unit="MB" />
              <div className="ss-field full">
                <label className="ss-label">{t('admin.settings.storage.allowedFormats') || 'Allowed Formats'}</label>
                <input className="ss-input" value={settings.storage.allowedFormats} onChange={e => upd('storage', 'allowedFormats', e.target.value)} />
              </div>
              <UnitField label={t('admin.settings.storage.retentionPeriod') || 'Retention Period'} section="storage" field="retentionPeriod" unit="days" />
              <Toggle label={t('admin.settings.storage.compressionEnabled') || 'Image Compression'} desc="Compress uploads to save storage" section="storage" field="compressionEnabled" color="#00BFA6" />
            </div>
          </div>

          <div className="ss-card" data-aos="fade-left">
            <CardHeader sectionKey="backup" />
            <div className="ss-grid one-col">
              <Toggle label={t('admin.settings.backup.autoBackup') || 'Auto Backup'} desc="Enable scheduled automatic backups" section="backup" field="autoBackup" color="#F59E0B" />
              <Select label={t('admin.settings.backup.frequency')  || 'Frequency'}   section="backup" field="frequency"
                opts={[{ val:'hourly', lbl:'Hourly' }, { val:'daily', lbl:'Daily' }, { val:'weekly', lbl:'Weekly' }]} />
              <UnitField label={t('admin.settings.backup.retention') || 'Keep Backups For'} section="backup" field="retention" unit="days" />
              <div className="ss-field full">
                <label className="ss-label">{t('admin.settings.backup.location') || 'Backup Path'}</label>
                <input className="ss-input" value={settings.backup.location} onChange={e => upd('backup', 'location', e.target.value)} />
              </div>
            </div>
          </div>

        </div>

        {/* NOTIFICATIONS */}
        <div className="ss-card" data-aos="fade-up">
          <div className="ss-card-header" style={{ '--ssh': '#6366F1' }}>
            <div className="ss-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <div className="ss-card-title-wrap">
              <h3 className="ss-card-title">{t('admin.settings.notifications.title') || 'Notifications'}</h3>
            </div>
          </div>
          <div className="ss-grid">
            <Toggle label="Email Notifications"   desc="Send system alerts via email"       section="notifications" field="emailNotifications" color="#6366F1" />
            <Toggle label="Critical Alerts"       desc="Immediate alerts for critical events" section="notifications" field="criticalAlerts"     color="#EF4444" />
            <Toggle label="Weekly Reports"        desc="Automated weekly summary reports"   section="notifications" field="weeklyReports"      color="#6366F1" />
            <div className="ss-field">
              <label className="ss-label">Slack Webhook URL</label>
              <input className="ss-input" placeholder="https://hooks.slack.com/…" value={settings.notifications.slackWebhook} onChange={e => upd('notifications', 'slackWebhook', e.target.value)} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SystemSettings;