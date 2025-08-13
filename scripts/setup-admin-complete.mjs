import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Function to set user as admin
async function setUserAsAdmin(email) {
  try {
    console.log(`🔧 Setting up admin for: ${email}`)
    
    // Get all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return false
    }
    
    // Find user by email
    const user = users.users.find(u => u.email === email)
    if (!user) {
      console.error(`❌ User not found: ${email}`)
      return false
    }
    
    console.log(`✅ Found user: ${user.email} (ID: ${user.id})`)
    
    // Update user metadata to set admin role
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: { 
          ...user.user_metadata,
          role: 'admin' 
        }
      }
    )
    
    if (updateError) {
      console.error('❌ Error setting admin role:', updateError)
      return false
    }
    
    console.log(`✅ Successfully set ${email} as admin`)
    return true
  } catch (error) {
    console.error('❌ Error in setUserAsAdmin:', error)
    return false
  }
}

// Function to test admin functions
async function testAdminFunctions() {
  try {
    console.log('\n🧪 Testing admin functions...')
    
    // Test is_admin function
    console.log('Testing is_admin function...')
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
    
    if (adminError) {
      console.error('❌ Error testing is_admin:', adminError)
    } else {
      console.log(`✅ is_admin result: ${isAdmin}`)
    }
    
    // Test get_student_profiles function
    console.log('Testing get_student_profiles function...')
    const { data: studentProfiles, error: profilesError } = await supabase.rpc('get_student_profiles')
    
    if (profilesError) {
      console.error('❌ Error testing get_student_profiles:', profilesError)
    } else {
      console.log(`✅ Found ${studentProfiles?.length || 0} student profiles`)
    }
    
    // Test get_user_accessible_exercises function
    console.log('Testing get_user_accessible_exercises function...')
    const { data: exercises, error: exercisesError } = await supabase.rpc('get_user_accessible_exercises', {
      user_uuid: '00000000-0000-0000-0000-000000000000' // Dummy UUID for testing
    })
    
    if (exercisesError) {
      console.error('❌ Error testing get_user_accessible_exercises:', exercisesError)
    } else {
      console.log(`✅ Found ${exercises?.length || 0} accessible exercises`)
    }
    
    return true
  } catch (error) {
    console.error('❌ Error testing admin functions:', error)
    return false
  }
}

// Function to list all users
async function listAllUsers() {
  try {
    console.log('\n👥 Listing all users...')
    
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error listing users:', error)
      return
    }
    
    console.log(`✅ Found ${users.users.length} users:`)
    
    users.users.forEach((user, index) => {
      const role = user.user_metadata?.role || 'user'
      const isAdmin = role === 'admin'
      const status = isAdmin ? '👑 ADMIN' : '👤 USER'
      
      console.log(`${index + 1}. ${user.email} - ${status}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Role: ${role}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      if (user.last_sign_in_at) {
        console.log(`   Last Sign In: ${new Date(user.last_sign_in_at).toLocaleString()}`)
      }
      console.log('')
    })
  } catch (error) {
    console.error('❌ Error listing users:', error)
  }
}

// Function to check RLS policies
async function checkRLSPolicies() {
  try {
    console.log('\n🔒 Checking RLS policies...')
    
    const { data, error } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_schema', 'public')
      .eq('privilege_type', 'SELECT')
    
    if (error) {
      console.error('❌ Error checking RLS policies:', error)
      return
    }
    
    console.log('✅ RLS policies check completed')
    
    // Check specific tables
    const tables = ['chapters', 'exercises', 'levels', 'subjects', 'student_profile', 'user_progress']
    
    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (tableError) {
          console.log(`❌ ${table}: ${tableError.message}`)
        } else {
          console.log(`✅ ${table}: Accessible`)
        }
      } catch (err) {
        console.log(`❌ ${table}: Error checking access`)
      }
    }
  } catch (error) {
    console.error('❌ Error checking RLS policies:', error)
  }
}

// Main function
async function main() {
  console.log('🚀 Starting comprehensive admin setup...\n')
  
  // Get email from command line arguments
  const email = process.argv[2]
  
  if (!email) {
    console.error('❌ Please provide an email address as an argument')
    console.error('Usage: node setup-admin-complete.mjs <email>')
    process.exit(1)
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    console.error('❌ Invalid email format')
    process.exit(1)
  }
  
  console.log(`📧 Setting up admin for: ${email}`)
  
  // Set user as admin
  const adminResult = await setUserAsAdmin(email)
  
  if (!adminResult) {
    console.error('❌ Failed to set user as admin')
    process.exit(1)
  }
  
  // List all users
  await listAllUsers()
  
  // Test admin functions
  await testAdminFunctions()
  
  // Check RLS policies
  await checkRLSPolicies()
  
  console.log('\n✅ Admin setup completed successfully!')
  console.log('\n📋 Next steps:')
  console.log('1. Log in with the admin account')
  console.log('2. Navigate to /admin to access the admin dashboard')
  console.log('3. Test admin functionality in the dashboard')
  console.log('4. Use the admin functions to manage users and content')
}

// Run the main function
main().catch(console.error)
