import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '../../../shared/store'
import { requestPasswordReset } from '../../data/authThunk'
import { PATH } from '../../routes/paths'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector'
import './_ForgotPassword.scss'
import logoImg from '/logo/astuceLogo.png'

const initialValues = {
  email: '',
}

const ForgotPassword = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    }),
    onSubmit: async (values) => {
      setSubmitting(true)
      setError('')
      
      try {
        await dispatch(requestPasswordReset(values.email)).unwrap()
        setSuccess(true)
      } catch (err: any) {
        setError(err.message || 'Failed to send reset email')
      } finally {
        setSubmitting(false)
      }
    },
  })

  if (success) {
    return (
      <div className="forgot-password-module">
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        
        <div className="forgot-password-card-container">
          <div className="logo-container">
            <img src={logoImg} alt="Platform Logo" className="logo-image" />
          </div>
          
          <h1 className="title">{t('auth.forgotPassword.checkEmail', 'Check Your Email')}</h1>
          <p className="subtitle">
            {t('auth.forgotPassword.emailSent', 'We have sent a password reset link to your email address.')}
          </p>
          
          <div className="success-message">
            <p>{t('auth.forgotPassword.instructions', 'Please check your email and follow the instructions to reset your password.')}</p>
          </div>
          
          <Link to={PATH.LOGIN} className="back-to-login">
            <ArrowLeft size={18} />
            {t('auth.forgotPassword.backToLogin', 'Back to Login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-module">
      <div className="language-selector-container">
        <LanguageSelector />
      </div>
      
      <div className="forgot-password-card-container">
        <div className="logo-container">
          <img src={logoImg} alt="Platform Logo" className="logo-image" />
        </div>
        
        <h1 className="title">{t('auth.forgotPassword.title', 'Forgot Password')}</h1>
        <p className="subtitle">
          {t('auth.forgotPassword.subtitle', 'Enter your email address and we will send you a link to reset your password.')}
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={formik.handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email" className="label">
              {t('auth.forgotPassword.email', 'Email Address')} *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder={t('auth.forgotPassword.emailPlaceholder', 'Enter your email address')}
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="input"
            />
            {formik.touched.email && formik.errors.email && (
              <div className="error-text">{formik.errors.email}</div>
            )}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="spinner" />
                {t('auth.forgotPassword.sending', 'Sending')}...
              </>
            ) : (
              t('auth.forgotPassword.sendReset', 'Send Reset Link')
            )}
          </button>
        </form>

        <Link to={PATH.LOGIN} className="back-to-login">
          <ArrowLeft size={18} />
          {t('auth.forgotPassword.backToLogin', 'Back to Login')}
        </Link>
      </div>
    </div>
  )
}

export default ForgotPassword