/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { signIn, signUp, signOut, getCurrentUser, getUserWithLevel, onAuthStateChange, ensureStudentProfile, resetPassword, updatePassword, getCurrentSession, signInWithGoogle, handleOAuthCallback } from '../../../lib/api/auth'
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

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const { user, session, error } = await signIn({
        email: payload.email,
        password: payload.password
      })
      
      if (error) {
        throw new Error(error.message)
      }

      if (!user || !session) {
        throw new Error('Login failed: No user or session returned')
      }

      // Get user profile with level information
      const userWithLevel = await getUserWithLevel(user)
      
      // Check if user has phone number in metadata
      const userPhone = user.user_metadata?.phone

      // Check if user needs to complete their profile
      const hasLevel = userWithLevel.levelId !== null && userWithLevel.levelId !== undefined
      const hasPhone = userPhone !== null && userPhone !== undefined && userPhone !== ''
      const needsProfileCompletion = !hasLevel || !hasPhone

      console.log('Login profile check:', {
        hasLevel,
        hasPhone,
        needsProfileCompletion,
        level_id: userWithLevel.levelId,
        phoneNumber: userPhone
      })

      return {
        user: {
          id: user.id,
          email: user.email || '',
          name: `${userWithLevel.firstName || ''} ${userWithLevel.lastName || ''}`.trim() || user.email || '',
          firstName: userWithLevel.firstName || '',
          lastName: userWithLevel.lastName || '',
          level_id: userWithLevel.levelId || null,
          level: userWithLevel.level || null,
          phoneNumber: userPhone || null,
          role: user.user_metadata?.role || null,
          isAdmin: user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin',
          needsProfileCompletion
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        }
      }
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
    // Don't handle auth state changes on magic link pages
    if (isMagicLinkPage()) {
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
        
        return { success: true }
      } else if (session?.user?.aud === 'authenticated') {
        // User is authenticated and wants to change their password
        const { error } = await updatePassword(payload.password)
        
        if (error) {
          throw new Error(error.message)
        }
        
        return { success: true }
      } else if (payload.accessToken) {
        // Use access token for password reset
        const { error } = await updatePassword(payload.password)
        
        if (error) {
          throw new Error(error.message)
        }
        
        return { success: true }
      } else {
        throw new Error('No valid recovery session, authenticated session, or access token found')
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to reset password')
    }
  }
)

// Sign in with Google OAuth
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        throw new Error(error.message)
      }
      
      // The redirect will happen automatically, so we just return success
      return { success: true }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Google sign-in failed')
    }
  }
)

// Handle OAuth callback
export const handleOAuthCallbackThunk = createAsyncThunk(
  'auth/handleOAuthCallback',
  async (_, { rejectWithValue }) => {
    try {
      const { user, session, error } = await handleOAuthCallback()
      
      if (error) {
        throw new Error(error.message)
      }

      if (!user || !session) {
        throw new Error('OAuth callback failed: No user or session returned')
      }

      // Check if user needs to complete their profile
      // For new OAuth users, both level_id and phoneNumber will be null/undefined
      const hasLevel = user.level_id !== null && user.level_id !== undefined
      const hasPhone = user.phoneNumber !== null && user.phoneNumber !== undefined && user.phoneNumber !== ''
      const needsProfileCompletion = !hasLevel || !hasPhone

      console.log('OAuth callback profile check:', {
        hasLevel,
        hasPhone,
        needsProfileCompletion,
        level_id: user.level_id,
        phoneNumber: user.phoneNumber
      })

      return {
        user: {
          id: user.id,
          email: user.email || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          level_id: user.level_id || null,
          level: user.level || null,
          phoneNumber: user.phoneNumber || null,
          role: user.user_metadata?.role || null,
          isAdmin: user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin',
          needsProfileCompletion
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        }
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'OAuth callback failed')
    }
  }
)

// Refresh user data after profile completion
export const refreshUserData = createAsyncThunk(
  'auth/refreshUserData',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        throw new Error(error.message)
      }

      if (!user) {
        throw new Error('No user found')
      }

      // Get user profile with level information
      const userWithLevel = await getUserWithLevel(user)
      
      // Check if user has phone number in metadata
      const userPhone = user.user_metadata?.phone

      // Check if user needs to complete their profile
      const hasLevel = userWithLevel.levelId !== null && userWithLevel.levelId !== undefined
      const hasPhone = userPhone !== null && userPhone !== undefined && userPhone !== ''
      const needsProfileCompletion = !hasLevel || !hasPhone

      return {
        user: {
          id: user.id,
          email: user.email || '',
          name: `${userWithLevel.firstName || ''} ${userWithLevel.lastName || ''}`.trim() || user.email || '',
          firstName: userWithLevel.firstName || '',
          lastName: userWithLevel.lastName || '',
          level_id: userWithLevel.levelId || null,
          level: userWithLevel.level || null,
          phoneNumber: userPhone || null,
          role: user.user_metadata?.role || null,
          isAdmin: user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'super_admin',
          needsProfileCompletion
        }
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to refresh user data')
    }
  }
)
