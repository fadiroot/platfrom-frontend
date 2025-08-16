import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSecureFileAccess() {
  console.log('🧪 Testing Secure File Access Fix...\n')

  try {
    // 1. Test authentication
    console.log('1. Testing authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('   ⚠️  No authenticated user found. Please log in first.')
      console.log('   Run: npm run login or set up authentication')
      return
    }
    
    console.log(`   ✅ Authenticated as: ${user.email}`)

    // 2. Test can_access_exercise function
    console.log('\n2. Testing can_access_exercise function...')
    const exerciseId = '79d2862a-2e4e-45de-9675-737fd9ac921d'
    
    const { data: hasAccess, error: accessError } = await supabase
      .rpc('can_access_exercise', { exercise_id: exerciseId })
    
    if (accessError) {
      console.error('   ❌ Error:', accessError.message)
    } else {
      console.log(`   ✅ Access result: ${hasAccess}`)
    }

    // 3. Check exercise public status
    console.log('\n3. Checking exercise public status...')
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('id, name, is_public')
      .eq('id', exerciseId)
      .single()
    
    if (exerciseError) {
      console.error('   ❌ Error:', exerciseError.message)
    } else {
      console.log(`   ✅ Exercise: ${exercise.name}`)
      console.log(`   ✅ Public: ${exercise.is_public}`)
    }

    // 4. Test secure file proxy endpoint
    console.log('\n4. Testing secure file proxy endpoint...')
    
    // Get the access token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      console.log('   ❌ No access token available')
      return
    }

    const proxyUrl = `${supabaseUrl}/functions/v1/secure-file-proxy?exerciseId=${exerciseId}&type=correction&index=0`
    
    const response = await fetch(proxyUrl, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`   📡 Response status: ${response.status}`)
    
    if (response.ok) {
      console.log('   ✅ Access granted!')
    } else {
      const errorData = await response.json()
      console.log('   ❌ Access denied:', errorData)
    }

    // 5. Check user profile
    console.log('\n5. Checking user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('student_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (profileError) {
      console.log('   ⚠️  No student profile found or error:', profileError.message)
    } else {
      console.log(`   ✅ Profile found:`)
      console.log(`      - Active: ${profile.is_active}`)
      console.log(`      - Subscription end: ${profile.subscription_end_date}`)
      console.log(`      - Valid subscription: ${!profile.subscription_end_date || profile.subscription_end_date > new Date()}`)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSecureFileAccess()
