#!/usr/bin/env node

/**
 * Script to apply the subject-levels many-to-many migration
 * This script creates the junction table and migrates existing data
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

async function applyMigration() {
  try {
    console.log('🚀 Starting subject-levels many-to-many migration...')

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'migrations', 'subject_levels_many_to_many.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration file loaded successfully')

    // Execute the migration
    console.log('⚡ Executing migration...')
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // If the RPC doesn't exist, try executing the SQL directly
      console.log('⚠️  RPC method not available, trying direct execution...')
      
      // Split the migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      for (const statement of statements) {
        if (statement.includes('BEGIN') || statement.includes('COMMIT')) {
          continue // Skip transaction control statements
        }
        
        console.log(`📝 Executing: ${statement.substring(0, 50)}...`)
        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (stmtError) {
          console.error(`❌ Error executing statement: ${stmtError.message}`)
          console.error(`Statement: ${statement}`)
          throw stmtError
        }
      }
    }

    console.log('✅ Migration executed successfully!')

    // Verify the migration
    console.log('🔍 Verifying migration...')
    
    // Check if subject_levels table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'subject_levels')

    if (tableError) {
      console.error('❌ Error checking tables:', tableError.message)
      return
    }

    if (tables && tables.length > 0) {
      console.log('✅ subject_levels table created successfully')
    } else {
      console.error('❌ subject_levels table not found')
      return
    }

    // Check migrated data
    const { data: subjectLevels, error: dataError } = await supabase
      .from('subject_levels')
      .select('*')
      .limit(5)

    if (dataError) {
      console.error('❌ Error checking migrated data:', dataError.message)
      return
    }

    console.log(`✅ Found ${subjectLevels?.length || 0} subject-level relationships`)
    
    if (subjectLevels && subjectLevels.length > 0) {
      console.log('📊 Sample migrated data:')
      subjectLevels.forEach((sl, index) => {
        console.log(`   ${index + 1}. Subject: ${sl.subject_id}, Level: ${sl.level_id}`)
      })
    }

    console.log('🎉 Migration completed successfully!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('   1. Test the new multi-level subject assignment in the admin dashboard')
    console.log('   2. Verify that existing subjects still work correctly')
    console.log('   3. Test creating new subjects with multiple levels')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error('')
    console.error('🔧 Troubleshooting:')
    console.error('   1. Ensure you have admin privileges in Supabase')
    console.error('   2. Check that the SUPABASE_SERVICE_ROLE_KEY is correct')
    console.error('   3. Verify the migration SQL syntax')
    process.exit(1)
  }
}

// Run the migration
applyMigration()

