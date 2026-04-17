import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/components/LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  // ✅ FIX: Gérer les codes de langue avec région (en-GB, fr-FR, etc.)
  const getCurrentLanguageCode = () => {
    const lang = i18n.language || 'en';
    // Extrait juste 'en' de 'en-GB' ou 'fr' de 'fr-FR'
    return lang.split('-')[0];
  };

  const currentLangCode = getCurrentLanguageCode();
  const currentLang = languages.find(lang => lang.code === currentLangCode) || languages[0];

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code); // ✅ Sauvegarde dans localStorage
    setIsOpen(false);
  };

  return (
    <div className="language-switcher">
      <button 
        className="lang-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="lang-flag">{currentLang.flag}</span>
        <span className="lang-code">{currentLang.code.toUpperCase()}</span>
      </button>
      
      {isOpen && (
        <div className="lang-dropdown">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`lang-option ${currentLangCode === lang.code ? 'active' : ''}`}
              onClick={() => changeLang(lang.code)}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;