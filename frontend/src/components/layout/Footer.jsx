import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/components/Footer.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <svg width="32" height="32" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0066CC"/>
                    <stop offset="100%" stopColor="#00BFA6"/>
                  </linearGradient>
                </defs>
                <circle cx="19" cy="19" r="17.5" stroke="url(#footerLogoGrad)" strokeWidth="2" fill="none" opacity="0.35"/>
                <path d="M12 27 C12 22 10 20 10 16 C10 12 13 9 16 9 C17.5 9 18.5 10 19 11 C19.5 10 20.5 9 22 9 C25 9 28 12 28 16 C28 20 26 22 26 27"
                  stroke="url(#footerLogoGrad)" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                <polyline points="10,19 13,19 14.5,15 16,23 17.5,17 19,19 22,19 23.5,16 25,22 26.5,19 28,19"
                  stroke="url(#footerLogoGrad)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="footer-logo-text">RadiSense <span className="footer-logo-ai">AI</span></span>
            </div>
            <p className="footer-tagline">{t('footer.tagline') || 'Advanced AI-powered pulmonary radiology diagnostics'}</p>
            <p className="footer-description">{t('footer.description') || 'Empowering radiologists and clinicians with cutting-edge AI tools for faster, more accurate chest X-ray analysis.'}</p>

            <div className="footer-social">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="footer-section">
            <h4 className="footer-title">
              <span className="footer-title-dot" />
              {t('footer.product') || 'Product'}
            </h4>
            <ul className="footer-links">
              <li><Link to="/pathologies">{t('footer.features') || 'Pathologies'}</Link></li>
              <li><Link to="/pricing">{t('footer.pricing') || 'Pricing'}</Link></li>
              <li><a href="https://docs.radisense.ai" target="_blank" rel="noopener noreferrer">{t('footer.documentation') || 'Documentation'}</a></li>
              <li><a href="https://docs.radisense.ai/api" target="_blank" rel="noopener noreferrer">{t('footer.api') || 'API Reference'}</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-section">
            <h4 className="footer-title">
              <span className="footer-title-dot" />
              {t('footer.company') || 'Company'}
            </h4>
            <ul className="footer-links">
              <li><Link to="/about">{t('footer.about') || 'About Us'}</Link></li>
              <li><Link to="/news">{t('footer.blog') || 'News & Research'}</Link></li>
              <li><a href="mailto:careers@radisense.ai">{t('footer.careers') || 'Careers'}</a></li>
              <li><a href="mailto:contact@radisense.ai">{t('footer.contact') || 'Contact'}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h4 className="footer-title">
              <span className="footer-title-dot" />
              {t('footer.legal') || 'Legal'}
            </h4>
            <ul className="footer-links">
              <li><a href="#">{t('footer.privacy') || 'Privacy Policy'}</a></li>
              <li><a href="#">{t('footer.terms') || 'Terms of Service'}</a></li>
              <li><a href="#">{t('footer.security') || 'Security'}</a></li>
            </ul>

            <div className="footer-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>HIPAA Compliant</span>
            </div>
            <div className="footer-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>99.9% Uptime SLA</span>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {new Date().getFullYear()} RadiSense AI. {t('footer.copyright') || 'All rights reserved.'}
          </p>
          <div className="footer-bottom-links">
            <a href="#">{t('footer.privacy') || 'Privacy'}</a>
            <span className="footer-dot">·</span>
            <a href="#">{t('footer.terms') || 'Terms'}</a>
            <span className="footer-dot">·</span>
            <a href="mailto:contact@radisense.ai">{t('footer.contact') || 'Contact'}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;