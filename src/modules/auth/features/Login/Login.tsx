"use client"

import type React from "react"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useAppDispatch } from "../../../../modules/shared/store"
import { login } from "../../data/authThunk"
import { PATH } from "../../routes/paths"
import ErrorModal from "../../components/ErrorModal"
import LanguageSelector from "../../../shared/components/LanguageSelector/LanguageSelector"
import "./_Login.scss"
import logoImg from '/logo/astuceLogo.png'

// Custom Input Component to match your original styling
interface InputProps {
  name: string
  formik: any
  placeholder?: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
}

const Input = ({ name, formik, placeholder, label, type = "text", required, autoComplete }: InputProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div className="Input-component-wrapper">
      <label htmlFor={name} className="label">
        {label} {required && "*"}
      </label>
      <div className="input-container">
        <input
          id={name}
          name={name}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className="input"
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}

// Custom Button Component to match your original styling
interface ButtonProps {
  type?: "button" | "submit"
  label?: string
  loading?: boolean
  children?: React.ReactNode
}

const Button = ({ type = "button", label, loading, children }: ButtonProps) => {
  return (
    <button type={type} className="Button-component" disabled={loading}>
      {loading ? (
        <>
          <Loader2 size={18} className="spinner" />
          {label || children}
        </>
      ) : (
        label || children
      )}
    </button>
  )
}

const initialValues = {
  email: "",
  password: "",
}

const LoginComponent = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { t, i18n } = useTranslation()
  
  // Add Arabic font class when Arabic language is selected
  const isArabic = i18n?.language === 'ar'

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      email: Yup.string().email("Invalid email address").required("Email is required"),
      password: Yup.string().required("Password is required").min(6, "Password must be at least 6 characters"),
    }),
    onSubmit: (values) => {
      setSubmitting(true)
      dispatch(login(values))
        .unwrap()
        .then(() => {
          // Navigate to subjects page - the SubjectList component will automatically
          // filter subjects based on the user's level from Redux store
          navigate('/subjects')
        })
        .catch((err) => {
          setErrorMessage(err?.message || "Login failed")
          setShowError(true)
        })
        .finally(() => {
          setSubmitting(false)
        })
    },
  })

  return (
    <div className={`login-module ${isArabic ? 'arabic-fonts' : ''}`}>
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
          {formik.touched.email && formik.errors.email && (
            <div className="error-text">{formik.errors.email}</div>
          )}

          <Input
            name="password"
            formik={formik}
            type="password"
            placeholder={t('auth.login.passwordPlaceholder')}
            label={t('auth.login.password')}
            required
            autoComplete="current-password"
          />
          {formik.touched.password && formik.errors.password && (
            <div className="error-text">{formik.errors.password}</div>
          )}

          <div className="forgot-password-link">
            <Link to={PATH.FORGOT_PASSWORD} className="link">
              {t('auth.login.forgot')}
            </Link>
          </div>

          <Button type="submit" label={t('auth.login.submit')} loading={submitting} />
        </form>

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
