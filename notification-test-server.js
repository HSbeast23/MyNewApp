// notification-test-server.js
const fetch = require('node-fetch');
const readline = require('readline');

// Constants
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask user for input
 * @param {string} question - The question to ask
 * @returns {Promise<string>} - The user's answer
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Send a push notification via Expo Push API
 * @param {string} expoPushToken - The Expo push token to send to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send
 * @returns {Promise<Object>} - The response from the API
 */
async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken) {
    console.error('⚠️ No push token provided');
    return { error: 'No push token provided' };
  }
  
  // Validate token format
  if (!expoPushToken.startsWith('ExponentPushToken')) {
    console.error('⚠️ Invalid Expo push token format:', expoPushToken);
    return { error: 'Invalid Expo push token format' };
  }

  try {
    console.log(`📤 Sending push notification to token: ${expoPushToken.substring(0, 20)}...`);
    
    // Instagram-style notification with high priority and immediate delivery
    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        timestamp: Date.now(),
        urgent: true
      },
      priority: 'high',
      channelId: data.type === 'blood_request_match' ? 'blood-requests' : 'donor-responses',
      badge: 1,
      ttl: 3600, // 1 hour
      // Android specific settings for immediate delivery
      android: {
        priority: 'high',
        sound: 'default',
        vibrate: [0, 250, 250, 250],
        sticky: false,
        channelId: data.type === 'blood_request_match' ? 'blood-requests' : 'donor-responses'
      },
      // iOS specific settings for immediate delivery
      ios: {
        sound: 'default',
        badge: 1,
        _displayInForeground: true
      }
    };

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.data && result.data[0] && result.data[0].status === 'ok') {
      console.log('✅ Push notification sent successfully');
      return { success: true, details: result.data[0] };
    } else {
      console.log('❌ Push notification failed:', result);
      return { error: 'Push notification failed', details: result };
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return { error: error.message };
  }
}

/**
 * Main function to run the notification test server
 */
async function runNotificationTest() {
  console.log('🔔 Welcome to the Blood-Link Notification Test Server 🔔');
  console.log('------------------------------------------------------');
  console.log('This tool helps test push notifications without the app.');
  console.log('You need an Expo push token to send notifications.');
  console.log('You can find this in the Notification Diagnostics screen in the app.');
  console.log('------------------------------------------------------\n');
  
  try {
    // Get push token
    const pushToken = await askQuestion('Enter Expo push token: ');
    if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
      console.error('⚠️ Invalid token format. It should start with "ExponentPushToken"');
      rl.close();
      return;
    }
    
    while (true) {
      console.log('\n🚀 Choose notification type:');
      console.log('1. Blood Request Match (High priority)');
      console.log('2. Donor Response (High priority)');
      console.log('3. General App Update (Normal priority)');
      console.log('4. Custom Notification');
      console.log('0. Exit');
      
      const choice = await askQuestion('Enter your choice (0-4): ');
      
      if (choice === '0') {
        console.log('👋 Exiting...');
        break;
      }
      
      let title, body, data = {};
      
      switch (choice) {
        case '1':
          title = '🚨 URGENT: A+ Blood Needed in Chennai';
          body = 'John urgently needs A+ blood for surgery. NEEDED IMMEDIATELY. Can you help save a life today?';
          data = {
            type: 'blood_request_match',
            requestId: `test_${Date.now()}`,
            bloodGroup: 'A+',
            city: 'Chennai',
            receiverName: 'John',
            requiredDateTime: 'ASAP',
            purpose: 'Surgery',
            hospital: 'Apollo Hospital',
            mobile: '+91XXXXXXXXXX',
            screen: 'Notifications',
            action: 'view_request',
            urgent: true,
            timestamp: Date.now()
          };
          break;
          
        case '2':
          title = '✅ Ravi ACCEPTED!';
          body = 'Great news! Ravi accepted your A+ blood request in Chennai. Contact: +91XXXXXXXXXX';
          data = {
            type: 'donor_response',
            requestId: `test_${Date.now()}`,
            donorName: 'Ravi',
            status: 'accepted',
            bloodGroup: 'A+',
            city: 'Chennai',
            donorMobile: '+91XXXXXXXXXX',
            screen: 'Notifications',
            action: 'view_response',
            urgent: true,
            timestamp: Date.now()
          };
          break;
          
        case '3':
          title = '📱 Blood-Link App Update';
          body = 'We\'ve added new features to make donating and requesting blood easier than ever!';
          data = {
            type: 'app_update',
            screen: 'Home',
            action: 'view_updates',
            urgent: false,
            timestamp: Date.now()
          };
          break;
          
        case '4':
          title = await askQuestion('Enter notification title: ');
          body = await askQuestion('Enter notification body: ');
          const dataType = await askQuestion('Enter data type (e.g., test, custom): ');
          data = {
            type: dataType,
            screen: 'Notifications',
            timestamp: Date.now()
          };
          break;
          
        default:
          console.log('⚠️ Invalid choice. Try again.');
          continue;
      }
      
      console.log(`\n📤 Sending notification...`);
      console.log(`Title: ${title}`);
      console.log(`Body: ${body}`);
      console.log(`Data: ${JSON.stringify(data, null, 2)}`);
      
      const confirm = await askQuestion('\nSend this notification? (y/n): ');
      if (confirm.toLowerCase() === 'y') {
        const result = await sendPushNotification(pushToken, title, body, data);
        console.log('\nResult:', JSON.stringify(result, null, 2));
      } else {
        console.log('\n❌ Notification cancelled');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
  }
}

// Run the notification test
runNotificationTest();
