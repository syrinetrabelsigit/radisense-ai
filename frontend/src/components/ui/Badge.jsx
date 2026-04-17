import React from 'react';

const Badge = ({ children, variant = 'success', className = '' }) => {
  const variantClass = {
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
  }[variant];

  return (
    <span className={`badge ${variantClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;