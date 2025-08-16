import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './_NotFound.scss';

const NotFound: React.FC = () => {
  const { t } = useTranslation('translation');
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToSubjects = () => {
    navigate('/subjects');
  };

  const handleExploreSubjects = () => {
    navigate('/subjects');
  };

  return (
    <div className="not-found">
      <div className="not-found__container">
        <div className="not-found__icon">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
            <path d="M12 2a10 10 0 0 1 10 10" />
            <path d="M12 2a10 10 0 0 0-10 10" />
          </svg>
        </div>
        
        <div className="not-found__content">
          <div className="not-found__error-code">404</div>
          
          <h1 className="not-found__title">
            {t('notFound.title', 'Page Not Found')}
          </h1>
          
          <p className="not-found__message">
            {t('notFound.message', 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.')}
          </p>
          
          <div className="not-found__suggestions">
            <h3 className="not-found__suggestions-title">
              {t('notFound.suggestions.title', 'What you can do:')}
            </h3>
            <ul className="not-found__suggestions-list">
              <li>{t('notFound.suggestions.checkUrl', 'Check the URL for any typing errors')}</li>
              <li>{t('notFound.suggestions.goBack', 'Go back to the previous page')}</li>
              <li>{t('notFound.suggestions.explore', 'Explore our learning materials')}</li>
            </ul>
          </div>
          
          <div className="not-found__actions">
            <button 
              onClick={handleGoBack}
              className="btn btn-secondary btn-md not-found__btn"
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
              {t('notFound.goBack', 'Go Back')}
            </button>
            
            <button 
              onClick={handleGoToSubjects}
              className="btn btn-primary btn-md not-found__btn"
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
              {t('notFound.goToSubjects', 'Go to Subjects')}
            </button>
            
            <button 
              onClick={handleExploreSubjects}
              className="btn btn-outlined-primary btn-md not-found__btn"
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
              {t('notFound.explore', 'Explore Subjects')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
