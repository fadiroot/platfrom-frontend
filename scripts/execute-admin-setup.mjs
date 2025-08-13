// Execute Admin Setup SQL
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const supabaseUrl = 'https://kmtjpafmshyyuftknuof.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdGpwYWZtc2h5eXVmdGtudW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIxNDcwNSwiZXhwIjoyMDY5NzkwNzA1fQ.L4KdL17KixzYLQtoSiv7V0qUSiirwcB3wq3pk85v0dA';

// Create admin client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeAdminSetup() {
  try {
    console.log('🔧 Setting up admin user and roles table...');
    
    // Read the SQL file
    const sqlPath = join(__dirname, 'create-admin-table.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
      
      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: statement
      });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    // Verify admin role was created
    console.log('\n🔍 Verifying admin role assignment...');
    const { data: adminRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('role', 'admin');
    
    if (roleError) {
      console.error('❌ Error checking admin roles:', roleError);
    } else {
      console.log(`✅ Found ${adminRoles?.length || 0} admin role(s)`);
      if (adminRoles && adminRoles.length > 0) {
        adminRoles.forEach(role => {
          console.log(`👑 Admin: ${role.user_id} (Active: ${role.is_active})`);
        });
      }
    }
    
    console.log('\n🚀 Setup complete! You can now access the admin dashboard.');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the setup
executeAdminSetup();