// Simple Admin Setup - Direct SQL execution
import { createClient } from '@supabase/supabase-js';

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

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin access...');
    
    // Since we can't create tables via API, let's try a different approach
    // We'll use the auth metadata approach which is simpler
    
    const adminUserId = '1d106cd0-c73d-463a-9fea-c9a19676112e'; // fadi.romdhan@horizon-tech.tn
    
    console.log('👑 Setting admin role in user metadata...');
    
    // Update user metadata to include admin role
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      adminUserId,
      {
        user_metadata: { role: 'admin' }
      }
    );
    
    if (error) {
      console.error('❌ Error setting admin role:', error);
      return;
    }
    
    console.log('✅ Admin role set in user metadata!');
    console.log('👤 User updated:', data.user.email);
    console.log('🔑 Role:', data.user.user_metadata?.role);
    
    console.log('\n🚀 Setup complete!');
    console.log('📝 Note: The admin check will now look for user.user_metadata.role === "admin"');
    console.log('🌐 You can now access the admin dashboard at: http://localhost:4001/admin');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the setup
setupAdmin();