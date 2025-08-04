import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store'
import { logout } from '../../../auth/data/authThunk'
import ThemeButton from '../ThemeButton/ThemeButton'
import { useTranslation } from 'react-i18next'
import './StudentHeader.scss'
import logoImg from '../../assets/images/Black & Blue Minimalist Modern Initial Font Logo (3).png'
import enFlagIcon from '../../assets/icons/navbar/en-flag.png'
import frFlagIcon from '../../assets/icons/navbar/fr-flag.png'
import arFlagIcon from '../../assets/icons/navbar/ar-flag.png'

const StudentHeader: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { t, i18n } = useTranslation('translation')
  const [lang, setLang] = useState(i18n?.language?.toString() || 'en')
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  const handleLogoClick = () => {
    navigate('/subjects')
  }

  const onChangeLanguage = (language: string) => {
    i18n.changeLanguage(language)
    setLang(language)
    setShowLanguageDropdown(false)
  }

  const getCurrentFlag = () => {
    switch (lang) {
      case 'fr': return frFlagIcon
      case 'ar': return arFlagIcon
      default: return enFlagIcon
    }
  }

  const languages = [
    { code: 'en', name: t('language.en'), flag: enFlagIcon },
    { code: 'fr', name: t('language.fr'), flag: frFlagIcon },
    { code: 'ar', name: t('language.ar'), flag: arFlagIcon }
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="student-header">
      <div className="student-header__container">
        {/* Logo and Brand */}
        <div className="student-header__brand" onClick={handleLogoClick}>
          <img 
            src={logoImg} 
            alt="Platform Logo" 
            className="student-header__logo"
          />
          <div className="student-header__brand-text">
            <h1 className="student-header__title">المنصة لي تنجحك</h1>
            <p className="student-header__subtitle">Educational Excellence Platform</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="student-header__actions">
          {/* Language Switcher */}
          <div className="student-header__language-switcher" ref={dropdownRef}>
            <button 
              className="language-selector"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              title="Change Language"
            >
              <img 
                src={getCurrentFlag()} 
                alt="Current Language" 
                className="current-flag"
              />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            
            {showLanguageDropdown && (
              <div className="language-dropdown">
                {languages.map((language) => (
                  <div
                    key={language.code}
                    className={`language-item ${lang === language.code ? 'active' : ''}`}
                    onClick={() => onChangeLanguage(language.code)}
                  >
                    <img 
                      src={language.flag} 
                      alt={language.name} 
                      className="language-flag" 
                    />
                    <span className="language-name">{language.name}</span>
                    {lang === language.code && (
                      <div className="language-active-indicator">✓</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <ThemeButton />
          
          {user && (
            <div className="student-header__user">
              <span className="student-header__username">
                {user.name || user.email}
              </span>
              <button 
                className="student-header__logout"
                onClick={handleLogout}
                title="Logout"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default StudentHeader