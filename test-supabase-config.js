// Test Supabase configuration and password reset flow
console.log('🧪 Testing Supabase Configuration')

// Test 1: Check current URL and parameters
console.log('\n📋 Test 1: Current URL Analysis')
console.log('📍 Full URL:', window.location.href)
console.log('🔗 Pathname:', window.location.pathname)
console.log('🔍 Search params:', window.location.search)
console.log('🔍 Hash params:', window.location.hash)

// Test 2: Parse URL parameters
console.log('\n📋 Test 2: URL Parameter Analysis')
const urlParams = new URLSearchParams(window.location.search)
const hashParams = new URLSearchParams(window.location.hash.substring(1))

console.log('🔍 Search Parameters:')
for (const [key, value] of urlParams.entries()) {
  console.log(`   ${key}: ${value}`)
}

console.log('🔍 Hash Parameters:')
for (const [key, value] of hashParams.entries()) {
  console.log(`   ${key}: ${value}`)
}

// Test 3: Check for tokens
console.log('\n📋 Test 3: Token Detection')
const hasTokens = urlParams.has('access_token') || 
                 urlParams.has('refresh_token') || 
                 urlParams.has('token_hash') || 
                 urlParams.has('code') ||
                 hashParams.has('access_token') || 
                 hashParams.has('refresh_token') || 
                 hashParams.has('token_hash') || 
                 hashParams.has('code')

const hasErrors = urlParams.has('error') || 
                 urlParams.has('error_code') || 
                 urlParams.has('error_description') ||
                 hashParams.has('error') || 
                 hashParams.has('error_code') || 
                 hashParams.has('error_description')

if (hasTokens) {
  console.log('✅ Found tokens in URL')
} else if (hasErrors) {
  console.log('❌ Found errors in URL')
} else {
  console.log('⚠️ No tokens or errors found - this indicates email template issue')
}

// Test 4: Check Supabase client configuration
console.log('\n📋 Test 4: Supabase Client Check')
try {
  // Try to access Supabase client
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  console.log('🔧 Supabase URL configured:', !!supabaseUrl)
  console.log('🔧 Supabase Anon Key configured:', !!supabaseAnonKey)
  
  if (supabaseUrl) {
    console.log('🔗 Supabase URL:', supabaseUrl)
  }
  
} catch (err) {
  console.log('❌ Error accessing Supabase config:', err.message)
}

// Test 5: Simulate password reset request
console.log('\n📋 Test 5: Password Reset Simulation')
console.log('🔧 To test the password reset flow:')
console.log('1. Go to your forgot password page')
console.log('2. Enter your email address')
console.log('3. Check the email you receive')
console.log('4. Look at the reset link format')

// Test 6: Email template check
console.log('\n📋 Test 6: Email Template Configuration')
console.log('🔧 You need to check your Supabase Dashboard:')
console.log('1. Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/auth/templates')
console.log('2. Click on "Reset Password" template')
console.log('3. Check if it uses the correct format')

console.log('\n📧 Expected email template format:')
console.log('For PKCE flow:')
console.log('<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">')
console.log('For Implicit flow:')
console.log('<a href="{{ .ConfirmationURL }}">')

// Test 7: Redirect URL check
console.log('\n📋 Test 7: Redirect URL Configuration')
console.log('🔧 Check your Supabase Dashboard:')
console.log('1. Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/auth/url-configuration')
console.log('2. Add these redirect URLs:')
console.log('   - http://localhost:4000/reset-password')
console.log('   - http://localhost:4000/auth/confirm')
console.log('3. Set Site URL to: http://localhost:4000')

// Test 8: Current environment check
console.log('\n📋 Test 8: Environment Check')
console.log('🌐 Current origin:', window.location.origin)
console.log('🔗 Expected redirect URL:', `${window.location.origin}/reset-password`)
console.log('🔗 Expected auth confirm URL:', `${window.location.origin}/auth/confirm`)

// Summary
console.log('\n📋 SUMMARY:')
if (hasTokens) {
  console.log('✅ URL contains tokens - ResetPassword component should work')
} else if (hasErrors) {
  console.log('❌ URL contains errors - Check Supabase configuration')
} else {
  console.log('⚠️ No tokens found - Email template needs to be updated')
  console.log('🔧 IMMEDIATE ACTION REQUIRED:')
  console.log('   1. Update Supabase email template')
  console.log('   2. Configure redirect URLs')
  console.log('   3. Test with new password reset request')
}

console.log('\n🧪 Debug functions available:')
console.log('- Check email template configuration')
console.log('- Test password reset flow')
console.log('- Verify Supabase settings')
