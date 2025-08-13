// Admin Setup Script (ES Module version)
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://kmtjpafmshyyuftknuof.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdGpwYWZtc2h5eXVmdGtudW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTQ3MDUsImV4cCI6MjA2OTc5MDcwNX0.PMltpNc-jsiWOvzpmdAbX5axFYt_Lv2gXk3GFOpn5sQ';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdGpwYWZtc2h5eXVmdGtudW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIxNDcwNSwiZXhwIjoyMDY5NzkwNzA1fQ.L4KdL17KixzYLQtoSiv7V0qUSiirwcB3wq3pk85v0dA';

// Create admin client with service role
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create regular client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdminRole() {
  try {
    console.log('🔍 Checking for existing users...');
    
    // List all users using admin client
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found. Please register a user first.');
      console.log('👉 Go to http://localhost:4001/register to create an account.');
      return;
    }
    
    console.log(`📋 Found ${users.length} user(s):`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    // Take the first user and make them admin
    const firstUser = users[0];
    console.log(`\n🔧 Setting admin role for: ${firstUser.email}`);
    
    // Insert admin role into user_roles table
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: firstUser.id,
        role: 'admin',
        is_active: true,
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,role'
      });
    
    if (error) {
      console.error('❌ Error setting admin role:', error);
      return;
    }
    
    console.log('✅ Admin role set successfully!');
    console.log(`👑 ${firstUser.email} is now an admin.`);
    console.log('\n🚀 You can now access the admin dashboard at: http://localhost:4001/admin');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the setup
setupAdminRole();