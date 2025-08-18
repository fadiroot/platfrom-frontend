import { supabase } from '../supabase'
import type { Tables } from '../supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  confirmPassword: string
  phone?: string | null
  age?: number | null
  birthDate?: string | null
  levelId: string // Required for student_profile creation
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  username: string
  phone?: string | null
  age?: number | null
  birthDate?: string | null
  levelId?: string | null
}

export interface AuthResponse {
  user: User | null
  session: Session | null
  error: AuthError | null
  requiresVerification?: boolean
}

// ===== Authentication Functions =====

// Sign up new user with student profile
export const signUp = async (registerData: RegisterData): Promise<AuthResponse> => {
  const { confirmPassword, firstName, lastName, username, phone, age, birthDate, levelId, ...authData } = registerData

  // Validate passwords match
  if (authData.password !== confirmPassword) {
    return {
      user: null,
      session: null,
      error: { message: 'Passwords do not match' } as AuthError
    }
  }

  // Validate levelId is provided (required for student profile)
  if (!levelId) {
    return {
      user: null,
      session: null,
      error: { message: 'Level selection is required' } as AuthError
    }
  }

  try {
    // Ensure phone number is properly formatted
    const formattedPhone = phone ? phone.trim() : null
    
    // Create user with Supabase Auth first
    const { data, error } = await supabase.auth.signUp({
      email: authData.email,
      password: authData.password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          username: username,
          phone: formattedPhone, // Use formatted phone number
          age: age,
          birth_date: birthDate,
          levelId: levelId // Store levelId in metadata for later profile creation
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`
      }
    })

    if (error) {
      return { user: null, session: null, error }
    }

    if (!data.user) {
      return { 
        user: null, 
        session: null, 
        error: { message: 'User creation failed' } as AuthError 
      }
    }



    // Create student profile with retry logic
    const profileResult = await ensureStudentProfile(data.user.id, levelId, formattedPhone)
    
    if (profileResult.error) {
      console.error('❌ Failed to create student profile after all attempts:', profileResult.error)
      
      // If it's a foreign key constraint error and no session (email verification required),
      // we'll create the profile later on first login
      if (profileResult.error.code === '23503' && !data.session) {
        console.log('📧 Email verification required - profile will be created after verification')
        return { 
          user: data.user, 
          session: data.session, 
          error: null,
          requiresVerification: true
        }
      }
      
      // For other errors or when user has immediate session, fail registration
      if (data.session) {
        try {
          await supabase.auth.admin.deleteUser(data.user.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup user after profile creation failure:', cleanupError)
        }
        
        return {
          user: null,
          session: null,
          error: { message: `Registration failed: ${profileResult.error.message || 'Could not create student profile'}` } as AuthError
        }
      }
    } else {
      console.log('🎉 Student profile successfully created during signup!')
    }
    
    return { 
      user: data.user, 
      session: data.session, 
      error: null,
      requiresVerification: !data.session 
    }
    
  } catch (err: any) {
    console.error('Registration error:', err)
    return {
      user: null,
      session: null,
      error: { message: err.message || 'Registration failed' } as AuthError
    }
  }
}

// Sign in existing user
export const signIn = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  return { user: data.user, session: data.session, error }
}

// Sign out user
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get current session
export const getCurrentSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Reset password
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return { error }
}

// Handle password reset recovery (when user clicks email link)
export const handlePasswordResetRecovery = async (): Promise<{ user: User | null; error: AuthError | null }> => {
  const { data, error } = await supabase.auth.getUser()
  
  if (error) {
    return { user: null, error }
  }
  
  // Check if user is in recovery mode (has recovery token)
  const session = await getCurrentSession()
  if (session?.user?.aud === 'recovery') {
    return { user: session.user, error: null }
  }
  
  return { user: data.user, error: null }
}

// Update password
export const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  return { error }
}

// ===== User Profile Functions =====

// Get user profile from auth metadata
export const getUserProfile = async (user: User): Promise<UserProfile> => {
  const metadata = user.user_metadata || {}
  

  
  return {
    id: user.id,
    email: user.email || '',
    firstName: metadata.first_name || '',
    lastName: metadata.last_name || '',
    username: metadata.username || '',
    phone: metadata.phone || null,
    age: metadata.age || null,
    birthDate: metadata.birth_date || null,
    levelId: null, // Level ID is fetched from student_profile table
  }
}

// Get user with level information from student_profile table
export const getUserWithLevel = async (user: User): Promise<UserProfile & { level: Tables<'levels'> | null; role?: string; isAdmin?: boolean }> => {
  const profile = await getUserProfile(user)
  
  let level = null
  let levelId = null
  let role = null
  let isAdmin = false
  
  try {
    // Check if user is admin using the is_admin function
    const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin')
    if (!adminError && adminCheck) {
      isAdmin = true
      role = 'admin'
    }
    
    // Get user level from student_profile table
    const { data, error } = await supabase
      .from('student_profile')
      .select(`
        level_id,
        levels (
          id,
          title,
          description,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .maybeSingle() // Use maybeSingle() instead of single() to handle missing records
    
    if (!error && data) {
      levelId = data.level_id // Already a UUID string
      level = Array.isArray(data.levels) ? data.levels[0] : data.levels
    } else if (error && error.code === 'PGRST116') {
      // Student profile doesn't exist, this is normal for new users
      console.log('Student profile not found for user:', user.id, '- this is normal for new users')
    } else if (error) {
      console.error('Error fetching student profile:', error)
    }
  } catch (error) {
    console.error('💥 Exception in getUserWithLevel:', error)
  }

  return {
    ...profile,
    levelId,
    level,
    role,
    isAdmin
  }
}

// Create student profile (separate function for delayed creation)
export const createStudentProfile = async (userId: string, levelId: string, phoneNumber?: string | null): Promise<{ error: any; data?: any }> => {
  try {
    console.log('🔄 Creating student profile for user:', userId, 'level:', levelId)
    
    const { data, error } = await supabase
      .from('student_profile')
      .insert({
        user_id: userId,
        level_id: levelId, // Keep as UUID string, don't convert to integer
        phone_number: phoneNumber, // Store phone number in student_profile
        is_active: false // Explicitly set to false - student accounts are deactivated by default
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Student profile creation failed:', error)
      return { error }
    }
    
    console.log('✅ Student profile created successfully:', data)
    return { error: null, data }
  } catch (error) {
    console.error('❌ Exception during student profile creation:', error)
    return { error }
  }
}

// Ensure student profile exists (with retry logic)
export const ensureStudentProfile = async (userId: string, levelId: string, phoneNumber?: string | null): Promise<{ error: any; data?: any }> => {
  try {
    console.log('🔍 Checking if student profile exists for user:', userId)
    
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('student_profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (!checkError && existingProfile) {
      console.log('✅ Student profile already exists:', existingProfile)
      return { error: null, data: existingProfile }
    }
    
    console.log('📝 Student profile does not exist, creating...')
    
    // Profile doesn't exist, create it with retry logic
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      attempts++
      console.log(`🔄 Attempt ${attempts}/${maxAttempts} to create student profile`)
      
      const result = await createStudentProfile(userId, levelId, phoneNumber)
      
      if (!result.error) {
        return result
      }
      
      // If it's a foreign key constraint error, wait and retry
      if (result.error.code === '23503' && attempts < maxAttempts) {
        console.log(`⏳ User not available yet, waiting 500ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      
      // If it's a unique constraint violation, the profile already exists
      if (result.error.code === '23505') {
        console.log('✅ Profile already exists (unique constraint)')
        // Fetch the existing profile
        const { data: existingData } = await supabase
          .from('student_profile')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()
        return { error: null, data: existingData }
      }
      
      // For other errors, return immediately
      return result
    }
    
    return { error: { message: 'Failed to create student profile after multiple attempts' } }
  } catch (error) {
    console.error('❌ Exception in ensureStudentProfile:', error)
    return { error }
  }
}

// Set user level in student_profile table
export const setUserLevel = async (userId: string, levelId: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from('student_profile')
      .upsert({
        user_id: userId,
        level_id: levelId, // Keep as UUID string
        created_at: new Date().toISOString()
      })
    
    return { error }
  } catch (error) {
    return { error }
  }
}

// Update user profile in auth metadata
export const updateUserProfile = async (updates: Partial<Omit<UserProfile, 'id' | 'email'>>): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: updates.firstName,
      last_name: updates.lastName,
      username: updates.username,
      phone: updates.phone,
      age: updates.age,
      birth_date: updates.birthDate,
    }
  })
  
  // If level_id is provided, update it in student_profile table
  if (updates.levelId && !error) {
    const user = await getCurrentUser()
    if (user) {
      await setUserLevel(user.id, updates.levelId)
    }
  }
  
  return { error }
}

// Manual function to create student profile (for testing/debugging)
export const manuallyCreateStudentProfile = async (levelId: string): Promise<{ error: any; data?: any }> => {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { error: { message: 'No user is currently logged in' } }
    }
    
    console.log('🔧 Manually creating student profile for current user')
    return await ensureStudentProfile(user.id, levelId, user.user_metadata?.phone)
  } catch (error) {
    console.error('❌ Manual profile creation failed:', error)
    return { error }
  }
}



// ===== Auth State Listeners =====

// Listen to auth state changes
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession()
  return !!session
}

// Get access token
export const getAccessToken = async (): Promise<string | null> => {
  const session = await getCurrentSession()
  return session?.access_token || null
}

// Refresh session
export const refreshSession = async (): Promise<{ session: Session | null; error: AuthError | null }> => {
  const { data, error } = await supabase.auth.refreshSession()
  return { session: data.session, error }
}