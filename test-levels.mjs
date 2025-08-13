import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables manually
let supabaseUrl, supabaseKey;
try {
  const envContent = readFileSync('.env', 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1];
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1];
    }
  }
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
}

// Variables are already declared above

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLevels() {
  try {
    console.log('🔍 Testing levels table...');
    
    // Test direct query to levels table
    const { data: levels, error } = await supabase
      .from('levels')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error querying levels:', error.message);
      return;
    }
    
    console.log(`✅ Found ${levels?.length || 0} levels in database`);
    
    if (levels && levels.length > 0) {
      console.log('\n📋 Levels:');
      levels.forEach((level, index) => {
        console.log(`${index + 1}. ${level.title} (ID: ${level.id})`);
        if (level.description) {
          console.log(`   Description: ${level.description}`);
        }
      });
    } else {
      console.log('\n⚠️  No levels found in database!');
      console.log('\n💡 You need to create some levels first.');
      console.log('   You can do this through the admin dashboard at /admin/levels');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testLevels();