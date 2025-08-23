'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Loader2, AlertCircle, CheckCircle, User, Mail, Phone, GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../../modules/shared/store'
import { fetchPublicLevels } from '../../../levels/data/levelThunk'
import { Level } from '../../../levels/data/levelTypes'
import CustomSelect from '../../../shared/components/CustomSelect/CustomSelect'
import { createStudentProfileAPI } from '../../../../lib/api/auth'
import { supabase } from '../../../../lib/supabase'
import { refreshUserData } from '../../data/authThunk'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector'
import './_ProfileCompletionPage.scss'
import logoImg from '/logo/astuceLogo.png'

// Enhanced Input Component
interface InputProps {
  name: string
  formik: any
  placeholder?: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
  icon?: React.ReactNode
}

const Input = ({
  name,
  formik,
  placeholder,
  label,
  type = 'text',
  required,
  autoComplete,
  icon,
}: InputProps) => {
  const [hasInteracted, setHasInteracted] = useState(false)
  
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
    <div className="form-field">
      <label htmlFor={name} className="label">
        {icon && <span className="label-icon">{icon}</span>}
        {label} {required && <span className="required-asterisk">*</span>}
      </label>
      <div className={`input-container ${isInvalid ? 'error' : ''} ${showSuccess ? 'success' : ''}`}>
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={handleBlur}
          className="input"
        />
        <div className="input-icons">
          {isInvalid && <AlertCircle size={16} className="error-icon" />}
          {showSuccess && <CheckCircle size={16} className="success-icon" />}
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
  phoneNumber: '',
  levelId: '',
}

const ProfileCompletionPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { levels, loading: levelsLoading } = useAppSelector((state: any) => state.levels)

  // Add Arabic font class when Arabic language is selected
  const isArabic = i18n?.language === 'ar'

  useEffect(() => {
    const checkUserAndProfile = async () => {
      try {
        setLoading(true)
        
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          // User not authenticated, redirect to login
          navigate('/login')
          return
        }

        setUser(currentUser)

        // Check if user already has a complete profile
        const { data: profile } = await supabase
          .from('student_profile')
          .select('level_id')
          .eq('user_id', currentUser.id)
          .single()

        // Check if user has phone number in metadata
        const hasPhone = currentUser.user_metadata?.phone

        if (profile && profile.level_id && hasPhone) {
          // User has complete profile, redirect to subjects
          navigate('/subjects')
          return
        }

        // Load levels for the form
        dispatch(fetchPublicLevels())
        
      } catch (error) {
        console.error('Error checking user profile:', error)
        setErrorMessage('Failed to load user information')
        setShowError(true)
      } finally {
        setLoading(false)
      }
    }

    checkUserAndProfile()
  }, [dispatch, navigate])

  const formik = useFormik({
    initialValues,
    validationSchema: Yup.object().shape({
      phoneNumber: Yup.string()
        .required(t('auth.register.validation.phoneRequired'))
        .matches(/^[2459]\d{7}$/, t('auth.register.validation.phoneInvalid')),
      levelId: Yup.string().required(t('auth.register.validation.levelRequired')),
    }),
    validateOnMount: false,
    validateOnChange: false,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setSubmitting(true)
      setShowError(false)
      
      try {
        const result = await createStudentProfileAPI({
          levelId: values.levelId,
          phoneNumber: values.phoneNumber,
        })

        if (result.success) {
          // Profile created successfully, refresh user data
          await dispatch(refreshUserData()).unwrap()
          
          // Navigate to subjects page
          navigate('/subjects')
        } else {
          throw new Error(result.error || 'Failed to create profile')
        }
        
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to complete profile')
        setShowError(true)
      } finally {
        setSubmitting(false)
      }
    },
  })

  if (loading) {
    return (
      <div className={`profile-completion-page ${isArabic ? 'arabic-fonts' : ''}`}>
        <div className="loading-container">
          <Loader2 size={48} className="spinner" />
          <p>{t('common.loading', 'Loading...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`profile-completion-page ${isArabic ? 'arabic-fonts' : ''}`}>
      <div className="language-selector-container">
        <LanguageSelector />
      </div>

      <div className="profile-completion-container">
        <div className="header-section">
          <div className="logo-container">
            <img src={logoImg} alt="Platform Logo" className="logo-image" />
          </div>
          
          <h1 className="title">{t('auth.profileCompletion.title', 'Complete Your Profile')}</h1>
          <p className="subtitle">
            {t('auth.profileCompletion.subtitle', 'Please provide some additional information to complete your account setup.')}
          </p>
        </div>

        {user && (
          <div className="user-info-section">
            <div className="user-avatar">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {user.user_metadata?.first_name?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
            </div>
            <div className="user-details">
              <h3 className="user-name">
                {user.user_metadata?.first_name && user.user_metadata?.last_name
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                  : user.email}
              </h3>
              <p className="user-email">
                <Mail size={16} />
                {user.email}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} noValidate className="profile-form">
          <div className="form-section">
            <h3 className="section-title">
              <GraduationCap size={20} />
              {t('auth.profileCompletion.academicInfo', 'Academic Information')}
            </h3>
            
            <div className="form-field">
              <label htmlFor="levelId" className="label">
                <span className="label-icon">
                  <GraduationCap size={16} />
                </span>
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

          <div className="form-section">
            <h3 className="section-title">
              <Phone size={20} />
              {t('auth.profileCompletion.contactInfo', 'Contact Information')}
            </h3>
            
            <Input
              name="phoneNumber"
              formik={formik}
              placeholder={t('auth.register.phoneNumberPlaceholder')}
              label={t('auth.register.phoneNumber')}
              required
              autoComplete="tel"
              icon={<Phone size={16} />}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="complete-button" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  {t('auth.profileCompletion.completing', 'Completing...')}
                </>
              ) : (
                t('auth.profileCompletion.complete', 'Complete Profile')
              )}
            </button>
          </div>
        </form>

        {showError && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileCompletionPage
