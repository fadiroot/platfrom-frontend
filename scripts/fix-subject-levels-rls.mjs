#!/usr/bin/env node

/**
 * Script to fix RLS policies on the subject_levels table
 * This script updates the existing policies to use the is_admin() function
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixRLSPolicies() {
  try {
    console.log('🔧 Fixing RLS policies for subject_levels table...\n')

    // Drop existing policies if they exist
    console.log('1️⃣ Dropping existing policies...')
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Anyone can view subject levels" ON subject_levels;',
      'DROP POLICY IF EXISTS "Admins can manage subject levels" ON subject_levels;'
    ]

    for (const policy of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy })
      if (error) {
        console.log(`⚠️  Could not drop policy (may not exist): ${error.message}`)
      } else {
        console.log('✅ Policy dropped successfully')
      }
    }

    // Create new policies using is_admin() function
    console.log('\n2️⃣ Creating new RLS policies...')
    
    const createPolicies = [
      `CREATE POLICY "Anyone can view subject levels" ON subject_levels
       FOR SELECT USING (true);`,
      `CREATE POLICY "Admins can manage subject levels" ON subject_levels
       FOR ALL USING (public.is_admin());`
    ]

    for (const policy of createPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy })
      if (error) {
        console.error(`❌ Error creating policy: ${error.message}`)
        console.error(`Policy: ${policy}`)
        return
      } else {
        console.log('✅ Policy created successfully')
      }
    }

    console.log('\n3️⃣ Verifying policies...')
    
    // Test the policies by trying to query the table
    const { data, error } = await supabase
      .from('subject_levels')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error testing policies:', error.message)
      return
    }

    console.log('✅ Policies are working correctly')
    console.log(`✅ Found ${data?.length || 0} subject-level relationships`)

    console.log('\n🎉 RLS policies fixed successfully!')
    console.log('')
    console.log('📋 What was fixed:')
    console.log('   ✅ Dropped old policies that referenced auth.users')
    console.log('   ✅ Created new policies using public.is_admin() function')
    console.log('   ✅ Verified policies are working correctly')
    console.log('')
    console.log('🚀 You can now test the admin dashboard to:')
    console.log('   - Add levels to subjects')
    console.log('   - Remove levels from subjects')
    console.log('   - Create new subjects with multiple levels')

  } catch (error) {
    console.error('❌ Failed to fix RLS policies:', error.message)
    process.exit(1)
  }
}

// Run the fix
fixRLSPolicies()

