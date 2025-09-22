#!/usr/bin/env node

/**
 * Debug script specifically for the Informatique subject issue
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

async function debugInformatiqueSpecific() {
  try {
    console.log('🔍 Debugging Informatique subject for 4ème Sciences Techniques...\n')

    // 1. Find the specific levels
    console.log('1️⃣ Finding the specific levels:')
    const { data: levels, error: levelsError } = await supabase
      .from('levels')
      .select('id, title')
      .or('title.ilike.%4ème Sciences Expérimentales%,title.ilike.%4ème Sciences Techniques%')

    if (levelsError) {
      console.error('❌ Error fetching levels:', levelsError.message)
      return
    }

    console.log(`Found ${levels?.length || 0} levels:`)
    levels?.forEach((level, index) => {
      console.log(`   ${index + 1}. "${level.title}" (ID: ${level.id})`)
    })
    console.log('')

    // 2. Find Informatique subject
    console.log('2️⃣ Finding Informatique subject:')
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

    // 3. Check subject_levels relationships for Informatique
    console.log('3️⃣ Checking subject_levels relationships for Informatique:')
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

    // 4. Test the exact API query for "4ème Sciences Techniques"
    const techniquesLevel = levels?.find(level => 
      level.title.includes('Techniques')
    )

    if (techniquesLevel) {
      console.log(`4️⃣ Testing API query for "${techniquesLevel.title}" (ID: ${techniquesLevel.id}):`)
      
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
        .eq('level_id', techniquesLevel.id)

      if (error) {
        console.log(`   ❌ Error: ${error.message}`)
      } else {
        console.log(`   Raw query returned ${data?.length || 0} rows:`)
        data?.forEach((item, index) => {
          console.log(`   ${index + 1}. Subject: "${item.subjects?.title}" (ID: ${item.subject_id})`)
        })

        // Group subjects by subject_id
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

        const subjects = Array.from(subjectMap.values())
        
        console.log(`   After grouping: ${subjects.length} subjects:`)
        subjects.forEach((subject, index) => {
          const levelNames = subject.levels?.map(l => l.title).join(', ') || 'No levels'
          console.log(`   ${index + 1}. "${subject.title}" (Levels: [${levelNames}])`)
        })

        // Check if Informatique is found
        const informatiqueFound = subjects.some(subject => 
          subject.title.toLowerCase().includes('informatique')
        )
        console.log(`   ${informatiqueFound ? '✅' : '❌'} Informatique ${informatiqueFound ? 'IS' : 'IS NOT'} found for "${techniquesLevel.title}"`)
      }
    } else {
      console.log('❌ Could not find "4ème Sciences Techniques" level')
    }

    // 5. Check if there's a relationship in subject_levels for Techniques level
    if (techniquesLevel) {
      console.log(`\n5️⃣ Checking if Informatique is linked to "${techniquesLevel.title}" in subject_levels:`)
      
      const { data: specificRel, error: specificError } = await supabase
        .from('subject_levels')
        .select(`
          id,
          subject_id,
          level_id,
          subjects(title),
          levels(title)
        `)
        .eq('subject_id', informatiqueSubject.id)
        .eq('level_id', techniquesLevel.id)

      if (specificError) {
        console.error('❌ Error checking specific relationship:', specificError.message)
      } else {
        if (specificRel && specificRel.length > 0) {
          console.log(`✅ Relationship EXISTS: "${specificRel[0].subjects?.title}" → "${specificRel[0].levels?.title}"`)
        } else {
          console.log(`❌ Relationship DOES NOT EXIST: Informatique is NOT linked to "${techniquesLevel.title}" in subject_levels table`)
          console.log('   This is the problem! The subject needs to be added to the subject_levels table for this level.')
        }
      }
    }

    console.log('\n🎉 Debug completed!')
    console.log('')
    console.log('📋 Summary:')
    console.log('   - Check if Informatique has a row in subject_levels table for "4ème Sciences Techniques"')
    console.log('   - If not, add it through the admin interface or directly in the database')

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    process.exit(1)
  }
}

// Run the debug
debugInformatiqueSpecific()

