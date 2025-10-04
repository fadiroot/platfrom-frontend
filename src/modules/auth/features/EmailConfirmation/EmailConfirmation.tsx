'use client'

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, ArrowLeft, LogIn } from 'lucide-react'
import SimpleLoader from '../../../shared/components/SimpleLoader/SimpleLoader'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '../../../shared/store'
import { PATH } from '../../routes/paths'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector'
import { supabase } from '../../../../lib/supabase'
import './_EmailConfirmation.scss'
import logoImg from '/logo/astuceLogo.png'

const EmailConfirmationComponent = () => {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isDirectLoginMode, setIsDirectLoginMode] = useState(false)

  // Add Arabic font class and RTL direction when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  const isRTL = isArabic

  // Get URL parameters - check both search params and hash params
  const tokenHash =
    searchParams.get('token_hash') ||
    new URLSearchParams(window.location.hash.substring(1)).get('token_hash')
  const type =
    searchParams.get('type') || new URLSearchParams(window.location.hash.substring(1)).get('type')
  const accessToken =
    searchParams.get('access_token') ||
    new URLSearchParams(window.location.hash.substring(1)).get('access_token')
  const refreshToken =
    searchParams.get('refresh_token') ||
    new URLSearchParams(window.location.hash.substring(1)).get('refresh_token')
  const next =
    searchParams.get('next') ||
    new URLSearchParams(window.location.hash.substring(1)).get('next') ||
    '/subjects'

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // First, check if user is already authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user?.aud === 'authenticated') {
          setUserEmail(session.user.email)
          setStatus('success')
          setMessage(
            t(
              'auth.emailConfirmation.successMessage',
              'Your account has been confirmed successfully! You can now log in to your account.'
            )
          )
          setIsDirectLoginMode(true)
          setLoading(false)
          return
        }

        // If we have access_token and refresh_token, this might be a signup confirmation
        if (accessToken && refreshToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (error) {
              setStatus('error')
              setMessage('Invalid confirmation link. Please try again.')
              setLoading(false)
              return
            }

            if (data.session?.user) {
              setUserEmail(data.session.user.email)
              setStatus('success')
              setMessage(
                t(
                  'auth.emailConfirmation.successMessage',
                  'Your account has been confirmed successfully! You can now log in to your account.'
                )
              )
              setIsDirectLoginMode(true)
              setLoading(false)
              return
            }
          } catch (sessionError) {
            setStatus('error')
            setMessage('Invalid confirmation link. Please try again.')
            setLoading(false)
            return
          }
        }

        // If we have token_hash and type=email, this is an email confirmation
        if (tokenHash && type === 'email') {
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email',
            })

            if (error) {
              setStatus('error')
              setMessage(
                error.message ||
                  t(
                    'auth.emailConfirmation.errorMessage',
                    'Email confirmation failed. Please try again.'
                  )
              )
              setLoading(false)
              return
            }

            if (data.user) {
              setUserEmail(data.user.email)
              setStatus('success')
              setMessage(
                t(
                  'auth.emailConfirmation.successMessage',
                  'Your account has been confirmed successfully! You can now log in to your account.'
                )
              )
              setIsDirectLoginMode(true)
              setLoading(false)
              return
            }
          } catch (verifyError) {
            setStatus('error')
            setMessage(
              t(
                'auth.emailConfirmation.errorMessage',
                'Email confirmation failed. Please try again.'
              )
            )
            setLoading(false)
            return
          }
        }

        // If we reach here, no valid confirmation parameters found
        setStatus('error')
        setMessage('Invalid confirmation link. Please check your email for the correct link.')
        setLoading(false)
      } catch (err) {
        setStatus('error')
        setMessage(
          t('auth.emailConfirmation.errorMessage', 'Email confirmation failed. Please try again.')
        )
        setLoading(false)
      }
    }

    confirmEmail()
  }, [tokenHash, type, accessToken, refreshToken, next, navigate, searchParams, t])

  const handleBackToLogin = () => {
    navigate(PATH.LOGIN)
  }

  const handleResendConfirmation = () => {
    navigate(PATH.REGISTER)
  }

  const handleDirectLogin = async () => {
    try {
      // For direct login, we'll use the current session that was established
      // during the email confirmation process
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user?.aud === 'authenticated') {
        // Check if user is admin and route accordingly
        const isAdmin =
          session.user.user_metadata?.role === 'admin' ||
          session.user.user_metadata?.role === 'super_admin' ||
          session.user.app_metadata?.role === 'admin' ||
          session.user.app_metadata?.role === 'super_admin'

        if (isAdmin) {
          navigate('/admin')
        } else {
          navigate('/subjects')
        }
      } else {
        // If no valid session, redirect to login
        navigate(PATH.LOGIN)
      }
    } catch (error) {
      navigate(PATH.LOGIN)
    }
  }

  if (loading) {
    return (
      <div 
        className={`email-confirmation-module ${isArabic ? 'arabic-fonts' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        <div className="email-confirmation-card-container">
          <div className="logo-container">
            <img src={logoImg} alt="Platform Logo" className="logo-image" />
          </div>
          <div className="loading-state">
            <SimpleLoader size={24} />
            <p>{t('auth.emailConfirmation.confirming', 'Confirming your email...')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`email-confirmation-module ${isArabic ? 'arabic-fonts' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="language-selector-container">
        <LanguageSelector />
      </div>
      <div className="email-confirmation-card-container">
        <div className="logo-container">
          <img src={logoImg} alt="Platform Logo" className="logo-image" />
        </div>

        <button type="button" className="back-link" onClick={handleBackToLogin}>
          <ArrowLeft size={16} />
          {t('auth.emailConfirmation.backToLogin', 'Back to Login')}
        </button>

        <div className="status-container">
          {status === 'success' ? (
            <>
              <CheckCircle size={48} className="success-icon" />
              <h1 className="title">
                {t('auth.emailConfirmation.successTitle', 'Account Confirmed!')}
              </h1>
              <p className="message">{message}</p>

              {userEmail && (
                <div className="user-info">
                  <p>
                    Email: <strong>{userEmail}</strong>
                  </p>
                </div>
              )}

              <div className="action-buttons">
                {isDirectLoginMode ? (
                  <button
                    type="button"
                    className="submit-button direct-login-button"
                    onClick={handleDirectLogin}
                  >
                    <LogIn size={18} />
                    {t('auth.emailConfirmation.directLogin', 'Login Now')}
                  </button>
                ) : (
                  <button type="button" className="submit-button" onClick={handleBackToLogin}>
                    {t('auth.emailConfirmation.goToLogin', 'Go to Login')}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <XCircle size={48} className="error-icon" />
              <h1 className="title">
                {t('auth.emailConfirmation.errorTitle', 'Confirmation Failed')}
              </h1>
              <p className="message">{message}</p>
              <div className="action-buttons">
                <button type="button" className="submit-button" onClick={handleResendConfirmation}>
                  {t('auth.emailConfirmation.resendConfirmation', 'Resend Confirmation')}
                </button>
                <button type="button" className="secondary-button" onClick={handleBackToLogin}>
                  {t('auth.emailConfirmation.backToLogin', 'Back to Login')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailConfirmationComponent
