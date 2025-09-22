#!/usr/bin/env node

/**
 * Debug script to check subject-level relationships
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

async function debugSubjectLevels() {
  try {
    console.log('🔍 Debugging subject-level relationships...\n')

    // 1. Check all subjects
    console.log('1️⃣ All subjects:')
    const { data: allSubjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, title')
      .order('title')

    if (subjectsError) {
      console.error('❌ Error fetching subjects:', subjectsError.message)
      return
    }

    console.log(`Found ${allSubjects?.length || 0} subjects:`)
    allSubjects?.forEach((subject, index) => {
      console.log(`   ${index + 1}. ${subject.title} (ID: ${subject.id})`)
    })
    console.log('')

    // 2. Check all levels
    console.log('2️⃣ All levels:')
    const { data: allLevels, error: levelsError } = await supabase
      .from('levels')
      .select('id, title')
      .order('title')

    if (levelsError) {
      console.error('❌ Error fetching levels:', levelsError.message)
      return
    }

    console.log(`Found ${allLevels?.length || 0} levels:`)
    allLevels?.forEach((level, index) => {
      console.log(`   ${index + 1}. ${level.title} (ID: ${level.id})`)
    })
    console.log('')

    // 3. Check subject-level relationships
    console.log('3️⃣ Subject-level relationships:')
    const { data: relationships, error: relError } = await supabase
      .from('subject_levels')
      .select(`
        subject_id,
        level_id,
        subjects(title),
        levels(title)
      `)
      .order('subjects(title)')

    if (relError) {
      console.error('❌ Error fetching relationships:', relError.message)
      return
    }

    console.log(`Found ${relationships?.length || 0} relationships:`)
    relationships?.forEach((rel, index) => {
      console.log(`   ${index + 1}. "${rel.subjects?.title}" → "${rel.levels?.title}"`)
    })
    console.log('')

    // 4. Test the new API function
    console.log('4️⃣ Testing getSubjectsByLevel function:')
    
    // Find "bac technique" level
    const bacTechniqueLevel = allLevels?.find(level => 
      level.title.toLowerCase().includes('bac') && 
      level.title.toLowerCase().includes('technique')
    )

    if (bacTechniqueLevel) {
      console.log(`Testing with level: "${bacTechniqueLevel.title}" (ID: ${bacTechniqueLevel.id})`)
      
      // Simulate the new API function
      const { data: subjectsWithLevels, error: swlError } = await supabase
        .from('subjects')
        .select(`
          *,
          subject_levels(
            level_id,
            levels(*)
          )
        `)
        .order('created_at', { ascending: true })

      if (swlError) {
        console.error('❌ Error in API simulation:', swlError.message)
        return
      }

      // Filter subjects that have the specified level
      const filteredSubjects = (subjectsWithLevels || []).filter(subject => {
        const subjectLevelIds = subject.subject_levels?.map((sl) => sl.level_id) || []
        return subjectLevelIds.includes(bacTechniqueLevel.id)
      })

      console.log(`Found ${filteredSubjects.length} subjects for "${bacTechniqueLevel.title}":`)
      filteredSubjects.forEach((subject, index) => {
        const levelNames = subject.subject_levels?.map(sl => sl.levels?.title).filter(Boolean) || []
        console.log(`   ${index + 1}. "${subject.title}" (Levels: [${levelNames.join(', ')}])`)
      })
    } else {
      console.log('⚠️  Could not find "bac technique" level')
    }

    console.log('\n🎉 Debug completed!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('   1. Make sure you ran the RLS policy fix SQL script')
    console.log('   2. Check that the subject "informatique" is assigned to "bac technique" level')
    console.log('   3. Test the student subject list page')

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    process.exit(1)
  }
}

// Run the debug
debugSubjectLevels()

