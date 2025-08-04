import { createClient } from '@supabase/supabase-js'

// Environment variables - add these to your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types (based on your schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          username: string | null
          phone: string | null
          age: number | null
          birth_date: string | null
          level_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          username?: string | null
          phone?: string | null
          age?: number | null
          birth_date?: string | null
          level_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          username?: string | null
          phone?: string | null
          age?: number | null
          birth_date?: string | null
          level_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      levels: {
        Row: {
          id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          level_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          level_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          level_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          title: string
          description: string | null
          exercise_count: number | null
          estimated_time: string | null
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null
          type: 'Theory' | 'Practical' | 'Assessment' | null
          subject_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          exercise_count?: number | null
          estimated_time?: string | null
          difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null
          type?: 'Theory' | 'Practical' | 'Assessment' | null
          subject_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          exercise_count?: number | null
          estimated_time?: string | null
          difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null
          type?: 'Theory' | 'Practical' | 'Assessment' | null
          subject_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          tag: number | null
          difficulty: 'Easy' | 'Medium' | 'Hard' | null
          chapter_id: string | null
          exercise_file_urls: string[] | null
          correction_file_urls: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tag?: number | null
          difficulty?: 'Easy' | 'Medium' | 'Hard' | null
          chapter_id?: string | null
          exercise_file_urls?: string[] | null
          correction_file_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tag?: number | null
          difficulty?: 'Easy' | 'Medium' | 'Hard' | null
          chapter_id?: string | null
          exercise_file_urls?: string[] | null
          correction_file_urls?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          chapter_id: string
          completed: boolean | null
          completion_date: string | null
          progress_percentage: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          chapter_id: string
          completed?: boolean | null
          completion_date?: string | null
          progress_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          chapter_id?: string
          completed?: boolean | null
          completion_date?: string | null
          progress_percentage?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']