import React, { useState } from 'react';

/* ══ CSS intégré ══════════════════════════════════════════════════════════ */
const styles = `
  .toast-container {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    pointer-events: none;
  }

  .toast-item {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 1rem 1.25rem;
    background: var(--bg-card);
    border-radius: 16px;
    border: 1px solid transparent;
    border-left-width: 4px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(20px);
    min-width: 300px;
    max-width: 420px;
    pointer-events: all;
    animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .toast-item.toast-exit {
    animation: toastOut 0.3s ease forwards;
  }

  .toast-item.success {
    border-color: rgba(16, 185, 129, 0.25);
    border-left-color: #10B981;
    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.04) 100%);
  }

  .toast-item.error {
    border-color: rgba(239, 68, 68, 0.25);
    border-left-color: #EF4444;
    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.04) 100%);
  }

  .toast-item.info {
    border-color: rgba(0, 102, 204, 0.25);
    border-left-color: #0066CC;
    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(0, 102, 204, 0.04) 100%);
  }

  .toast-item.warning {
    border-color: rgba(245, 158, 11, 0.25);
    border-left-color: #F59E0B;
    background: linear-gradient(135deg, var(--bg-card) 0%, rgba(245, 158, 11, 0.04) 100%);
  }

  .toast-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toast-item.success .toast-icon { background: rgba(16, 185, 129, 0.12); color: #10B981; }
  .toast-item.error   .toast-icon { background: rgba(239, 68, 68, 0.12);  color: #EF4444; }
  .toast-item.info    .toast-icon { background: rgba(0, 102, 204, 0.12);  color: #60A5FA; }
  .toast-item.warning .toast-icon { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }

  .toast-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .toast-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .toast-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .toast-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 0.2s, background 0.2s;
  }

  .toast-close:hover {
    color: var(--text-primary);
    background: var(--bg-secondary);
  }

  .toast-progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    border-radius: 0 0 16px 16px;
    animation: toastProgress 4s linear forwards;
  }

  .toast-item {
    position: relative;
    overflow: hidden;
  }

  .toast-item.success .toast-progress { background: #10B981; }
  .toast-item.error   .toast-progress { background: #EF4444; }
  .toast-item.info    .toast-progress { background: #0066CC; }
  .toast-item.warning .toast-progress { background: #F59E0B; }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateX(100px) scale(0.85);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  @keyframes toastOut {
    from {
      opacity: 1;
      transform: translateX(0) scale(1);
      max-height: 100px;
      margin-bottom: 0;
    }
    to {
      opacity: 0;
      transform: translateX(100px) scale(0.85);
      max-height: 0;
      margin-bottom: -0.75rem;
    }
  }

  @keyframes toastProgress {
    from { width: 100%; }
    to   { width: 0%; }
  }
`;

/* ══ Hook ════════════════════════════════════════════════════════════════ */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', sub = '') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, sub, type, exiting: false }]);
    setTimeout(() => {
      setToasts(prev =>
        prev.map(t => t.id === id ? { ...t, exiting: true } : t)
      );
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  };

  const toast = {
    success: (msg, sub) => addToast(msg, 'success', sub),
    error:   (msg, sub) => addToast(msg, 'error',   sub),
    info:    (msg, sub) => addToast(msg, 'info',     sub),
    warning: (msg, sub) => addToast(msg, 'warning',  sub),
  };

  return { toasts, toast, removeToast };
};

/* ══ Icônes ══════════════════════════════════════════════════════════════ */
const IconSuccess = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconError = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconWarning = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const iconMap = {
  success: <IconSuccess />,
  error:   <IconError />,
  info:    <IconInfo />,
  warning: <IconWarning />,
};

/* ══ Composant Toast ═════════════════════════════════════════════════════ */
const Toast = ({ toasts, removeToast }) => {
  return (
    <>
      <style>{styles}</style>
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast-item ${t.type} ${t.exiting ? 'toast-exit' : ''}`}
          >
            <div className="toast-icon">
              {iconMap[t.type]}
            </div>

            <div className="toast-body">
              <span className="toast-title">{t.message}</span>
              {t.sub && <span className="toast-sub">{t.sub}</span>}
            </div>

            <button className="toast-close" onClick={() => removeToast(t.id)}>
              <IconClose />
            </button>

            <div className="toast-progress" />
          </div>
        ))}
      </div>
    </>
  );
};

export default Toast;