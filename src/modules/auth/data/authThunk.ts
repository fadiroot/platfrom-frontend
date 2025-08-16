/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { signIn, signUp, signOut, getCurrentUser, getUserWithLevel, onAuthStateChange, ensureStudentProfile, resetPassword, updatePassword, getCurrentSession } from '../../../lib/api/auth'
import { LoginPayload, RegisterPayload } from './authTypes'
import { supabase } from '../../../lib/supabase'

// Helper function to check if we're on a magic link page
const isMagicLinkPage = () => {
  const currentPath = window.location.pathname
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  
  // Check for magic link indicators
  const hasTokenHash = searchParams.has('token_hash') || hashParams.has('token_hash')
  const hasAccessToken = searchParams.has('access_token') || hashParams.has('access_token')
  const hasCode = searchParams.has('code') || hashParams.has('code')
  const isRecovery = searchParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery'
  const isEmailConfirmation = searchParams.get('type') === 'email' || hashParams.get('type') === 'email'
  
  return (
    currentPath === '/reset-password' ||
    currentPath === '/auth/confirm' ||
    hasTokenHash ||
    hasAccessToken ||
    hasCode ||
    isRecovery ||
    isEmailConfirmation
  )
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginPayload, { rejectWithValue }) => {
    try {
      const { user, session, error } = await signIn({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!user || !session) {
        throw new Error('Login failed: No user or session returned')
      }

      // Get user profile with level information from auth metadata
      const userWithLevel = await getUserWithLevel(user)

      // Check if user needs student profile created (for users who registered but needed email verification)
      if (!userWithLevel.levelId && user.user_metadata?.levelId) {
        console.log('🔄 Creating missing student profile for verified user')
        const profileResult = await ensureStudentProfile(user.id, user.user_metadata.levelId)
        
        if (!profileResult.error) {
          console.log('✅ Student profile created successfully on login')
          // Fetch updated user with level after profile creation
          const updatedUserWithLevel = await getUserWithLevel(user)
          return {
            user: {
              id: user.id,
              email: user.email || '',
              name: `${updatedUserWithLevel.firstName} ${updatedUserWithLevel.lastName}`.trim() || user.email || '',
              firstName: updatedUserWithLevel.firstName || '',
              lastName: updatedUserWithLevel.lastName || '',
              level_id: updatedUserWithLevel.levelId || null,
              level: updatedUserWithLevel.level || null,
              role: user.user_metadata?.role || null,
              isAdmin: user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin'
            },
            session: {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at
            }
          }
        } else {
          console.error('❌ Failed to create student profile on login:', profileResult.error)
          // Continue with login even if profile creation fails
        }
      }

      const loginResult = {
        user: {
          id: user.id,
          email: user.email || '',
          name: `${userWithLevel.firstName} ${userWithLevel.lastName}`.trim() || user.email || '',
          firstName: userWithLevel.firstName || '',
          lastName: userWithLevel.lastName || '',
          level_id: userWithLevel.levelId || null,
          level: userWithLevel.level || null,
          role: user.user_metadata?.role || null,
          isAdmin: user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin'
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        }
      }
      
      return loginResult
    } catch (err: any) {
      return rejectWithValue(err.message || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterPayload, { rejectWithValue }) => {
    try {
      const { user, session, error, requiresVerification } = await signUp(userData)

      if (error) {
        throw new Error(error.message)
      }

      if (!user) {
        throw new Error('Registration failed: No user returned')
      }

      return {
        user: {
          id: user.id,
          email: user.email || '',
          name: `${userData.firstName} ${userData.lastName}`.trim(),
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          level_id: userData.levelId || null,
          level: null,
          role: user.user_metadata?.role || null,
          isAdmin: user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin'
        },
        session: session ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        } : null,
        requiresVerification
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Registration failed')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await signOut()
      if (error) {
        throw new Error(error.message)
      }
      return {}
    } catch (err: any) {
      return rejectWithValue(err.message || 'Logout failed')
    }
  }
)

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Don't initialize auth if we're on a magic link page
      if (isMagicLinkPage()) {
        console.log('🔗 Magic link page detected, skipping auth initialization')
        return {
          isAuthenticated: false,
          user: null
        }
      }

      const user = await getCurrentUser()
      
      if (!user) {
        return {
          isAuthenticated: false,
          user: null
        }
      }

      // Check if user is in recovery mode (password reset)
      const session = await getCurrentSession()
      if (session?.user?.aud === 'recovery') {
        console.log('User is in recovery mode during auth initialization, not authenticating')
        return {
          isAuthenticated: false,
          user: null
        }
      }

      // Get user profile with level information
      const userWithLevel = await getUserWithLevel(user)

      return {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email || '',
          name: `${userWithLevel.firstName} ${userWithLevel.lastName}`.trim() || user.email || '',
          firstName: userWithLevel.firstName || '',
          lastName: userWithLevel.lastName || '',
          level_id: userWithLevel.levelId || null,
          level: userWithLevel.level || null,
          role: user.user_metadata?.role || null,
          isAdmin: user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin'
        }
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Auth initialization failed')
    }
  }
)

// Auth state change listener (call this in your app initialization)
export const setupAuthListener = (dispatch: any) => {
  return onAuthStateChange(async (event, session) => {
    console.log('Auth state change:', event, session?.user?.aud)
    
    // Don't handle auth state changes on magic link pages
    if (isMagicLinkPage()) {
      console.log('🔗 Magic link page detected, skipping auth state change handling')
      return
    }
    
    if (event === 'SIGNED_OUT' || !session) {
      // Use the initialise action to reset auth state
      dispatch({
        type: 'auth/initialise',
        payload: { isAuthenticated: false, user: null }
      })
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // Check if user is in recovery mode (password reset)
      if (session?.user?.aud === 'recovery') {
        console.log('User is in recovery mode, not initializing auth')
        // Don't initialize auth for recovery mode - let the reset password component handle it
        return
      }
      
      // Re-initialize auth to get fresh user data for normal sign-ins
      dispatch(initializeAuth())
    }
  })
}

// Request password reset
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { success: true }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to send reset email')
    }
  }
)

// Reset user password
export const resetUserPassword = createAsyncThunk(
  'auth/resetUserPassword',
  async (payload: { password: string; accessToken?: string; refreshToken?: string }, { rejectWithValue }) => {
    try {
      // Check if user is in recovery mode
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user?.aud === 'recovery') {
        // User is in recovery mode, update password directly
        const { error } = await updatePassword(payload.password)
        
        if (error) {
          throw new Error(error.message)
        }
        
        // Don't sign out the user - keep the session for direct login
        // The session will automatically become 'authenticated' after password update
        console.log('✅ Password updated successfully, maintaining session for direct login')
        
        return { success: true }
      } else if (payload.accessToken) {
        // Use access token for password reset
        const { error } = await updatePassword(payload.password)
        
        if (error) {
          throw new Error(error.message)
        }
        
        return { success: true }
      } else {
        throw new Error('No valid recovery session or access token found')
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to reset password')
    }
  }
)
