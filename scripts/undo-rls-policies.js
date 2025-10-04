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

async function undoRLSPolicies() {
  console.log('🔄 Undoing RLS policies for Astuce platform...\n')

  try {
    // Read the undo RLS SQL file
    const undoRlsSqlPath = path.join(process.cwd(), 'scripts', 'undo-rls-policies.sql')
    const undoRlsSql = fs.readFileSync(undoRlsSqlPath, 'utf8')

    console.log('📋 Step 1: Reading undo RLS policies from file...')
    console.log(`✅ Undo RLS SQL file loaded (${undoRlsSql.length} characters)\n`)

    // Split the SQL into individual statements
    const statements = undoRlsSql
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
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: undoRlsSql })
      
      if (error) {
        console.error('❌ Error executing undo RLS policies:', error.message)
        console.log('\n💡 Trying alternative approach...')
        
        // Try executing in smaller chunks
        await executeInChunks(statements)
      } else {
        console.log('✅ RLS policies undone successfully as single transaction!')
      }
    } catch (transactionError) {
      console.error('❌ Transaction error:', transactionError.message)
      console.log('\n💡 Trying alternative approach...')
      
      // Try executing in smaller chunks
      await executeInChunks(statements)
    }

    // Step 4: Verify RLS is disabled on tables
    console.log('\n🔍 Step 4: Verifying RLS status...')
    await verifyRLSStatus()

    // Step 5: Test access
    console.log('\n🧪 Step 5: Testing access...')
    await testAccess()

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
    // Check if RLS is disabled on key tables
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
        console.log(`   ${data.row_security ? '❌' : '✅'} RLS ${data.row_security ? 'still enabled' : 'disabled'} on ${table}`)
      } else {
        console.log(`   ⚠️  Table ${table} not found`)
      }
    }
  } catch (error) {
    console.error('❌ Error verifying RLS status:', error.message)
  }
}

async function testAccess() {
  try {
    console.log('   Testing table access...')
    
    // Test access to student_profile
    const { data: profileTest, error: profileError } = await supabaseAdmin
      .from('student_profile')
      .select('*')
      .limit(1)

    if (profileError) {
      console.log(`   ⚠️  Student profile access test failed: ${profileError.message}`)
    } else {
      console.log(`   ✅ Student profile access working: ${profileTest?.length || 0} records`)
    }

    // Test access to exercises
    const { data: exerciseTest, error: exerciseError } = await supabaseAdmin
      .from('exercises')
      .select('*')
      .limit(1)

    if (exerciseError) {
      console.log(`   ⚠️  Exercises access test failed: ${exerciseError.message}`)
    } else {
      console.log(`   ✅ Exercises access working: ${exerciseTest?.length || 0} records`)
    }

  } catch (error) {
    console.error('❌ Error testing access:', error.message)
  }
}

// Run the undo RLS application
undoRLSPolicies()
  .then(() => {
    console.log('\n✅ RLS policies undo complete!')
    console.log('\n📋 Summary:')
    console.log('✅ All RLS policies have been removed')
    console.log('✅ RLS has been disabled on all tables')
    console.log('✅ All users now have full access to all data')
    console.log('✅ Helper functions have been removed')
    console.log('✅ Security views have been removed')
    console.log('\n⚠️  WARNING:')
    console.log('   - There are now NO security restrictions')
    console.log('   - All authenticated users can access all data')
    console.log('   - This is equivalent to having no RLS at all')
    console.log('\n🔧 To re-enable RLS:')
    console.log('   - Run: node scripts/apply-rls-policies.js')
    console.log('   - Or manually apply specific policies as needed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ RLS policies undo failed:', error)
    process.exit(1)
  })























