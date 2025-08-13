export interface StudentProfile {
  id: string;
  user_id: string;
  level_id: string;
  is_active: boolean;
  subscription_start_date?: string;
  subscription_end_date?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_amount?: number;
  payment_notes?: string;
  activated_by?: string;
  activated_at?: string;
  deactivated_at?: string;
  deactivated_by?: string;
  deactivation_reason?: string;
  created_at: string;
}

export interface AdminStudentList {
  profile_id: string;
  user_id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  level_title?: string;
  is_active: boolean;
  subscription_start_date?: string;
  subscription_end_date?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_amount?: number;
  payment_method?: string;
  payment_notes?: string;
  activated_by?: string;
  activated_at?: string;
  deactivated_at?: string;
  deactivated_by?: string;
  deactivation_reason?: string;
  created_at: string;
  user_created_at: string;
  last_sign_in_at?: string;
  account_status: 'active' | 'inactive' | 'expired';
}

export interface ActivateStudentRequest {
  student_profile_id: string;
  subscription_months: number;
  payment_amount?: number;
  payment_method?: string;
  payment_notes?: string;
}

export interface DeactivateStudentRequest {
  student_profile_id: string;
  reason?: string;
}

export interface ExerciseAccess {
  exercise_id: string;
  exercise_name: string;
  is_public: boolean;
  chapter_id: string;
  chapter_title: string;
  subject_id: string;
  subject_title: string;
}

export interface StudentFilters {
  status?: 'all' | 'active' | 'inactive' | 'expired';
  level_id?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  search?: string;
} 