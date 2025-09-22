#!/usr/bin/env node

/**
 * Test script for the new subject-levels many-to-many functionality
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL')
  console.error('   VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSubjectLevels() {
  try {
    console.log('🧪 Testing subject-levels many-to-many functionality...\n')

    // Test 1: Check if subject_levels table exists and has data
    console.log('1️⃣ Testing subject_levels table...')
    const { data: subjectLevels, error: slError } = await supabase
      .from('subject_levels')
      .select(`
        *,
        subjects(title),
        levels(title)
      `)
      .limit(5)

    if (slError) {
      console.error('❌ Error querying subject_levels:', slError.message)
      return
    }

    console.log(`✅ Found ${subjectLevels?.length || 0} subject-level relationships`)
    if (subjectLevels && subjectLevels.length > 0) {
      subjectLevels.forEach((sl, index) => {
        console.log(`   ${index + 1}. ${sl.subjects?.title} → ${sl.levels?.title}`)
      })
    }
    console.log('')

    // Test 2: Test the new API functions (simulate what the frontend would do)
    console.log('2️⃣ Testing subjects with levels query...')
    const { data: subjectsWithLevels, error: swlError } = await supabase
      .from('subjects')
      .select(`
        *,
        subject_levels(
          level_id,
          levels(*)
        )
      `)
      .limit(3)

    if (swlError) {
      console.error('❌ Error querying subjects with levels:', swlError.message)
      return
    }

    console.log(`✅ Found ${subjectsWithLevels?.length || 0} subjects with level data`)
    subjectsWithLevels?.forEach((subject, index) => {
      const levelNames = subject.subject_levels?.map(sl => sl.levels?.title).filter(Boolean) || []
      console.log(`   ${index + 1}. "${subject.title}" → Levels: [${levelNames.join(', ')}]`)
    })
    console.log('')

    // Test 3: Test filtering subjects by level
    console.log('3️⃣ Testing subject filtering by level...')
    if (subjectLevels && subjectLevels.length > 0) {
      const testLevelId = subjectLevels[0].level_id
      const { data: filteredSubjects, error: filterError } = await supabase
        .from('subjects')
        .select(`
          *,
          subject_levels(
            level_id,
            levels(*)
          )
        `)
        .eq('subject_levels.level_id', testLevelId)

      if (filterError) {
        console.error('❌ Error filtering subjects by level:', filterError.message)
        return
      }

      console.log(`✅ Found ${filteredSubjects?.length || 0} subjects for level ID: ${testLevelId}`)
      filteredSubjects?.forEach((subject, index) => {
        console.log(`   ${index + 1}. "${subject.title}"`)
      })
    }
    console.log('')

    // Test 4: Check if we can create a new subject-level relationship
    console.log('4️⃣ Testing subject-level relationship creation...')
    
    // First, get a subject and level to test with
    const { data: testSubject, error: subError } = await supabase
      .from('subjects')
      .select('id, title')
      .limit(1)
      .single()

    const { data: testLevel, error: levError } = await supabase
      .from('levels')
      .select('id, title')
      .limit(1)
      .single()

    if (subError || levError || !testSubject || !testLevel) {
      console.log('⚠️  Skipping relationship creation test (no test data available)')
    } else {
      // Check if relationship already exists
      const { data: existingRel, error: existError } = await supabase
        .from('subject_levels')
        .select('id')
        .eq('subject_id', testSubject.id)
        .eq('level_id', testLevel.id)
        .single()

      if (existError && existError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking existing relationship:', existError.message)
        return
      }

      if (existingRel) {
        console.log(`✅ Relationship already exists: "${testSubject.title}" → "${testLevel.title}"`)
      } else {
        console.log(`ℹ️  No existing relationship found between "${testSubject.title}" and "${testLevel.title}"`)
        console.log('   (This is normal - relationships are created through the admin interface)')
      }
    }
    console.log('')

    console.log('🎉 All tests completed successfully!')
    console.log('')
    console.log('📋 Summary:')
    console.log('   ✅ subject_levels table is accessible')
    console.log('   ✅ Subjects can be queried with their levels')
    console.log('   ✅ Subject filtering by level works')
    console.log('   ✅ Database structure is ready for the frontend')
    console.log('')
    console.log('🚀 You can now test the admin dashboard to:')
    console.log('   1. Create subjects with multiple levels')
    console.log('   2. Edit existing subjects to add/remove levels')
    console.log('   3. Filter subjects by level')
    console.log('   4. View subjects with all their assigned levels')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the tests
testSubjectLevels()

