import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../store'
import { useEffect, useState } from 'react'
import { getCurrentSession } from '../../../lib/api/auth'
import Loader from '../components/Loader/Loader'

interface MainLayoutProps {
  children: React.ReactNode
}

const GuestGuard = ({ children }: MainLayoutProps) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const location = useLocation()
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkRecoveryMode = async () => {
      try {
        // Only check for recovery mode on the reset password page
        if (location.pathname === '/reset-password') {
          const session = await getCurrentSession()
          if (session?.user?.aud === 'recovery') {
            setIsRecoveryMode(true)
          }
        }
      } catch (error) {
        console.error('Error checking recovery mode in GuestGuard:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkRecoveryMode()
  }, [location.pathname])

  // Show loading while checking recovery mode
  if (isChecking) {
    return <Loader fullScreen />
  }

  // Allow access to reset password page if user is in recovery mode
  if (isRecoveryMode) {
    return <>{children}</>
  }

  // Otherwise, redirect authenticated users away from guest pages
  return isAuthenticated ? <Navigate to="/subjects" /> : children
}

export default GuestGuard
