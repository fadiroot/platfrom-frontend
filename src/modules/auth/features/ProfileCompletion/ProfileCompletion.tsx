'use client'

import { useState, useEffect } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { AlertCircle, CheckCircle, Phone, GraduationCap, X } from 'lucide-react'
import SimpleLoader from '../../../shared/components/SimpleLoader/SimpleLoader'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../../modules/shared/store'
import { fetchPublicLevels } from '../../../levels/data/levelThunk'
import { Level } from '../../../levels/data/levelTypes'
import CustomSelect from '../../../shared/components/CustomSelect/CustomSelect'
import { createStudentProfileAPI } from '../../../../lib/api/auth'
import { supabase } from '../../../../lib/supabase'
import { refreshUserData } from '../../data/authThunk'
import './_ProfileCompletion.scss'
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
          className="input force-ltr-placeholder"
          style={{
            '--placeholder-direction': 'ltr',
            '--placeholder-text-align': 'left'
          } as React.CSSProperties}
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

interface ProfileCompletionProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const ProfileCompletion = ({ isOpen, onClose, onSuccess }: ProfileCompletionProps) => {
  const dispatch = useAppDispatch()
  const { t, i18n } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const { levels, loading: levelsLoading } = useAppSelector((state: any) => state.levels)

  // Add Arabic font class and RTL direction when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  const isRTL = isArabic

  useEffect(() => {
    if (isOpen) {
      const loadUserAndLevels = async () => {
        try {
          // Get current user
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          setUser(currentUser)
          
          // Load levels for the form
          dispatch(fetchPublicLevels())
        } catch (error) {
          console.error('Error loading user data:', error)
          setErrorMessage('Failed to load user information')
          setShowError(true)
        }
      }

      loadUserAndLevels()
    }
  }, [isOpen, dispatch])

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
          
          // Close modal and call success callback
          onClose()
          if (onSuccess) {
            onSuccess()
          }
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

  if (!isOpen) return null

  return (
    <div className="profile-completion-overlay" onClick={onClose}>
      <div 
        className={`profile-completion-modal ${isArabic ? 'arabic-fonts' : ''} ${isRTL ? 'rtl' : 'ltr'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="logo-container">
            <img src={logoImg} alt="Platform Logo" className="logo-image" />
          </div>
          
          <h1 className="title">{t('auth.profileCompletion.title', 'Complete Your Profile')}</h1>
          <p className="subtitle">
            {t('auth.profileCompletion.subtitle', 'Please provide some additional information to complete your account setup.')}
          </p>
        </div>

        {user && (
          <div className="user-info">
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
                {user.email}
              </p>
            </div>
          </div>
        )}

        <div className="form-content">
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

        <div className="modal-actions">
          <button type="button" className="skip-button" onClick={onClose}>
            {t('common.skip', 'Skip for now')}
          </button>
          <button 
            type="button" 
            className="complete-button" 
            disabled={submitting}
            onClick={() => formik.handleSubmit()}
          >
            {submitting ? (
              <>
                <SimpleLoader size={18} />
                {t('auth.profileCompletion.completing', 'Completing...')}
              </>
            ) : (
              t('auth.profileCompletion.complete', 'Complete Profile')
            )}
          </button>
        </div>

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

export default ProfileCompletion