// Test script to verify password reset flow
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testPasswordResetFlow() {
  console.log('🔍 Testing Password Reset Flow...')
  console.log('📍 Supabase URL:', supabaseUrl)
  console.log('🔑 Anon Key exists:', !!supabaseAnonKey)
  
  try {
    // Test 1: Check if we can send a password reset email
    console.log('\n📧 Test 1: Sending password reset email...')
    
    const testEmail = 'test@example.com' // Replace with a real email for testing
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) {
      console.error('❌ Error sending password reset email:', error)
      return
    }
    
    console.log('✅ Password reset email sent successfully')
    console.log('📋 Response data:', data)
    
    // Test 2: Check current session
    console.log('\n🔐 Test 2: Checking current session...')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError)
    } else {
      console.log('✅ Session check completed')
      console.log('📋 Session exists:', !!session)
      if (session) {
        console.log('📋 User ID:', session.user.id)
        console.log('📋 User email:', session.user.email)
      }
    }
    
    // Test 3: Check auth settings
    console.log('\n⚙️ Test 3: Checking auth configuration...')
    
    // Note: We can't directly check Supabase project settings from client side
    // But we can provide guidance on what to check
    console.log('📋 To fix password reset issues, check these Supabase settings:')
    console.log('   1. Go to Supabase Dashboard > Authentication > Settings')
    console.log('   2. Check "Enable email confirmations" is ON')
    console.log('   3. Check "Enable password resets" is ON')
    console.log('   4. Verify Site URL is set correctly')
    console.log('   5. Check Redirect URLs include your domain')
    console.log('   6. Verify email templates are configured')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

// Run the test
testPasswordResetFlow()
