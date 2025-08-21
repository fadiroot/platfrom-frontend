import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'

/**
 * SmartRedirect component that redirects users based on their role
 * Admins → /admin
 * Students → /subjects
 * Unauthenticated → /login
 */
const SmartRedirect: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check if user is admin
  const isAdmin = user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin'

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  // Default redirect for regular users
  return <Navigate to="/subjects" replace />
}

export default SmartRedirect
