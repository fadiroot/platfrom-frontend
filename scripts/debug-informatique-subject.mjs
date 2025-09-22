#!/usr/bin/env node

/**
 * Debug script specifically for the Informatique subject visibility issue
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

async function debugInformatiqueSubject() {
  try {
    console.log('🔍 Debugging Informatique subject visibility...\n')

    // 1. Find the Informatique subject
    console.log('1️⃣ Finding Informatique subject:')
    const { data: informatiqueSubjects, error: subError } = await supabase
      .from('subjects')
      .select('*')
      .ilike('title', '%informatique%')

    if (subError) {
      console.error('❌ Error fetching Informatique subjects:', subError.message)
      return
    }

    if (!informatiqueSubjects || informatiqueSubjects.length === 0) {
      console.log('❌ No Informatique subject found')
      return
    }

    const informatiqueSubject = informatiqueSubjects[0]
    console.log(`✅ Found: "${informatiqueSubject.title}" (ID: ${informatiqueSubject.id})`)
    console.log(`   Old level_id: ${informatiqueSubject.level_id || 'NULL'}`)
    console.log('')

    // 2. Check subject_levels relationships for Informatique
    console.log('2️⃣ Checking subject_levels relationships:')
    const { data: relationships, error: relError } = await supabase
      .from('subject_levels')
      .select(`
        level_id,
        levels(title)
      `)
      .eq('subject_id', informatiqueSubject.id)

    if (relError) {
      console.error('❌ Error fetching relationships:', relError.message)
      return
    }

    console.log(`Found ${relationships?.length || 0} relationships in subject_levels:`)
    relationships?.forEach((rel, index) => {
      console.log(`   ${index + 1}. Level: "${rel.levels?.title}" (ID: ${rel.level_id})`)
    })
    console.log('')

    // 3. Check all levels to find "scientifiques" and "technique"
    console.log('3️⃣ Finding scientifiques and technique levels:')
    const { data: allLevels, error: levelsError } = await supabase
      .from('levels')
      .select('id, title')
      .or('title.ilike.%scientifiques%,title.ilike.%technique%')

    if (levelsError) {
      console.error('❌ Error fetching levels:', levelsError.message)
      return
    }

    console.log(`Found ${allLevels?.length || 0} relevant levels:`)
    allLevels?.forEach((level, index) => {
      console.log(`   ${index + 1}. "${level.title}" (ID: ${level.id})`)
    })
    console.log('')

    // 4. Test the get_subjects_for_level function for each level
    console.log('4️⃣ Testing get_subjects_for_level function:')
    
    for (const level of allLevels || []) {
      console.log(`\n   Testing level: "${level.title}" (ID: ${level.id})`)
      
      try {
        const { data: functionResult, error: functionError } = await supabase.rpc('get_subjects_for_level', {
          target_level_id: level.id
        })

        if (functionError) {
          console.log(`   ❌ Function error: ${functionError.message}`)
        } else {
          const informatiqueFound = functionResult?.some(subject => subject.id === informatiqueSubject.id)
          console.log(`   ${informatiqueFound ? '✅' : '❌'} Informatique ${informatiqueFound ? 'IS' : 'IS NOT'} found for this level`)
          
          if (functionResult && functionResult.length > 0) {
            console.log(`   Found ${functionResult.length} total subjects for this level:`)
            functionResult.forEach((subject, index) => {
              const isInformatique = subject.id === informatiqueSubject.id
              const marker = isInformatique ? '🎯' : '   '
              console.log(`   ${marker} ${index + 1}. "${subject.title}"`)
            })
          }
        }
      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`)
      }
    }

    // 5. Test the fallback approach
    console.log('\n5️⃣ Testing fallback approach:')
    
    for (const level of allLevels || []) {
      console.log(`\n   Testing fallback for level: "${level.title}" (ID: ${level.id})`)
      
      const { data: allSubjects, error: allError } = await supabase
        .from('subjects')
        .select(`
          *,
          subject_levels(
            level_id,
            levels(*)
          )
        `)
        .order('created_at', { ascending: true })

      if (allError) {
        console.log(`   ❌ Error fetching subjects: ${allError.message}`)
        continue
      }

      // Filter subjects that have the specified level (check both old and new data)
      const filteredSubjects = (allSubjects || []).filter(subject => {
        // Check new many-to-many relationships
        const newLevelIds = subject.subject_levels?.map((sl) => sl.level_id) || []
        // Check old single level_id (if it still exists)
        const oldLevelId = subject.level_id
        
        return newLevelIds.includes(level.id) || oldLevelId === level.id
      })

      const informatiqueFound = filteredSubjects.some(subject => subject.id === informatiqueSubject.id)
      console.log(`   ${informatiqueFound ? '✅' : '❌'} Fallback: Informatique ${informatiqueFound ? 'IS' : 'IS NOT'} found for this level`)
      
      if (filteredSubjects.length > 0) {
        console.log(`   Found ${filteredSubjects.length} total subjects for this level:`)
        filteredSubjects.forEach((subject, index) => {
          const isInformatique = subject.id === informatiqueSubject.id
          const marker = isInformatique ? '🎯' : '   '
          const newLevels = subject.subject_levels?.map(sl => sl.levels?.title).filter(Boolean) || []
          const oldLevel = subject.level_id ? 'OLD_LEVEL' : ''
          const allLevels = [...newLevels, ...(oldLevel ? [oldLevel] : [])]
          console.log(`   ${marker} ${index + 1}. "${subject.title}" (Levels: [${allLevels.join(', ')}])`)
        })
      }
    }

    console.log('\n🎉 Debug completed!')
    console.log('')
    console.log('📋 Summary:')
    console.log('   - Check if Informatique is properly linked to both levels in subject_levels table')
    console.log('   - Verify RLS policies allow reading subjects and subject_levels')
    console.log('   - Test both the database function and fallback approach')

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    process.exit(1)
  }
}

// Run the debug
debugInformatiqueSubject()

