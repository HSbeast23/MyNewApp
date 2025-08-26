// notification-diagnostics.js
// Utility script to diagnose notification issues - Node.js version

// This is a Node.js compatible version that simulates checks
// For actual notification diagnostics, run this code inside the React Native app

// Mock the required modules for Node.js compatibility
const Notifications = {
  getPermissionsAsync: async () => ({ status: 'granted' }),
  getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]' }),
  getNotificationChannelsAsync: async () => ([
    { id: 'blood-requests', name: 'Blood Requests', importance: 5 },
    { id: 'donor-responses', name: 'Donor Responses', importance: 4 }
  ])
};

const Platform = { OS: 'android' };
const Constants = { expoConfig: { extra: { eas: { projectId: 'mock-project-id' } } } };
const AsyncStorage = { 
  getItem: async () => 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]',
  setItem: async () => {}
};

// Mock Firebase
const auth = { currentUser: { uid: 'mock-user-id' } };
const db = {};

// Mock Firestore functions
function collection() {}
function query() {}
function where() {}
function getDocs() {
  return {
    empty: false, 
    docs: [
      { 
        id: 'doc1', 
        data: () => ({
          name: 'Test User',
          bloodGroup: 'B+',
          city: 'Chennai',
          pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]',
          isActive: true,
          emailVerified: true
        })
      }
    ]
  };
}
function doc() {}
function getDoc() {
  return {
    exists: () => true,
    data: () => ({
      name: 'Test User',
      bloodGroup: 'B+', 
      city: 'Chennai',
      pushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]'
    })
  };
}

// Mock notification manager
const notificationManager = {
  sendLocalNotification: async (title, body, data, channelId) => {
    console.log(`[MOCK] Sending local notification: ${title}`);
    return 'mock-notification-id';
  }
};

console.log('🔍 NOTIFICATION SYSTEM DIAGNOSTICS');
console.log('=================================');

async function checkPermissions() {
  console.log('📱 Checking notification permissions...');
  
  const { status } = await Notifications.getPermissionsAsync();
  console.log('- Permission status:', status);
  
  return status === 'granted';
}

async function checkPushToken() {
  console.log('🔑 Checking push token...');
  
  // First check in AsyncStorage
  const storedToken = await AsyncStorage.getItem('expoPushToken');
  console.log('- Token in AsyncStorage:', storedToken ? '✅ Found' : '❌ Not found');
  
  // Then get current token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    
    console.log('- Current Expo push token:', tokenData.data);
    console.log('- Token status:', tokenData.data ? '✅ Valid' : '❌ Invalid');
    
    return tokenData.data;
  } catch (error) {
    console.log('- Error getting token:', error.message);
    return null;
  }
}

async function checkNotificationChannels() {
  if (Platform.OS !== 'android') {
    console.log('📢 Notification channels: N/A (not on Android)');
    return true;
  }
  
  console.log('📢 Checking notification channels...');
  
  try {
    const channels = await Notifications.getNotificationChannelsAsync();
    console.log('- Number of channels:', channels.length);
    
    channels.forEach(channel => {
      console.log(`- Channel "${channel.name}": ${channel.importance >= 4 ? '✅ High priority' : '⚠️ Low priority'}`);
    });
    
    // Check for required channels
    const requiredChannels = ['blood-requests', 'donor-responses'];
    const missingChannels = requiredChannels.filter(
      required => !channels.some(c => c.id === required)
    );
    
    if (missingChannels.length > 0) {
      console.log('⚠️ Missing channels:', missingChannels.join(', '));
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('- Error checking channels:', error.message);
    return false;
  }
}

async function checkUserProfile() {
  console.log('👤 Checking user profile...');
  
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.log('- ❌ No user logged in');
    return false;
  }
  
  console.log('- User ID:', currentUser.uid);
  
  try {
    // Check in users collection
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('- User found in users collection');
      console.log('- Has push token:', userData.pushToken ? '✅ Yes' : '❌ No');
      console.log('- Email verified:', userData.emailVerified ? '✅ Yes' : '❌ No');
      console.log('- User role:', userData.isAdmin ? 'Admin' : 'Regular user');
      
      if (!userData.pushToken) {
        console.log('⚠️ User does not have a push token stored');
      }
    } else {
      console.log('⚠️ User not found in users collection');
    }
    
    // Check if user is a donor
    const donorQuery = query(
      collection(db, 'BloodDonors'),
      where('uid', '==', currentUser.uid)
    );
    
    const donorSnapshot = await getDocs(donorQuery);
    if (!donorSnapshot.empty) {
      const donorData = donorSnapshot.docs[0].data();
      console.log('- User is a registered donor');
      console.log('- Blood Group:', donorData.bloodGroup || 'Not specified');
      console.log('- City:', donorData.city || 'Not specified');
      console.log('- Has donor push token:', donorData.pushToken || donorData.expoPushToken ? '✅ Yes' : '❌ No');
      console.log('- Donor status:', donorData.isActive ? '✅ Active' : '❌ Inactive');
    } else {
      console.log('- User is not registered as a donor');
    }
    
    // Check if user has any blood requests
    const requestQuery = query(
      collection(db, 'Bloodreceiver'),
      where('uid', '==', currentUser.uid)
    );
    
    const requestSnapshot = await getDocs(requestQuery);
    if (!requestSnapshot.empty) {
      console.log('- User has submitted blood requests:', requestSnapshot.size);
      
      // Check the most recent request
      const latestRequest = requestSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        })[0];
      
      if (latestRequest) {
        console.log('- Latest request:', latestRequest.id);
        console.log('- Blood Group:', latestRequest.bloodGroup);
        console.log('- City:', latestRequest.city);
        console.log('- Status:', latestRequest.status);
        console.log('- Has responses:', (latestRequest.responses?.length || 0) > 0 ? '✅ Yes' : '❌ No');
      }
    } else {
      console.log('- User has not submitted any blood requests');
    }
    
    return true;
  } catch (error) {
    console.log('- Error checking user profile:', error.message);
    return false;
  }
}

async function testLocalNotification() {
  console.log('📱 Testing local notification...');
  
  try {
    const identifier = await notificationManager.sendLocalNotification(
      '🔍 Diagnostic Test',
      'This is a test notification from the diagnostic tool.',
      { type: 'diagnostic_test' },
      'app-updates'
    );
    
    console.log('- Local notification sent with ID:', identifier);
    return true;
  } catch (error) {
    console.log('- Error sending test notification:', error.message);
    return false;
  }
}

// Run all diagnostic tests
async function runDiagnostics() {
  console.log('⏳ Starting notification system diagnostics (SIMULATION)...');
  
  const permissionsOk = await checkPermissions();
  const token = await checkPushToken();
  const channelsOk = await checkNotificationChannels();
  const userOk = await checkUserProfile();
  const notificationOk = await testLocalNotification();
  
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  console.log('- Notification permissions:', permissionsOk ? '✅ OK' : '❌ Issue');
  console.log('- Push token:', token ? '✅ OK' : '❌ Issue');
  console.log('- Notification channels:', channelsOk ? '✅ OK' : '❌ Issue');
  console.log('- User profile:', userOk ? '✅ OK' : '❌ Issue');
  console.log('- Test notification:', notificationOk ? '✅ OK' : '❌ Issue');
  
  const overallStatus = permissionsOk && token && channelsOk && userOk && notificationOk;
  console.log('\nOVERALL STATUS:', overallStatus ? '✅ SYSTEM OK' : '❌ ISSUES DETECTED');
  
  if (!overallStatus) {
    console.log('\n🛠️ RECOMMENDATIONS:');
    
    if (!permissionsOk) {
      console.log('- Request notification permissions again');
      console.log('  - Go to Settings > Apps > YourApp > Notifications');
      console.log('  - Enable notifications for the app');
    }
    
    if (!token) {
      console.log('- Reinstall the app or clear app data');
      console.log('- Check if Expo Push service is accessible');
    }
    
    if (!channelsOk) {
      console.log('- Reinitialize notification channels');
      console.log('- Restart the app');
    }
    
    if (!userOk) {
      console.log('- Update user profile to include push token');
      console.log('- Re-register as a donor if applicable');
    }
  }
  
  return overallStatus;
}

// Execute diagnostics
runDiagnostics().then(result => {
  console.log('\n🏁 Diagnostics complete!');
  console.log('\n⚠️ NOTE: This is just a simulation. To run real diagnostics,');
  console.log('copy this code into your React Native app and run it there.');
});

// Export for CommonJS
module.exports = {
  runDiagnostics,
  checkPermissions,
  checkPushToken,
  checkNotificationChannels,
  checkUserProfile,
  testLocalNotification
};
