import React from 'react';

const Card = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div 
      className={`card ${hover ? 'card:hover' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;