import { supabase } from '../supabase'

// Types for user management
export interface UserWithStatus {
  user_id: string
  email: string
  first_name: string
  last_name: string
  username: string
  level_title: string
  is_active: boolean
  subscription_type: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  activated_at: string | null
  activated_by_email: string | null
  created_at: string
  notes: string | null
}

export interface ActivationHistoryEntry {
  id: string
  user_id: string
  action: 'activated' | 'deactivated' | 'subscription_extended' | 'subscription_expired'
  performed_by: string | null
  previous_status: boolean | null
  new_status: boolean | null
  previous_end_date: string | null
  new_end_date: string | null
  reason: string | null
  notes: string | null
  created_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: 'student' | 'admin' | 'super_admin'
  assigned_at: string
  assigned_by: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ===== User Management Functions =====

// Get all users with their activation status (admin only)
export const getAllUsersWithStatus = async (): Promise<UserWithStatus[]> => {
  try {
    const { data, error } = await supabase.rpc('get_all_users_with_status')

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error('Error fetching users with status:', error)
    throw error
  }
}

// Activate a user account
export const activateUserAccount = async (
  userId: string,
  subscriptionType: 'monthly' | 'quarterly' | 'yearly' | 'lifetime' = 'monthly',
  durationMonths: number = 1,
  adminNotes?: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('activate_user_account', {
      target_user_id: userId,
      subscription_type_param: subscriptionType,
      duration_months: durationMonths,
      admin_notes: adminNotes,
    })

    if (error) {
      throw new Error(`Failed to activate user: ${error.message}`)
    }

    return data === true
  } catch (error: any) {
    console.error('Error activating user:', error)
    throw error
  }
}

// Deactivate a user account
export const deactivateUserAccount = async (
  userId: string,
  reason: string = 'Deactivated by admin',
  adminNotes?: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('deactivate_user_account', {
      target_user_id: userId,
      reason: reason,
      admin_notes: adminNotes,
    })

    if (error) {
      throw new Error(`Failed to deactivate user: ${error.message}`)
    }

    return data === true
  } catch (error: any) {
    console.error('Error deactivating user:', error)
    throw error
  }
}

// Assign admin role to a user
export const assignAdminRole = async (
  userId: string,
  roleType: 'admin' | 'super_admin' = 'admin'
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('assign_admin_role', {
      target_user_id: userId,
      role_type: roleType,
    })

    if (error) {
      throw new Error(`Failed to assign admin role: ${error.message}`)
    }

    return data === true
  } catch (error: any) {
    console.error('Error assigning admin role:', error)
    throw error
  }
}

// Get user activation history
export const getUserActivationHistory = async (
  userId: string
): Promise<ActivationHistoryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('user_activation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch activation history: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error('Error fetching activation history:', error)
    throw error
  }
}

// Get all activation history (admin only)
export const getAllActivationHistory = async (): Promise<ActivationHistoryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('user_activation_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100) // Limit to recent 100 entries

    if (error) {
      throw new Error(`Failed to fetch activation history: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error('Error fetching all activation history:', error)
    throw error
  }
}

// Get user roles
export const getUserRoles = async (userId: string): Promise<UserRole[]> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      throw new Error(`Failed to fetch user roles: ${error.message}`)
    }

    return data || []
  } catch (error: any) {
    console.error('Error fetching user roles:', error)
    throw error
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

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('role', ['admin', 'super_admin'])

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return data && data.length > 0
  } catch (error: any) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Check if current user has specific role
export const hasRole = async (role: 'student' | 'admin' | 'super_admin'): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', role)
      .eq('is_active', true)

    if (error) {
      console.error('Error checking user role:', error)
      return false
    }

    return data && data.length > 0
  } catch (error: any) {
    console.error('Error checking user role:', error)
    return false
  }
}

// Get current user's activation status
export const getCurrentUserActivationStatus = async (): Promise<{
  is_active: boolean
  subscription_end_date: string | null
  subscription_type: string | null
}> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('No authenticated user')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('is_active, subscription_end_date, subscription_type')
      .eq('id', user.id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch user activation status: ${error.message}`)
    }

    return {
      is_active: data.is_active || false,
      subscription_end_date: data.subscription_end_date,
      subscription_type: data.subscription_type,
    }
  } catch (error: any) {
    console.error('Error fetching user activation status:', error)
    throw error
  }
}

// ===== Exercise Access Functions =====

// Get exercises based on user's activation status
export const getAccessibleExercises = async (
  chapterId?: string,
  subjectId?: string,
  levelId?: string
): Promise<any[]> => {
  try {
    let query = supabase.from('exercises').select(`
        *,
        chapter:chapters(
          *,
          subject:subjects(
            *,
            level:levels(*)
          )
        )
      `)

    // Apply filters if provided
    if (chapterId) {
      query = query.eq('chapter_id', chapterId)
    } else if (subjectId) {
      query = query.eq('chapters.subject_id', subjectId)
    } else if (levelId) {
      query = query.eq('chapters.subjects.level_id', levelId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch accessible exercises: ${error.message}`)
    }

    // Transform data to match expected format
    const transformedData =
      data?.map((exercise) => ({
        ...exercise,
        chapter_title: exercise.chapter?.title,
        subject_title: exercise.chapter?.subject?.title,
        level_title: exercise.chapter?.subject?.level?.title,
      })) || []

    return transformedData
  } catch (error: any) {
    console.error('Error fetching accessible exercises:', error)
    throw error
  }
}

// Get public exercises only (for non-active users)
export const getPublicExercises = async (
  chapterId?: string,
  subjectId?: string,
  levelId?: string
): Promise<any[]> => {
  try {
    let query = supabase
      .from('exercises')
      .select(
        `
        *,
        chapter:chapters(
          *,
          subject:subjects(
            *,
            level:levels(*)
          )
        )
      `
      )
      .eq('is_public', true)

    // Apply filters if provided
    if (chapterId) {
      query = query.eq('chapter_id', chapterId)
    } else if (subjectId) {
      query = query.eq('chapters.subject_id', subjectId)
    } else if (levelId) {
      query = query.eq('chapters.subjects.level_id', levelId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch public exercises: ${error.message}`)
    }

    // Transform data to match expected format
    const transformedData =
      data?.map((exercise) => ({
        ...exercise,
        chapter_title: exercise.chapter?.title,
        subject_title: exercise.chapter?.subject?.title,
        level_title: exercise.chapter?.subject?.level?.title,
      })) || []

    return transformedData
  } catch (error: any) {
    console.error('Error fetching public exercises:', error)
    throw error
  }
}

// Toggle exercise public status (admin only)
export const toggleExercisePublicStatus = async (
  exerciseId: string,
  isPublic: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('exercises')
      .update({ is_public: isPublic })
      .eq('id', exerciseId)

    if (error) {
      throw new Error(`Failed to update exercise visibility: ${error.message}`)
    }

    return true
  } catch (error: any) {
    console.error('Error updating exercise visibility:', error)
    throw error
  }
}

// Bulk update exercise public status (admin only)
export const bulkUpdateExercisePublicStatus = async (
  exerciseIds: string[],
  isPublic: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('exercises')
      .update({ is_public: isPublic })
      .in('id', exerciseIds)

    if (error) {
      throw new Error(`Failed to bulk update exercise visibility: ${error.message}`)
    }

    return true
  } catch (error: any) {
    console.error('Error bulk updating exercise visibility:', error)
    throw error
  }
}

// ===== Statistics Functions =====

// Get user statistics for admin dashboard
export const getUserStatistics = async (): Promise<{
  total_users: number
  active_users: number
  inactive_users: number
  expired_subscriptions: number
  admins: number
}> => {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get active users
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get inactive users
    const { count: inactiveUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false)

    // Get expired subscriptions
    const { count: expiredSubscriptions } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('subscription_end_date', 'is', null)
      .lt('subscription_end_date', new Date().toISOString())

    // Get admins
    const { count: admins } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .in('role', ['admin', 'super_admin'])
      .eq('is_active', true)

    return {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      inactive_users: inactiveUsers || 0,
      expired_subscriptions: expiredSubscriptions || 0,
      admins: admins || 0,
    }
  } catch (error: any) {
    console.error('Error fetching user statistics:', error)
    throw error
  }
}

// Get exercise statistics
export const getExerciseStatistics = async (): Promise<{
  total_exercises: number
  public_exercises: number
  private_exercises: number
}> => {
  try {
    // Get total exercises from secure view
    const { count: totalExercises } = await supabase
      .from('user_accessible_exercises')
      .select('*', { count: 'exact', head: true })

    // Get public exercises from secure view
    const { count: publicExercises } = await supabase
      .from('user_accessible_exercises')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)

    return {
      total_exercises: totalExercises || 0,
      public_exercises: publicExercises || 0,
      private_exercises: (totalExercises || 0) - (publicExercises || 0),
    }
  } catch (error: any) {
    console.error('Error fetching exercise statistics:', error)
    throw error
  }
}
