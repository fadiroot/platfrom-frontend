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

async function fixMissingUserData() {
  console.log('🔧 Starting fix for missing user data...\n')

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

    // Step 3: Identify and fix users with missing data
    console.log('🔧 Step 3: Identifying and fixing users with missing data...\n')
    
    let fixedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const profile of profiles) {
      const user = users.users.find(u => u.id === profile.user_id)
      
      if (!user) {
        console.log(`❌ Profile ${profile.id}: User ${profile.user_id} NOT FOUND in auth.users - SKIPPING`)
        errorCount++
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
        console.log(`🔧 Fixing user ${profile.user_id}...`)
        console.log(`   Current email: ${email || 'MISSING'}`)
        console.log(`   Current first name: ${firstName || 'MISSING'}`)
        console.log(`   Current last name: ${lastName || 'MISSING'}`)

        // Prepare updated metadata
        const updatedMetadata = {
          ...userMetadata,
          first_name: firstName || userMetadata.firstName || `Student_${profile.id}`,
          last_name: lastName || userMetadata.lastName || 'User',
          username: username || `student_${profile.id}`,
          phone: phone || userMetadata.phoneNumber || '',
          // Keep existing fields
          levelId: userMetadata.levelId || profile.level_id,
          role: userMetadata.role || 'student'
        }

        // Update user metadata
        try {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            {
              user_metadata: updatedMetadata
            }
          )

          if (updateError) {
            console.error(`   ❌ Failed to update user ${user.id}:`, updateError.message)
            errorCount++
          } else {
            console.log(`   ✅ Successfully updated user ${user.id}`)
            console.log(`   New first name: ${updatedMetadata.first_name}`)
            console.log(`   New last name: ${updatedMetadata.last_name}`)
            console.log(`   New username: ${updatedMetadata.username}`)
            fixedCount++
          }
        } catch (updateError) {
          console.error(`   ❌ Error updating user ${user.id}:`, updateError.message)
          errorCount++
        }
        
        console.log('')
      } else {
        skippedCount++
      }
    }

    // Step 4: Summary
    console.log('📊 FIX SUMMARY:')
    console.log(`Total student profiles: ${profiles.length}`)
    console.log(`Users fixed: ${fixedCount}`)
    console.log(`Users skipped (already complete): ${skippedCount}`)
    console.log(`Users with errors: ${errorCount}`)

    if (fixedCount > 0) {
      console.log('\n✅ Successfully fixed missing user data!')
      console.log('The student management table should now display all users properly.')
    } else if (errorCount > 0) {
      console.log('\n⚠️  Some users could not be fixed. Check the error messages above.')
    } else {
      console.log('\n✅ All users already have complete data!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the fix
fixMissingUserData()
  .then(() => {
    console.log('\n✅ Fix process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fix process failed:', error)
    process.exit(1)
  })

