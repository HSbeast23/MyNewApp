// src/services/notifications/diagnostics.js
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Device from 'expo-device';
import * as Application from 'expo-application';
import notificationManager from './index';

/**
 * Gets device information useful for notification diagnostics
 * @returns {Promise<Object>} Device information
 */
export const getDeviceInfo = async () => {
  try {
    return {
      deviceName: Device.deviceName || 'Unknown',
      deviceType: Device.deviceType === Device.DeviceType.PHONE ? 'Phone' : 
                 Device.deviceType === Device.DeviceType.TABLET ? 'Tablet' : 'Unknown',
      platform: Platform.OS,
      osVersion: Platform.Version,
      isDevice: Device.isDevice,
      brand: Device.brand || 'Unknown',
      modelName: Device.modelName || 'Unknown',
      appVersion: Application.nativeApplicationVersion || 'Unknown',
      buildVersion: Application.nativeBuildVersion || 'Unknown',
      isExpoGo: Constants.appOwnership === 'expo',
      projectId: Constants.expoConfig?.extra?.eas?.projectId || 'Unknown',
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      error: error.message,
      platform: Platform.OS,
    };
  }
};

/**
 * Gets notification permission status and settings
 * @returns {Promise<Object>} Notification permission status
 */
export const getNotificationStatus = async () => {
  try {
    const settings = await Notifications.getPermissionsAsync();
    
    // Check if expo push token can be generated
    let tokenStatus = 'unknown';
    try {
      const tokenData = await notificationManager.getExpoPushToken();
      tokenStatus = tokenData ? 'available' : 'unavailable';
    } catch (error) {
      tokenStatus = `error: ${error.message}`;
    }
    
    return {
      enabled: settings.granted,
      authorizationStatus: settings.status,
      canAskAgain: settings.canAskAgain,
      expoPushToken: tokenStatus,
      androidSettings: Platform.OS === 'android' ? {
        allowAlert: settings.android?.allowAlert || false,
        allowSound: settings.android?.allowSound || false,
        allowBadge: settings.android?.allowBadge || false,
        importance: settings.android?.importance || 'unknown',
      } : 'not applicable',
      iosSettings: Platform.OS === 'ios' ? {
        allowAlert: settings.ios?.allowAlert || false,
        allowSound: settings.ios?.allowSound || false,
        allowBadge: settings.ios?.allowBadge || false,
        allowDisplayInNotificationCenter: settings.ios?.allowDisplayInNotificationCenter || false,
      } : 'not applicable',
    };
  } catch (error) {
    console.error('Error getting notification status:', error);
    return {
      error: error.message,
      enabled: false,
    };
  }
};

/**
 * Sends a test notification
 * @returns {Promise<Object>} Test result
 */
export const testNotification = async () => {
  try {
    // First try to send a local notification
    const localId = await notificationManager.sendLocalNotification(
      '🔔 Test Notification',
      'This is a test notification from the diagnostics tool',
      {
        type: 'test',
        timestamp: Date.now(),
      },
      Platform.OS === 'android' ? 'app-updates' : 'default'
    );
    
    // Try to get the expo push token
    let pushStatus = 'not attempted';
    let pushToken = null;
    
    try {
      pushToken = await notificationManager.getExpoPushToken();
      
      if (pushToken) {
        // Try to send a push notification to self (may not work in Expo Go)
        const pushResult = await notificationManager.sendPushNotification(
          pushToken,
          '🚀 Push Test Notification',
          'This is a test push notification via Expo',
          {
            type: 'test_push',
            timestamp: Date.now(),
          }
        );
        
        pushStatus = pushResult ? 'success' : 'failed';
      } else {
        pushStatus = 'no token available';
      }
    } catch (error) {
      pushStatus = `error: ${error.message}`;
    }
    
    return {
      local: {
        success: !!localId,
        identifier: localId || null,
      },
      push: {
        success: pushStatus === 'success',
        status: pushStatus,
        token: pushToken ? `${pushToken.substring(0, 10)}...` : null,
      },
    };
  } catch (error) {
    console.error('Error running notification test:', error);
    return {
      error: error.message,
      local: { success: false },
      push: { success: false },
    };
  }
};

export default {
  getDeviceInfo,
  getNotificationStatus,
  testNotification,
};
