'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle } from 'lucide-react'
import SimpleLoader from '../../../shared/components/SimpleLoader/SimpleLoader'
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
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  // Add Arabic font class and RTL direction when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  const isRTL = isArabic

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
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
      }
    }

    handleOAuthCallback()
  }, [dispatch, navigate, t])

  return (
    <div className={`oauth-callback-module ${isArabic ? 'arabic-fonts' : ''} ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="language-selector-container">
        <LanguageSelector />
      </div>

      {status === 'loading' && (
        <div className="loading-container">
          <SimpleLoader size={80} />
        </div>
      )}

      {status === 'success' && (
        <div className="success-container">
          <CheckCircle size={64} className="success-icon" />
          <p className="message">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="error-container">
          <XCircle size={64} className="error-icon" />
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
  )
}

export default OAuthCallbackComponent
