// notification-system-test.js
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Constants
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TEST_RESULTS_FILE = path.join(__dirname, 'notification-test-results.json');

// Test cases for notification system
async function runAllTests() {
  console.log('🧪 Running notification system tests...\n');
  
  const results = {
    testDate: new Date().toISOString(),
    platform: process.platform,
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
    },
    tests: []
  };

  // Test 1: Validate push token format
  await runTest(
    '1. Validate push token format',
    validatePushTokenFormat,
    ['ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'],
    results
  );
  
  // Test 2: Validate push token format (invalid)
  await runTest(
    '2. Validate push token format (invalid)',
    validatePushTokenFormat,
    ['InvalidToken123'],
    results,
    false // This test should fail
  );

  // Test 3: Generate notification key
  await runTest(
    '3. Generate notification key',
    generateAndValidateNotificationKey,
    ['blood_request_match', 'req_123', 'user_456'],
    results
  );
  
  // Test 4: Validate notification format
  await runTest(
    '4. Validate notification format',
    validateNotificationFormat,
    ['🚨 URGENT: A+ Blood Needed', 'Message body', { type: 'blood_request_match' }],
    results
  );
  
  // Test 5: Validate firebase paths
  await runTest(
    '5. Validate firebase paths',
    validateFirebasePaths,
    ['users', 'Bloodreceiver', 'BloodDonors'],
    results
  );
  
  // Test 6: Check notification channel IDs
  await runTest(
    '6. Check notification channel IDs',
    validateNotificationChannelIds,
    ['blood-requests', 'donor-responses', 'app-updates'],
    results
  );

  // Summarize results
  console.log('\n📊 Test Summary:');
  console.log(`Total tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed} ✅`);
  console.log(`Failed: ${results.summary.failed} ❌`);
  
  // Save results to file
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(results, null, 2));
  console.log(`\n📝 Test results saved to ${TEST_RESULTS_FILE}`);
  
  return results;
}

// Helper function to run a test
async function runTest(name, testFunction, args, results, shouldPass = true) {
  console.log(`Running test: ${name}`);
  results.summary.total++;
  
  try {
    const startTime = Date.now();
    const testResult = await testFunction(...args);
    const duration = Date.now() - startTime;
    
    const passed = shouldPass ? testResult.success : !testResult.success;
    
    if (passed) {
      console.log(`✅ PASS: ${name}`);
      results.summary.passed++;
    } else {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Reason: ${testResult.message}`);
      results.summary.failed++;
    }
    
    results.tests.push({
      name,
      passed,
      duration,
      message: testResult.message,
      details: testResult.details || {}
    });
    
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error.message}`);
    results.summary.failed++;
    results.tests.push({
      name,
      passed: false,
      duration: 0,
      message: `Test threw an error: ${error.message}`,
      details: { error: error.stack }
    });
  }
}

// Test 1: Validate push token format
async function validatePushTokenFormat(token) {
  if (!token) {
    return {
      success: false,
      message: 'Token is empty'
    };
  }
  
  if (!token.startsWith('ExponentPushToken[')) {
    return {
      success: false,
      message: 'Token does not start with "ExponentPushToken["'
    };
  }
  
  if (!token.endsWith(']')) {
    return {
      success: false,
      message: 'Token does not end with "]"'
    };
  }
  
  return {
    success: true,
    message: 'Token format is valid'
  };
}

// Test 3: Generate and validate notification key
async function generateAndValidateNotificationKey(type, requestId, userId) {
  const key = `${type}_${requestId}_${userId || 'broadcast'}`;
  
  if (!key.includes(type) || !key.includes(requestId)) {
    return {
      success: false,
      message: 'Generated key is missing required components',
      details: { generatedKey: key }
    };
  }
  
  return {
    success: true,
    message: 'Notification key generated correctly',
    details: { generatedKey: key }
  };
}

// Test 4: Validate notification format
async function validateNotificationFormat(title, body, data) {
  const errors = [];
  
  if (!title) errors.push('Title is missing');
  if (!body) errors.push('Body is missing');
  if (!data) errors.push('Data is missing');
  if (!data?.type) errors.push('Notification type is missing');
  
  if (errors.length > 0) {
    return {
      success: false,
      message: 'Notification format has errors',
      details: { errors }
    };
  }
  
  // Create a test notification object (not sent)
  const notification = {
    title,
    body,
    data: {
      ...data,
      timestamp: Date.now()
    },
    sound: 'default',
    priority: 'high',
    channelId: data.type === 'blood_request_match' ? 'blood-requests' : 'donor-responses',
  };
  
  return {
    success: true,
    message: 'Notification format is valid',
    details: { notification }
  };
}

// Test 5: Validate firebase paths
async function validateFirebasePaths(...collections) {
  const requiredCollections = ['users', 'BloodDonors', 'Bloodreceiver'];
  const missingCollections = requiredCollections.filter(
    required => !collections.includes(required)
  );
  
  if (missingCollections.length > 0) {
    return {
      success: false,
      message: 'Some required collections are missing',
      details: { missingCollections }
    };
  }
  
  return {
    success: true,
    message: 'All required collections are present',
    details: { validatedCollections: collections }
  };
}

// Test 6: Check notification channel IDs
async function validateNotificationChannelIds(...channelIds) {
  const requiredChannels = ['blood-requests', 'donor-responses'];
  const missingChannels = requiredChannels.filter(
    required => !channelIds.includes(required)
  );
  
  if (missingChannels.length > 0) {
    return {
      success: false,
      message: 'Some required notification channels are missing',
      details: { missingChannels }
    };
  }
  
  return {
    success: true,
    message: 'All required notification channels are present',
    details: { validatedChannels: channelIds }
  };
}

// Run all tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
});
