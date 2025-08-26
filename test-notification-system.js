// test-notification-system.js
// Script for testing the notification system

import notificationManager from './src/services/notifications';
import { auth } from './src/services/auth';

// Test data
const testRequestData = {
  id: 'TEST_REQUEST_' + Date.now(),
  bloodGroup: 'O+',
  city: 'Chennai',
  name: 'Test User',
  receiverName: 'Test User',
  requiredDateTime: 'ASAP',
  purpose: 'Testing System',
  hospital: 'Test Hospital',
  mobile: '1234567890',
  bloodUnits: '1'
};

console.log('🧪 NOTIFICATION SYSTEM TEST');
console.log('--------------------------');
console.log('This script will test the notification system functionality');
console.log('');

// 1. Test notification deduplication
async function testDeduplication() {
  console.log('🔍 TEST 1: Notification Deduplication');
  console.log('Sending same notification 3 times in rapid succession...');
  
  console.log('📤 Sending notification attempt 1...');
  await notificationManager.notifyMatchingDonors(testRequestData);
  
  console.log('📤 Sending notification attempt 2 (should be blocked)...');
  await notificationManager.notifyMatchingDonors(testRequestData);
  
  console.log('📤 Sending notification attempt 3 (should be blocked)...');
  await notificationManager.notifyMatchingDonors(testRequestData);
  
  console.log('✅ Deduplication test completed!');
  console.log('');
}

// 2. Test sending a local notification
async function testLocalNotification() {
  console.log('🔍 TEST 2: Local Notification');
  console.log('Sending a local notification...');
  
  const notificationId = await notificationManager.sendLocalNotification(
    '🧪 Test Local Notification',
    'This is a test local notification from the notification system.',
    { type: 'test' },
    'blood-requests'
  );
  
  console.log(`✅ Local notification sent with ID: ${notificationId}`);
  console.log('');
}

// 3. Test donor response notification
async function testDonorResponse() {
  console.log('🔍 TEST 3: Donor Response Notification');
  console.log('Simulating a donor response notification...');
  
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.log('❌ No user logged in, skipping this test');
    return;
  }
  
  const responseData = {
    donorName: 'Test Donor',
    status: 'accepted',
    donorMobile: '9876543210'
  };
  
  await notificationManager.notifyRequesterOfDonorResponse(
    currentUser.uid,
    responseData,
    testRequestData
  );
  
  console.log('✅ Donor response notification test completed!');
  console.log('');
}

// Run all tests in sequence
async function runAllTests() {
  try {
    console.log('⏳ Starting notification system tests...');
    
    await testDeduplication();
    await testLocalNotification();
    await testDonorResponse();
    
    console.log('✅ All tests completed!');
    console.log('Check your device for notifications and the console for detailed results.');
  } catch (error) {
    console.log('❌ Test error:', error);
  }
}

// Execute the tests
runAllTests();

// For debugging
export default {
  testDeduplication,
  testLocalNotification, 
  testDonorResponse,
  runAllTests
};
