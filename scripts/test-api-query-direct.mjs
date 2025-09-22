#!/usr/bin/env node

/**
 * Test the exact API query that the frontend uses
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

async function testAPIQueryDirect() {
  try {
    console.log('🧪 Testing the exact API query that the frontend uses...\n')

    // 1. Find the "4ème Sciences Techniques" level
    console.log('1️⃣ Finding "4ème Sciences Techniques" level:')
    const { data: techniquesLevel, error: levelError } = await supabase
      .from('levels')
      .select('id, title')
      .ilike('title', '%4ème Sciences Techniques%')
      .single()

    if (levelError || !techniquesLevel) {
      console.error('❌ Error finding Techniques level:', levelError?.message)
      return
    }

    console.log(`✅ Found: "${techniquesLevel.title}" (ID: ${techniquesLevel.id})`)
    console.log('')

    // 2. Test the exact query from the new API
    console.log('2️⃣ Testing the exact API query:')
    console.log('   Query: from("subject_levels").select(...).eq("level_id", techniquesLevel.id)')
    
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
      console.error(`❌ Query error: ${error.message}`)
      console.error(`   Error details:`, error)
      return
    }

    console.log(`✅ Query successful! Returned ${data?.length || 0} rows`)
    console.log('')

    // 3. Show raw data
    console.log('3️⃣ Raw query results:')
    data?.forEach((item, index) => {
      console.log(`   ${index + 1}. Subject: "${item.subjects?.title}" (ID: ${item.subject_id})`)
      console.log(`      Level: "${item.levels?.title}" (ID: ${item.level_id})`)
    })
    console.log('')

    // 4. Test the grouping logic
    console.log('4️⃣ Testing grouping logic:')
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
    
    console.log(`✅ After grouping: ${subjects.length} subjects`)
    subjects.forEach((subject, index) => {
      const levelNames = subject.levels?.map(l => l.title).join(', ') || 'No levels'
      console.log(`   ${index + 1}. "${subject.title}" (Levels: [${levelNames}])`)
    })
    console.log('')

    // 5. Check specifically for Informatique
    const informatiqueFound = subjects.some(subject => 
      subject.title.toLowerCase().includes('informatique')
    )
    console.log(`5️⃣ Informatique check:`)
    console.log(`   ${informatiqueFound ? '✅' : '❌'} Informatique ${informatiqueFound ? 'IS' : 'IS NOT'} found in the results`)

    if (!informatiqueFound) {
      console.log('')
      console.log('🔍 Let\'s check if Informatique exists in subject_levels for this level:')
      
      const { data: informatiqueCheck, error: infoError } = await supabase
        .from('subject_levels')
        .select(`
          subject_id,
          subjects(title),
          levels(title)
        `)
        .eq('level_id', techniquesLevel.id)
        .ilike('subjects.title', '%informatique%')

      if (infoError) {
        console.error('❌ Error checking Informatique:', infoError.message)
      } else {
        console.log(`   Found ${informatiqueCheck?.length || 0} Informatique relationships for this level`)
        informatiqueCheck?.forEach((rel, index) => {
          console.log(`   ${index + 1}. "${rel.subjects?.title}" → "${rel.levels?.title}"`)
        })
      }
    }

    // 6. Test with different user roles
    console.log('\n6️⃣ Testing with different authentication contexts:')
    
    // Test as anonymous user
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data: anonData, error: anonError } = await anonSupabase
      .from('subject_levels')
      .select('subject_id, subjects(title)')
      .eq('level_id', techniquesLevel.id)
      .limit(1)

    console.log(`   Anonymous user: ${anonError ? '❌ Error: ' + anonError.message : '✅ Success - ' + (anonData?.length || 0) + ' rows'}`)

    console.log('\n🎉 API query test completed!')
    console.log('')
    console.log('📋 Summary:')
    console.log('   - Check if the query returns the expected data')
    console.log('   - Verify that Informatique is in the results')
    console.log('   - Check for any RLS policy issues')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testAPIQueryDirect()

