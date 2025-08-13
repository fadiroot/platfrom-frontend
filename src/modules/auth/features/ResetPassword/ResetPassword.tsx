"use client"

import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../shared/store'
import { resetUserPassword } from '../../data/authThunk'
import { clearResetPasswordState } from '../../data/authSlice'
import { PATH } from '../../routes/paths'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector'
import { handlePasswordResetRecovery } from '../../../../lib/api/auth'
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
  const [loading, setLoading] = useState(true)
  
  const { resetPasswordStatus, resetPasswordMessage } = useAppSelector((state) => state.auth)
  
  // Get access token from URL parameters
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')
  
  useEffect(() => {
    console.log('ResetPassword component mounted')
    console.log('URL search params:', searchParams.toString())
    console.log('Access token:', accessToken)
    console.log('Refresh token:', refreshToken)
    
    // Clear any previous reset password state when component mounts
    dispatch(clearResetPasswordState())
    
    const checkRecoveryMode = async () => {
      try {
        // Add a small delay to ensure URL parameters are processed
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const { user, error } = await handlePasswordResetRecovery()
        
        if (error) {
          console.error('Error checking recovery mode:', error)
          navigate(PATH.FORGOT_PASSWORD)
          return
        }
        
        if (user) {
          // Check if user is in recovery mode
          const session = await import('../../../../lib/api/auth').then(module => module.getCurrentSession())
          if (session?.user?.aud === 'recovery') {
            console.log('User is in recovery mode, allowing password reset')
            setIsRecoveryMode(true)
          } else {
            console.log('User is authenticated but not in recovery mode, redirecting to subjects')
            navigate('/subjects')
            return
          }
        } else if (!accessToken) {
          console.log('No user or access token found, redirecting to forgot password')
          navigate(PATH.FORGOT_PASSWORD)
          return
        }
      } catch (err) {
        console.error('Error in recovery mode check:', err)
        navigate(PATH.FORGOT_PASSWORD)
        return
      } finally {
        setLoading(false)
      }
    }
    
    checkRecoveryMode()
  }, [accessToken, dispatch, navigate, searchParams])
  
  useEffect(() => {
    if (resetPasswordStatus === 'succeeded') {
      // Redirect to login page after successful password reset
      // User needs to log in manually with their new password
      setTimeout(() => {
        navigate(PATH.LOGIN)
      }, 2000) // Give user time to read the success message
    }
  }, [resetPasswordStatus, navigate])

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      console.log('Form submitted with values:', { password: '***', confirmPassword: '***' })
      
      if (isRecoveryMode || accessToken) {
        console.log('Dispatching resetUserPassword...')
        dispatch(resetUserPassword({
          password: values.password,
          accessToken,
          refreshToken
        }))
      } else {
        console.error('No recovery mode or access token available for password reset')
      }
    },
  })

  const handleBackToLogin = () => {
    dispatch(clearResetPasswordState())
    navigate(PATH.LOGIN)
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