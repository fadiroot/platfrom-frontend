#!/usr/bin/env node

/**
 * Check RLS policies for subject_levels and subjects tables
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

async function checkRLSPolicies() {
  try {
    console.log('🔍 Checking RLS policies...\n')

    // 1. Test reading from subject_levels table
    console.log('1️⃣ Testing subject_levels table access:')
    const { data: slData, error: slError } = await supabase
      .from('subject_levels')
      .select('*')
      .limit(1)

    if (slError) {
      console.error(`❌ Error reading subject_levels: ${slError.message}`)
      console.error(`   Error code: ${slError.code}`)
      console.error(`   Error details: ${slError.details}`)
    } else {
      console.log(`✅ Successfully read from subject_levels: ${slData?.length || 0} rows`)
    }
    console.log('')

    // 2. Test reading from subjects table
    console.log('2️⃣ Testing subjects table access:')
    const { data: sData, error: sError } = await supabase
      .from('subjects')
      .select('*')
      .limit(1)

    if (sError) {
      console.error(`❌ Error reading subjects: ${sError.message}`)
      console.error(`   Error code: ${sError.code}`)
      console.error(`   Error details: ${sError.details}`)
    } else {
      console.log(`✅ Successfully read from subjects: ${sData?.length || 0} rows`)
    }
    console.log('')

    // 3. Test reading from levels table
    console.log('3️⃣ Testing levels table access:')
    const { data: lData, error: lError } = await supabase
      .from('levels')
      .select('*')
      .limit(1)

    if (lError) {
      console.error(`❌ Error reading levels: ${lError.message}`)
      console.error(`   Error code: ${lError.code}`)
      console.error(`   Error details: ${lError.details}`)
    } else {
      console.log(`✅ Successfully read from levels: ${lData?.length || 0} rows`)
    }
    console.log('')

    // 4. Test the join query
    console.log('4️⃣ Testing join query (subjects + subject_levels + levels):')
    const { data: joinData, error: joinError } = await supabase
      .from('subject_levels')
      .select(`
        subject_id,
        subjects(
          id,
          title
        ),
        levels(
          id,
          title
        )
      `)
      .limit(1)

    if (joinError) {
      console.error(`❌ Error with join query: ${joinError.message}`)
      console.error(`   Error code: ${joinError.code}`)
      console.error(`   Error details: ${joinError.details}`)
    } else {
      console.log(`✅ Successfully executed join query: ${joinData?.length || 0} rows`)
      if (joinData && joinData.length > 0) {
        console.log(`   Sample: "${joinData[0].subjects?.title}" → "${joinData[0].levels?.title}"`)
      }
    }
    console.log('')

    // 5. Test with a specific level
    console.log('5️⃣ Testing with specific level:')
    const { data: techniquesLevel, error: levelError } = await supabase
      .from('levels')
      .select('id, title')
      .ilike('title', '%4ème Sciences Techniques%')
      .single()

    if (levelError || !techniquesLevel) {
      console.log(`❌ Could not find Techniques level: ${levelError?.message}`)
    } else {
      console.log(`✅ Found Techniques level: "${techniquesLevel.title}" (ID: ${techniquesLevel.id})`)
      
      // Test the exact query for this level
      const { data: specificData, error: specificError } = await supabase
        .from('subject_levels')
        .select(`
          subject_id,
          subjects(title),
          levels(title)
        `)
        .eq('level_id', techniquesLevel.id)

      if (specificError) {
        console.error(`❌ Error with specific level query: ${specificError.message}`)
      } else {
        console.log(`✅ Specific level query successful: ${specificData?.length || 0} subjects`)
        specificData?.forEach((item, index) => {
          console.log(`   ${index + 1}. "${item.subjects?.title}"`)
        })
      }
    }

    console.log('\n🎉 RLS policy check completed!')
    console.log('')
    console.log('📋 Summary:')
    console.log('   - Check if all tables are accessible')
    console.log('   - Verify join queries work')
    console.log('   - Confirm specific level queries return data')

  } catch (error) {
    console.error('❌ Check failed:', error.message)
    process.exit(1)
  }
}

// Run the check
checkRLSPolicies()

