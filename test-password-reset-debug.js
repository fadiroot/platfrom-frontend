// Test script to debug password reset flow
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your actual URL
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: true
  }
})

async function testPasswordResetFlow() {
  const testEmail = 'test@example.com' // Replace with a real email
  
  console.log('🧪 Testing Password Reset Flow')
  console.log('📧 Test email:', testEmail)
  console.log('🔗 Redirect URL:', `${window.location.origin}/reset-password`)
  
  try {
    // Step 1: Send password reset email
    console.log('\n📤 Step 1: Sending password reset email...')
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) {
      console.error('❌ Error sending reset email:', error)
      return
    }
    
    console.log('✅ Password reset email sent successfully')
    console.log('📧 Check your email for the reset link')
    console.log('🔗 Expected link format:')
    console.log('   - PKCE flow: http://localhost:4000/auth/confirm?token_hash=xxx&type=recovery&next=/reset-password')
    console.log('   - Implicit flow: http://localhost:4000/reset-password?access_token=xxx&refresh_token=yyy')
    
    console.log('\n🔍 Debug Information:')
    console.log('📍 Current URL:', window.location.href)
    console.log('🌐 Origin:', window.location.origin)
    console.log('🔧 Supabase URL:', supabaseUrl)
    
    console.log('\n📋 Next Steps:')
    console.log('1. Check your email for the reset link')
    console.log('2. Click the link and see what URL you get redirected to')
    console.log('3. Check the browser console for any errors')
    console.log('4. If the link has no tokens, check your Supabase email templates')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

// Function to test URL parsing
function testUrlParsing() {
  console.log('\n🔍 Testing URL Parsing')
  
  // Test different URL formats
  const testUrls = [
    'http://localhost:4000/reset-password?access_token=abc&refresh_token=def',
    'http://localhost:4000/auth/confirm?token_hash=xyz&type=recovery&next=/reset-password',
    'http://localhost:4000/reset-password?error=access_denied&error_code=otp_expired',
    'http://localhost:4000/reset-password'
  ]
  
  testUrls.forEach((url, index) => {
    console.log(`\n📋 Test URL ${index + 1}:`, url)
    
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    
    console.log('🔗 Pathname:', urlObj.pathname)
    console.log('🔍 Search params:')
    for (const [key, value] of params.entries()) {
      console.log(`   ${key}: ${value}`)
    }
    
    // Check for tokens
    const hasTokens = params.has('access_token') || params.has('token_hash') || params.has('code')
    const hasErrors = params.has('error') || params.has('error_code')
    
    if (hasTokens) {
      console.log('✅ URL contains tokens')
    } else if (hasErrors) {
      console.log('❌ URL contains errors')
    } else {
      console.log('⚠️ URL has no tokens or errors')
    }
  })
}

// Function to check Supabase configuration
async function checkSupabaseConfig() {
  console.log('\n🔧 Checking Supabase Configuration')
  
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('📋 Current session:', session ? 'Exists' : 'None')
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 Current user:', user ? 'Exists' : 'None')
    
    console.log('\n📋 Configuration Summary:')
    console.log('✅ Supabase client created with PKCE flow')
    console.log('✅ detectSessionInUrl: true')
    console.log('✅ autoRefreshToken: true')
    console.log('✅ persistSession: true')
    
  } catch (err) {
    console.error('❌ Error checking config:', err)
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Password Reset Debug Tests\n')
  
  await checkSupabaseConfig()
  testUrlParsing()
  await testPasswordResetFlow()
  
  console.log('\n✅ All tests completed')
  console.log('\n📋 If you\'re still having issues:')
  console.log('1. Check your Supabase email templates')
  console.log('2. Verify redirect URLs are configured')
  console.log('3. Check the browser console for errors')
  console.log('4. Ensure your Supabase project is properly set up')
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testPasswordResetFlow = testPasswordResetFlow
  window.testUrlParsing = testUrlParsing
  window.checkSupabaseConfig = checkSupabaseConfig
  window.runAllTests = runAllTests
  
  console.log('🧪 Password reset debug functions loaded:')
  console.log('- testPasswordResetFlow()')
  console.log('- testUrlParsing()')
  console.log('- checkSupabaseConfig()')
  console.log('- runAllTests()')
}

export {
  testPasswordResetFlow,
  testUrlParsing,
  checkSupabaseConfig,
  runAllTests
}
