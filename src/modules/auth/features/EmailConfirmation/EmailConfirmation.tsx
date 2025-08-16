"use client"

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
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
  
  // Add Arabic font class when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  
  // Get URL parameters
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') || '/subjects'
  
  useEffect(() => {
    console.log('EmailConfirmation component mounted')
    console.log('URL search params:', searchParams.toString())
    console.log('Token hash:', tokenHash)
    console.log('Type:', type)
    console.log('Next:', next)
    
    const confirmEmail = async () => {
      try {
        if (!tokenHash || type !== 'email') {
          console.error('Missing token_hash or invalid type')
          setStatus('error')
          setMessage('Invalid confirmation link')
          return
        }

        // Verify the email confirmation
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email'
        })

        if (error) {
                  console.error('Email confirmation error:', error)
        setStatus('error')
        setMessage(error.message || t('auth.emailConfirmation.errorMessage'))
          return
        }

        console.log('✅ Email confirmed successfully')
        setStatus('success')
        setMessage(t('auth.emailConfirmation.successMessage'))
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(next)
        }, 2000)
        
      } catch (err) {
        console.error('Error in email confirmation:', err)
        setStatus('error')
        setMessage(t('auth.emailConfirmation.errorMessage'))
      } finally {
        setLoading(false)
      }
    }
    
    confirmEmail()
  }, [tokenHash, type, next, navigate, searchParams])

  const handleBackToLogin = () => {
    navigate(PATH.LOGIN)
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
            <p>{t('auth.emailConfirmation.confirming')}</p>
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
          {t('auth.emailConfirmation.backToLogin')}
        </button>
        
        <div className="status-container">
          {status === 'success' ? (
            <>
              <CheckCircle size={48} className="success-icon" />
              <h1 className="title">{t('auth.emailConfirmation.successTitle')}</h1>
              <p className="message">{message}</p>
            </>
          ) : (
            <>
              <XCircle size={48} className="error-icon" />
              <h1 className="title">{t('auth.emailConfirmation.errorTitle')}</h1>
              <p className="message">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailConfirmationComponent
