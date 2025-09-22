#!/usr/bin/env node

/**
 * Test script to verify the new API approach using subject_levels table
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

async function testSubjectLevelsAPI() {
  try {
    console.log('🧪 Testing new API approach using subject_levels table...\n')

    // 1. Get all levels
    console.log('1️⃣ Getting all levels:')
    const { data: levels, error: levelsError } = await supabase
      .from('levels')
      .select('id, title')
      .order('title')

    if (levelsError) {
      console.error('❌ Error fetching levels:', levelsError.message)
      return
    }

    console.log(`Found ${levels?.length || 0} levels:`)
    levels?.forEach((level, index) => {
      console.log(`   ${index + 1}. "${level.title}" (ID: ${level.id})`)
    })
    console.log('')

    // 2. Test the new API approach for each level
    console.log('2️⃣ Testing new API approach for each level:')
    
    for (const level of levels || []) {
      console.log(`\n   Testing level: "${level.title}" (ID: ${level.id})`)
      
      // This is exactly what the new API does
      const { data, error } = await supabase
        .from('subject_levels')
        .select(`
          subject_id,
          subjects(
            id,
            title,
            description,
            image_url,
            created_at,
            updated_at
          ),
          levels(
            id,
            title,
            description,
            created_at,
            updated_at
          )
        `)
        .eq('level_id', level.id)

      if (error) {
        console.log(`   ❌ Error: ${error.message}`)
        continue
      }

      // Group subjects by subject_id to handle multiple levels per subject
      const subjectMap = new Map()
      
      data?.forEach((item) => {
        const subjectId = item.subject_id
        const subject = item.subjects
        const levelData = item.levels
        
        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            ...subject,
            levels: [],
            level_ids: []
          })
        }
        
        const existingSubject = subjectMap.get(subjectId)
        if (levelData && !existingSubject.level_ids.includes(levelData.id)) {
          existingSubject.levels.push(levelData)
          existingSubject.level_ids.push(levelData.id)
        }
      })

      // Convert map to array
      const subjects = Array.from(subjectMap.values())
      
      console.log(`   Found ${subjects.length} subjects for this level:`)
      subjects.forEach((subject, index) => {
        const levelNames = subject.levels?.map(l => l.title).join(', ') || 'No levels'
        console.log(`   ${index + 1}. "${subject.title}" (Levels: [${levelNames}])`)
      })

      // Check if Informatique is found
      const informatiqueFound = subjects.some(subject => 
        subject.title.toLowerCase().includes('informatique')
      )
      console.log(`   ${informatiqueFound ? '✅' : '❌'} Informatique ${informatiqueFound ? 'IS' : 'IS NOT'} found for this level`)
    }

    // 3. Test specifically for Informatique subject
    console.log('\n3️⃣ Testing specifically for Informatique subject:')
    
    const { data: informatiqueRelations, error: infoError } = await supabase
      .from('subject_levels')
      .select(`
        level_id,
        levels(title),
        subjects(title)
      `)
      .ilike('subjects.title', '%informatique%')

    if (infoError) {
      console.error('❌ Error fetching Informatique relationships:', infoError.message)
      return
    }

    console.log(`Found ${informatiqueRelations?.length || 0} relationships for Informatique:`)
    informatiqueRelations?.forEach((rel, index) => {
      console.log(`   ${index + 1}. "${rel.subjects?.title}" → "${rel.levels?.title}" (ID: ${rel.level_id})`)
    })

    console.log('\n🎉 API test completed!')
    console.log('')
    console.log('📋 Summary:')
    console.log('   - New API approach queries subject_levels table directly')
    console.log('   - Groups subjects by subject_id to handle multiple levels')
    console.log('   - Should show Informatique for all levels it\'s assigned to')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testSubjectLevelsAPI()

