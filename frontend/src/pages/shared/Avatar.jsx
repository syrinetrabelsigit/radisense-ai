import React from 'react';

/**
 * Avatar — composant réutilisable partout dans l'app.
 * Affiche la photo Cloudinary si disponible, sinon les initiales en couleur.
 *
 * Props:
 *   avatarUrl   — URL Cloudinary (string | null)
 *   firstName   — prénom
 *   lastName    — nom de famille
 *   size        — taille en px (default: 40)
 *   color       — couleur de fond pour les initiales (default: '#0066CC')
 *   className   — classes CSS additionnelles
 *   style       — styles inline additionnels
 */
const Avatar = ({
  avatarUrl,
  firstName = '',
  lastName = '',
  size = 40,
  color = '#0066CC',
  className = '',
  style = {},
}) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  const fontSize =
    size < 32 ? '0.6rem'
    : size < 48 ? '0.8rem'
    : size < 64 ? '1rem'
    : size < 96 ? '1.25rem'
    : '1.75rem';

  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  if (avatarUrl) {
    return (
      <div className={`avatar-photo ${className}`} style={base}>
        <img
          src={avatarUrl}
          alt={`${firstName} ${lastName}`.trim()}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            // Si l'image Cloudinary échoue → afficher les initiales
            e.target.style.display = 'none';
            e.target.parentNode.style.background = `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, #00BFA6))`;
            e.target.parentNode.innerHTML = `<span style="color:white;font-size:${fontSize};font-weight:800;">${initials}</span>`;
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`avatar-initials ${className}`}
      style={{
        ...base,
        background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, #00BFA6))`,
        color: 'white',
        fontSize,
        fontWeight: 800,
        letterSpacing: '0.02em',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;