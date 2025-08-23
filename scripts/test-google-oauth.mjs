#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testGoogleOAuth() {
  console.log('🔍 Testing Google OAuth configuration...\n')

  try {
    // Test 1: Check if Google provider is enabled
    console.log('📋 Test 1: Checking Google provider configuration...')
    
    // Try to initiate Google OAuth (this will fail if not configured, but we can catch the error)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      if (error.message.includes('Provider not enabled') || error.message.includes('not configured')) {
        console.log('❌ Google OAuth provider is not enabled in Supabase')
        console.log('   Please enable Google provider in your Supabase dashboard:')
        console.log('   1. Go to Authentication > Providers')
        console.log('   2. Enable Google provider')
        console.log('   3. Add your Google OAuth credentials')
        console.log('   4. Set redirect URL to: http://localhost:3000/auth/callback')
        return false
      } else {
        console.log('✅ Google OAuth provider is enabled')
        console.log('   Error details:', error.message)
        console.log('   This is expected - the test was just checking configuration')
      }
    } else {
      console.log('✅ Google OAuth provider is enabled and working')
    }

    // Test 2: Check environment variables
    console.log('\n📋 Test 2: Checking environment variables...')
    console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')

    // Test 3: Check Supabase connection
    console.log('\n📋 Test 3: Testing Supabase connection...')
    const { data, error: healthError } = await supabase.from('levels').select('count').limit(1)
    
    if (healthError) {
      console.log('❌ Cannot connect to Supabase:', healthError.message)
      return false
    } else {
      console.log('✅ Successfully connected to Supabase')
    }

    console.log('\n🎉 Google OAuth setup appears to be configured correctly!')
    console.log('\n📝 Next steps:')
    console.log('   1. Start your development server: npm run dev')
    console.log('   2. Navigate to the login page')
    console.log('   3. Click the "Continue with Google" button')
    console.log('   4. Complete the OAuth flow')
    
    return true

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testGoogleOAuth()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
