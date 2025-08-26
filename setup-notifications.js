// setup-notifications.js
// Utility script to configure notifications and test setup
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './src/services/auth';
import notificationManager from './src/services/notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Function to setup notification channels on Android
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    console.log('🔔 Setting up Android notification channels');
    
    // Blood request notifications channel
    await Notifications.setNotificationChannelAsync('blood-requests', {
      name: 'Blood Request Alerts',
      description: 'Urgent blood request matches in your area',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF0000',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
    
    // Donor response notifications
    await Notifications.setNotificationChannelAsync('donor-responses', {
      name: 'Donor Responses',
      description: 'Responses from donors for your blood requests',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00FF00',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
    
    // App notifications
    await Notifications.setNotificationChannelAsync('app-updates', {
      name: 'App Updates',
      description: 'General app notifications and updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      enableVibrate: false,
      showBadge: true,
    });
  }
}

// Get Expo push token
export async function getExpoPushToken() {
  try {
    // Check for device compatibility
    if (!Device.isDevice) {
      console.log('⚠️ Must use physical device for push notifications');
      return null;
    }
    
    // Check permission first
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('⚠️ Failed to get push notification permission');
      return null;
    }
    
    // Get token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    
    console.log('📱 Push token:', tokenData.data);
    
    // Store token in AsyncStorage for quick access
    await AsyncStorage.setItem('expoPushToken', tokenData.data);
    
    return tokenData.data;
  } catch (error) {
    console.log('❌ Error getting push token:', error);
    return null;
  }
}

// Initialize notification system for current user
export async function initializeNotificationsForUser() {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('⚠️ No user logged in');
      return false;
    }
    
    // Get token
    const token = await getExpoPushToken();
    
    if (!token) {
      console.log('⚠️ Could not get push token');
      return false;
    }
    
    // Initialize with notification manager
    const success = await notificationManager.initialize(currentUser.uid);
    
    if (success) {
      console.log('✅ Notifications initialized successfully');
      return true;
    } else {
      console.log('❌ Failed to initialize notifications');
      return false;
    }
  } catch (error) {
    console.log('❌ Error initializing notifications:', error);
    return false;
  }
}

// Send a test notification
export async function sendTestNotification() {
  try {
    if (!auth.currentUser) {
      console.log('⚠️ No user logged in');
      return false;
    }
    
    // Local notification test
    const localResult = await notificationManager.sendLocalNotification(
      '🩸 Local Notification Test',
      'This is a test of local notifications. You should see this message immediately.',
      { type: 'test_local' },
      'app-updates'
    );
    
    console.log('📱 Local notification sent:', localResult);
    
    // Push notification test
    const token = await AsyncStorage.getItem('expoPushToken');
    
    if (token) {
      const pushResult = await notificationManager.sendPushNotification(
        token,
        '🩸 Push Notification Test',
        'This is a test of push notifications. You should receive this as a push notification.',
        { type: 'test_push' }
      );
      
      console.log('📱 Push notification sent:', pushResult);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error sending test notification:', error);
    return false;
  }
}

// Debug notification setup
export async function debugNotificationSetup() {
  try {
    const status = await Notifications.getPermissionsAsync();
    const token = await AsyncStorage.getItem('expoPushToken');
    const hasToken = !!token;
    
    console.log('🔍 NOTIFICATION DEBUG INFO:');
    console.log('- Permission status:', status.status);
    console.log('- Has saved token:', hasToken);
    console.log('- Token (if available):', token || 'Not available');
    
    if (Platform.OS === 'android') {
      const channels = await Notifications.getNotificationChannelsAsync();
      console.log('- Notification channels:', channels.map(c => c.name));
    }
    
    return {
      permissionStatus: status.status,
      hasToken,
      token,
    };
  } catch (error) {
    console.log('❌ Error debugging notification setup:', error);
    return null;
  }
}

// Run the setup automatically when imported
(async () => {
  await setupNotificationChannels();
  console.log('✅ Notification channels set up');
})();

// Export the notification manager as the default export for ease of use
export default notificationManager;
