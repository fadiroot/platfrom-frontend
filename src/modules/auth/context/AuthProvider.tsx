import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState, useAppDispatch } from '../../../modules/shared/store'
import LazyLoad from '../../shared/components/LazyLoad/LazyLoad'
import { initializeAuth, setupAuthListener } from '../data/authThunk'

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const { isInitialised } = useSelector((state: RootState) => state.auth)
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Check if we're on a magic link page (password reset or email confirmation)
    const isMagicLinkPage = () => {
      const currentPath = window.location.pathname
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      
      // Check for magic link indicators
      const hasTokenHash = searchParams.has('token_hash') || hashParams.has('token_hash')
      const hasAccessToken = searchParams.has('access_token') || hashParams.has('access_token')
      const hasCode = searchParams.has('code') || hashParams.has('code')
      const isRecovery = searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery'
      const isEmailConfirmation = searchParams.get('type') === 'email' || hashParams.get('type') === 'email'
      
      return (
        currentPath === '/reset-password' ||
        currentPath === '/auth/confirm' ||
        hasTokenHash ||
        hasAccessToken ||
        hasCode ||
        isRecovery ||
        isEmailConfirmation
      )
    }

    // If we're on a magic link page, don't initialize auth automatically
    if (isMagicLinkPage()) {
      console.log('🔗 Magic link detected, skipping automatic auth initialization')
      // Set initialized to true but don't authenticate
      dispatch({
        type: 'auth/initialise',
        payload: { isAuthenticated: false, user: null }
      })
      return
    }

    // Initialize Supabase auth state for normal pages
    dispatch(initializeAuth())

    // Set up auth state change listener
    let authListener: any = null
    
    try {
      authListener = setupAuthListener(dispatch)
    } catch (error) {
      console.error('Failed to setup auth listener:', error)
    }

    // Cleanup listener on unmount
    return () => {
      try {
        if (authListener?.data?.unsubscribe) {
          authListener.data.unsubscribe()
        }
      } catch (error) {
        console.warn('Error cleaning up auth listener:', error)
      }
    }
  }, [dispatch])

  if (!isInitialised) {
    return <LazyLoad />
  }

  return <>{children}</>
}

export default AuthProvider
