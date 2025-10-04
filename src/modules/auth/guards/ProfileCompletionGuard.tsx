'use client'

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../shared/store'
import { supabase } from '../../../lib/supabase'
import { PATH } from '../routes/paths'
import SimpleLoader from '../../shared/components/SimpleLoader/SimpleLoader'

interface ProfileCompletionGuardProps {
  children: React.ReactNode
}

const ProfileCompletionGuard = ({ children }: ProfileCompletionGuardProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAppSelector((state: any) => state.auth)
  const [checking, setChecking] = useState(true)
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    console.log('🔍 ProfileCompletionGuard: useEffect triggered', {
      isAuthenticated,
      user: user?.id,
      pathname: location.pathname,
      hasChecked: hasCheckedRef.current
    })

    const checkProfile = async () => {
      // Skip check if not authenticated
      if (!isAuthenticated || !user) {
        console.log('🔍 ProfileCompletionGuard: Not authenticated or no user')
        setChecking(false)
        return
      }

      // Skip check if already on profile completion page
      if (location.pathname === PATH.PROFILE_COMPLETION) {
        console.log('🔍 ProfileCompletionGuard: Already on profile completion page')
        setChecking(false)
        return
      }

      // Skip check for admin users
      if (user.isAdmin || user.role === 'admin' || user.role === 'super_admin') {
        console.log('🔍 ProfileCompletionGuard: Admin user, skipping check')
        setChecking(false)
        return
      }

      // Prevent multiple checks for the same user
      if (hasCheckedRef.current) {
        console.log('🔍 ProfileCompletionGuard: Already checked, skipping')
        setChecking(false)
        return
      }

      try {
        console.log('🔍 ProfileCompletionGuard: Checking profile for user:', user.id)

        // Check if user has a student profile with level
        const { data: profile, error: profileError } = await supabase
          .from('student_profile')
          .select('level_id')
          .eq('user_id', user.id)
          .single()

        // Check if user has phone number in metadata
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        const hasPhone = currentUser?.user_metadata?.phone

        console.log('🔍 ProfileCompletionGuard: Profile check results:', {
          profile,
          profileError,
          hasPhone,
          userMetadata: currentUser?.user_metadata
        })

        // Check if profile is missing required fields
        const hasLevel = profile && profile.level_id
        const needsCompletion = !hasLevel || !hasPhone

        console.log('🔍 ProfileCompletionGuard: Completion check:', {
          hasLevel,
          hasPhone,
          needsCompletion
        })

        if (needsCompletion) {
          console.log('🔍 ProfileCompletionGuard: Redirecting to profile completion')
          // Redirect immediately without delay
          navigate(PATH.PROFILE_COMPLETION, { replace: true })
          return
        }

        console.log('🔍 ProfileCompletionGuard: Profile is complete, allowing access')
      } catch (error) {
        console.error('Error checking profile completion:', error)
        // On error, redirect to profile completion to be safe
        console.log('🔍 ProfileCompletionGuard: Error occurred, redirecting to profile completion')
        navigate(PATH.PROFILE_COMPLETION, { replace: true })
      } finally {
        setChecking(false)
        hasCheckedRef.current = true
      }
    }

    checkProfile()
  }, [isAuthenticated, user?.id, location.pathname, navigate])

  // Show loading while checking to prevent flash
  if (checking) {
    console.log('🔍 ProfileCompletionGuard: Showing loading state')
    return (
      <div className="profile-completion-guard-loading">
        <SimpleLoader size={32} />
        <p>Checking profile...</p>
      </div>
    )
  }

  console.log('🔍 ProfileCompletionGuard: Rendering children')
  return <>{children}</>
}

export default ProfileCompletionGuard
