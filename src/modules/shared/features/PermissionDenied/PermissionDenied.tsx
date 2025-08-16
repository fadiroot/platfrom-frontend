import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './_PermissionDenied.scss';

const PermissionDenied: React.FC = () => {
  const { t } = useTranslation('translation');
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToSubjects = () => {
    navigate('/subjects');
  };

  return (
    <div className="permission-denied">
      <div className="permission-denied__container">
        <div className="permission-denied__icon">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        
        <div className="permission-denied__content">
          <h1 className="permission-denied__title">
            {t('permissionDenied.title', 'Access Denied')}
          </h1>
          
          <p className="permission-denied__message">
            {t('permissionDenied.message', 'You do not have permission to access this page. This area is restricted to administrators only.')}
          </p>
          
          <div className="permission-denied__actions">
            <button 
              onClick={handleGoBack}
              className="btn btn-secondary btn-md permission-denied__btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              {t('permissionDenied.goBack', 'Go Back')}
            </button>
            
            <button 
              onClick={handleGoToSubjects}
              className="btn btn-primary btn-md permission-denied__btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              {t('permissionDenied.goToSubjects', 'Go to Subjects')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionDenied;
