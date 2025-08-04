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
    // Initialize Supabase auth state
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
