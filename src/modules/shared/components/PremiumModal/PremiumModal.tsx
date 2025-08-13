import React from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Star, X } from 'lucide-react'
import './PremiumModal.scss'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  onContactAdmin: () => void
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onContactAdmin }) => {
  const { t } = useTranslation('translation')

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
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            {t('premium.cancel')}
          </button>
          <button className="contact-button" onClick={onContactAdmin}>
            {t('premium.contactAdmin')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PremiumModal
