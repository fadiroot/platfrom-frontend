import { supabase } from "../supabase";
import { createClient } from '@supabase/supabase-js';
import { 
  AdminStudentList, 
  ActivateStudentRequest, 
  DeactivateStudentRequest, 
  ExerciseAccess,
  StudentFilters 
} from '../../modules/shared/types/student';

// Create a separate Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const studentsApi = {
  // Get all students for admin dashboard
  async getStudentsList(filters?: StudentFilters): Promise<AdminStudentList[]> {
    try {
      // Query student_profile table with proper relationships
      const { data: profiles, error: profilesError } = await supabase
        .from('student_profile')
        .select(`
          *,
          levels (
            id,
            title,
            description
          )
        `);

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      // Get user information from auth.users using service role key
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (usersError) {
        console.warn('Could not fetch user details from auth:', usersError.message);
        // Fallback: return profiles without user details
        return (profiles || []).map((profile: any) => ({
          profile_id: profile.id,
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
          account_status: profile.is_active ? 'active' as const : 'inactive' as const
        }));
      }

      // Transform student_profile data to match AdminStudentList interface
      let transformedData: AdminStudentList[] = (profiles || []).map((profile: any) => {
        const user = users?.users?.find(u => u.id === profile.user_id);
        const userMetadata = user?.user_metadata || {};
        
        return {
          profile_id: profile.id,
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
          account_status: profile.is_active ? 'active' as const : 'inactive' as const
        };
      });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'expired') {
          transformedData = transformedData.filter((student) => 
            student.subscription_end_date && new Date(student.subscription_end_date) < new Date()
          );
        } else if (filters.status === 'active') {
          transformedData = transformedData.filter((student) => student.is_active);
        } else if (filters.status === 'inactive') {
          transformedData = transformedData.filter((student) => !student.is_active);
        }
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        transformedData = transformedData.filter((student) => 
          student.email?.toLowerCase().includes(searchLower) ||
          student.first_name?.toLowerCase().includes(searchLower) ||
          student.last_name?.toLowerCase().includes(searchLower)
        );
      }

      return transformedData;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
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
          subscription_end_date: new Date(Date.now() + request.subscription_months * 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_amount: request.payment_amount,
          payment_method: request.payment_method,
          payment_notes: request.payment_notes,
          payment_status: 'paid',
          activated_at: new Date().toISOString()
        })
        .eq('id', request.student_profile_id);

      if (error) {
        throw new Error(`Failed to activate student: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error activating student:', error);
      throw error;
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
          deactivation_reason: request.reason || 'Deactivated by admin'
        })
        .eq('id', request.student_profile_id);

      if (error) {
        throw new Error(`Failed to deactivate student: ${error.message}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error deactivating student:', error);
      throw error;
    }
  },

  // Get user's accessible exercises
  async getUserAccessibleExercises(): Promise<ExerciseAccess[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.rpc('get_user_accessible_exercises', {
      user_uuid: user.id
    });

    if (error) {
      // Fallback: If function doesn't exist, return all exercises
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.warn('Database function get_user_accessible_exercises not found, using fallback query');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('exercises')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          throw new Error(`Failed to fetch accessible exercises: ${fallbackError.message}`);
        }
        
        return fallbackData || [];
      }
      throw new Error(`Failed to fetch accessible exercises: ${error.message}`);
    }

    return data || [];
  },

  // Check if user can access specific exercise
  async canAccessExercise(exerciseId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase.rpc('can_access_exercise', {
      user_id: user.id,
      exercise_id: exerciseId
    });

    if (error) {
      // Fallback: If function doesn't exist, allow access (temporary)
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.warn('Database function can_access_exercise not found, allowing access (run migration to fix)');
        return true;
      }
      console.error('Error checking exercise access:', error);
      return false;
    }

    return data || false;
  },

  // Get student profile by user ID
  async getStudentProfile(userId: string) {
    const { data, error } = await supabase
      .from('student_profile')
      .select(`
        *,
        levels (
          id,
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch student profile: ${error.message}`);
    }

    return data;
  },

  // Update exercise public/private status
  async updateExerciseVisibility(exerciseId: string, isPublic: boolean) {
    const { error } = await supabase
      .from('exercises')
      .update({ is_public: isPublic })
      .eq('id', exerciseId);

    if (error) {
      throw new Error(`Failed to update exercise visibility: ${error.message}`);
    }
  }
};