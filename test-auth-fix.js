// Test script to verify authentication fix
import { createClient } from '@supabase/supabase-js'

// Test Supabase client configuration
const supabaseUrl = 'https://kmtjpafmshyyuftknuof.supabase.co'
const supabaseAnonKey = 'your-anon-key-here' // Replace with your actual anon key

// Create client with the new configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: true,
  }
})

async function testAuth() {
  console.log('Testing authentication configuration...')
  
  try {
    // Test session retrieval
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return
    }
    
    if (session) {
      console.log('✅ Session found:', session.user.email)
      
      // Test student_profile query
      const { data: profile, error: profileError } = await supabase
        .from('student_profile')
        .select('user_id, level_id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      
      if (profileError) {
        console.error('❌ Profile query error:', profileError)
      } else if (profile) {
        console.log('✅ Profile found:', profile)
      } else {
        console.log('⚠️ No profile found for user')
      }
      
      // Test subjects query
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .limit(5)
      
      if (subjectsError) {
        console.error('❌ Subjects query error:', subjectsError)
      } else {
        console.log('✅ Subjects query successful:', subjects?.length || 0, 'subjects found')
      }
      
    } else {
      console.log('⚠️ No active session found')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAuth()

