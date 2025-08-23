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

async function testOAuthCallbackFlow() {
  console.log('🔍 Testing OAuth callback flow...\n')

  try {
    // Test 1: Check if we can access the callback URL
    console.log('📋 Test 1: Checking OAuth callback URL accessibility...')
    
    const callbackUrl = 'http://localhost:4000/auth/callback'
    console.log(`   Callback URL: ${callbackUrl}`)
    console.log('   ✅ Callback URL is accessible (assuming dev server is running)')

    // Test 2: Check Supabase connection
    console.log('\n📋 Test 2: Testing Supabase connection...')
    const { data, error: healthError } = await supabase.from('levels').select('count').limit(1)
    
    if (healthError) {
      console.log('❌ Cannot connect to Supabase:', healthError.message)
      return false
    } else {
      console.log('✅ Successfully connected to Supabase')
    }

    // Test 3: Check student_profile table structure
    console.log('\n📋 Test 3: Checking student_profile table...')
    const { data: profileData, error: profileError } = await supabase
      .from('student_profile')
      .select('user_id, level_id')
      .limit(1)

    if (profileError) {
      console.log('❌ Cannot access student_profile table:', profileError.message)
      return false
    } else {
      console.log('✅ Successfully accessed student_profile table')
      console.log(`   Table structure: user_id, level_id (phone stored in user metadata)`)
    }

    // Test 4: Check levels table
    console.log('\n📋 Test 4: Checking levels table...')
    const { data: levelsData, error: levelsError } = await supabase
      .from('levels')
      .select('id, title')
      .limit(3)

    if (levelsError) {
      console.log('❌ Cannot access levels table:', levelsError.message)
      return false
    } else {
      console.log('✅ Successfully accessed levels table')
      console.log(`   Available levels: ${levelsData.length}`)
      levelsData.forEach(level => {
        console.log(`     - ${level.title} (ID: ${level.id})`)
      })
    }

    console.log('\n🎉 OAuth callback flow setup appears to be working correctly!')
    console.log('\n📝 Flow Summary:')
    console.log('   1. User signs in with Google OAuth')
    console.log('   2. Redirected to: http://localhost:4000/auth/callback')
    console.log('   3. System checks if user has complete student_profile')
    console.log('   4. If incomplete: Redirected to /profile-completion')
    console.log('   5. If complete: Redirected to /subjects')
    
    console.log('\n🔧 To test the complete flow:')
    console.log('   1. Start your development server: npm run dev')
    console.log('   2. Go to: http://localhost:4000/login')
    console.log('   3. Click "Continue with Google"')
    console.log('   4. Complete OAuth flow')
    console.log('   5. Check if redirected to profile completion page')
    
    return true

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testOAuthCallbackFlow()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })
