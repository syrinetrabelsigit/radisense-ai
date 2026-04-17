import React from 'react';

const Loader = ({ size = 'md', text = '' }) => {
  const sizeClass = {
    sm: '32px',
    md: '48px',
    lg: '64px',
  }[size];

  return (
    <div className="flex flex-col flex-center gap-4" style={{ minHeight: '200px' }}>
      <div 
        className="loader"
        style={{
          width: sizeClass,
          height: sizeClass,
          border: '4px solid rgba(0, 102, 204, 0.1)',
          borderTop: '4px solid var(--primary-blue)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && <p className="text-center">{text}</p>}
    </div>
  );
};

// Add spinner animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default Loader;