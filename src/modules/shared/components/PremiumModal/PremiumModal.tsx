import React from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Star, X, Phone, Mail, Facebook } from 'lucide-react'
import './PremiumModal.scss'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  onContactAdmin?: () => void // Made optional since we're not using it anymore
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('translation')

  const handleFacebookContact = () => {
    window.open('https://www.facebook.com/profile.php?id=61579018360994', '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <div className="premium-icon">
              <Star className="star-icon" />
            </div>
            <h2 className="modal-title">{t('premium.title')}</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            <X className="close-icon" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          <div className="lock-icon-container">
            <Lock className="lock-icon" />
          </div>
          
          <div className="content-text">
            <p className="main-message">{t('premium.message')}</p>
            <p className="sub-message">{t('premium.subMessage')}</p>
          </div>

          {/* Contact Information */}
          <div className="contact-info">
            <h3 className="contact-title">{t('premium.contactTitle', 'Contact Information')}</h3>
            <div className="contact-details">
              <div className="contact-item">
                <Phone className="contact-icon" />
                <div className="contact-text">
                  <span className="contact-label">{t('premium.phoneLabel', 'Phone Number')}:</span>
                  <span className="contact-value">29191239</span>
                </div>
              </div>
              <div className="contact-item">
                <Mail className="contact-icon" />
                <div className="contact-text">
                  <span className="contact-label">{t('premium.emailLabel', 'Email')}:</span>
                  <span className="contact-value">astuce.elerning@gmail.com</span>
                </div>
              </div>
              <div className="contact-item">
                <Facebook className="contact-icon" />
                <div className="contact-text">
                  <span className="contact-label">{t('premium.facebookLabel', 'Facebook')}:</span>
                  <span className="contact-value facebook-link" onClick={handleFacebookContact}>
                    {t('premium.facebookLink', 'Visit our Facebook page')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            {t('premium.cancel')}
          </button>
          <button className="facebook-button" onClick={handleFacebookContact}>
            <Facebook className="facebook-icon" />
            {t('premium.contactFacebook', 'Contact on Facebook')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PremiumModal
