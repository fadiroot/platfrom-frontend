"use client"

import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Loader2, ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../shared/store'
import { resetUserPassword, login } from '../../data/authThunk'
import { clearResetPasswordState } from '../../data/authSlice'
import { PATH } from '../../routes/paths'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector'
import { handlePasswordResetRecovery, getCurrentSession } from '../../../../lib/api/auth'
import { supabase } from '../../../../lib/supabase'
import './_ResetPassword.scss'
import logoImg from '/logo/astuceLogo.png'

const validationSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
})

const initialValues = {
  password: '',
  confirmPassword: '',
}

const ResetPasswordComponent = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [isDirectLoginMode, setIsDirectLoginMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
  const { resetPasswordStatus, resetPasswordMessage } = useAppSelector((state) => state.auth)
  
  // Get URL parameters - check both search params and hash params
  const accessToken = searchParams.get('access_token') || new URLSearchParams(window.location.hash.substring(1)).get('access_token')
  const refreshToken = searchParams.get('refresh_token') || new URLSearchParams(window.location.hash.substring(1)).get('refresh_token')
  const tokenHash = searchParams.get('token_hash') || new URLSearchParams(window.location.hash.substring(1)).get('token_hash')
  const type = searchParams.get('type') || new URLSearchParams(window.location.hash.substring(1)).get('type')
  
  useEffect(() => {
    console.log('ResetPassword component mounted')
    console.log('URL search params:', searchParams.toString())
    console.log('URL hash:', window.location.hash)
    console.log('Access token:', accessToken)
    console.log('Refresh token:', refreshToken)
    console.log('Token hash:', tokenHash)
    console.log('Type:', type)
    
    // Clear any previous reset password state when component mounts
    dispatch(clearResetPasswordState())
    
    const checkRecoveryMode = async () => {
      try {
        // Add a small delay to ensure URL parameters are processed
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // First, try to get the current session
        const session = await getCurrentSession()
        console.log('Current session:', session)
        
        // If user is already authenticated (not in recovery mode), redirect them
        if (session?.user?.aud === 'authenticated') {
          console.log('✅ User is already authenticated, redirecting to subjects')
          navigate('/subjects')
          return
        }
        
        if (session?.user?.aud === 'recovery') {
          console.log('✅ User is in recovery mode, allowing password reset')
          setIsRecoveryMode(true)
          setUserEmail(session.user.email)
          setLoading(false)
          return
        }
        
        // If we have token_hash and type=recovery, this is a recovery link
        if (tokenHash && type === 'recovery') {
          console.log('🔗 Processing recovery token hash')
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery'
            })
            
            if (error) {
              console.error('❌ Recovery token verification failed:', error)
              setError('Invalid or expired recovery link. Please request a new password reset.')
              setLoading(false)
              return
            }
            
            if (data.user) {
              console.log('✅ Recovery token verified, user in recovery mode')
              setIsRecoveryMode(true)
              setUserEmail(data.user.email)
              setLoading(false)
              return
            }
          } catch (verifyError) {
            console.error('❌ Error verifying recovery token:', verifyError)
            setError('Invalid recovery link. Please request a new password reset.')
            setLoading(false)
            return
          }
        }
        
        // If we have access_token and refresh_token, try to set the session
        if (accessToken && refreshToken) {
          console.log('🔗 Setting session with access and refresh tokens')
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (error) {
              console.error('❌ Failed to set session:', error)
              setError('Invalid reset link. Please request a new password reset.')
              setLoading(false)
              return
            }
            
            if (data.session?.user?.aud === 'recovery') {
              console.log('✅ Session set successfully, user in recovery mode')
              setIsRecoveryMode(true)
              setUserEmail(data.session.user.email)
              setLoading(false)
              return
            } else if (data.session?.user?.aud === 'authenticated') {
              console.log('✅ User is authenticated, redirecting to subjects')
              navigate('/subjects')
              return
            } else {
              console.log('❌ User not in recovery mode after setting session')
              setError('Invalid reset link. Please request a new password reset.')
              setLoading(false)
              return
            }
          } catch (sessionError) {
            console.error('❌ Error setting session:', sessionError)
            setError('Invalid reset link. Please request a new password reset.')
            setLoading(false)
            return
          }
        }
        
        // If we reach here, no valid recovery parameters found
        console.log('❌ No valid recovery parameters found')
        setError('Invalid reset link. Please request a new password reset.')
        setLoading(false)
        
      } catch (err) {
        console.error('❌ Error in recovery mode check:', err)
        setError('An error occurred while processing the reset link.')
        setLoading(false)
      }
    }
    
    checkRecoveryMode()
  }, [accessToken, refreshToken, tokenHash, type, dispatch, navigate])
  
  useEffect(() => {
    if (resetPasswordStatus === 'succeeded') {
      // Show success message and offer direct login option
      setIsDirectLoginMode(true)
    }
  }, [resetPasswordStatus])

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      console.log('Form submitted with values:', { password: '***', confirmPassword: '***' })
      
      if (isRecoveryMode) {
        console.log('Dispatching resetUserPassword...')
        dispatch(resetUserPassword({
          password: values.password,
          accessToken,
          refreshToken
        }))
      } else {
        console.error('No recovery mode available for password reset')
        setError('Unable to reset password. Please request a new reset link.')
      }
    },
  })

  const handleBackToLogin = () => {
    dispatch(clearResetPasswordState())
    navigate(PATH.LOGIN)
  }

  const handleRequestNewReset = () => {
    dispatch(clearResetPasswordState())
    navigate(PATH.FORGOT_PASSWORD)
  }

  const handleDirectLogin = async () => {
    if (!userEmail) {
      setError('No email available for direct login')
      return
    }

    try {
      // For direct login, we'll use the current session that was established
      // during the password reset process
      const session = await getCurrentSession()
      
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
      <div className="reset-password-module">
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        <div className="reset-password-card-container">
          <div className="logo-container">
            <img src={logoImg} alt="Platform Logo" className="logo-image" />
          </div>
          <div className="loading-state">
            <Loader2 size={24} className="spinner" />
            <p>{t('auth.resetPassword.checkingLink', 'Checking reset link...')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reset-password-module">
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        <div className="reset-password-card-container">
          <div className="logo-container">
            <img src={logoImg} alt="Platform Logo" className="logo-image" />
          </div>
          
          <button 
            type="button" 
            className="back-link"
            onClick={handleBackToLogin}
          >
            <ArrowLeft size={16} />
            {t('auth.resetPassword.backToLogin', 'Back to Login')}
          </button>
          
          <div className="error-container">
            <h1 className="title">{t('auth.resetPassword.errorTitle', 'Invalid Reset Link')}</h1>
            <p className="error-message">{error}</p>
            <button 
              type="button" 
              className="submit-button"
              onClick={handleRequestNewReset}
            >
              {t('auth.resetPassword.requestNewReset', 'Request New Reset Link')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isDirectLoginMode) {
    return (
      <div className="reset-password-module">
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        <div className="reset-password-card-container">
          <div className="logo-container">
            <img src={logoImg} alt="Platform Logo" className="logo-image" />
          </div>
          
          <button 
            type="button" 
            className="back-link"
            onClick={handleBackToLogin}
          >
            <ArrowLeft size={16} />
            {t('auth.resetPassword.backToLogin', 'Back to Login')}
          </button>
          
          <div className="success-container">
            <h1 className="title">{t('auth.resetPassword.successTitle', 'Password Updated!')}</h1>
            <p className="success-message">
              {t('auth.resetPassword.successMessage', 'Your password has been successfully updated.')}
            </p>
            
            <div className="action-buttons">
              <button 
                type="button" 
                className="submit-button direct-login-button"
                onClick={handleDirectLogin}
              >
                <LogIn size={18} />
                {t('auth.resetPassword.directLogin', 'Login Now')}
              </button>
              
              <button 
                type="button" 
                className="secondary-button"
                onClick={handleBackToLogin}
              >
                {t('auth.resetPassword.goToLogin', 'Go to Login Page')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-module">
      <div className="language-selector-container">
        <LanguageSelector />
      </div>
      <div className="reset-password-card-container">
        <div className="logo-container">
          <img src={logoImg} alt="Platform Logo" className="logo-image" />
        </div>
        
        <button 
          type="button" 
          className="back-link"
          onClick={handleBackToLogin}
        >
          <ArrowLeft size={16} />
          {t('auth.resetPassword.backToLogin', 'Back to Login')}
        </button>
        
        <h1 className="title">{t('auth.resetPassword.title', 'Reset Password')}</h1>
        <p className="subtitle">
          {t('auth.resetPassword.subtitle', 'Enter your new password below.')}
        </p>

        {userEmail && (
          <div className="user-info">
            <p>Email: <strong>{userEmail}</strong></p>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="input-group">
            <label htmlFor="password" className="label">
              {t('auth.resetPassword.newPassword', 'New Password')} *
            </label>
            <div className="password-input-container">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.resetPassword.passwordPlaceholder', 'Enter your new password')}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`input ${formik.touched.password && formik.errors.password ? 'error' : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className="error-text">{formik.errors.password}</div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword" className="label">
              {t('auth.resetPassword.confirmPassword', 'Confirm Password')} *
            </label>
            <div className="password-input-container">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('auth.resetPassword.confirmPasswordPlaceholder', 'Confirm your new password')}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`input ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'error' : ''}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <div className="error-text">{formik.errors.confirmPassword}</div>
            )}
          </div>

          {resetPasswordStatus === 'failed' && resetPasswordMessage && (
            <div className="error-message">
              {resetPasswordMessage}
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button" 
            disabled={resetPasswordStatus === 'loading' || !formik.isValid}
          >
            {resetPasswordStatus === 'loading' ? (
              <>
                <Loader2 size={18} className="spinner" />
                {t('auth.resetPassword.updating', 'Updating...')}
              </>
            ) : (
              t('auth.resetPassword.submit', 'Update Password')
            )}
          </button>
        </form>

        <div className="login-link">
          <Link to={PATH.LOGIN}>
            {t('auth.resetPassword.rememberPassword', 'Remember your password?')} {t('auth.resetPassword.signIn', 'Sign In')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordComponent