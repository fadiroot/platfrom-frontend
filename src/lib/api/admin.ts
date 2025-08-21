import { createClient } from '@supabase/supabase-js'
import { supabase } from '../supabase'

// Create a separate Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY, // Use service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Enhanced admin interface
export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isAdmin: boolean
  createdAt: string
  lastSignInAt?: string
}

export interface StudentProfile {
  user_id: string
  first_name: string
  last_name: string
  email: string
  is_active: boolean
  subscription_start_date?: string
  subscription_end_date?: string
  payment_status: string
  payment_method?: string
  payment_amount?: number
  level_title: string
  created_at: string
}

// Enhanced student management interface
export interface AdminStudentProfile {
  profile_id: string
  user_id: string
  email: string
  username?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  level_title?: string
  is_active: boolean
  subscription_start_date?: string
  subscription_end_date?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_amount?: number
  payment_method?: string
  payment_notes?: string
  activated_by?: string
  activated_at?: string
  deactivated_at?: string
  deactivated_by?: string
  deactivation_reason?: string
  created_at: string
  user_created_at: string
  last_sign_in_at?: string
  account_status: 'active' | 'inactive' | 'expired'
}

export interface ActivateStudentRequest {
  student_profile_id: string
  subscription_months: number
  payment_amount?: number
  payment_method?: string
  payment_notes?: string
}

export interface DeactivateStudentRequest {
  student_profile_id: string
  reason?: string
}

export interface StudentFilters {
  status?: 'all' | 'active' | 'inactive' | 'expired'
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded'
  search?: string
}

// Set user as admin
export const setUserAsAdmin = async (userEmail: string): Promise<boolean> => {
  try {
    // First get the user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return false
    }

    const user = users.users.find((u: any) => u.email === userEmail)
    if (!user) {
      console.error('User not found:', userEmail)
      return false
    }

    // Update user metadata to set admin role
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: 'admin',
      },
    })

    if (error) {
      console.error('Error setting admin role:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error setting admin role:', error)
    return false
  }
}

// Check if current user is admin
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    // Use the new check_user_is_admin function with user ID
    const { data: isAdmin, error } = await supabase.rpc('check_user_is_admin', {
      target_user_id: user.id,
    })

    if (error) {
      console.error('Error checking admin status:', error)
      // Fallback to checking user metadata
      return user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin'
    }

    return isAdmin || false
  } catch (error) {
    console.error('Error checking admin status:', error)
    // Fallback to checking user metadata
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.user_metadata?.role === 'admin' || user?.app_metadata?.role === 'admin'
  }
}

// Get all admin users
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    // Use the secure RPC function instead of Admin API
    const { data, error } = await supabase.rpc('get_admin_users_only')

    if (error) {
      console.error('Error fetching admin users:', error)
      return []
    }

    // Format the response
    return (data || []).map((user: any) => ({
      id: user.user_id,
      email: user.email || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: user.role || 'user',
      isAdmin: user.is_admin || false,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    }))
  } catch (error) {
    console.error('Error fetching admin users:', error)
    return []
  }
}

// Remove admin role
export const removeAdminRole = async (userEmail: string): Promise<boolean> => {
  try {
    // Check if current user is admin first
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      throw new Error('Access denied: Admin privileges required')
    }

    // First get the user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return false
    }

    const user = users.users.find((u: any) => u.email === userEmail)
    if (!user) {
      console.error('User not found:', userEmail)
      return false
    }

    // Update user metadata to remove admin role
    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        role: 'user',
      },
    })

    if (error) {
      console.error('Error removing admin role:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error removing admin role:', error)
    return false
  }
}

// Get all users (admin only)
export const getAllUsers = async (): Promise<AdminUser[]> => {
  try {
    // Use the secure RPC function instead of Admin API
    const { data, error } = await supabase.rpc('get_all_users_admin')

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    // Format the response
    return (data || []).map((user: any) => ({
      id: user.user_id,
      email: user.email || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: user.role || 'user',
      isAdmin: user.is_admin || false,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

// Get student profiles (admin only) - Enhanced version with proper user data
export const getStudentProfiles = async (
  filters?: StudentFilters
): Promise<AdminStudentProfile[]> => {
  try {
    // Use the secure RPC function instead of Admin API
    const { data, error } = await supabase.rpc('get_students_with_user_data')

    if (error) {
      console.error('Error fetching student profiles:', error)
      return []
    }

    // Transform the data to match AdminStudentProfile interface
    let transformedData: AdminStudentProfile[] = (data || []).map((student: any) => ({
      profile_id: student.profile_id,
      user_id: student.user_id,
      email: student.email || '',
      username: student.username || '',
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      phone_number: student.phone_number || '',
      level_title: student.level_title,
      is_active: student.is_active || false,
      subscription_start_date: student.subscription_start_date,
      subscription_end_date: student.subscription_end_date,
      payment_status: student.payment_status || ('pending' as const),
      payment_amount: student.payment_amount,
      payment_method: student.payment_method,
      payment_notes: student.payment_notes || '',
      activated_by: student.activated_by,
      activated_at: student.activated_at,
      deactivated_at: student.deactivated_at,
      deactivated_by: student.deactivated_by,
      deactivation_reason: student.deactivation_reason || '',
      created_at: student.created_at,
      user_created_at: student.user_created_at,
      last_sign_in_at: student.last_sign_in_at,
      account_status: student.account_status as 'active' | 'inactive' | 'expired',
    }))

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'expired') {
        transformedData = transformedData.filter(
          (student) =>
            student.subscription_end_date && new Date(student.subscription_end_date) < new Date()
        )
      } else if (filters.status === 'active') {
        transformedData = transformedData.filter((student) => student.is_active)
      } else if (filters.status === 'inactive') {
        transformedData = transformedData.filter((student) => !student.is_active)
      }
    }

    if (filters?.payment_status) {
      transformedData = transformedData.filter(
        (student) => student.payment_status === filters.payment_status
      )
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      transformedData = transformedData.filter(
        (student) =>
          student.email?.toLowerCase().includes(searchLower) ||
          student.first_name?.toLowerCase().includes(searchLower) ||
          student.last_name?.toLowerCase().includes(searchLower)
      )
    }

    return transformedData
  } catch (error) {
    console.error('Error fetching student profiles:', error)
    return []
  }
}

// Activate student account
export const activateStudentAccount = async (request: ActivateStudentRequest): Promise<boolean> => {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      throw new Error('Access denied: Admin privileges required')
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Use user_id directly (it's already a UUID)
    const userId = request.student_profile_id // This is now the user_id UUID

    console.log('Activating student account:', {
      user_id: userId,
      admin_user_id: user.id,
      subscription_months: request.subscription_months,
      payment_amount: request.payment_amount,
      payment_method: request.payment_method,
      payment_notes: request.payment_notes,
    })

    const { data, error } = await supabase.rpc('activate_student_account', {
      student_profile_id: userId, // Send as UUID
      admin_user_id: user.id,
      subscription_months: request.subscription_months,
      payment_amount: request.payment_amount,
      payment_method: request.payment_method,
      payment_notes: request.payment_notes,
    })

    if (error) {
      console.error('RPC Error:', error)
      throw new Error(`Failed to activate student account: ${error.message}`)
    }

    console.log('Activation result:', data)
    return data === true
  } catch (error) {
    console.error('Error activating student account:', error)
    throw error
  }
}

// Deactivate student account
export const deactivateStudentAccount = async (
  request: DeactivateStudentRequest
): Promise<boolean> => {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      throw new Error('Access denied: Admin privileges required')
    }

    // Get current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Use user_id directly (it's already a UUID)
    const userId = request.student_profile_id // This is now the user_id UUID

    console.log('Deactivating student account:', {
      user_id: userId,
      admin_user_id: user.id,
      reason: request.reason,
    })

    const { data, error } = await supabase.rpc('deactivate_student_account', {
      student_profile_id: userId, // Send as UUID
      admin_user_id: user.id,
      reason: request.reason,
    })

    if (error) {
      console.error('RPC Error:', error)
      throw new Error(`Failed to deactivate student account: ${error.message}`)
    }

    console.log('Deactivation result:', data)
    return data === true
  } catch (error) {
    console.error('Error deactivating student account:', error)
    throw error
  }
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Get user accessible exercises (admin can see all)
export const getUserAccessibleExercises = async (userId?: string): Promise<any[]> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return []
    }

    // Use the get_user_accessible_exercises function
    const { data, error } = await supabase.rpc('get_user_accessible_exercises', {
      user_uuid: userId || user.id,
    })

    if (error) {
      console.error('Error fetching accessible exercises:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching accessible exercises:', error)
    return []
  }
}

// Check if user can access specific exercise
export const canAccessExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('can_access_exercise', {
      exercise_id: exerciseId,
    })

    if (error) {
      console.error('Error checking exercise access:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error checking exercise access:', error)
    return false
  }
}
