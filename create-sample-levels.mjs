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
    if (line.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseKey = line.split('=')[1];
    }
  }
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample levels to create
const sampleLevels = [
  {
    title: 'Bac 1 Informatique',
    description: 'Première année de licence en informatique - Bases de la programmation et algorithmique'
  },
  {
    title: 'Bac 2 Informatique', 
    description: 'Deuxième année de licence en informatique - Structures de données et programmation orientée objet'
  },
  {
    title: 'Bac 3 Informatique',
    description: 'Troisième année de licence en informatique - Développement avancé et bases de données'
  },
  {
    title: 'Master 1 Informatique',
    description: 'Première année de master en informatique - Spécialisation et projets avancés'
  },
  {
    title: 'Master 2 Informatique',
    description: 'Deuxième année de master en informatique - Recherche et développement expert'
  }
];

async function createSampleLevels() {
  try {
    console.log('🚀 Creating sample levels...');
    
    // Check if levels already exist
    const { data: existingLevels, error: checkError } = await supabase
      .from('levels')
      .select('*');
    
    if (checkError) {
      console.error('❌ Error checking existing levels:', checkError.message);
      return;
    }
    
    if (existingLevels && existingLevels.length > 0) {
      console.log(`⚠️  Found ${existingLevels.length} existing levels. Skipping creation.`);
      console.log('\n📋 Existing levels:');
      existingLevels.forEach((level, index) => {
        console.log(`${index + 1}. ${level.title}`);
      });
      return;
    }
    
    // Create the sample levels
    const { data: createdLevels, error: createError } = await supabase
      .from('levels')
      .insert(sampleLevels)
      .select();
    
    if (createError) {
      console.error('❌ Error creating levels:', createError.message);
      return;
    }
    
    console.log(`✅ Successfully created ${createdLevels?.length || 0} levels!`);
    
    if (createdLevels && createdLevels.length > 0) {
      console.log('\n📋 Created levels:');
      createdLevels.forEach((level, index) => {
        console.log(`${index + 1}. ${level.title} (ID: ${level.id})`);
        if (level.description) {
          console.log(`   Description: ${level.description}`);
        }
      });
    }
    
    console.log('\n🎉 Levels are now available for sign-up!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the creation
createSampleLevels();