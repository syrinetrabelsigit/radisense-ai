import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';

/* ── SVG Logo professionnel ── */
const RadiSenseLogo = () => (
  <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0066CC"/>
        <stop offset="100%" stopColor="#00BFA6"/>
      </linearGradient>
    </defs>
    <circle cx="19" cy="19" r="17.5" stroke="url(#logoGrad)" strokeWidth="2" fill="none" opacity="0.35"/>
    <path
      d="M12 27 C12 22 10 20 10 16 C10 12 13 9 16 9 C17.5 9 18.5 10 19 11 C19.5 10 20.5 9 22 9 C25 9 28 12 28 16 C28 20 26 22 26 27"
      stroke="url(#logoGrad)" strokeWidth="1.6" fill="none" strokeLinecap="round"
    />
    <polyline
      points="10,19 13,19 14.5,15 16,23 17.5,17 19,19 22,19 23.5,16 25,22 26.5,19 28,19"
      stroke="url(#logoGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

/* ── Nav icons SVG ── */
const icons = {
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  news: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>,
  pathologies: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  about: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  pricing: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  upload: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  patients: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  analytics: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  records: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>,
  analyses: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  appointments: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  radiologists: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  education: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  datasets: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  experiments: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11l-5 5h16l-5-5V3"/></svg>,
  models: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  visualization: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="22 20 2 20"/></svg>,
  publications: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  partners: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  logs: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>,
  profile: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settingsAlt: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  chevron: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

const Navbar = ({ user, theme, toggleTheme, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setShowProfileMenu(false);
    onLogout();
    navigate('/');
  };

  const getNavLinks = () => {
    const publicLinks = [
      { path: '/',            label: t('nav.home')        || 'Home',        icon: icons.home },
      { path: '/news',        label: t('nav.news')        || 'News',        icon: icons.news },
      { path: '/pathologies', label: t('nav.pathologies') || 'Pathologies', icon: icons.pathologies },
      { path: '/about',       label: t('nav.about')       || 'About',       icon: icons.about },
      { path: '/pricing',     label: t('nav.pricing')     || 'Pricing',     icon: icons.pricing },
      { path: '/partners',    label: t('nav.partners')    || 'Partners', icon: icons.partners },
    ];

    if (!user) return publicLinks;

    const roleSpecificLinks = {
      radiologist: [
        { path: '/dashboard',   label: t('nav.dashboard')   || 'Dashboard',   icon: icons.dashboard },
        { path: '/upload',      label: t('nav.upload')       || 'Upload',      icon: icons.upload },
        { path: '/my-analyses', label: t('nav.myAnalyses')   || 'My Analyses', icon: icons.analyses },
        { path: '/patients',    label: t('nav.patients')     || 'Patients',    icon: icons.patients },
        { path: '/analytics',   label: t('nav.analytics')   || 'Analytics',   icon: icons.analytics },
        { path: '/appointments',label: t('nav.appointments') || 'Appointments',icon: icons.appointments },
        { path: '/pending-xrays', label: 'Pending X-Rays', icon: icons.upload },
      ],
      patient: [
        { path: '/patient/dashboard',    label: t('nav.dashboard')      || 'Dashboard',    icon: icons.dashboard },
        { path: '/patient/records',      label: t('nav.medicalRecords') || 'Records',      icon: icons.records },
        { path: '/patient/analyses',     label: t('nav.myAnalyses')     || 'Analyses',     icon: icons.analyses },
        { path: '/patient/appointments', label: t('nav.appointments')   || 'Appointments', icon: icons.appointments },
        { path: '/patient/radiologists', label: t('nav.radiologists')   || 'Radiologists', icon: icons.radiologists },
        { path: '/patient/education',    label: t('nav.education')      || 'Education',    icon: icons.education },
        { path: '/patient/upload', label: 'Upload X-Ray', icon: icons.upload },
      ],
      researcher: [
        { path: '/researcher/dashboard',   label: t('nav.dashboard')   || 'Dashboard',   icon: icons.dashboard },
        { path: '/researcher/analyses',    label: t('nav.analyses')    || 'Analyses',    icon: icons.analyses },
        { path: '/researcher/experiments', label: t('nav.experiments') || 'Experiments', icon: icons.experiments },
        { path: '/researcher/datasets',    label: t('nav.datasets')    || 'Datasets',    icon: icons.datasets },
      ],
      // ✅ ADMIN - SEULEMENT 4 PAGES ESSENTIELLES (MVP)
      admin: [
        { path: '/admin/dashboard', label: t('nav.dashboard') || 'Dashboard', icon: icons.dashboard },
        { path: '/admin/patients',  label: t('nav.patients')  || 'Patients',  icon: icons.patients },
        { path: '/admin/users',     label: t('nav.users')     || 'Users',     icon: icons.users },
        { path: '/admin/logs',      label: t('nav.logs')      || 'Logs',      icon: icons.logs },
        { path: '/admin/appointments', label: t('nav.appointments'), icon: icons.appointments },
        { path: '/admin/requests', label: t('nav.requests') || 'Requests', icon: icons.records }
      ],
    };

    return roleSpecificLinks[user.role] || [];
  };

  const navLinks = getNavLinks();

  const homePath = user
    ? (user.role === 'radiologist' ? '/dashboard' : `/${user.role}/dashboard`)
    : '/';
  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`navbar navbar-${user?.role || 'public'}`}>
      <div className="container navbar-container">

        {/* LOGO */}
        <Link to={homePath} className="navbar-logo">
          <RadiSenseLogo />
          <span className="logo-text">RadiSense <span className="logo-text-ai">AI</span></span>
        </Link>
        
        {/* ✅ BADGE ROLE */}
        {user && (
          <span className="role-badge" style={{
            display: 'inline-block',
            backgroundColor: '#0066CC',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            marginLeft: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {t('navbar.' + user.role)?.toUpperCase() || user.role.toUpperCase()}
          </span>
        )}

        {/* MOBILE TOGGLE */}
        <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? icons.close : icons.menu}
        </button>

        {/* NAV LINKS */}
        <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {navLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </Link>
          ))}
        </div>

        {/* ACTIONS */}
        <div className="navbar-actions">
          <LanguageSwitcher />
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          {user ? (
            <div className="navbar-user-menu">
              <button className="user-menu-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                    : <>{user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}</>
                  }
                </div>
                <div className="user-info">
                  <span className="user-name">{user.first_name} {user.last_name}</span>
                  <span className="user-role-text">{t('navbar.' + user.role) || user.role}</span>
                </div>
                <span className={`dropdown-arrow ${showProfileMenu ? 'open' : ''}`}>{icons.chevron}</span>
              </button>

              {showProfileMenu && (
                <>
                  <div className="dropdown-overlay" onClick={() => setShowProfileMenu(false)} />
                  <div className="user-dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                        {user.avatar_url
                          ? <img src={user.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }} />
                          : <>{user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}</>
                        }
                      </div>
                      <div>
                        <p className="dropdown-name">{user.first_name} {user.last_name}</p>
                        <p className="dropdown-email">{user.email}</p>
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    <Link to={`/${user.role}/profile`} className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                      <span className="dropdown-icon">{icons.profile}</span>
                      <span>{t('nav.myProfile') || 'My Profile'}</span>
                    </Link>
                    <Link to={`/${user.role}/settings`} className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                      <span className="dropdown-icon">{icons.settingsAlt}</span>
                      <span>{t('nav.accountSettings') || 'Settings'}</span>
                    </Link>

                    <div className="dropdown-divider" />

                    <button onClick={handleLogout} className="dropdown-item logout-item">
                      <span className="dropdown-icon">{icons.logout}</span>
                      <span>{t('nav.logout') || 'Logout'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="navbar-auth-buttons">
              <Link to="/login" className="navbar-login-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                {t('nav.login') || 'Login'}
              </Link>
              <Link to="/register" className="navbar-register-btn">
                {t('nav.register') || 'Get Started'}
                <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                </svg>
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;