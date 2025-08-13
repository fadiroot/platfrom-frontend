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

// Create Supabase client with anon key (simulates frontend usage)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test admin functions
async function testAdminFunctions() {
  console.log('🧪 Testing Admin Functions...\n')
  
  try {
    // Test 1: Check if is_admin function exists and works
    console.log('1. Testing is_admin function...')
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
    
    if (adminError) {
      console.error('   ❌ Error:', adminError.message)
    } else {
      console.log(`   ✅ Result: ${isAdmin}`)
    }
    
    // Test 2: Test get_student_profiles function
    console.log('\n2. Testing get_student_profiles function...')
    const { data: studentProfiles, error: profilesError } = await supabase.rpc('get_student_profiles')
    
    if (profilesError) {
      console.error('   ❌ Error:', profilesError.message)
    } else {
      console.log(`   ✅ Found ${studentProfiles?.length || 0} student profiles`)
    }
    
    // Test 3: Test get_user_accessible_exercises function
    console.log('\n3. Testing get_user_accessible_exercises function...')
    const { data: exercises, error: exercisesError } = await supabase.rpc('get_user_accessible_exercises', {
      user_uuid: '00000000-0000-0000-0000-000000000000' // Dummy UUID
    })
    
    if (exercisesError) {
      console.error('   ❌ Error:', exercisesError.message)
    } else {
      console.log(`   ✅ Found ${exercises?.length || 0} accessible exercises`)
    }
    
    // Test 4: Test can_access_exercise function
    console.log('\n4. Testing can_access_exercise function...')
    const { data: canAccess, error: accessError } = await supabase.rpc('can_access_exercise', {
      exercise_id: '00000000-0000-0000-0000-000000000000' // Dummy UUID
    })
    
    if (accessError) {
      console.error('   ❌ Error:', accessError.message)
    } else {
      console.log(`   ✅ Result: ${canAccess}`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error testing admin functions:', error)
    return false
  }
}

// Test RLS policies
async function testRLSPolicies() {
  console.log('\n🔒 Testing RLS Policies...\n')
  
  const tables = ['chapters', 'exercises', 'levels', 'subjects', 'student_profile', 'user_progress']
  
  for (const table of tables) {
    try {
      console.log(`Testing ${table} table...`)
      
      // Test SELECT
      const { data: selectData, error: selectError } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (selectError) {
        console.log(`   ❌ SELECT: ${selectError.message}`)
      } else {
        console.log(`   ✅ SELECT: Success`)
      }
      
      // Test INSERT (should fail for non-admin)
      const { error: insertError } = await supabase
        .from(table)
        .insert({ test: 'data' })
      
      if (insertError) {
        console.log(`   ✅ INSERT: Blocked (expected)`)
      } else {
        console.log(`   ⚠️  INSERT: Allowed (unexpected)`)
      }
      
      // Test UPDATE (should fail for non-admin)
      const { error: updateError } = await supabase
        .from(table)
        .update({ test: 'updated' })
        .eq('id', '00000000-0000-0000-0000-000000000000')
      
      if (updateError) {
        console.log(`   ✅ UPDATE: Blocked (expected)`)
      } else {
        console.log(`   ⚠️  UPDATE: Allowed (unexpected)`)
      }
      
      // Test DELETE (should fail for non-admin)
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000')
      
      if (deleteError) {
        console.log(`   ✅ DELETE: Blocked (expected)`)
      } else {
        console.log(`   ⚠️  DELETE: Allowed (unexpected)`)
      }
      
      console.log('')
    } catch (error) {
      console.error(`   ❌ Error testing ${table}:`, error.message)
    }
  }
}

// Test authentication
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...\n')
  
  try {
    // Test 1: Check current user
    console.log('1. Checking current user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('   ❌ Error:', userError.message)
    } else if (user) {
      console.log(`   ✅ User: ${user.email}`)
      console.log(`   ✅ Role: ${user.user_metadata?.role || 'user'}`)
    } else {
      console.log('   ℹ️  No user logged in')
    }
    
    // Test 2: Check auth status
    console.log('\n2. Checking auth status...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('   ❌ Error:', sessionError.message)
    } else if (session) {
      console.log('   ✅ Session active')
    } else {
      console.log('   ℹ️  No active session')
    }
    
    return true
  } catch (error) {
    console.error('❌ Error testing authentication:', error)
    return false
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Admin System Tests...\n')
  
  // Test authentication first
  await testAuthentication()
  
  // Test admin functions
  await testAdminFunctions()
  
  // Test RLS policies
  await testRLSPolicies()
  
  console.log('\n✅ Admin system tests completed!')
  console.log('\n📋 Summary:')
  console.log('- Authentication: Checked user and session status')
  console.log('- Admin Functions: Tested database functions')
  console.log('- RLS Policies: Verified access control')
  console.log('\n💡 If you see errors, check:')
  console.log('1. Database functions are properly installed')
  console.log('2. RLS policies are applied')
  console.log('3. User has proper permissions')
  console.log('4. Environment variables are correct')
}

// Run the tests
runTests().catch(console.error)
