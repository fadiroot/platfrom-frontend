import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../shared/components/Modal/Modal';
import './_EmailVerificationModal.scss';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  email 
}) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n?.language === 'ar';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('auth.emailVerificationModal.title')}
      type="success"
      showCloseButton={true}
    >
      <div className={`email-verification-content ${isArabic ? 'arabic-fonts' : ''}`}>
        <div className="verification-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2H2v16h20V2zM2 22l4-4h16l4 4" />
            <path d="M6 9h12" />
            <path d="M6 13h8" />
          </svg>
        </div>
        
        <div className="verification-message">
          <p className="success-message">
            <strong>{t('auth.emailVerificationModal.accountCreated')}</strong>
          </p>
          
          <p className="email-info">
            {t('auth.emailVerificationModal.emailSent')}{' '}
            <strong className="email-highlight">{email}</strong>.
          </p>
          
          <p className="instructions">
            {t('auth.emailVerificationModal.checkEmail')}
          </p>
          
          <p className="spam-note">
            <em>{t('auth.emailVerificationModal.spamNote')}</em>
          </p>
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            {t('auth.emailVerificationModal.gotIt')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EmailVerificationModal;