import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

// Create Supabase client with service role key for admin access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnoseMissingUserData() {
  console.log('🔍 Starting diagnosis of missing user data...\n')

  try {
    // Step 1: Get all student profiles
    console.log('📋 Step 1: Fetching student profiles...')
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('student_profile')
      .select(`
        id,
        user_id,
        level_id,
        is_active,
        created_at,
        levels (
          title
        )
      `)

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    console.log(`✅ Found ${profiles.length} student profiles\n`)

    // Step 2: Get all users from auth.users
    console.log('👥 Step 2: Fetching users from auth.users...')
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    console.log(`✅ Found ${users.length} total users\n`)

    // Step 3: Analyze each profile and match with user data
    console.log('🔍 Step 3: Analyzing user data...\n')
    
    let missingDataCount = 0
    let totalProfiles = profiles.length

    for (const profile of profiles) {
      const user = users.users.find(u => u.id === profile.user_id)
      
      if (!user) {
        console.log(`❌ Profile ${profile.id}: User ${profile.user_id} NOT FOUND in auth.users`)
        missingDataCount++
        continue
      }

      const userMetadata = user.user_metadata || {}
      const email = user.email
      const firstName = userMetadata.first_name || userMetadata.firstName
      const lastName = userMetadata.last_name || userMetadata.lastName
      const username = userMetadata.username
      const phone = userMetadata.phone || userMetadata.phoneNumber

      // Check for missing data
      const hasMissingData = !email || !firstName || !lastName
      
      if (hasMissingData) {
        missingDataCount++
        console.log(`⚠️  Profile ${profile.id}: User ${profile.user_id}`)
        console.log(`   Email: ${email || 'MISSING'}`)
        console.log(`   First Name: ${firstName || 'MISSING'}`)
        console.log(`   Last Name: ${lastName || 'MISSING'}`)
        console.log(`   Username: ${username || 'MISSING'}`)
        console.log(`   Phone: ${phone || 'MISSING'}`)
        console.log(`   Created: ${user.created_at}`)
        console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`)
        console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
        console.log(`   Raw Metadata:`, JSON.stringify(userMetadata, null, 2))
        console.log('')
      }
    }

    // Step 4: Summary
    console.log('📊 SUMMARY:')
    console.log(`Total student profiles: ${totalProfiles}`)
    console.log(`Users with missing data: ${missingDataCount}`)
    console.log(`Users with complete data: ${totalProfiles - missingDataCount}`)
    console.log(`Percentage with missing data: ${((missingDataCount / totalProfiles) * 100).toFixed(1)}%`)

    // Step 5: Check for patterns
    console.log('\n🔍 PATTERN ANALYSIS:')
    
    const usersWithMissingData = profiles.filter(profile => {
      const user = users.users.find(u => u.id === profile.user_id)
      if (!user) return true
      
      const userMetadata = user.user_metadata || {}
      const email = user.email
      const firstName = userMetadata.first_name || userMetadata.firstName
      const lastName = userMetadata.last_name || userMetadata.lastName
      
      return !email || !firstName || !lastName
    })

    if (usersWithMissingData.length > 0) {
      console.log('\n📅 Creation date analysis for users with missing data:')
      for (const profile of usersWithMissingData) {
        const user = users.users.find(u => u.id === profile.user_id)
        if (user) {
          console.log(`   ${profile.user_id}: Created ${user.created_at}`)
        }
      }
    }

    // Step 6: Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    if (missingDataCount > 0) {
      console.log('1. Check if these users registered through a different method')
      console.log('2. Verify if the registration process is saving metadata correctly')
      console.log('3. Check if there were any issues during user creation')
      console.log('4. Consider updating the registration flow to ensure all required fields are saved')
      console.log('5. You may need to manually update these users or ask them to re-register')
    } else {
      console.log('✅ All users have complete data!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the diagnosis
diagnoseMissingUserData()
  .then(() => {
    console.log('\n✅ Diagnosis complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Diagnosis failed:', error)
    process.exit(1)
  })

