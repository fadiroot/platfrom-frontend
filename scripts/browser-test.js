// Browser test for the new API
// Copy and paste this into your browser console on the student subject list page

console.log('🧪 Testing new API approach...');

// Test the new API function
async function testNewAPI() {
  try {
    // Get the current user's level_id from the auth state
    const userLevelId = 'a29bfef6-5b8b-42fd-932b-05943...'; // Replace with actual Techniques level ID
    
    console.log('1️⃣ Testing getSubjectsByLevel with Techniques level ID:', userLevelId);
    
    // This is what the new API does
    const { data, error } = await supabase
      .from('subjects_with_all_levels')
      .select('*')
      .contains('level_ids', [userLevelId])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`✅ Found ${data?.length || 0} subjects for Techniques level:`);
    data?.forEach((subject, index) => {
      console.log(`   ${index + 1}. "${subject.title}" (Level IDs: [${subject.level_ids?.join(', ')}])`);
    });

    // Check if Informatique is found
    const informatiqueFound = data?.some(subject => 
      subject.title.toLowerCase().includes('informatique')
    );
    console.log(`\n   ${informatiqueFound ? '✅' : '❌'} Informatique ${informatiqueFound ? 'IS' : 'IS NOT'} found for Techniques level`);

    // Also test with the Expérimentales level ID
    const expLevelId = '626eab20-f703-4335-960c-537b...'; // Replace with actual Expérimentales level ID
    console.log('\n2️⃣ Testing with Expérimentales level ID:', expLevelId);
    
    const { data: expData, error: expError } = await supabase
      .from('subjects_with_all_levels')
      .select('*')
      .contains('level_ids', [expLevelId])
      .order('created_at', { ascending: true });

    if (expError) {
      console.error('❌ Error:', expError.message);
      return;
    }

    console.log(`✅ Found ${expData?.length || 0} subjects for Expérimentales level:`);
    expData?.forEach((subject, index) => {
      console.log(`   ${index + 1}. "${subject.title}" (Level IDs: [${subject.level_ids?.join(', ')}])`);
    });

    const informatiqueFoundExp = expData?.some(subject => 
      subject.title.toLowerCase().includes('informatique')
    );
    console.log(`\n   ${informatiqueFoundExp ? '✅' : '❌'} Informatique ${informatiqueFoundExp ? 'IS' : 'IS NOT'} found for Expérimentales level`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNewAPI();

