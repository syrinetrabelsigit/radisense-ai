// frontend/src/pages/public/RegisterComplete.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const RegisterComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const pending = JSON.parse(localStorage.getItem('pendingAccessRequest') || '{}');

    if (!sessionId || !pending.email) { navigate('/register'); return; }

    fetch('http://localhost:8000/api/access-requests/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:              pending.name,
        email:             pending.email,
        institution:       pending.institution,
        role:              pending.role,
        message:           pending.message,
        plan:              pending.plan,
        billing:           pending.billing || 'monthly',
        stripe_session_id: sessionId,
      })
    })
    .then(r => r.json())
    .then(() => {
      localStorage.removeItem('pendingAccessRequest');
      setStatus('success');
    })
    .catch(() => setStatus('error'));
  }, []);

  if (status === 'processing') return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-primary)' }}>Processing your request...</div>;
  if (status === 'error') return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#EF4444' }}>Something went wrong. Contact support.</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem', color: 'var(--text-primary)' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#10B981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <h2 style={{ fontWeight: 900 }}>Payment Confirmed!</h2>
      <p style={{ color: '#64748B' }}>Your request has been submitted. We'll review it within 48 hours and send you your credentials.</p>
      <button onClick={() => navigate('/')} style={{ padding: '0.75rem 2rem', borderRadius: '12px', background: 'linear-gradient(135deg,#0066CC,#00BFA6)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
        Back to Home
      </button>
    </div>
  );
};
export default RegisterComplete;