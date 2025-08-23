#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkStudentProfiles() {
  try {
    console.log('🔍 Checking student_profile table...\n')

    // Get all student profiles
    const { data: profiles, error } = await supabase
      .from('student_profile')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching student profiles:', error)
      return
    }

    console.log(`📊 Found ${profiles.length} student profiles\n`)

    // Analyze profiles
    const activeProfiles = profiles.filter(p => p.is_active === true)
    const inactiveProfiles = profiles.filter(p => p.is_active === false)
    const nullProfiles = profiles.filter(p => p.is_active === null)

    console.log('📈 Profile Status Summary:')
    console.log(`   ✅ Active profiles: ${activeProfiles.length}`)
    console.log(`   ❌ Inactive profiles: ${inactiveProfiles.length}`)
    console.log(`   ❓ Null profiles: ${nullProfiles.length}\n`)

    // Show recent profiles
    console.log('🕒 Recent Profiles (last 10):')
    profiles.slice(0, 10).forEach((profile, index) => {
      const status = profile.is_active ? '✅ Active' : '❌ Inactive'
      const date = new Date(profile.created_at).toLocaleDateString()
      console.log(`   ${index + 1}. User: ${profile.user_id.slice(0, 8)}... | Level: ${profile.level_id || 'None'} | Status: ${status} | Created: ${date}`)
    })

    // Check for profiles that should be inactive
    console.log('\n🔍 Analysis:')
    
    if (inactiveProfiles.length > 0) {
      console.log(`   ✅ ${inactiveProfiles.length} profiles are correctly set to inactive (good for profile completion)`)
    }
    
    if (activeProfiles.length > 0) {
      console.log(`   ⚠️  ${activeProfiles.length} profiles are active (should be activated by admin)`)
    }
    
    if (nullProfiles.length > 0) {
      console.log(`   ⚠️  ${nullProfiles.length} profiles have null is_active (should be set to false)`)
    }

    // Check table structure
    console.log('\n📋 Table Structure Check:')
    const { data: sampleProfile } = await supabase
      .from('student_profile')
      .select('*')
      .limit(1)
      .single()

    if (sampleProfile) {
      const columns = Object.keys(sampleProfile)
      console.log('   Available columns:', columns.join(', '))
      
      if (columns.includes('is_active')) {
        console.log('   ✅ is_active column exists')
      } else {
        console.log('   ❌ is_active column missing')
      }
    }

    console.log('\n✅ Student profile check completed!')

  } catch (error) {
    console.error('❌ Error during check:', error)
  }
}

// Run the check
checkStudentProfiles()
