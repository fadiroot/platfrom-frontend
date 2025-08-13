"use client"


import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppDispatch, useAppSelector } from "../../../shared/store"
import { register } from "../../data/authThunk"
import { PATH } from "../../routes/paths"
import { fetchPublicLevels } from "../../../levels/data/levelThunk"
import { Level } from "../../../levels/data/levelTypes"
import CustomSelect from "../../../shared/components/CustomSelect/CustomSelect"
import EmailVerificationModal from "../../components/EmailVerificationModal"
import ErrorModal from "../../components/ErrorModal"
import LanguageSelector from "../../../shared/components/LanguageSelector/LanguageSelector"
import "./_Register.scss"
import logoImg from '/logo/astuceLogo.png'

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
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const { levels, loading: levelsLoading } = useAppSelector((state: any) => state.levels)

  useEffect(() => {
    dispatch(fetchPublicLevels())
  }, [dispatch])

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      username: Yup.string().required("Username is required"),
      firstName: Yup.string().required("First name is required"),
      lastName: Yup.string().required("Last name is required"),
      email: Yup.string()
        .email("Invalid email address")
        .matches(/^([a-zA-Z0-9._%+-]+)@((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/, "Invalid email address")
        .test(
          "no-special-chars",
          "Email contains disallowed characters",
          (value: string | undefined) => !value || /^[^<>()\\/\[\]{}\s]+@[^\s]+$/.test(value),
        )
        .required("Email is required"),
      password: Yup.string().required("Password is required").min(6, "Password is too short!"),
      confirmPassword: Yup.string()
        .required("Confirm password is required")
        .oneOf([Yup.ref("password")], "Passwords must match"),
      phoneNumber: Yup.string()
        .required("Phone number is required")
        .matches(/^[2459]\d{7}$/, "Phone number must be 8 digits and start with 2, 4, 5, or 9"),
      levelId: Yup.string().required("Level is required"),
    }),
    onSubmit: (values) => {
      setSubmitting(true)
      setUserEmail(values.email)
      // Map form values to API DTO
      const payload = {
        email: values.email,
        phoneNumber: values.phoneNumber,
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

  return (
    <div className="register-module">
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
            <div className="form-field">
              <label htmlFor="firstName" className="label">
                {t('auth.register.firstName')} *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder={t('auth.register.firstNamePlaceholder')}
                autoComplete="given-name"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.firstName && formik.errors.firstName && (
                <div className="error-text">{formik.errors.firstName}</div>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="lastName" className="label">
                {t('auth.register.lastName')} *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder={t('auth.register.lastNamePlaceholder')}
                autoComplete="family-name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.lastName && formik.errors.lastName && (
                <div className="error-text">{formik.errors.lastName}</div>
              )}
            </div>
          </div>
          {/* Row 2: Level */}
          <div className="form-row single">
            <div className="form-field">
              <label htmlFor="levelId" className="label">
                {t('auth.register.level')} *
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
              />
              {formik.touched.levelId && formik.errors.levelId && (
                <div className="error-text">{formik.errors.levelId}</div>
              )}
            </div>
          </div>
          {/* Row 3: Email */}
          <div className="form-row single">
            <div className="form-field">
              <label htmlFor="email" className="label">
                {t('auth.register.email')} *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder={t('auth.register.emailPlaceholder')}
                autoComplete="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.email && formik.errors.email && <div className="error-text">{formik.errors.email}</div>}
            </div>
          </div>

          {/* Row 4: Username */}
          <div className="form-row single">
            <div className="form-field">
              <label htmlFor="username" className="label">
                {t('auth.register.username')} *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder={t('auth.register.usernamePlaceholder')}
                autoComplete="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.username && formik.errors.username && (
                <div className="error-text">{formik.errors.username}</div>
              )}
            </div>
          </div>

          {/* Row 5: Phone Number */}
          <div className="form-row single">
            <div className="form-field">
              <label htmlFor="phoneNumber" className="label">
                {t('auth.register.phoneNumber')} *
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="text"
                placeholder={t('auth.register.phoneNumberPlaceholder')}
                autoComplete="tel"
                value={formik.values.phoneNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="input"
              />
              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <div className="error-text">{formik.errors.phoneNumber}</div>
              )}
            </div>
          </div>

          {/* Row 6: Password & Confirm Password */}
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="password" aria-label="Password" className="label">
                {t('auth.register.password')} *
              </label>
              <div className="input-container">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.register.passwordPlaceholder')}
                  autoComplete="new-password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <div className="error-text">{formik.errors.password}</div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword" aria-label="Confirm Password" className="label">
                {t('auth.register.confirmPassword')} *
              </label>
              <div className="input-container">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t('auth.register.confirmPasswordPlaceholder')}
                  autoComplete="new-password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className="error-text">{formik.errors.confirmPassword}</div>
              )}
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={18} className="spinner" />
                {t('auth.register.creatingAccount')}
              </>
            ) : (
              t('auth.register.submit')
            )}
          </button>
        </form>

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
