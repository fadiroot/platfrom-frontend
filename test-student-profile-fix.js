// Test script to verify student profile fix
// This script tests the exact query that was failing

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kmtjpafmshyyuftknuof.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStudentProfileQuery() {
  console.log('Testing student profile query...')
  
  const userId = 'b0d2ff54-52d4-451a-9c71-f98b6457ddf0'
  
  try {
    // Test the exact query that was failing
    const { data, error } = await supabase
      .from('student_profile')
      .select(`
        user_id,
        level_id
      `)
      .eq('user_id', userId)
      .maybeSingle()

    console.log('Query result:', { data, error })
    
    if (error) {
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else if (data) {
      console.log('✅ Success! Student profile found:', data)
    } else {
      console.log('⚠️  No profile found for user (this might be expected if user doesn\'t exist)')
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

async function testSubjectsQuery() {
  console.log('\nTesting subjects query...')
  
  try {
    // Test the subjects query that was also mentioned
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        level:levels(*)
      `)
      .order('created_at', { ascending: true })

    console.log('Subjects query result:', { 
      dataCount: data?.length || 0, 
      error: error?.message || null 
    })
    
    if (error) {
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else if (data && data.length > 0) {
      console.log('✅ Success! Found', data.length, 'subjects')
      console.log('First subject:', data[0])
    } else {
      console.log('⚠️  No subjects found')
    }
    
  } catch (err) {
    console.error('❌ Subjects test failed:', err)
  }
}

async function runTests() {
  console.log('🚀 Starting student profile tests...\n')
  
  await testStudentProfileQuery()
  await testSubjectsQuery()
  
  console.log('\n✨ Tests completed!')
}

// Run the tests
runTests().catch(console.error)
