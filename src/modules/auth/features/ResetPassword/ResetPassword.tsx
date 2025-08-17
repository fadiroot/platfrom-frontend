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
  const [isAuthenticatedUserMode, setIsAuthenticatedUserMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
  const { resetPasswordStatus, resetPasswordMessage } = useAppSelector((state) => state.auth)
  
  // Get URL parameters - check both search params and hash params
  const accessToken = searchParams.get('access_token') || new URLSearchParams(window.location.hash.substring(1)).get('access_token')
  const refreshToken = searchParams.get('refresh_token') || new URLSearchParams(window.location.hash.substring(1)).get('refresh_token')
  const tokenHash = searchParams.get('token_hash') || new URLSearchParams(window.location.hash.substring(1)).get('token_hash')
  const type = searchParams.get('type') || new URLSearchParams(window.location.hash.substring(1)).get('type')
  
  // Check for error parameters in URL hash
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const errorCode = hashParams.get('error_code')
  const errorDescription = hashParams.get('error_description')
  
  useEffect(() => {
    // Clear any previous reset password state when component mounts
    dispatch(clearResetPasswordState())
    setError(null)
    setSuccess(null)
    
    // Check for error parameters first
    if (errorCode) {
      let errorMessage = 'Invalid reset link. Please request a new password reset.'
      
      if (errorCode === 'otp_expired') {
        errorMessage = 'The password reset link has expired. Please request a new password reset.'
      } else if (errorCode === 'access_denied') {
        errorMessage = 'Access denied. The reset link is invalid or has expired.'
      } else if (errorDescription) {
        errorMessage = decodeURIComponent(errorDescription)
      }
      
      setError(errorMessage)
      setSuccess(null)
      setLoading(false)
      return
    }
    
    const checkRecoveryMode = async () => {
      try {
        // Add a small delay to ensure URL parameters are processed
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // First, check if we have reset password parameters - these take priority
        if (tokenHash && type === 'recovery') {
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery'
            })
            
            if (error) {
              setError('Invalid or expired recovery link. Please request a new password reset.')
              setSuccess(null)
              setLoading(false)
              return
            }
            
            if (data.user) {
              setIsRecoveryMode(true)
              setUserEmail(data.user.email)
              setLoading(false)
              return
            }
          } catch (verifyError) {
            setError('Invalid recovery link. Please request a new password reset.')
            setSuccess(null)
            setLoading(false)
            return
          }
        }
        
        // If we have access_token and refresh_token, try to set the session
        if (accessToken && refreshToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            
            if (error) {
              setError('Invalid reset link. Please request a new password reset.')
              setSuccess(null)
              setLoading(false)
              return
            }
            
            if (data.session?.user?.aud === 'recovery') {
              setIsRecoveryMode(true)
              setUserEmail(data.session.user.email)
              setLoading(false)
              return
            } else if (data.session?.user?.aud === 'authenticated') {
              navigate('/subjects')
              return
            } else {
              setError('Invalid reset link. Please request a new password reset.')
              setSuccess(null)
              setLoading(false)
              return
            }
          } catch (sessionError) {
            setError('Invalid reset link. Please request a new password reset.')
            setSuccess(null)
            setLoading(false)
            return
          }
        }
        
        // Only check existing session if we don't have reset password parameters
        if (!tokenHash && !accessToken && !refreshToken) {
          // First, try to get the current session
          const session = await getCurrentSession()
          
          // If user is already authenticated (not in recovery mode), allow them to change password
          if (session?.user?.aud === 'authenticated') {
            setIsAuthenticatedUserMode(true)
            setUserEmail(session.user.email)
            setLoading(false)
            return
          }
          
          if (session?.user?.aud === 'recovery') {
            setIsRecoveryMode(true)
            setUserEmail(session.user.email)
            setLoading(false)
            return
          }
        }
        
        // If we reach here, no valid recovery parameters found
        setError('Invalid reset link. Please request a new password reset.')
        setSuccess(null)
        setLoading(false)
        
      } catch (err) {
        setError('An error occurred while processing the reset link.')
        setSuccess(null)
        setLoading(false)
      }
    }
    
    checkRecoveryMode()
  }, [accessToken, refreshToken, tokenHash, type, errorCode, errorDescription, dispatch, navigate])
  
  useEffect(() => {
    if (resetPasswordStatus === 'succeeded') {
      // Show success message and offer direct login option
      if (isRecoveryMode) {
        setIsDirectLoginMode(true)
      } else if (isAuthenticatedUserMode) {
        // For authenticated users, show success and redirect to dashboard
        setError(null) // Clear any existing error
        setSuccess('Password updated successfully! Redirecting to dashboard...')
        setTimeout(() => {
          navigate('/subjects')
        }, 2000)
      }
    }
  }, [resetPasswordStatus, isRecoveryMode, isAuthenticatedUserMode, navigate])

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      
      if (isRecoveryMode) {
        dispatch(resetUserPassword({
          password: values.password,
          accessToken,
          refreshToken
        }))
      } else if (isAuthenticatedUserMode) {
        dispatch(resetUserPassword({
          password: values.password
        }))
      } else {
        setError('Unable to reset password. Please request a new reset link.')
        setSuccess(null)
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
      setSuccess(null)
      return
    }

    try {
      // For direct login, we'll use the current session that was established
      // during the password reset process
      const session = await getCurrentSession()
      
      if (session?.user?.aud === 'authenticated') {
        navigate('/subjects')
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
    // Check if this is the "already authenticated" case
    const isAlreadyAuthenticated = error.includes('already logged in')
    
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
            <h1 className="title">
              {isAlreadyAuthenticated 
                ? t('auth.resetPassword.alreadyLoggedIn', 'Already Logged In') 
                : t('auth.resetPassword.errorTitle', 'Invalid Reset Link')
              }
            </h1>
            <p className="error-message">{error}</p>
            
            {isAlreadyAuthenticated ? (
              <div className="action-buttons">
                <button 
                  type="button" 
                  className="submit-button"
                  onClick={() => {
                    setError(null)
                    setLoading(true)
                    // Allow them to proceed with password reset as authenticated user
                    setIsAuthenticatedUserMode(true)
                    setUserEmail('fadiromdhan2@gmail.com') // You might want to get this from session
                    setLoading(false)
                  }}
                >
                  {t('auth.resetPassword.setNewPassword', 'Set New Password')}
                </button>
                
                <button 
                  type="button" 
                  className="secondary-button"
                  onClick={() => navigate('/subjects')}
                >
                  {t('auth.resetPassword.goToDashboard', 'Go to Dashboard')}
                </button>
                
                <button 
                  type="button" 
                  className="secondary-button"
                  onClick={() => navigate('/login')}
                >
                  {t('auth.resetPassword.goToLogin', 'Go to Login')}
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                className="submit-button"
                onClick={handleRequestNewReset}
              >
                {t('auth.resetPassword.requestNewReset', 'Request New Reset Link')}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (success) {
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
              {success}
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
        
        <h1 className="title">
          {isAuthenticatedUserMode 
            ? t('auth.resetPassword.changePassword', 'Change Password') 
            : t('auth.resetPassword.title', 'Reset Password')
          }
        </h1>
        <p className="subtitle">
          {isAuthenticatedUserMode 
            ? t('auth.resetPassword.changePasswordSubtitle', 'Enter your new password below.') 
            : t('auth.resetPassword.subtitle', 'Enter your new password below.')
          }
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
                {isAuthenticatedUserMode 
                  ? t('auth.resetPassword.updating', 'Updating...') 
                  : t('auth.resetPassword.updating', 'Updating...')
                }
              </>
            ) : (
              isAuthenticatedUserMode 
                ? t('auth.resetPassword.changePassword', 'Change Password') 
                : t('auth.resetPassword.submit', 'Update Password')
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