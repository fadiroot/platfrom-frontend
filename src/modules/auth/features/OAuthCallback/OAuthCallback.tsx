'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '../../../../modules/shared/store'
import { handleOAuthCallbackThunk } from '../../data/authThunk'
import { PATH } from '../../routes/paths'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector'
import './_OAuthCallback.scss'
import logoImg from '/logo/astuceLogo.png'

const OAuthCallbackComponent = () => {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  // Add Arabic font class when Arabic language is selected
  const isArabic = i18n?.language === 'ar'

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        setLoading(true)
        setStatus('loading')
        setMessage(t('auth.oauthCallback.processing', 'Processing authentication...'))

        // Dispatch the OAuth callback thunk
        const result = await dispatch(handleOAuthCallbackThunk()).unwrap()

        if (result.user) {
          setStatus('success')
          setMessage(t('auth.oauthCallback.success', 'Authentication successful!'))

          console.log('OAuth callback result:', result.user)

          // Check if user needs to complete their profile
          if (result.user.needsProfileCompletion) {
            console.log('User needs profile completion, redirecting to:', PATH.PROFILE_COMPLETION)
            // Redirect to profile completion page immediately
            navigate(PATH.PROFILE_COMPLETION)
          } else {
            console.log('User profile is complete, checking admin status')
            // Check if user is admin and route accordingly
            if (
              result.user?.isAdmin ||
              result.user?.role === 'admin' ||
              result.user?.role === 'super_admin'
            ) {
              // Redirect admin users to admin panel immediately
              navigate('/admin')
            } else {
              // Navigate regular users to subjects page immediately
              navigate('/subjects')
            }
          }
        } else {
          throw new Error('No user data returned')
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setMessage(
          error?.message || 
          t('auth.oauthCallback.error', 'Authentication failed. Please try again.')
        )
      } finally {
        setLoading(false)
      }
    }

    handleOAuthCallback()
  }, [dispatch, navigate, t])

  return (
    <div className={`oauth-callback-module ${isArabic ? 'arabic-fonts' : ''}`}>
      <div className="language-selector-container">
        <LanguageSelector />
      </div>

      <div className="oauth-callback-card-container">
        <div className="logo-container">
          <img src={logoImg} alt="Platform Logo" className="logo-image" />
        </div>

        <h1 className="title">{t('auth.oauthCallback.title', 'Authentication')}</h1>

        <div className="status-container">
          {loading && (
            <div className="loading-state">
              <Loader2 size={48} className="spinner" />
              <p className="message">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="success-state">
              <CheckCircle size={48} className="success-icon" />
              <p className="message">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="error-state">
              <XCircle size={48} className="error-icon" />
              <p className="message">{message}</p>
              <button 
                className="retry-button"
                onClick={() => window.location.href = PATH.LOGIN}
              >
                {t('auth.oauthCallback.retry', 'Try Again')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OAuthCallbackComponent
