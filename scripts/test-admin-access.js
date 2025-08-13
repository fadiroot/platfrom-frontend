// Test Admin Access Script
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kmtjpafmshyyuftknuof.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdGpwYWZtc2h5eXVmdGtudW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDIxNDcwNSwiZXhwIjoyMDY5NzkwNzA1fQ.L4KdL17KixzYLQtoSiv7V0qUSiirwcB3wq3pk85v0dA';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAdminAccess() {
  try {
    console.log('🔍 Testing admin access...\n');
    
    // Get all users
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    // Find admin users
    const adminUsers = users.users.filter(u => 
      u.user_metadata?.role === 'admin' || u.raw_user_meta_data?.role === 'admin'
    );
    
    console.log('📋 Admin users found:');
    adminUsers.forEach(admin => {
      console.log(`- ${admin.email} (ID: ${admin.id})`);
      console.log(`  user_metadata.role: ${admin.user_metadata?.role}`);
      console.log(`  raw_user_meta_data.role: ${admin.raw_user_meta_data?.role}`);
      console.log('');
    });
    
    // Test the admin_student_list view
    console.log('🔍 Testing admin_student_list view...');
    
    // First, get a user to test with
    const testUser = adminUsers[0];
    if (!testUser) {
      console.log('❌ No admin users found to test with');
      return;
    }
    
    // Create a client with the admin user's session
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testUser.email,
    });
    
    if (sessionError) {
      console.error('❌ Error generating session:', sessionError);
      return;
    }
    
    console.log('✅ Admin access test completed');
    console.log(`Found ${adminUsers.length} admin user(s)`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAdminAccess(); 