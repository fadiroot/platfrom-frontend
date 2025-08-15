// Test script to check for code parameter in password reset URL
console.log('🧪 Testing Code Parameter Detection')

// Get current URL parameters
const urlParams = new URLSearchParams(window.location.search)
const hashParams = new URLSearchParams(window.location.hash.substring(1))

console.log('\n📋 Current URL Analysis:')
console.log('📍 Full URL:', window.location.href)
console.log('🔗 Pathname:', window.location.pathname)
console.log('🔍 Search params:', window.location.search)
console.log('🔍 Hash params:', window.location.hash)

console.log('\n📋 Parameter Check:')
console.log('🔑 code parameter:', urlParams.get('code') || 'NOT FOUND')
console.log('📋 type parameter:', urlParams.get('type') || 'NOT FOUND')
console.log('🔑 token_hash parameter:', urlParams.get('token_hash') || 'NOT FOUND')
console.log('🔑 access_token parameter:', urlParams.get('access_token') || 'NOT FOUND')
console.log('🔑 refresh_token parameter:', urlParams.get('refresh_token') || 'NOT FOUND')

console.log('\n📋 Hash Parameter Check:')
console.log('🔑 code in hash:', hashParams.get('code') || 'NOT FOUND')
console.log('📋 type in hash:', hashParams.get('type') || 'NOT FOUND')
console.log('🔑 token_hash in hash:', hashParams.get('token_hash') || 'NOT FOUND')
console.log('🔑 access_token in hash:', hashParams.get('access_token') || 'NOT FOUND')
console.log('🔑 refresh_token in hash:', hashParams.get('refresh_token') || 'NOT FOUND')

// Check for code parameter specifically
const hasCode = urlParams.get('code') || hashParams.get('code')
const hasType = urlParams.get('type') || hashParams.get('type')

console.log('\n📋 Code Parameter Analysis:')
if (hasCode) {
  console.log('✅ Code parameter found:', hasCode)
  console.log('📋 Type parameter:', hasType || 'NOT FOUND')
  
  if (hasType === 'recovery') {
    console.log('✅ Type is "recovery" - this is correct for password reset')
  } else if (hasType) {
    console.log('⚠️ Type is:', hasType, '- should be "recovery" for password reset')
  } else {
    console.log('⚠️ No type parameter found - this might still work')
  }
  
  console.log('\n🎯 RESULT: Code parameter detected - ResetPassword component should work!')
} else {
  console.log('❌ No code parameter found in URL')
  console.log('\n🔧 REQUIRED ACTION:')
  console.log('1. Update Supabase email template to use:')
  console.log('   {{ .SiteURL }}/reset-password?code={{ .TokenHash }}&type=recovery')
  console.log('2. Or use: {{ .ConfirmationURL }}')
  console.log('3. Configure redirect URLs in Supabase dashboard')
  console.log('4. Request a new password reset')
}

// Check for any tokens at all
const hasAnyTokens = hasCode || 
                    urlParams.get('token_hash') || 
                    urlParams.get('access_token') || 
                    urlParams.get('refresh_token') ||
                    hashParams.get('token_hash') || 
                    hashParams.get('access_token') || 
                    hashParams.get('refresh_token')

console.log('\n📋 Overall Token Status:')
if (hasAnyTokens) {
  console.log('✅ Tokens found in URL - ResetPassword should work')
} else {
  console.log('❌ No tokens found - Email template needs to be updated')
}

console.log('\n�� Test completed!')
