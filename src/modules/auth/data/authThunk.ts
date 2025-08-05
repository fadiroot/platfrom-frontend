/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk } from '@reduxjs/toolkit'
import { signIn, signUp, signOut, getCurrentUser, getUserWithLevel, onAuthStateChange, ensureStudentProfile } from '../../../lib/api/auth'
import { LoginPayload, RegisterPayload } from './authTypes'

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
              level: updatedUserWithLevel.level || null
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
          level: userWithLevel.level || null
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
          level: null // Will be fetched on login
        },
        session: session ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        } : null,
        requiresVerification: requiresVerification || false,
        levelId: userData.levelId // Store levelId for later profile creation
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'Registration failed')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const { error } = await signOut()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (err: any) {
    return rejectWithValue(err.message || 'Logout failed')
  }
})

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const user = await getCurrentUser()
      
      if (!user) {
        return {
          isAuthenticated: false,
          user: null
        }
      }

      // Get user profile with level information from auth metadata
      const userWithLevel = await getUserWithLevel(user)

      const userData = {
        isAuthenticated: true,
        user: {
          id: user.id,
          email: user.email || '',
          name: `${userWithLevel.firstName} ${userWithLevel.lastName}`.trim() || user.email || '',
          firstName: userWithLevel.firstName || '',
          lastName: userWithLevel.lastName || '',
          level_id: userWithLevel.levelId || null,
          level: userWithLevel.level || null
        }
      }
      
      return userData
    } catch (err: any) {
      console.error('❌ Auth initialization failed:', err)
      return rejectWithValue(err.message || 'Failed to initialize auth')
    }
  }
)

// Auth state change listener (call this in your app initialization)
export const setupAuthListener = (dispatch: any) => {
  return onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      // Use the initialise action to reset auth state
      dispatch({
        type: 'auth/initialise',
        payload: { isAuthenticated: false, user: null }
      })
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      // Re-initialize auth to get fresh user data
      dispatch(initializeAuth())
    }
  })
}
