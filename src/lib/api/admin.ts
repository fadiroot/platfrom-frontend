import { createClient } from '@supabase/supabase-js'
import { supabase } from '../supabase'

// Create a separate Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY, // Use service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
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
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: { 
          ...user.user_metadata,
          role: 'admin' 
        }
      }
    )
    
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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }
    
    // Use the is_admin function from the database
    const { data: isAdmin, error } = await supabase.rpc('is_admin')
    
    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }
    
    return isAdmin || false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Get all admin users
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    // Check if current user is admin first
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      throw new Error('Access denied: Admin privileges required')
    }
    
    // Use service role key to access admin API
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error fetching admin users:', error)
      return []
    }
    
    // Filter for admin users and format the response
    return data.users
      .filter((user: any) => user.user_metadata?.role === 'admin')
      .map((user: any) => ({
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        role: user.user_metadata?.role || 'user',
        isAdmin: user.user_metadata?.role === 'admin',
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at
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
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: { 
          ...user.user_metadata,
          role: 'user' 
        }
      }
    )
    
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
    // Check if current user is admin first
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      throw new Error('Access denied: Admin privileges required')
    }
    
    // Use service role key to access admin API
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.error('Error fetching users:', error)
      return []
    }
    
    // Format the response
    return data.users.map((user: any) => ({
      id: user.id,
      email: user.email || '',
      firstName: user.user_metadata?.first_name || '',
      lastName: user.user_metadata?.last_name || '',
      role: user.user_metadata?.role || 'user',
      isAdmin: user.user_metadata?.role === 'admin',
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at
    }))
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

// Get student profiles (admin only) - Enhanced version with proper user data
export const getStudentProfiles = async (filters?: StudentFilters): Promise<AdminStudentProfile[]> => {
  try {
    // Check if current user is admin first
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      throw new Error('Access denied: Admin privileges required')
    }
    
    // Query student_profile table with proper relationships
    const { data: profiles, error: profilesError } = await supabase
      .from('student_profile')
      .select(`
        id,
        user_id,
        level_id,
        is_active,
        subscription_start_date,
        subscription_end_date,
        payment_status,
        payment_amount,
        payment_method,
        payment_notes,
        activated_by,
        activated_at,
        deactivated_at,
        deactivated_by,
        deactivation_reason,
        created_at,
        levels (
          title
        )
      `)

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`)
    }

    // Get user information from auth.users using service role key
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (usersError) {
      console.warn('Could not fetch user details from auth:', usersError.message)
      // Fallback: return profiles without user details
      return (profiles || []).map((profile: any) => {
        let accountStatus: 'active' | 'inactive' | 'expired' = 'inactive'
        if (profile.is_active) {
          if (profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) {
            accountStatus = 'expired'
          } else {
            accountStatus = 'active'
          }
        }
        
        return {
          profile_id: profile.user_id, // Use user_id instead of profile.id
          user_id: profile.user_id,
          email: 'Unknown',
          username: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          level_title: profile.levels?.title,
          is_active: profile.is_active || false,
          subscription_start_date: profile.subscription_start_date,
          subscription_end_date: profile.subscription_end_date,
          payment_status: profile.payment_status || 'pending' as const,
          payment_amount: profile.payment_amount,
          payment_method: profile.payment_method,
          payment_notes: profile.payment_notes || '',
          activated_by: profile.activated_by,
          activated_at: profile.activated_at,
          deactivated_at: profile.deactivated_at,
          deactivated_by: profile.deactivated_by,
          deactivation_reason: profile.deactivation_reason || '',
          created_at: profile.created_at,
          user_created_at: profile.created_at,
          last_sign_in_at: undefined,
          account_status: accountStatus
        }
      })
    }

    // Transform student_profile data to match AdminStudentProfile interface
    let transformedData: AdminStudentProfile[] = (profiles || []).map((profile: any) => {
      const user = users?.users?.find((u: any) => u.id === profile.user_id)
      const userMetadata = user?.user_metadata || {}
      
      // Determine account status
      let accountStatus: 'active' | 'inactive' | 'expired' = 'inactive'
      if (profile.is_active) {
        if (profile.subscription_end_date && new Date(profile.subscription_end_date) < new Date()) {
          accountStatus = 'expired'
        } else {
          accountStatus = 'active'
        }
      }
      
      return {
        profile_id: profile.user_id, // Use user_id instead of profile.id
        user_id: profile.user_id,
        email: user?.email || '',
        username: userMetadata.username || '',
        first_name: userMetadata.first_name || '',
        last_name: userMetadata.last_name || '',
        phone_number: userMetadata.phone || '',
        level_title: profile.levels?.title,
        is_active: profile.is_active || false,
        subscription_start_date: profile.subscription_start_date,
        subscription_end_date: profile.subscription_end_date,
        payment_status: profile.payment_status || 'pending' as const,
        payment_amount: profile.payment_amount,
        payment_method: profile.payment_method,
        payment_notes: profile.payment_notes || '',
        activated_by: profile.activated_by,
        activated_at: profile.activated_at,
        deactivated_at: profile.deactivated_at,
        deactivated_by: profile.deactivated_by,
        deactivation_reason: profile.deactivation_reason || '',
        created_at: profile.created_at,
        user_created_at: user?.created_at || profile.created_at,
        last_sign_in_at: user?.last_sign_in_at,
        account_status: accountStatus
      }
    })

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'expired') {
        transformedData = transformedData.filter((student) => 
          student.subscription_end_date && new Date(student.subscription_end_date) < new Date()
        )
      } else if (filters.status === 'active') {
        transformedData = transformedData.filter((student) => student.is_active)
      } else if (filters.status === 'inactive') {
        transformedData = transformedData.filter((student) => !student.is_active)
      }
    }

    if (filters?.payment_status) {
      transformedData = transformedData.filter((student) => 
        student.payment_status === filters.payment_status
      )
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      transformedData = transformedData.filter((student) => 
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

    const { data: { user } } = await supabase.auth.getUser()
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
      payment_notes: request.payment_notes
    })

    const { data, error } = await supabase.rpc('activate_student_account', {
      student_profile_id: userId, // Send as UUID
      admin_user_id: user.id,
      subscription_months: request.subscription_months,
      payment_amount: request.payment_amount,
      payment_method: request.payment_method,
      payment_notes: request.payment_notes
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
export const deactivateStudentAccount = async (request: DeactivateStudentRequest): Promise<boolean> => {
  try {
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      throw new Error('Access denied: Admin privileges required')
    }

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Use user_id directly (it's already a UUID)
    const userId = request.student_profile_id // This is now the user_id UUID

    console.log('Deactivating student account:', {
      user_id: userId,
      admin_user_id: user.id,
      reason: request.reason
    })

    const { data, error } = await supabase.rpc('deactivate_student_account', {
      student_profile_id: userId, // Send as UUID
      admin_user_id: user.id,
      reason: request.reason
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return []
    }
    
    // Use the get_user_accessible_exercises function
    const { data, error } = await supabase.rpc('get_user_accessible_exercises', {
      user_uuid: userId || user.id
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
      exercise_id: exerciseId
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