import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

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

async function applyRLSPolicies() {
  console.log('🔒 Applying RLS policies to Astuce platform...\n')

  try {
    // Read the RLS SQL file
    const rlsSqlPath = path.join(process.cwd(), 'scripts', 'comprehensive-rls-setup.sql')
    const rlsSql = fs.readFileSync(rlsSqlPath, 'utf8')

    console.log('📋 Step 1: Reading RLS policies from file...')
    console.log(`✅ RLS SQL file loaded (${rlsSql.length} characters)\n`)

    // Split the SQL into individual statements
    const statements = rlsSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'))

    console.log(`📝 Step 2: Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (statement.trim().length === 0) continue

      try {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement })
        
        if (error) {
          console.error(`   ❌ Error in statement ${i + 1}:`, error.message)
          errorCount++
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`)
          successCount++
        }
      } catch (execError) {
        console.error(`   ❌ Exception in statement ${i + 1}:`, execError.message)
        errorCount++
      }
    }

    // Alternative approach: Execute the entire SQL as one transaction
    console.log('\n🔄 Step 3: Attempting to execute as single transaction...')
    
    try {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: rlsSql })
      
      if (error) {
        console.error('❌ Error executing RLS policies:', error.message)
        console.log('\n💡 Trying alternative approach...')
        
        // Try executing in smaller chunks
        await executeInChunks(statements)
      } else {
        console.log('✅ RLS policies applied successfully as single transaction!')
      }
    } catch (transactionError) {
      console.error('❌ Transaction error:', transactionError.message)
      console.log('\n💡 Trying alternative approach...')
      
      // Try executing in smaller chunks
      await executeInChunks(statements)
    }

    // Step 4: Verify RLS is enabled on tables
    console.log('\n🔍 Step 4: Verifying RLS status...')
    await verifyRLSStatus()

    // Step 5: Test policies
    console.log('\n🧪 Step 5: Testing RLS policies...')
    await testRLSPolicies()

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function executeInChunks(statements) {
  console.log('📦 Executing statements in chunks...')
  
  const chunkSize = 5
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < statements.length; i += chunkSize) {
    const chunk = statements.slice(i, i + chunkSize)
    const chunkSql = chunk.join(';\n') + ';'
    
    try {
      console.log(`   Executing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(statements.length / chunkSize)}...`)
      
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: chunkSql })
      
      if (error) {
        console.error(`   ❌ Error in chunk ${Math.floor(i / chunkSize) + 1}:`, error.message)
        errorCount++
      } else {
        console.log(`   ✅ Chunk ${Math.floor(i / chunkSize) + 1} executed successfully`)
        successCount++
      }
    } catch (chunkError) {
      console.error(`   ❌ Exception in chunk ${Math.floor(i / chunkSize) + 1}:`, chunkError.message)
      errorCount++
    }
  }

  console.log(`\n📊 Chunk execution summary: ${successCount} successful, ${errorCount} errors`)
}

async function verifyRLSStatus() {
  try {
    // Check if RLS is enabled on key tables
    const tables = ['student_profile', 'user_roles', 'levels', 'subjects', 'chapters', 'exercises']
    
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name, row_security')
        .eq('table_name', table)
        .eq('table_schema', 'public')
        .single()

      if (error) {
        console.log(`   ⚠️  Could not verify RLS for ${table}: ${error.message}`)
      } else if (data) {
        console.log(`   ${data.row_security ? '✅' : '❌'} RLS ${data.row_security ? 'enabled' : 'disabled'} on ${table}`)
      } else {
        console.log(`   ⚠️  Table ${table} not found`)
      }
    }
  } catch (error) {
    console.error('❌ Error verifying RLS status:', error.message)
  }
}

async function testRLSPolicies() {
  try {
    console.log('   Testing admin function...')
    
    // Test the is_admin function
    const { data: adminTest, error: adminError } = await supabaseAdmin.rpc('is_admin')
    
    if (adminError) {
      console.log(`   ⚠️  Admin function test failed: ${adminError.message}`)
    } else {
      console.log(`   ✅ Admin function working: ${adminTest}`)
    }

    console.log('   Testing student dashboard view...')
    
    // Test the student dashboard view
    const { data: dashboardTest, error: dashboardError } = await supabaseAdmin
      .from('student_dashboard_view')
      .select('*')
      .limit(1)

    if (dashboardError) {
      console.log(`   ⚠️  Dashboard view test failed: ${dashboardError.message}`)
    } else {
      console.log(`   ✅ Dashboard view working: ${dashboardTest?.length || 0} records`)
    }

  } catch (error) {
    console.error('❌ Error testing RLS policies:', error.message)
  }
}

// Run the RLS application
applyRLSPolicies()
  .then(() => {
    console.log('\n✅ RLS policies application complete!')
    console.log('\n📋 Next steps:')
    console.log('1. Test the policies in your application')
    console.log('2. Verify that users can only access their own data')
    console.log('3. Check that admins can access all data')
    console.log('4. Test level-based content filtering')
    console.log('5. Verify subscription-based exercise access')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ RLS policies application failed:', error)
    process.exit(1)
  })













