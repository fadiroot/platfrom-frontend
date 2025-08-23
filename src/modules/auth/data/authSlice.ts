/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { login, register, logout, initializeAuth, requestPasswordReset, resetUserPassword, loginWithGoogle, handleOAuthCallbackThunk, refreshUserData } from './authThunk'

export interface AuthState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed' | 'verification_required'
  isAuthenticated: boolean
  isInitialised: boolean
  user: {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    level_id: string | null
    level: {
      id: string
      title: string
      description: string | null
    } | null
    phoneNumber: string | null
    role?: string // Add role field for admin detection
    isAdmin?: boolean // Add explicit admin flag
    needsProfileCompletion?: boolean // Add profile completion flag
  } | null
  error: string | null
  resetPasswordStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  resetPasswordMessage: string | null
}

const initialState: AuthState = {
  status: 'idle',
  isAuthenticated: false,
  isInitialised: false,
  user: null,
  error: null,
  resetPasswordStatus: 'idle',
  resetPasswordMessage: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initialise: (state, action) => {
      const { isAuthenticated, user } = action.payload
      state.isAuthenticated = isAuthenticated
      state.isInitialised = true
      state.user = user
    },
    restore: (state) => {
      state.error = null
    },
    clearResetPasswordState: (state) => {
      state.resetPasswordStatus = 'idle'
      state.resetPasswordMessage = null
    },
  },
  extraReducers: (builder) => {
    // Login cases
    builder.addCase(login.pending, (state) => {
      state.error = null
      state.status = 'loading'
    })
    builder.addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
      const { user } = action.payload
      state.isAuthenticated = true
      state.user = user
      state.status = 'succeeded'
      state.isInitialised = true
    })
    builder.addCase(login.rejected, (state, action: PayloadAction<any>) => {
      state.error = action?.payload
      state.status = 'failed'
      state.isAuthenticated = false
      state.user = null
    })

    // Register cases
    builder.addCase(register.pending, (state) => {
      state.error = null
      state.status = 'loading'
    })
    builder.addCase(register.fulfilled, (state, action: PayloadAction<any>) => {
      const { user, requiresVerification } = action.payload
      if (requiresVerification) {
        state.status = 'verification_required'
        state.isAuthenticated = false
        state.user = null
      } else {
        state.isAuthenticated = true
        state.user = user
        state.status = 'succeeded'
        state.isInitialised = true
      }
    })
    builder.addCase(register.rejected, (state, action: PayloadAction<any>) => {
      state.error = action?.payload
      state.status = 'failed'
      state.isAuthenticated = false
      state.user = null
    })

    // Logout cases
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false
      state.user = null
      state.status = 'idle'
      state.error = null
    })
    builder.addCase(logout.rejected, (state, action: PayloadAction<any>) => {
      state.error = action?.payload
    })

    // Initialize auth cases
    builder.addCase(initializeAuth.fulfilled, (state, action: PayloadAction<any>) => {
      const { isAuthenticated, user } = action.payload
      state.isAuthenticated = isAuthenticated
      state.user = user
      state.isInitialised = true
      state.status = 'succeeded'
    })
    builder.addCase(initializeAuth.rejected, (state, action: PayloadAction<any>) => {
      state.error = action?.payload
      state.isInitialised = true
    })

    // Request password reset cases
    builder.addCase(requestPasswordReset.pending, (state) => {
      state.resetPasswordStatus = 'loading'
      state.resetPasswordMessage = null
    })
    builder.addCase(requestPasswordReset.fulfilled, (state) => {
      state.resetPasswordStatus = 'succeeded'
      state.resetPasswordMessage = 'Password reset email sent successfully'
    })
    builder.addCase(requestPasswordReset.rejected, (state, action: PayloadAction<any>) => {
      state.resetPasswordStatus = 'failed'
      state.resetPasswordMessage = action?.payload || 'Failed to send reset email'
    })

    // Reset user password cases
    builder.addCase(resetUserPassword.pending, (state) => {
      state.resetPasswordStatus = 'loading'
      state.resetPasswordMessage = null
    })
    builder.addCase(resetUserPassword.fulfilled, (state) => {
      state.resetPasswordStatus = 'succeeded'
      state.resetPasswordMessage = 'Password updated successfully'
    })
    builder.addCase(resetUserPassword.rejected, (state, action: PayloadAction<any>) => {
      state.resetPasswordStatus = 'failed'
      state.resetPasswordMessage = action?.payload || 'Failed to reset password'
    })

    // Google OAuth login cases
    builder.addCase(loginWithGoogle.pending, (state) => {
      state.error = null
      state.status = 'loading'
    })
    builder.addCase(loginWithGoogle.fulfilled, (state) => {
      // Google OAuth will redirect, so we just mark as loading
      state.status = 'loading'
    })
    builder.addCase(loginWithGoogle.rejected, (state, action: PayloadAction<any>) => {
      state.error = action?.payload
      state.status = 'failed'
    })

    // OAuth callback cases
    builder.addCase(handleOAuthCallbackThunk.pending, (state) => {
      state.error = null
      state.status = 'loading'
    })
    builder.addCase(handleOAuthCallbackThunk.fulfilled, (state, action: PayloadAction<any>) => {
      const { user } = action.payload
      state.isAuthenticated = true
      state.user = user
      state.status = 'succeeded'
      state.isInitialised = true
    })
    builder.addCase(handleOAuthCallbackThunk.rejected, (state, action: PayloadAction<any>) => {
      state.error = action?.payload
      state.status = 'failed'
      state.isAuthenticated = false
      state.user = null
    })

    // Refresh user data cases
    builder.addCase(refreshUserData.pending, (state) => {
      state.error = null
      state.status = 'loading'
    })
    builder.addCase(refreshUserData.fulfilled, (state, action: PayloadAction<any>) => {
      const { user } = action.payload
      state.isAuthenticated = true
      state.user = user
      state.status = 'succeeded'
      state.isInitialised = true
    })
    builder.addCase(refreshUserData.rejected, (state, action: PayloadAction<any>) => {
      state.error = action?.payload
      state.status = 'failed'
      state.isAuthenticated = false
      state.user = null
    })
  },
})

export const { initialise, restore, clearResetPasswordState } = authSlice.actions

export default authSlice.reducer
