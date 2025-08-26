/**
 * Clean, unified notification service for Blood Link app
 * Handles push notifications using Firebase Cloud Messaging (FCM)
 */

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './auth';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

class NotificationService {
  constructor() {
    this.initialized = false;
    this.notificationListeners = [];
    this._setupNotificationChannels();
  }

  /**
   * Initialize notification channels for Android
   * @private
   */
  async _setupNotificationChannels() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('blood-requests', {
        name: 'Blood Request Matches',
        description: 'Notifications for matching blood requests',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('donor-responses', {
        name: 'Donor Responses',
        description: 'Notifications when donors respond to your requests',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00FF00',
        sound: 'default',
      });
    }
  }

  /**
   * Initialize the notification service for a user
   * @param {string} userId - Current user ID
   * @returns {Promise<boolean>} Success status
   */
  async initialize(userId) {
    try {
      console.log('Initializing notification service for user:', userId);
      
      // Even if already initialized, we'll check permissions again to be sure
      if (this.initialized) {
        console.log('Notification service already initialized, refreshing setup');
      }

      // Set up notification handler before anything else
      Notifications.setNotificationHandler({
        handleNotification: async () => {
          console.log('Handling incoming notification');
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          };
        },
      });

      // Request notification permissions
      console.log('Requesting notification permissions');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {}, // Default permissions for Android
      });

      console.log('Permission request result:', status);
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Get and store push token if on a physical device
      if (Device.isDevice) {
        console.log('Device is physical, getting push token');
        const token = await this.getExpoPushToken();
        
        if (token && userId) {
          console.log(`Got token: ${token.substring(0, 10)}... for user: ${userId}`);
          await this.savePushToken(userId, token);
          console.log(`Push token saved for user: ${userId}`);
        } else {
          console.log('No token received or no userId provided');
        }
      } else {
        console.log('Not a physical device, skipping push token registration');
      }

      // Setup notification channels again just to be sure
      await this._setupNotificationChannels();
      
      // Test local notification to verify everything is working
      const testId = await this.sendLocalNotification(
        'Notification Service Initialized',
        'You are now ready to receive notifications.',
        { type: 'initialization' },
        'default'
      );
      console.log('Sent test notification:', testId);

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  /**
   * Get Expo Push Token for the device
   * @returns {Promise<string|null>} Push token
   */
  async getExpoPushToken() {
    try {
      // Check if this is a physical device
      if (!Device.isDevice) {
        console.log('Push tokens can only be generated on physical devices');
        return null;
      }
      
      // Get project ID from Expo config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      console.log('Using project ID for push token:', projectId);
      
      // Get token with proper configuration
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      console.log('Successfully obtained push token');
      return tokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Save push token to the user's document
   * @param {string} userId - User ID
   * @param {string} token - Push token
   */
  async savePushToken(userId, token) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        pushToken: token,
        pushTokenUpdatedAt: new Date()
      });
      
      // Check if user is a donor, update token there too
      const donorQuery = query(
        collection(db, 'BloodDonors'),
        where('uid', '==', userId)
      );
      
      const donorSnapshot = await getDocs(donorQuery);
      if (!donorSnapshot.empty) {
        await updateDoc(doc(db, 'BloodDonors', donorSnapshot.docs[0].id), {
          pushToken: token,
          pushTokenUpdatedAt: new Date()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error saving push token:', error);
      return false;
    }
  }

  /**
   * Send a local notification (for immediate display)
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @param {string} channelId - Android channel ID
   * @returns {Promise<string|null>} Notification ID
   */
  async sendLocalNotification(title, body, data = {}, channelId = 'default') {
    try {
      console.log(`Sending local notification: ${title}`);
      
      // Add timestamp to ensure uniqueness
      const enhancedData = {
        ...data,
        _timestamp: new Date().getTime(),
      };
      
      // For Android, ensure we have appropriate channel
      if (Platform.OS === 'android' && channelId !== 'default' && 
          channelId !== 'blood-requests' && channelId !== 'donor-responses') {
        console.log(`Creating channel for ${channelId}`);
        await Notifications.setNotificationChannelAsync(channelId, {
          name: channelId,
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
        });
      }
      
      // Schedule notification to show immediately
      const notificationContent = {
        title,
        body,
        data: enhancedData,
        sound: 'default',
        priority: 'max',
        vibrate: [0, 250, 250, 250],
      };
      
      // Add channel ID for Android
      if (Platform.OS === 'android') {
        notificationContent.channelId = channelId;
        console.log(`Using channel: ${channelId}`);
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Show immediately
      });
      
      console.log(`Local notification sent with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error sending local notification:', error);
      return null;
    }
  }

  /**
   * Add a listener for received notifications
   * @param {Function} callback - Notification handler
   * @returns {Object} Subscription object
   */
  addNotificationReceivedListener(callback) {
    const subscription = Notifications.addNotificationReceivedListener(callback);
    this.notificationListeners.push(subscription);
    return subscription;
  }

  /**
   * Add a listener for notification responses (taps)
   * @param {Function} callback - Response handler
   * @returns {Object} Subscription object
   */
  addNotificationResponseReceivedListener(callback) {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    this.notificationListeners.push(subscription);
    return subscription;
  }

  /**
   * Set up notification handlers for navigation
   * @param {Object} navigation - Navigation object
   * @returns {Function} Cleanup function
   */
  setupNotificationHandlers(navigation) {
    // Listen for notification taps
    const responseSubscription = this.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (!navigation) return;
      
      // Navigate based on notification type
      if (data.screen) {
        navigation.navigate(data.screen, {
          highlightRequestId: data.requestId,
          donorName: data.donorName,
          status: data.status
        });
      }
    });

    // Return cleanup function
    return () => {
      Notifications.removeNotificationSubscription(responseSubscription);
    };
  }

  /**
   * Clean up all notification listeners
   */
  cleanup() {
    this.notificationListeners.forEach(subscription => {
      Notifications.removeNotificationSubscription(subscription);
    });
    this.notificationListeners = [];
  }

  /**
   * Get badge count of unseen notifications
   * @param {string} userId - User ID
   * @param {string} userRole - User role ('donor' or 'receiver')
   * @param {string} bloodGroup - User blood group
   * @param {string} city - User city
   * @returns {Promise<number>} Badge count
   */
  async getUnseenNotificationCount(userId, userRole, bloodGroup, city) {
    try {
      let count = 0;
      
      if (userRole === 'donor' && bloodGroup && city) {
        // For donors: count unseen blood requests
        const requestsQuery = query(
          collection(db, 'Bloodreceiver'),
          where('bloodGroup', '==', bloodGroup),
          where('city', '==', city),
          where('status', '==', 'pending')
        );
        
        const requestsSnapshot = await getDocs(requestsQuery);
        requestsSnapshot.forEach(doc => {
          const data = doc.data();
          const seenBy = data.seenBy || [];
          if (!seenBy.includes(userId)) {
            count++;
          }
        });
      } else if (userRole === 'receiver') {
        // For receivers: count unseen donor responses
        const requestsQuery = query(
          collection(db, 'Bloodreceiver'),
          where('uid', '==', userId)
        );
        
        const requestsSnapshot = await getDocs(requestsQuery);
        requestsSnapshot.forEach(doc => {
          const data = doc.data();
          const responses = data.responses || [];
          responses.forEach(response => {
            if (!response.seenByReceiver) {
              count++;
            }
          });
        });
      }
      
      return count;
    } catch (error) {
      console.error('Error getting unseen notification count:', error);
      return 0;
    }
  }
  
  /**
   * Notify matching donors about a blood request
   * @param {Object} requestData - Blood request data
   * @returns {Promise<boolean>} Success status
   */
  async notifyMatchingDonors(requestData) {
    try {
      console.log('Finding donors for blood request:', requestData.id);
      
      if (!requestData.bloodGroup || !requestData.city) {
        console.error('Missing required blood request data');
        return false;
      }
      
      // Find potential donors with matching blood group in the same city
      const donorsQuery = query(
        collection(db, 'users'),
        where('bloodGroup', '==', requestData.bloodGroup),
        where('city', '==', requestData.city)
      );
      
      const donorsSnapshot = await getDocs(donorsQuery);
      let notificationsSent = 0;
      
      for (const donorDoc of donorsSnapshot.docs) {
        const donor = donorDoc.data();
        
        // Skip the requester themselves
        if (donor.uid === requestData.uid) continue;
        
        // Skip if no push token
        if (!donor.pushToken) continue;
        
        // Send notification to this donor
        const title = `🚨 Urgent ${requestData.bloodGroup} Blood Request`;
        const body = `Someone in ${requestData.city} needs ${requestData.bloodGroup} blood${requestData.purpose ? ' for ' + requestData.purpose : ''}.`;
        
        // Add request details to notification data
        const notificationData = {
          type: 'blood_request',
          requestId: requestData.id,
          screen: 'Notifications',
        };
        
        // Send local notification first (works reliably)
        const localId = await this.sendLocalNotification(
          title,
          body,
          notificationData,
          'blood-requests'
        );
        
        if (localId) {
          notificationsSent++;
        }
      }
      
      console.log(`Sent notifications to ${notificationsSent} donors`);
      return notificationsSent > 0;
    } catch (error) {
      console.error('Error notifying donors:', error);
      return false;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
