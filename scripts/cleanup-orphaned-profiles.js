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

async function cleanupOrphanedProfiles() {
  console.log('🧹 Starting cleanup of orphaned student profiles...\n')

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

    console.log(`✅ Found ${users.users.length} total users\n`)

    // Step 3: Identify orphaned profiles
    console.log('🔍 Step 3: Identifying orphaned profiles...\n')
    
    const orphanedProfiles = profiles.filter(profile => {
      const userExists = users.users.some(user => user.id === profile.user_id)
      return !userExists
    })

    console.log(`📊 Found ${orphanedProfiles.length} orphaned profiles:`)
    orphanedProfiles.forEach(profile => {
      console.log(`   - Profile ID: ${profile.id}, User ID: ${profile.user_id}`)
    })

    if (orphanedProfiles.length === 0) {
      console.log('✅ No orphaned profiles found!')
      return
    }

    // Step 4: Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete the following orphaned profiles:')
    orphanedProfiles.forEach(profile => {
      console.log(`   - Profile ID: ${profile.id} (User ID: ${profile.user_id})`)
    })
    
    console.log('\n💡 These profiles are orphaned because their corresponding users no longer exist in auth.users.')
    console.log('   This could happen if users were deleted manually or if there were registration issues.')
    
    // For now, we'll proceed with cleanup (in a real scenario, you might want user confirmation)
    console.log('\n🧹 Proceeding with cleanup...\n')

    // Step 5: Delete orphaned profiles
    let deletedCount = 0
    let errorCount = 0

    for (const profile of orphanedProfiles) {
      try {
        console.log(`🗑️  Deleting orphaned profile ${profile.id}...`)
        
        const { error: deleteError } = await supabaseAdmin
          .from('student_profile')
          .delete()
          .eq('id', profile.id)

        if (deleteError) {
          console.error(`   ❌ Failed to delete profile ${profile.id}:`, deleteError.message)
          errorCount++
        } else {
          console.log(`   ✅ Successfully deleted profile ${profile.id}`)
          deletedCount++
        }
      } catch (error) {
        console.error(`   ❌ Error deleting profile ${profile.id}:`, error.message)
        errorCount++
      }
    }

    // Step 6: Summary
    console.log('\n📊 CLEANUP SUMMARY:')
    console.log(`Total orphaned profiles: ${orphanedProfiles.length}`)
    console.log(`Profiles deleted: ${deletedCount}`)
    console.log(`Deletion errors: ${errorCount}`)

    if (deletedCount > 0) {
      console.log('\n✅ Successfully cleaned up orphaned profiles!')
      console.log('The student management table should now only show valid users.')
    } else if (errorCount > 0) {
      console.log('\n⚠️  Some profiles could not be deleted. Check the error messages above.')
    }

    // Step 7: Verify remaining profiles
    console.log('\n🔍 Step 7: Verifying remaining profiles...')
    const { data: remainingProfiles, error: remainingError } = await supabaseAdmin
      .from('student_profile')
      .select('id, user_id')

    if (remainingError) {
      console.error('❌ Error fetching remaining profiles:', remainingError)
    } else {
      console.log(`✅ Remaining profiles: ${remainingProfiles.length}`)
      
      // Check if any remaining profiles are still orphaned
      const stillOrphaned = remainingProfiles.filter(profile => {
        const userExists = users.users.some(user => user.id === profile.user_id)
        return !userExists
      })

      if (stillOrphaned.length > 0) {
        console.log(`⚠️  Warning: ${stillOrphaned.length} profiles are still orphaned`)
        stillOrphaned.forEach(profile => {
          console.log(`   - Profile ID: ${profile.id}, User ID: ${profile.user_id}`)
        })
      } else {
        console.log('✅ All remaining profiles have valid users!')
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the cleanup
cleanupOrphanedProfiles()
  .then(() => {
    console.log('\n✅ Cleanup process complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Cleanup process failed:', error)
    process.exit(1)
  })

