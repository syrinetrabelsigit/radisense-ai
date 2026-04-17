import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { predictionService } from '../../services/predictionService';
import { patientService } from '../../services/patientService';
import '../../styles/pages/radiologist/Upload.css';

const API_URL = 'http://localhost:8000';

const Upload = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [file, setFile]                       = useState(null);
  const [preview, setPreview]                 = useState(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [dragActive, setDragActive]           = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError]                     = useState('');
  const [formData, setFormData]               = useState({ patientId: '', model: 'mobilenet' });
  const [patients, setPatients]               = useState([]);

  const [searchParams] = useSearchParams();
  const pendingId = searchParams.get('pending_id');

  useEffect(() => {
    fetchPatients();
    if (pendingId) loadPendingXray(pendingId);
  }, []);

  const loadPendingXray = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`${API_URL}/api/predict/pending-from-patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) return;
      const data = await r.json();
      const analysis = data.analyses?.find(a => a.id === parseInt(id));
      if (!analysis) return;

      const imgUrl = `${API_URL}/${analysis.image_path.replace(/\\/g, '/')}`;
      setPreview(imgUrl);
      setPendingImageUrl(imgUrl);

      if (analysis.patient?.id) {
        setFormData(f => ({
          ...f,
          patientId: analysis.patient.id,
          notes: analysis.notes || '',
        }));
      }

      const filename = analysis.image_path.split('/').pop().split('\\').pop();
      setFile({ name: filename, size: 0, type: 'image/png', _isPending: true });

    } catch (err) {
      console.error('Failed to load pending xray:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientService.getPatients();
      setPatients(response.patients || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const models = [
    { value: 'mobilenet',    label: t('upload.model.mobilenet')    || 'MobileNet-V2'    },
    { value: 'densenet',     label: t('upload.model.densenet')     || 'DenseNet-121'    },
    { value: 'resnet',       label: t('upload.model.resnet')       || 'ResNet-50'       },
    { value: 'efficientnet', label: t('upload.model.efficientnet') || 'EfficientNet-B0' },
  ];

  const modelInfo = {
    mobilenet:    { auc: '81.1%', speed: '0.16s', desc: '🏆 Best AUC-ROC - Fastest inference', badge: 'Recommended' },
    densenet:     { auc: '79.4%', speed: '0.32s', desc: 'Strong multi-pathology detection',    badge: 'Balanced'    },
    resnet:       { auc: '79.1%', speed: '0.33s', desc: 'Deep architecture - Proven reliable', badge: 'Classic'     },
    efficientnet: { auc: '77.3%', speed: '0.22s', desc: 'Efficient modern architecture',       badge: 'Compact'     },
  };

  const handleDrag = e => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = e => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFile = f => {
    setError('');
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)) {
      setError(t('upload.error.fileType') || 'Invalid file type. Use JPG or PNG.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError(t('upload.error.fileSize') || 'File too large. Max 10MB.');
      return;
    }
    setFile(f);
    setPendingImageUrl(null);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setPendingImageUrl(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError(t('upload.error.noFile') || 'Please select a file.');
      return;
    }
    if (!formData.patientId) {
      setError(t('upload.error.noPatient') || 'Please select a patient.');
      return;
    }

    setLoading(true);

    try {
      let fileToSend = file;

      // Si c'est un pending, on fetch via le proxy backend
      if (file._isPending && pendingImageUrl) {
        try {
          const token = localStorage.getItem('token');
          const localPath = pendingImageUrl.replace(API_URL + '/', '');
          const proxyR = await fetch(
            `${API_URL}/api/predict/image-proxy?path=${encodeURIComponent(localPath)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (proxyR.ok) {
            const blob = await proxyR.blob();
            fileToSend = new File([blob], file.name, { type: blob.type || 'image/png' });
          } else {
            setError('Failed to load the patient image. Please try again.');
            setLoading(false);
            return;
          }
        } catch {
          setError('Failed to load the patient image. Please try again.');
          setLoading(false);
          return;
        }
      }

      const result = await predictionService.uploadAndPredict(
        fileToSend,
        formData.patientId,
        null,  // ✅ Pas de notes à l'upload
        formData.model,
        pendingId ? parseInt(pendingId) : null
      );

      navigate(`/results/${result.id}`);
    } catch (err) {
      console.error('Upload failed:', err);
      if (err.status === 429) {
        setError('🔒 Monthly quota reached. Upgrade your plan to run more analyses.');
      } else {
        setError(err.detail || err.message || 'Analysis failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const upd = (k, v) => setFormData(f => ({ ...f, [k]: v }));
  const mi = modelInfo[formData.model];

  return (
    <div className="up-page">
      <div className="container">

        {/* HEADER */}
        <div className="up-header">
          <div className="up-badge"><div className="up-badge-dot" /><span>AI Radiology</span></div>
          <h1 className="up-title"><span className="up-title-grad">{t('upload.title') || 'Upload & Analyze'}</span></h1>
          <p className="up-subtitle">{t('upload.subtitle') || 'Upload a chest X-ray image for AI-powered analysis'}</p>
        </div>

        {/* PENDING BANNER */}
        {pendingId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', marginBottom: '1.5rem', color: '#F59E0B', fontSize: '0.875rem', fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            X-ray submitted by patient is loaded — select a model and run analysis
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="up-grid">

            {/* LEFT — DROPZONE / PREVIEW */}
            <div className="up-col">
              <div className="up-drop-card">
                {!preview ? (
                  <div
                    className={`up-dropzone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag}
                    onDragOver={handleDrag} onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className={`up-drop-icon-wrap ${dragActive ? 'active' : ''}`}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    </div>
                    <p className="up-drop-text">{t('upload.dragDrop') || 'Drag & drop your X-ray here'}</p>
                    <div className="up-drop-or"><span>{t('upload.or') || 'or'}</span></div>
                    <button type="button" className="up-browse-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      {t('upload.browse') || 'Browse Files'}
                    </button>
                    <div className="up-drop-formats">
                      <span className="up-format-pill">JPG</span>
                      <span className="up-format-pill">PNG</span>
                      <span className="up-format-pill">JPEG</span>
                    </div>
                    <p className="up-drop-hint">{t('upload.supported') || 'Supported formats: JPG, PNG, JPEG (Max 10MB)'}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div className="up-preview">
                    <div className="up-preview-header">
                      <div className="up-preview-title-wrap">
                        <div className="up-preview-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <span className="up-preview-title">
                          {file?._isPending ? 'Patient X-Ray Loaded' : (t('upload.selected') || 'Image Selected')}
                        </span>
                      </div>
                      <button type="button" className="up-remove-btn" onClick={handleRemove}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        {t('upload.remove') || 'Remove'}
                      </button>
                    </div>
                    <div className="up-img-wrap">
                      <img src={preview} alt="Preview" className="up-preview-img" />
                      <div className="up-img-overlay">
                        <span className="up-img-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                          Ready for analysis
                        </span>
                      </div>
                    </div>
                    <div className="up-file-info">
                      <div className="up-file-name">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        {file?.name || 'patient-xray.png'}
                      </div>
                      <div className="up-file-size">
                        {file?._isPending ? 'From patient submission' : `${((file?.size || 0) / 1024 / 1024).toFixed(2)} MB`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ERROR */}
              {error && (
                <div className="up-error" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                  </div>
                  {(error.includes('quota') || error.includes('Upgrade')) && (
                    <a href="/pricing" style={{ color: '#0066CC', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'underline' }}>
                      View upgrade plans →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — FORM */}
            <div className="up-col">
              <div className="up-form-card">

                {/* PATIENT */}
                <div className="up-form-section">
                  <div className="up-form-section-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    {t('upload.selectPatient') || 'Select Patient'}
                  </div>
                  <div className="up-select-wrap">
                    <svg className="up-select-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <select
                      className="up-select"
                      value={formData.patientId}
                      onChange={e => upd('patientId', e.target.value)}
                      required
                      disabled={loadingPatients}
                    >
                      <option value="">
                        {loadingPatients ? 'Loading patients...' : (t('upload.patient.placeholder') || '— Select a patient —')}
                      </option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} ({p.patient_id})
                        </option>
                      ))}
                      <option value="new">{t('upload.patient.new') || '+ Add new patient'}</option>
                    </select>
                  </div>
                </div>

                {/* MODEL */}
                <div className="up-form-section">
                  <div className="up-form-section-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    {t('upload.selectModel') || 'AI Model'}
                  </div>
                  <div className="up-model-grid">
                    {models.map(m => (
                      <button
                        key={m.value}
                        type="button"
                        className={`up-model-btn ${formData.model === m.value ? 'active' : ''}`}
                        onClick={() => upd('model', m.value)}
                      >
                        <div className="up-model-name">{m.label}</div>
                        <div className="up-model-acc">{modelInfo[m.value].auc}</div>
                        {m.value === 'mobilenet' && (
                          <div className="up-model-badge" style={{ position: 'absolute', top: '8px', right: '8px', background: 'linear-gradient(135deg,#10B981,#00BFA6)', color: 'white', fontSize: '9px', padding: '3px 6px', borderRadius: '4px', fontWeight: '600' }}>
                            BEST
                          </div>
                        )}
                        {formData.model === m.value && (
                          <div className="up-model-check">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="up-model-info">
                    <div className="up-mi-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      AUC-ROC: <strong style={{ color: '#10B981' }}>{mi.auc}</strong>
                    </div>
                    <div className="up-mi-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                      Speed: <strong style={{ color: '#0066CC' }}>{mi.speed}</strong>
                    </div>
                    <div className="up-mi-desc">{mi.desc}</div>
                  </div>
                </div>

                {/* NOTES
                <div className="up-form-section">
                  <div className="up-form-section-label">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    {t('upload.notes') || 'Clinical Notes'}
                    <span className="up-optional">optional</span>
                  </div>
                  <textarea
                    className="up-textarea"
                    rows="4"
                    placeholder={t('upload.notesPlaceholder') || 'Describe symptoms, medical history, or relevant context…'}
                    value={formData.notes}
                    onChange={e => upd('notes', e.target.value)}
                  />
                </div> */}

                {/* SUBMIT */}
                <button
                  type="submit"
                  className={`up-submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading || !file || !formData.patientId}
                >
                  {loading ? (
                    <>
                      <div className="up-spinner" />
                      {t('upload.analyzing') || 'Analyzing…'}
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                      {t('upload.analyze') || 'Run AI Analysis'}
                    </>
                  )}
                </button>

                {!file && (
                  <p className="up-hint-text">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Upload an X-ray image to begin analysis
                  </p>
                )}

              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;