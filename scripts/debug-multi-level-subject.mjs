#!/usr/bin/env node

/**
 * Debug script specifically for subjects assigned to multiple levels
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugMultiLevelSubject() {
  try {
    console.log('🔍 Debugging multi-level subject visibility...\n')

    // 1. Find subjects with multiple levels
    console.log('1️⃣ Subjects with multiple levels:')
    const { data: subjectsWithLevels, error: swlError } = await supabase
      .from('subjects')
      .select(`
        id,
        title,
        subject_levels(
          level_id,
          levels(id, title)
        )
      `)
      .order('title')

    if (swlError) {
      console.error('❌ Error fetching subjects:', swlError.message)
      return
    }

    const multiLevelSubjects = (subjectsWithLevels || []).filter(subject => 
      subject.subject_levels && subject.subject_levels.length > 1
    )

    console.log(`Found ${multiLevelSubjects.length} subjects with multiple levels:`)
    multiLevelSubjects.forEach((subject, index) => {
      const levelNames = subject.subject_levels?.map(sl => sl.levels?.title).filter(Boolean) || []
      console.log(`   ${index + 1}. "${subject.title}" → Levels: [${levelNames.join(', ')}]`)
    })
    console.log('')

    if (multiLevelSubjects.length === 0) {
      console.log('⚠️  No subjects found with multiple levels. Let\'s check all subjects:')
      subjectsWithLevels?.forEach((subject, index) => {
        const levelNames = subject.subject_levels?.map(sl => sl.levels?.title).filter(Boolean) || []
        console.log(`   ${index + 1}. "${subject.title}" → Levels: [${levelNames.join(', ')}]`)
      })
      return
    }

    // 2. Test the API function for each level of the first multi-level subject
    const testSubject = multiLevelSubjects[0]
    console.log(`2️⃣ Testing API function for "${testSubject.title}":`)
    
    testSubject.subject_levels?.forEach((sl, index) => {
      const levelId = sl.level_id
      const levelTitle = sl.levels?.title
      
      console.log(`\n   Testing Level ${index + 1}: "${levelTitle}" (ID: ${levelId})`)
      
      // Simulate the getSubjectsByLevel function
      const { data: allSubjects, error: allError } = await supabase
        .from('subjects')
        .select(`
          id,
          title,
          subject_levels(
            level_id,
            levels(id, title)
          )
        `)
        .order('created_at', { ascending: true })

      if (allError) {
        console.error(`   ❌ Error fetching subjects: ${allError.message}`)
        return
      }

      // Filter subjects that have the specified level
      const filteredSubjects = (allSubjects || []).filter(subject => {
        const subjectLevelIds = subject.subject_levels?.map((sl) => sl.level_id) || []
        return subjectLevelIds.includes(levelId)
      })

      console.log(`   Found ${filteredSubjects.length} subjects for this level:`)
      filteredSubjects.forEach((subject, subIndex) => {
        const isTargetSubject = subject.id === testSubject.id
        const marker = isTargetSubject ? '🎯' : '   '
        console.log(`   ${marker} ${subIndex + 1}. "${subject.title}"`)
      })

      // Check if our test subject is found
      const found = filteredSubjects.some(subject => subject.id === testSubject.id)
      console.log(`   ${found ? '✅' : '❌'} Test subject "${testSubject.title}" ${found ? 'IS' : 'IS NOT'} visible for level "${levelTitle}"`)
    })

    // 3. Check the raw subject_levels table
    console.log(`\n3️⃣ Raw subject_levels table data for "${testSubject.title}":`)
    const { data: rawRelationships, error: rawError } = await supabase
      .from('subject_levels')
      .select(`
        subject_id,
        level_id,
        subjects(title),
        levels(title)
      `)
      .eq('subject_id', testSubject.id)

    if (rawError) {
      console.error('❌ Error fetching raw relationships:', rawError.message)
      return
    }

    console.log(`Found ${rawRelationships?.length || 0} relationships:`)
    rawRelationships?.forEach((rel, index) => {
      console.log(`   ${index + 1}. Subject: "${rel.subjects?.title}" → Level: "${rel.levels?.title}"`)
    })

    // 4. Test a specific user scenario
    console.log('\n4️⃣ Testing specific user scenario:')
    console.log('   (This simulates what happens when a student with a specific level_id loads the subject list)')
    
    if (testSubject.subject_levels && testSubject.subject_levels.length > 0) {
      const testLevelId = testSubject.subject_levels[0].level_id
      const testLevelTitle = testSubject.subject_levels[0].levels?.title
      
      console.log(`   Simulating user with level_id: ${testLevelId} ("${testLevelTitle}")`)
      
      // This is exactly what the frontend does
      const { data: userSubjects, error: userError } = await supabase
        .from('subjects')
        .select(`
          id,
          title,
          description,
          image_url,
          created_at,
          updated_at,
          subject_levels(
            level_id,
            levels(id, title, description, created_at, updated_at)
          )
        `)
        .order('created_at', { ascending: true })

      if (userError) {
        console.error(`   ❌ Error in user simulation: ${userError.message}`)
        return
      }

      // Filter subjects that have the specified level (frontend logic)
      const userFilteredSubjects = (userSubjects || []).filter(subject => {
        const subjectLevelIds = subject.subject_levels?.map((sl) => sl.level_id) || []
        return subjectLevelIds.includes(testLevelId)
      })

      console.log(`   User would see ${userFilteredSubjects.length} subjects:`)
      userFilteredSubjects.forEach((subject, index) => {
        const isTargetSubject = subject.id === testSubject.id
        const marker = isTargetSubject ? '🎯' : '   '
        console.log(`   ${marker} ${index + 1}. "${subject.title}"`)
      })

      const userFound = userFilteredSubjects.some(subject => subject.id === testSubject.id)
      console.log(`   ${userFound ? '✅' : '❌'} User ${userFound ? 'WILL' : 'WILL NOT'} see "${testSubject.title}"`)
    }

    console.log('\n🎉 Debug completed!')
    console.log('')
    console.log('📋 If the test subject is not visible:')
    console.log('   1. Check RLS policies are fixed')
    console.log('   2. Verify the subject_levels table has the correct data')
    console.log('   3. Check if there are any console errors in the browser')

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    process.exit(1)
  }
}

// Run the debug
debugMultiLevelSubject()

