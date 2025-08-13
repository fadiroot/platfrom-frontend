// Admin Setup Script
// Run this script to set up admin users

const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAdminRole() {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return;
    }
    
    if (!user) {
      console.log('No user logged in. Please log in first.');
      return;
    }
    
    console.log('Current user:', user.email);
    
    // Set admin role for the current user
    const { data, error } = await supabase.rpc('set_user_admin_role', {
      user_email: user.email
    });
    
    if (error) {
      console.error('Error setting admin role:', error);
      return;
    }
    
    console.log('Admin role set successfully!');
    
    // Test if the user is now an admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    
    if (adminError) {
      console.error('Error checking admin status:', adminError);
      return;
    }
    
    console.log('Is admin:', isAdmin);
    
    // Test fetching exercises directly from table (instead of get_admin_exercises)
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .limit(5);
    
    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError);
      return;
    }
    
    console.log('Successfully fetched exercises:', exercises.length);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the setup
setupAdminRole(); 