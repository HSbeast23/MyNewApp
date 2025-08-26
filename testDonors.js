// Test script to check if donors exist in database
const { collection, query, where, getDocs } = require('firebase/firestore');

// Simulated function to test donor finding
async function testFindDonors(db) {
  try {
    console.log('🔍 Testing donor database query...');
    
    // Test blood group A+ in Salem (from your logs)
    const bloodGroup = 'A+';
    const city = 'Salem';
    
    console.log(`Looking for ${bloodGroup} donors in ${city}...`);
    
    // First query by blood group only (simple index)
    const donorsQuery = query(
      collection(db, 'users'),
      where('bloodGroup', '==', bloodGroup)
    );

    const donorsSnapshot = await getDocs(donorsQuery);
    console.log(`Found ${donorsSnapshot.size} users with blood group ${bloodGroup}`);
    
    const donors = [];
    donorsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`User: ${data.name}, City: ${data.city}, PushToken: ${data.pushToken ? 'YES' : 'NO'}, IsAdmin: ${data.isAdmin ? 'YES' : 'NO'}`);
      
      // Filter by city and other conditions in memory
      if (data.city === city && 
          data.pushToken && 
          !data.isAdmin) {
        donors.push({
          id: doc.id,
          name: data.name,
          city: data.city,
          bloodGroup: data.bloodGroup,
          pushToken: data.pushToken
        });
      }
    });

    console.log(`✅ Final matching donors: ${donors.length}`);
    donors.forEach(donor => {
      console.log(`  - ${donor.name} (${donor.city})`);
    });
    
    return donors;
  } catch (error) {
    console.log('❌ Error finding donors:', error);
    return [];
  }
}

console.log('This is a test script to debug donor matching. Run this in the app context.');
