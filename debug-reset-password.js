// Debug script for password reset issues
console.log('🔍 Password Reset Debug Script')
console.log('📍 Current URL:', window.location.href)
console.log('🌐 Origin:', window.location.origin)

// Check if we're on the reset password page
if (window.location.pathname === '/reset-password') {
  console.log('✅ On reset password page')
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  
  console.log('🔍 URL Search Params:')
  for (const [key, value] of urlParams.entries()) {
    console.log(`   ${key}: ${value}`)
  }
  
  console.log('🔍 Hash Params:')
  for (const [key, value] of hashParams.entries()) {
    console.log(`   ${key}: ${value}`)
  }
  
  // Check if we have any tokens
  const hasTokens = urlParams.has('access_token') || 
                   urlParams.has('refresh_token') || 
                   urlParams.has('token_hash') || 
                   urlParams.has('code') ||
                   hashParams.has('access_token') || 
                   hashParams.has('refresh_token') || 
                   hashParams.has('token_hash') || 
                   hashParams.has('code')
  
  if (hasTokens) {
    console.log('✅ Found tokens in URL')
  } else {
    console.log('❌ No tokens found in URL')
    console.log('🔧 This means:')
    console.log('   1. Email template is not configured correctly')
    console.log('   2. Redirect URL is not working')
    console.log('   3. Supabase project settings need to be updated')
  }
  
  // Check for errors
  const hasErrors = urlParams.has('error') || 
                   urlParams.has('error_code') || 
                   urlParams.has('error_description') ||
                   hashParams.has('error') || 
                   hashParams.has('error_code') || 
                   hashParams.has('error_description')
  
  if (hasErrors) {
    console.log('❌ Found errors in URL')
    console.log('   Error:', urlParams.get('error') || hashParams.get('error'))
    console.log('   Error Code:', urlParams.get('error_code') || hashParams.get('error_code'))
    console.log('   Error Description:', urlParams.get('error_description') || hashParams.get('error_description'))
  }
} else {
  console.log('⚠️ Not on reset password page')
}

// Function to test Supabase configuration
async function testSupabaseConfig() {
  console.log('\n🔧 Testing Supabase Configuration')
  
  try {
    // Import Supabase client (you'll need to adjust this based on your setup)
    const { supabase } = await import('./src/lib/supabase.js')
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    console.log('📋 Current session:', session ? 'Exists' : 'None')
    
    if (session) {
      console.log('   User ID:', session.user.id)
      console.log('   User Email:', session.user.email)
      console.log('   User Aud:', session.user.aud)
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 Current user:', user ? 'Exists' : 'None')
    
  } catch (err) {
    console.error('❌ Error testing Supabase config:', err)
  }
}

// Function to simulate password reset
async function simulatePasswordReset() {
  console.log('\n🧪 Simulating Password Reset')
  
  try {
    // Import Supabase client
    const { supabase } = await import('./src/lib/supabase.js')
    
    const testEmail = 'test@example.com' // Replace with your email
    
    console.log('📧 Sending reset email to:', testEmail)
    console.log('🔗 Redirect URL:', `${window.location.origin}/reset-password`)
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) {
      console.error('❌ Error sending reset email:', error)
      return
    }
    
    console.log('✅ Password reset email sent successfully')
    console.log('📧 Check your email for the reset link')
    
  } catch (err) {
    console.error('❌ Error simulating password reset:', err)
  }
}

// Function to check email template configuration
function checkEmailTemplateConfig() {
  console.log('\n📧 Email Template Configuration Check')
  console.log('🔧 You need to check your Supabase Dashboard:')
  console.log('   1. Go to Auth → Email Templates')
  console.log('   2. Select "Reset Password" template')
  console.log('   3. Make sure it uses this format:')
  console.log('')
  console.log('   <h2>Reset Password</h2>')
  console.log('   <p>Follow this link to reset the password for your user:</p>')
  console.log('   <p>')
  console.log('     <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">')
  console.log('       Reset Password')
  console.log('     </a>')
  console.log('   </p>')
  console.log('')
  console.log('   OR for implicit flow:')
  console.log('')
  console.log('   <h2>Reset Password</h2>')
  console.log('   <p>Follow this link to reset the password for your user:</p>')
  console.log('   <p>')
  console.log('     <a href="{{ .ConfirmationURL }}">')
  console.log('       Reset Password')
  console.log('     </a>')
  console.log('   </p>')
}

// Function to check redirect URL configuration
function checkRedirectURLConfig() {
  console.log('\n🔗 Redirect URL Configuration Check')
  console.log('🔧 You need to check your Supabase Dashboard:')
  console.log('   1. Go to Auth → URL Configuration')
  console.log('   2. Add these redirect URLs:')
  console.log('      - http://localhost:4000/reset-password')
  console.log('      - http://localhost:4000/auth/confirm')
  console.log('   3. Set Site URL to: http://localhost:4000')
}

// Export functions for use in browser console
window.debugResetPassword = {
  testSupabaseConfig,
  simulatePasswordReset,
  checkEmailTemplateConfig,
  checkRedirectURLConfig
}

console.log('\n🧪 Debug functions available:')
console.log('- debugResetPassword.testSupabaseConfig()')
console.log('- debugResetPassword.simulatePasswordReset()')
console.log('- debugResetPassword.checkEmailTemplateConfig()')
console.log('- debugResetPassword.checkRedirectURLConfig()')

// Auto-run the debug check
console.log('\n🚀 Auto-running debug check...')
if (window.location.pathname === '/reset-password') {
  checkEmailTemplateConfig()
  checkRedirectURLConfig()
}
