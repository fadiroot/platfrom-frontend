'use client'

import type React from 'react'

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import SimpleLoader from '../../../shared/components/SimpleLoader/SimpleLoader'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '../../../../modules/shared/store'
import { login, loginWithGoogle } from '../../data/authThunk'
import { PATH } from '../../routes/paths'
import ErrorModal from '../../components/ErrorModal'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector'
import './_Login.scss'
import logoImg from '/logo/astuceLogo.png'

// Enhanced Input Component with better UX
interface InputProps {
  name: string
  formik: any
  placeholder?: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
}

const Input = ({
  name,
  formik,
  placeholder,
  label,
  type = 'text',
  required,
  autoComplete,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
  
  const isTouched = formik.touched[name]
  const hasError = formik.errors[name]
  const hasValue = formik.values[name]
  const showError = isTouched && hasInteracted && hasError
  const showSuccess = isTouched && hasInteracted && hasValue && !hasError
  const isInvalid = showError || (required && hasInteracted && !hasValue)

  const handleBlur = (e: React.FocusEvent) => {
    setHasInteracted(true)
    formik.handleBlur(e)
  }

  return (
    <div className="Input-component-wrapper">
      <label htmlFor={name} className="label">
        {label} {required && <span className="required-asterisk">*</span>}
      </label>
      <div className={`input-container ${isInvalid ? 'error' : ''} ${showSuccess ? 'success' : ''}`}>
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={handleBlur}
          className="input force-ltr-placeholder"
          style={{
            '--placeholder-direction': 'ltr',
            '--placeholder-text-align': 'left'
          } as React.CSSProperties}
        />
        <div className="input-icons">
          {isInvalid && <AlertCircle size={16} className="error-icon" />}
          {showSuccess && <CheckCircle size={16} className="success-icon" />}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      </div>
      {showError && (
        <div className="error-message">
          {formik.errors[name]}
        </div>
      )}
    </div>
  )
}

// Custom Button Component to match your original styling
interface ButtonProps {
  type?: 'button' | 'submit'
  label?: string
  loading?: boolean
  children?: React.ReactNode
}

const Button = ({ type = 'button', label, loading, children }: ButtonProps) => {
  return (
    <button type={type} className="Button-component" disabled={loading}>
      {loading ? (
        <>
          <SimpleLoader size={18} />
          {label || children}
        </>
      ) : (
        label || children
      )}
    </button>
  )
}

const initialValues = {
  email: '',
  password: '',
}

const LoginComponent = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { t, i18n } = useTranslation()

  // Add Arabic font class and RTL direction when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  const isRTL = isArabic

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      email: Yup.string()
        .email(t('auth.login.validation.emailInvalid'))
        .required(t('auth.login.validation.emailRequired')),
      password: Yup.string()
        .required(t('auth.login.validation.passwordRequired'))
        .min(6, t('auth.login.validation.passwordMinLength')),
    }),
    validateOnMount: false,
    validateOnChange: false, // Don't validate on every change
    validateOnBlur: false,   // Don't validate on blur initially
    onSubmit: (values) => {
      setSubmitting(true)
      dispatch(login(values))
        .unwrap()
        .then((result) => {
          console.log('Login result:', result.user)

          // Check if user needs to complete their profile
          if (result.user?.needsProfileCompletion) {
            console.log('User needs profile completion, redirecting to:', PATH.PROFILE_COMPLETION)
            navigate(PATH.PROFILE_COMPLETION)
            return
          }

          // Check if user is admin and route accordingly
          if (
            result.user?.isAdmin ||
            result.user?.role === 'admin' ||
            result.user?.role === 'super_admin'
          ) {
            // Redirect admin users to admin panel
            navigate('/admin')
          } else {
            // Navigate regular users to subjects page
            navigate('/subjects')
          }
        })
        .catch((err) => {
          setErrorMessage(err?.message || 'Login failed')
          setShowError(true)
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
  })

  const handleGoogleSignIn = async () => {
    setGoogleSubmitting(true)
    try {
      await dispatch(loginWithGoogle()).unwrap()
      // The redirect will happen automatically
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign-in failed')
      setShowError(true)
      setGoogleSubmitting(false)
    }
  }

  return (
    <div 
      className={`login-module ${isArabic ? 'arabic-fonts' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="language-selector-container">
        <LanguageSelector />
      </div>

      <div className="login-card-container">
        <div className="logo-container">
          <img src={logoImg} alt="Platform Logo" className="logo-image" />
        </div>

        <h1 className="title">{t('auth.login.title')}</h1>
        <p className="subtitle">{t('auth.login.subtitle')}</p>

        <form onSubmit={formik.handleSubmit} noValidate>
          <Input
            name="email"
            formik={formik}
            placeholder={t('auth.login.emailPlaceholder')}
            label={t('auth.login.email')}
            required
            autoComplete="email"
          />

          <Input
            name="password"
            formik={formik}
            type="password"
            placeholder={t('auth.login.passwordPlaceholder')}
            label={t('auth.login.password')}
            required
            autoComplete="current-password"
          />

          <div className="forgot-password-link">
            <Link to={PATH.FORGOT_PASSWORD} className="link">
              {t('auth.login.forgot')}
            </Link>
          </div>

          <Button type="submit" label={t('auth.login.submit')} loading={submitting} />
        </form>

        <div className="divider">
          <span className="divider-text">{t('auth.login.or', 'or')}</span>
        </div>

        <button
          type="button"
          className="google-signin-button"
          onClick={handleGoogleSignIn}
          disabled={googleSubmitting}
        >
          {googleSubmitting ? (
            <SimpleLoader size={18} />
          ) : (
            <svg className="google-icon" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {googleSubmitting ? t('auth.login.googleSigningIn', 'Signing in...') : t('auth.login.googleSignIn', 'Continue with Google')}
        </button>

        <Link to={PATH.REGISTER} className="signup-link">
          {t('auth.login.noAccount')} {t('auth.login.createAccount')}
        </Link>
      </div>

      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        title={t('auth.login.title')}
        message={errorMessage}
      />
    </div>
  )
}

export default LoginComponent
