"use client"


import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import SimpleLoader from '../../../shared/components/SimpleLoader/SimpleLoader'
import { useTranslation } from "react-i18next"
import { useAppDispatch, useAppSelector } from "../../../shared/store"
import { register, loginWithGoogle } from "../../data/authThunk"
import { PATH } from "../../routes/paths"
import { fetchPublicLevels } from "../../../levels/data/levelThunk"
import { Level } from "../../../levels/data/levelTypes"
import CustomSelect from "../../../shared/components/CustomSelect/CustomSelect"
import EmailVerificationModal from "../../components/EmailVerificationModal"
import ErrorModal from "../../components/ErrorModal"
import LanguageSelector from "../../../shared/components/LanguageSelector/LanguageSelector"
import { forcePlaceholdersLTR } from "../../../../utils/placeholderRTL"
import "./_Register.scss"
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
  
  // Only show errors if user has interacted OR if form has been submitted
  const showError = (hasInteracted || isTouched) && hasError
  const showSuccess = (hasInteracted || isTouched) && hasValue && !hasError
  const isInvalid = showError || (required && hasInteracted && !hasValue)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e)
    // Set hasInteracted when user actually types something
    if (!hasInteracted) {
      setHasInteracted(true)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    formik.handleBlur(e)
    // Don't set hasInteracted on blur if user hasn't typed anything
  }

  return (
    <div className="form-field">
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
          onChange={handleChange}
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

const initialValues = {
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phoneNumber: "",
  age: null,
  birthDate: null,
  levelId: "",
}

const RegisterComponent = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const { levels, loading: levelsLoading } = useAppSelector((state: any) => state.levels)
  
  // Add Arabic font class and RTL direction when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  const isRTL = isArabic

  useEffect(() => {
    dispatch(fetchPublicLevels())
  }, [dispatch])

  // Force placeholders to be LTR when component mounts or language changes
  useEffect(() => {
    forcePlaceholdersLTR();
  }, [isRTL])

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      username: Yup.string().required(t('auth.register.validation.usernameRequired')),
      firstName: Yup.string().required(t('auth.register.validation.firstNameRequired')),
      lastName: Yup.string().required(t('auth.register.validation.lastNameRequired')),
      email: Yup.string()
        .email(t('auth.register.validation.emailInvalid'))
        .matches(/^([a-zA-Z0-9._%+-]+)@((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/, t('auth.register.validation.emailInvalid'))
        .test(
          "no-special-chars",
          t('auth.register.validation.emailSpecialChars'),
          (value: string | undefined) => !value || /^[^<>()\\/\[\]{}\s]+@[^\s]+$/.test(value),
        )
        .required(t('auth.register.validation.emailRequired')),
      password: Yup.string()
        .required(t('auth.register.validation.passwordRequired'))
        .min(6, t('auth.register.validation.passwordTooShort')),
      confirmPassword: Yup.string()
        .required(t('auth.register.validation.confirmPasswordRequired'))
        .oneOf([Yup.ref("password")], t('auth.register.validation.passwordsMustMatch')),
      phoneNumber: Yup.string()
        .required(t('auth.register.validation.phoneRequired'))
        .matches(/^[2459]\d{7}$/, t('auth.register.validation.phoneInvalid')),
      levelId: Yup.string().required(t('auth.register.validation.levelRequired')),
    }),
    validateOnMount: false,
    validateOnChange: false, // Don't validate on every change
    validateOnBlur: false,   // Don't validate on blur initially
    onSubmit: (values) => {
      setSubmitting(true)
      setUserEmail(values.email)
      // Map form values to API DTO
      const payload = {
        email: values.email,
        phone: values.phoneNumber,
        username: values.username,
        password: values.password,
        confirmPassword: values.confirmPassword,
        levelId: values.levelId,
        firstName: values.firstName,
        lastName: values.lastName,
      }
      dispatch(register(payload))
        .unwrap()
        .then((result) => {
          console.log("Account created successfully")
          if (result.requiresVerification) {
            setShowEmailVerification(true)
          } else {
            navigate(`/subjects?levelId=${result.user.level_id}`)
          }
        })
        .catch((err: { message: any }) => {
          setErrorMessage(err?.message || "Something went wrong")
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
      className={`register-module ${isArabic ? 'arabic-fonts' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="language-selector-container">
        <LanguageSelector />
      </div>
      
      <div className="register-card-container">
        <div className="logo-container">
          <img src={logoImg} alt="Platform Logo" className="logo-image" />
        </div>
        
        <h1 className="title">{t('auth.register.title')}</h1>
        <p className="subtitle">{t('auth.register.subtitle')}</p>

        <form onSubmit={formik.handleSubmit} noValidate>
          {/* Row 1: First Name and Last Name */}
          <div className="form-row">
            <Input
              name="firstName"
              formik={formik}
              placeholder={t('auth.register.firstNamePlaceholder')}
              label={t('auth.register.firstName')}
              required
              autoComplete="given-name"
            />
            <Input
              name="lastName"
              formik={formik}
              placeholder={t('auth.register.lastNamePlaceholder')}
              label={t('auth.register.lastName')}
              required
              autoComplete="family-name"
            />
          </div>
          
          {/* Row 2: Level */}
          <div className="form-row single">
            <div className="form-field">
              <label htmlFor="levelId" className="label">
                {t('auth.register.level')} <span className="required-asterisk">*</span>
              </label>
              <CustomSelect
                options={levels.map((level: Level) => ({
                  value: level.id,
                  label: level.title,
                }))}
                value={formik.values.levelId}
                onChange={(value: string) => formik.setFieldValue("levelId", value)}
                onBlur={() => formik.setFieldTouched("levelId", true)}
                placeholder={t('auth.register.levelPlaceholder')}
                disabled={levelsLoading}
                error={formik.touched.levelId && formik.errors.levelId ? formik.errors.levelId : undefined}
                touched={formik.touched.levelId}
                required
              />
            </div>
          </div>
          
          {/* Row 3: Email */}
          <div className="form-row single">
            <Input
              name="email"
              formik={formik}
              type="email"
              placeholder={t('auth.register.emailPlaceholder')}
              label={t('auth.register.email')}
              required
              autoComplete="email"
            />
          </div>

          {/* Row 4: Username */}
          <div className="form-row single">
            <Input
              name="username"
              formik={formik}
              placeholder={t('auth.register.usernamePlaceholder')}
              label={t('auth.register.username')}
              required
              autoComplete="username"
            />
          </div>

          {/* Row 5: Phone Number */}
          <div className="form-row single">
            <Input
              name="phoneNumber"
              formik={formik}
              placeholder={t('auth.register.phoneNumberPlaceholder')}
              label={t('auth.register.phoneNumber')}
              required
              autoComplete="tel"
            />
          </div>

          {/* Row 6: Password & Confirm Password */}
          <div className="form-row">
            <Input
              name="password"
              formik={formik}
              type="password"
              placeholder={t('auth.register.passwordPlaceholder')}
              label={t('auth.register.password')}
              required
              autoComplete="new-password"
            />
            <Input
              name="confirmPassword"
              formik={formik}
              type="password"
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
              label={t('auth.register.confirmPassword')}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? (
              <>
                <SimpleLoader size={18} />
                {t('auth.register.creatingAccount')}
              </>
            ) : (
              t('auth.register.submit')
            )}
          </button>
        </form>

        <div className="divider">
          <span className="divider-text">{t('auth.register.or', 'or')}</span>
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
          {googleSubmitting ? t('auth.register.googleSigningIn', 'Signing in...') : t('auth.register.googleSignIn', 'Continue with Google')}
        </button>

        <Link to={PATH.LOGIN} className="signin-link">
          {t('auth.register.hasAccount')} {t('auth.register.signIn')}
        </Link>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={() => {
          setShowEmailVerification(false)
          navigate('/login')
        }}
        email={userEmail}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        title={t('auth.register.title')}
        message={errorMessage}
      />
    </div>
  )
}

export default RegisterComponent
