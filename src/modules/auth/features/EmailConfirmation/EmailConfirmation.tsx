"use client"

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle, ArrowLeft, LogIn } from 'lucide-react'
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
  
  // Add Arabic font class when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  
  // Get URL parameters - check both search params and hash params
  const tokenHash = searchParams.get('token_hash') || new URLSearchParams(window.location.hash.substring(1)).get('token_hash')
  const type = searchParams.get('type') || new URLSearchParams(window.location.hash.substring(1)).get('type')
  const accessToken = searchParams.get('access_token') || new URLSearchParams(window.location.hash.substring(1)).get('access_token')
  const refreshToken = searchParams.get('refresh_token') || new URLSearchParams(window.location.hash.substring(1)).get('refresh_token')
  const next = searchParams.get('next') || new URLSearchParams(window.location.hash.substring(1)).get('next') || '/subjects'
  
  useEffect(() => {
    console.log('EmailConfirmation component mounted')
    console.log('URL search params:', searchParams.toString())
    console.log('URL hash:', window.location.hash)
    console.log('Token hash:', tokenHash)
    console.log('Type:', type)
    console.log('Access token:', accessToken)
    console.log('Refresh token:', refreshToken)
    console.log('Next:', next)
    
    const confirmEmail = async () => {
      try {
        // First, check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.aud === 'authenticated') {
          console.log('✅ User is already authenticated, redirecting to subjects')
          navigate('/subjects')
          return
        }
        
        // If we have access_token and refresh_token, this might be a signup confirmation
        if (accessToken && refreshToken) {
          console.log('🔗 Setting session with access and refresh tokens')
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (error) {
              console.error('❌ Failed to set session:', error)
              setStatus('error')
              setMessage('Invalid confirmation link. Please try again.')
              setLoading(false)
              return
            }
            
            if (data.session?.user) {
              console.log('✅ Session set successfully, email confirmed')
              setUserEmail(data.session.user.email)
              setStatus('success')
              setMessage(t('auth.emailConfirmation.successMessage', 'Your email has been confirmed successfully! You can now log in to your account.'))
              setIsDirectLoginMode(true)
              setLoading(false)
              return
            }
          } catch (sessionError) {
            console.error('❌ Error setting session:', sessionError)
            setStatus('error')
            setMessage('Invalid confirmation link. Please try again.')
            setLoading(false)
            return
          }
        }
        
        // If we have token_hash and type=email, this is an email confirmation
        if (tokenHash && type === 'email') {
          console.log('🔗 Processing email confirmation token hash')
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email'
            })
            
            if (error) {
              console.error('❌ Email confirmation error:', error)
              setStatus('error')
              setMessage(error.message || t('auth.emailConfirmation.errorMessage', 'Email confirmation failed. Please try again.'))
              setLoading(false)
              return
            }
            
            if (data.user) {
              console.log('✅ Email confirmed successfully')
              setUserEmail(data.user.email)
              setStatus('success')
              setMessage(t('auth.emailConfirmation.successMessage', 'Your email has been confirmed successfully! You can now log in to your account.'))
              setIsDirectLoginMode(true)
              setLoading(false)
              return
            }
          } catch (verifyError) {
            console.error('❌ Error verifying email confirmation:', verifyError)
            setStatus('error')
            setMessage(t('auth.emailConfirmation.errorMessage', 'Email confirmation failed. Please try again.'))
            setLoading(false)
            return
          }
        }
        
        // If we reach here, no valid confirmation parameters found
        console.log('❌ No valid confirmation parameters found')
        setStatus('error')
        setMessage('Invalid confirmation link. Please check your email for the correct link.')
        setLoading(false)
        
      } catch (err) {
        console.error('❌ Error in email confirmation:', err)
        setStatus('error')
        setMessage(t('auth.emailConfirmation.errorMessage', 'Email confirmation failed. Please try again.'))
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
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.aud === 'authenticated') {
        console.log('✅ Direct login successful, redirecting to subjects')
        navigate('/subjects')
      } else {
        // If no valid session, redirect to login
        console.log('❌ No valid session for direct login, redirecting to login')
        navigate(PATH.LOGIN)
      }
    } catch (error) {
      console.error('❌ Error during direct login:', error)
      navigate(PATH.LOGIN)
    }
  }

  if (loading) {
    return (
      <div className={`email-confirmation-module ${isArabic ? 'arabic-fonts' : ''}`}>
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        <div className="email-confirmation-card-container">
          <div className="logo-container">
            <img src={logoImg} alt="Platform Logo" className="logo-image" />
          </div>
          <div className="loading-state">
            <Loader2 size={24} className="spinner" />
            <p>{t('auth.emailConfirmation.confirming', 'Confirming your email...')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`email-confirmation-module ${isArabic ? 'arabic-fonts' : ''}`}>
      <div className="language-selector-container">
        <LanguageSelector />
      </div>
      <div className="email-confirmation-card-container">
        <div className="logo-container">
          <img src={logoImg} alt="Platform Logo" className="logo-image" />
        </div>
        
        <button 
          type="button" 
          className="back-link"
          onClick={handleBackToLogin}
        >
          <ArrowLeft size={16} />
          {t('auth.emailConfirmation.backToLogin', 'Back to Login')}
        </button>
        
        <div className="status-container">
          {status === 'success' ? (
            <>
              <CheckCircle size={48} className="success-icon" />
              <h1 className="title">{t('auth.emailConfirmation.successTitle', 'Email Confirmed!')}</h1>
              <p className="message">{message}</p>
              
              {userEmail && (
                <div className="user-info">
                  <p>Email: <strong>{userEmail}</strong></p>
                </div>
              )}
              
              <div className="action-buttons">
                {isDirectLoginMode ? (
                  <>
                    <button 
                      type="button" 
                      className="submit-button direct-login-button"
                      onClick={handleDirectLogin}
                    >
                      <LogIn size={18} />
                      {t('auth.emailConfirmation.directLogin', 'Login Now')}
                    </button>
                    <button 
                      type="button" 
                      className="secondary-button"
                      onClick={handleBackToLogin}
                    >
                      {t('auth.emailConfirmation.goToLogin', 'Go to Login Page')}
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="submit-button"
                    onClick={handleBackToLogin}
                  >
                    {t('auth.emailConfirmation.goToLogin', 'Go to Login')}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <XCircle size={48} className="error-icon" />
              <h1 className="title">{t('auth.emailConfirmation.errorTitle', 'Confirmation Failed')}</h1>
              <p className="message">{message}</p>
              <div className="action-buttons">
                <button 
                  type="button" 
                  className="submit-button"
                  onClick={handleResendConfirmation}
                >
                  {t('auth.emailConfirmation.resendConfirmation', 'Resend Confirmation')}
                </button>
                <button 
                  type="button" 
                  className="secondary-button"
                  onClick={handleBackToLogin}
                >
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
