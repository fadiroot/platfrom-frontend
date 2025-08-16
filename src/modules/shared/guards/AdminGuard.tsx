import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { RootState } from '../store'
import { supabase } from '../../../lib/supabase'
import PermissionDenied from '../features/PermissionDenied'

interface AdminGuardProps {
  children: React.ReactNode
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        console.log('🔍 Checking admin status for user:', user.id)
        console.log('🔍 User role from Redux:', user.role)
        console.log('🔍 User isAdmin from Redux:', user.isAdmin)

        // Call the database function to check admin status
        const { data: adminCheck, error } = await supabase.rpc('is_admin')
        
        if (error) {
          console.error('❌ Error checking admin status:', error)
          setIsAdmin(false)
        } else {
          console.log('✅ Database is_admin() result:', adminCheck)
          setIsAdmin(adminCheck === true)
        }
      } catch (err) {
        console.error('❌ Exception checking admin status:', err)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [isAuthenticated, user])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        🔍 Checking admin permissions...
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('🚫 Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    console.log('🚫 Not admin, showing permission denied page')
    return <PermissionDenied />
  }

  console.log('✅ Admin access granted')
  return <>{children}</>
}

export default AdminGuard