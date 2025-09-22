#!/usr/bin/env node

/**
 * Quick test of the subjects_with_all_levels view
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

async function testViewQuery() {
  try {
    console.log('🧪 Testing subjects_with_all_levels view...\n')

    // 1. Get all subjects from the view
    console.log('1️⃣ All subjects from view:')
    const { data: allSubjects, error: allError } = await supabase
      .from('subjects_with_all_levels')
      .select('*')
      .order('created_at', { ascending: true })

    if (allError) {
      console.error('❌ Error:', allError.message)
      return
    }

    console.log(`Found ${allSubjects?.length || 0} subjects:`)
    allSubjects?.forEach((subject, index) => {
      console.log(`   ${index + 1}. "${subject.title}" (Level IDs: [${subject.level_ids?.join(', ')}])`)
    })
    console.log('')

    // 2. Find the Techniques level ID
    console.log('2️⃣ Finding Techniques level:')
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

    // 3. Test the new API query
    console.log('3️⃣ Testing new API query for Techniques level:')
    const { data: techniquesSubjects, error: techError } = await supabase
      .from('subjects_with_all_levels')
      .select('*')
      .contains('level_ids', [techniquesLevel.id])
      .order('created_at', { ascending: true })

    if (techError) {
      console.error('❌ Error:', techError.message)
      return
    }

    console.log(`Found ${techniquesSubjects?.length || 0} subjects for Techniques level:`)
    techniquesSubjects?.forEach((subject, index) => {
      console.log(`   ${index + 1}. "${subject.title}" (Level IDs: [${subject.level_ids?.join(', ')}])`)
    })

    // Check if Informatique is found
    const informatiqueFound = techniquesSubjects?.some(subject => 
      subject.title.toLowerCase().includes('informatique')
    )
    console.log(`\n   ${informatiqueFound ? '✅' : '❌'} Informatique ${informatiqueFound ? 'IS' : 'IS NOT'} found for Techniques level`)

    console.log('\n🎉 Test completed!')
    console.log('')
    console.log('📋 Summary:')
    console.log('   - View contains all subjects with their level_ids')
    console.log('   - New API query uses contains() to filter by level_id')
    console.log('   - Should show Informatique for Techniques level if it has the correct level_id in the array')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testViewQuery()

