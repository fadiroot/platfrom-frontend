import { supabase } from '../supabase'
import { createClient } from '@supabase/supabase-js'
import {
  AdminStudentList,
  ActivateStudentRequest,
  DeactivateStudentRequest,
  ExerciseAccess,
  StudentFilters,
} from '../../modules/shared/types/student'

// Create a separate Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export const studentsApi = {
  // Get all students for admin dashboard
  async getStudentsList(filters?: StudentFilters): Promise<AdminStudentList[]> {
    try {
      // Check if current user is admin first
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data: isAdmin, error: adminError } = await supabase.rpc('check_user_is_admin', {
        target_user_id: user.id,
      })

      if (adminError || !isAdmin) {
        throw new Error('Access denied: Admin privileges required')
      }

      // Use the secure RPC function instead of Admin API
      const { data, error: rpcError } = await supabase.rpc('get_students_with_user_data')

      if (rpcError) {
        throw new Error(`Failed to fetch students: ${rpcError.message}`)
      }

      // Transform the data to match AdminStudentList interface
      let transformedData: AdminStudentList[] = (data || []).map((student: any) => ({
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
        account_status: student.account_status as 'active' | 'inactive',
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
      console.error('Error fetching students:', error)
      throw error
    }
  },

  // Activate student account
  async activateStudent(request: ActivateStudentRequest): Promise<boolean> {
    try {
      // Update the student_profile to mark as active with subscription details
      const { error } = await supabase
        .from('student_profile')
        .update({
          is_active: true,
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(
            Date.now() + request.subscription_months * 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          payment_amount: request.payment_amount,
          payment_method: request.payment_method,
          payment_notes: request.payment_notes,
          payment_status: 'paid',
          activated_at: new Date().toISOString(),
        })
        .eq('id', request.student_profile_id)

      if (error) {
        throw new Error(`Failed to activate student: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error activating student:', error)
      throw error
    }
  },

  // Deactivate student account
  async deactivateStudent(request: DeactivateStudentRequest): Promise<boolean> {
    try {
      // Update the student_profile to mark as inactive
      const { error } = await supabase
        .from('student_profile')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: request.reason || 'Deactivated by admin',
        })
        .eq('id', request.student_profile_id)

      if (error) {
        throw new Error(`Failed to deactivate student: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Error deactivating student:', error)
      throw error
    }
  },

  // Get user's accessible exercises
  async getUserAccessibleExercises(): Promise<ExerciseAccess[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase.rpc('get_user_accessible_exercises', {
      user_uuid: user.id,
    })

    if (error) {
      // Fallback: If function doesn't exist, return all exercises
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.warn(
          'Database function get_user_accessible_exercises not found, using fallback query'
        )
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('exercises')
          .select('*')
          .order('created_at', { ascending: false })

        if (fallbackError) {
          throw new Error(`Failed to fetch accessible exercises: ${fallbackError.message}`)
        }

        return fallbackData || []
      }
      throw new Error(`Failed to fetch accessible exercises: ${error.message}`)
    }

    return data || []
  },

  // Check if user can access specific exercise
  async canAccessExercise(exerciseId: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data, error } = await supabase.rpc('can_access_exercise', {
      user_id: user.id,
      exercise_id: exerciseId,
    })

    if (error) {
      console.error('Error checking exercise access:', error)
      return false
    }

    return data || false
  },

  // Get student profile by user ID
  async getStudentProfile(userId: string) {
    const { data, error } = await supabase
      .from('student_profile')
      .select(
        `
        *,
        levels (
          id,
          title,
          description
        )
      `
      )
      .eq('user_id', userId)
      .maybeSingle() // Use maybeSingle() to handle missing records

    if (error && error.code !== 'PGRST116') {
      // Only throw error if it's not a "no rows" error
      throw new Error(`Failed to fetch student profile: ${error.message}`)
    }

    return data // Returns null if no profile exists
  },

  // Update exercise public/private status
  async updateExerciseVisibility(exerciseId: string, isPublic: boolean) {
    const { error } = await supabase
      .from('exercises')
      .update({ is_public: isPublic })
      .eq('id', exerciseId)

    if (error) {
      throw new Error(`Failed to update exercise visibility: ${error.message}`)
    }
  },
}
