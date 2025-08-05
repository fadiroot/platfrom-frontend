/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { login, logout, register, initializeAuth } from './authThunk'

export interface AuthState {
  status: string
  isAuthenticated: boolean
  isInitialised: boolean
  user: {
    id: string
    name: string
    email: string
    firstName: string
    lastName: string
    level_id: string | null
    level: {
      id: string
      title: string
      description: string | null
    } | null
  } | null
  error: string | null
}

const initialState: AuthState = {
  status: 'idle',
  isAuthenticated: false,
  isInitialised: false,
  user: null,
  error: null,
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
    builder.addCase(logout.pending, (state) => {
      state.error = null
      state.status = 'loading'
    })
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false
      state.user = null
      state.status = 'succeeded'
    })
    builder.addCase(logout.rejected, (state, action: PayloadAction<any>) => {
      state.error = action?.payload
      state.status = 'failed'
    })

    // Initialize auth cases
    builder.addCase(initializeAuth.pending, (state) => {
      state.error = null
      state.status = 'loading'
    })
    builder.addCase(initializeAuth.fulfilled, (state, action: PayloadAction<any>) => {
      const { isAuthenticated, user } = action.payload
      state.isAuthenticated = isAuthenticated
      state.user = user
      state.isInitialised = true
      state.status = 'succeeded'
    })
    builder.addCase(initializeAuth.rejected, (state, action: PayloadAction<any>) => {
      state.error = action?.payload
      state.status = 'failed'
      state.isAuthenticated = false
      state.user = null
      state.isInitialised = true
    })
  },
})

export const { initialise, restore } = authSlice.actions

export default authSlice.reducer
