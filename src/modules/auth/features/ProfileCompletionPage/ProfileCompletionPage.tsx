'use client'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../../../modules/shared/store'
import { fetchPublicLevels } from '../../../levels/data/levelThunk'
import { refreshUserData } from '../../data/authThunk'
import { AlertCircle, CheckCircle, User, Mail, Phone, GraduationCap } from 'lucide-react'
import SimpleLoader from '../../../shared/components/SimpleLoader/SimpleLoader'
import { supabase } from '../../../../lib/supabase'
import CustomSelect from '../../../shared/components/CustomSelect/CustomSelect'
import LanguageSelector from '../../../shared/components/LanguageSelector/LanguageSelector'
import './_ProfileCompletionPage.scss'
import logoImg from '/logo/astuceLogo.png'

interface Level {
  id: string
  title: string
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

  // Add Arabic font class and RTL direction when Arabic language is selected
  const isArabic = i18n?.language === 'ar'
  const isRTL = isArabic

  // Create validation schema with translated messages
  const validationSchema = Yup.object({
    levelId: Yup.string().required(t('auth.register.validation.levelRequired', 'Level is required')),
    phoneNumber: Yup.string()
      .required(t('auth.register.validation.phoneRequired', 'Phone number is required'))
      .matches(/^[+]?[\d\s-()]+$/, t('auth.register.validation.phoneInvalid', 'Please enter a valid phone number'))
  })

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
        const { data: profile, error: profileError } = await supabase
          .from('student_profile')
          .select('*')
          .eq('user_id', currentUser.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 is "not found" error, which is expected for new users
          console.error('Error fetching profile:', profileError)
        }

        if (profile && profile.level_id) {
          // Profile is already complete, redirect to dashboard
          navigate('/subjects')
          return
        }

        setLoading(false)
      } catch (error) {
        console.error('Error checking user profile:', error)
        setLoading(false)
      }
    }

    checkUserAndProfile()
  }, [navigate])

  // Load levels when component mounts
  useEffect(() => {
    console.log('ProfileCompletionPage: Levels state:', { levels, levelsLoading, levelsLength: levels.length })
    if (!levelsLoading && levels.length === 0) {
      console.log('ProfileCompletionPage: Dispatching fetchPublicLevels')
      dispatch(fetchPublicLevels())
    }
  }, [dispatch, levelsLoading, levels.length])

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSubmitting(true)
        setShowError(false)
        setErrorMessage('')

        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          throw new Error('User not authenticated')
        }

        // Update user metadata with phone number
        const { error: userError } = await supabase.auth.updateUser({
          data: {
            phone_number: values.phoneNumber
          }
        })

        if (userError) {
          throw userError
        }

        // Update or create student profile
        const { error } = await supabase
          .from('student_profile')
          .upsert({
            user_id: currentUser.id,
            level_id: values.levelId,
            updated_at: new Date().toISOString()
          })

        if (error) {
          throw error
        }

        // Success - refresh user data in the application state
        try {
          // Dispatch refreshUserData to update the application state with new profile data
          await dispatch(refreshUserData()).unwrap()
          
          // Redirect to subjects page with updated user data
          navigate('/subjects')
        } catch (error) {
          console.error('Error refreshing user data:', error)
          // Fallback: redirect anyway
          navigate('/subjects')
        }
      } catch (error: any) {
        console.error('Profile completion error:', error)
        setErrorMessage(error.message || 'Failed to complete profile. Please try again.')
        setShowError(true)
      } finally {
        setSubmitting(false)
      }
    }
  })

  // Re-validate form when language changes to update error messages
  useEffect(() => {
    if (formik && formik.validateForm) {
      formik.validateForm()
    }
  }, [i18n.language]) // Removed formik from dependencies to prevent infinite loop

  if (loading) {
    return (
      <div className={`profile-completion-page ${isArabic ? 'arabic-fonts' : ''} ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="language-selector-container">
          <LanguageSelector />
        </div>
        <div className="loading-container">
          <SimpleLoader size={48} />
          <p>{t('auth.profileCompletion.loading', 'Loading...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`profile-completion-page ${isArabic ? 'arabic-fonts' : ''} ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
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
                <img src={user.user_metadata.avatar_url} alt="User Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="user-details">
              <h3 className="user-name">{user.user_metadata?.full_name || user.email}</h3>
              <p className="user-email">
                <Mail size={16} />
                {user.email}
              </p>
            </div>
          </div>
        )}

        {showError && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} noValidate className="profile-form">
          <div className="form-field">
            <label htmlFor="levelId" className="label">
              <span className="label-icon">
                <GraduationCap size={18} />
              </span>
              {t('auth.register.level')} <span className="required-asterisk">*</span>
            </label>
            <CustomSelect
              options={levels.map((level: Level) => {
                console.log('ProfileCompletionPage: Mapping level:', level)
                return {
                  value: level.id,
                  label: level.title,
                }
              })}
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

          <div className="form-field">
            <label htmlFor="phoneNumber" className="label">
              <span className="label-icon">
                <Phone size={18} />
              </span>
              {t('auth.register.phoneNumber')} <span className="required-asterisk">*</span>
            </label>
            <div className="input-container">
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                className="input"
                placeholder={t('auth.register.phoneNumberPlaceholder')}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                value={formik?.values.phoneNumber}
                autoComplete="tel"
              />
            </div>
            {formik.touched.phoneNumber && formik.errors.phoneNumber && (
              <div className="error-message">
                {formik.errors.phoneNumber}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="complete-button" disabled={submitting}>
              {submitting ? (
                <>
                  <SimpleLoader size={20} />
                  {t('auth.profileCompletion.completing', 'Completing...')}
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {t('auth.profileCompletion.complete', 'Complete Profile')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileCompletionPage