// src/services/notifications/index.js
// Single source of truth for all notifications

import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../auth';

// Configure notification behavior for better visibility
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

class NotificationManager {
  constructor() {
    this.expoPushUrl = 'https://exp.host/--/api/v2/push/send';
    this.sentNotifications = new Set(); // Track sent notifications to prevent duplicates
    this.notificationTimeout = 30 * 1000; // 30 seconds timeout (Instagram-style short)
    this.isInitialized = false;
    this.isExpoGo = Constants.appOwnership === 'expo';
    this.initializeChannels();
  }

  // Initialize notification channels (Android only)
  async initializeChannels() {
    try {
      if (Platform.OS === 'android') {
        // Blood request channel
        await Notifications.setNotificationChannelAsync('blood-requests', {
          name: 'Blood Request Matches',
          description: 'Notifications for matching blood requests',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        
        // Donor responses channel
        await Notifications.setNotificationChannelAsync('donor-responses', {
          name: 'Donor Responses',
          description: 'Notifications for donor responses',
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
        
        console.log('✅ Notification channels initialized');
      }
    } catch (error) {
      console.log('Error initializing notification channels:', error);
    }
  }

  // Initialize notification permissions and expo token
  async initialize(userId) {
    if (this.isInitialized) {
      console.log('🚫 Notifications already initialized, skipping');
      return true;
    }
    
    try {
      console.log('🔔 Initializing notifications for user', userId);
      
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync({
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      
      if (status !== 'granted') {
        console.log('⚠️ Notification permissions not granted');
        return false;
      }
      
      // Get Expo push token
      const token = await this.getExpoPushToken();
      if (!token) {
        console.log('⚠️ Failed to get push token');
        return false;
      }
      
      // Store token in Firestore
      await this.storeUserPushToken(userId, token);
      
      this.isInitialized = true;
      console.log('✅ Notifications initialized successfully for user:', userId);
      console.log('📱 Push token:', token);
      return true;
    } catch (error) {
      console.log('❌ Error initializing notifications:', error);
      return false;
    }
  }
  
  // Get Expo push token
  async getExpoPushToken() {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      return tokenData.data;
    } catch (error) {
      console.log('Error getting push token:', error);
      return null;
    }
  }
  
  // Store user's push token in Firestore
  async storeUserPushToken(userId, pushToken) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        pushToken: pushToken,
        pushTokenUpdatedAt: new Date(),
      });
      return true;
    } catch (error) {
      console.log('Error storing push token:', error);
      return false;
    }
  }

  // Generate unique key for notification deduplication
  generateNotificationKey(type, requestId, userId = null) {
    return `${type}_${requestId}_${userId || 'broadcast'}`;
  }

  // Check if notification was already sent recently
  isNotificationAlreadySent(key) {
    return this.sentNotifications.has(key);
  }

  // Mark notification as sent and auto-remove after timeout
  markNotificationAsSent(key) {
    this.sentNotifications.add(key);
    
    // Auto-remove after timeout to allow future notifications
    setTimeout(() => {
      this.sentNotifications.delete(key);
      console.log(`🧹 Notification deduplication cleared: ${key}`);
    }, this.notificationTimeout);
  }

  // Send local notification (works in Expo Go)
  async sendLocalNotification(title, body, data = {}, channelId = 'default') {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          // Android specific
          channelId,
        },
        trigger: null, // Show immediately
      });
      
      return identifier;
    } catch (error) {
      console.log('Error sending local notification:', error);
      return false;
    }
  }

  // Send push notification via Expo Push API (Instagram-style urgent delivery)
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    if (!expoPushToken) {
      console.log('⚠️ No push token provided');
      return false;
    }
    
    // Validate the push token
    if (typeof expoPushToken === 'object' && expoPushToken.data) {
      expoPushToken = expoPushToken.data;
    }
    
    if (!expoPushToken.startsWith('ExponentPushToken')) {
      console.log('⚠️ Invalid Expo push token format:', expoPushToken.substring(0, 10) + '...');
      return false;
    }

    try {
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

      console.log(`📤 Sending push notification to token: ${expoPushToken.substring(0, 20)}...`);

      const response = await fetch(this.expoPushUrl, {
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
        return true;
      } else {
        console.log('❌ Push notification failed:', result);
        return false;
      }
    } catch (error) {
      console.log('❌ Error sending push notification:', error);
      return false;
    }
  }

  // Find donors by blood group and city
  async findMatchingDonors(bloodGroup, city) {
    try {
      console.log(`Starting donor search for ${bloodGroup} in ${city}...`);
      
      // First, try to find donors in the BloodDonors collection
      const bloodDonorsQuery = query(
        collection(db, 'BloodDonors'),
        where('bloodGroup', '==', bloodGroup),
        where('isActive', '==', true)
      );
      
      const bloodDonorsSnapshot = await getDocs(bloodDonorsQuery);
      const donors = [];
      
      // Filter by city in memory to avoid composite index requirement
      bloodDonorsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.city === city && 
            (data.pushToken || data.expoPushToken) && 
            data.uid !== auth.currentUser?.uid) {
          donors.push({
            id: doc.id,
            ...data,
            // Make sure we use the correct push token
            pushToken: data.pushToken || data.expoPushToken
          });
          console.log(`Blood match found: ${bloodGroup} in ${city} - ${data.name || 'Unknown donor'}`);
        }
      });
      
      console.log(`Found ${donors.length} matching donors in BloodDonors collection`);
      
      // As a fallback, also check users collection
      if (donors.length === 0) {
        console.log(`No donors found in BloodDonors, checking users collection...`);
        const usersQuery = query(
          collection(db, 'users'),
          where('bloodGroup', '==', bloodGroup)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.city === city && 
              data.pushToken && 
              !data.isAdmin &&
              data.uid !== auth.currentUser?.uid) {
            donors.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        console.log(`Found ${donors.length} total matching donors after checking users collection`);
      }

      return donors;
    } catch (error) {
      console.log('Error finding matching donors:', error);
      return [];
    }
  }

  // Send notification to all matching donors
  async notifyMatchingDonors(requestData) {
    try {
      const { bloodGroup, city, id: requestId } = requestData;
      
      if (!requestId) {
        console.log('⚠️ Missing request ID in notification data');
        return false;
      }
      
      // Create unique key for this notification broadcast
      const notificationKey = this.generateNotificationKey('blood_request_match', requestId);
      
      // Check if we've already sent this notification recently
      if (this.isNotificationAlreadySent(notificationKey)) {
        console.log(`🔄 Duplicate notification prevented for request ${requestId}`);
        return true;
      }
      
      console.log(`🔍 Finding donors for ${bloodGroup} in ${city}...`);
      
      // Find matching donors
      const matchingDonors = await this.findMatchingDonors(bloodGroup, city);
      
      if (matchingDonors.length === 0) {
        console.log(`⚠️ No matching donors found with push tokens for ${bloodGroup} in ${city}`);
        
        // Send local notification about no matches
        if (auth.currentUser) {
          await this.sendLocalNotification(
            'ℹ️ No Immediate Matches',
            `We couldn't find active donors with ${bloodGroup} blood in ${city} right now. Your request is still active and donors will see it when they check the app.`,
            {
              type: 'no_matches_info',
              requestId,
              bloodGroup,
              city
            },
            'blood-requests'
          );
        }
        
        return false;
      }

      // Mark as sent to prevent duplicates ONLY after we confirmed donors exist
      this.markNotificationAsSent(notificationKey);
      
      console.log(`📱 Sending URGENT notifications to ${matchingDonors.length} donors`);

      // Prepare notification content - Make it more urgent and actionable (Instagram style)
      let urgencyText = "";
      if (requestData.requiredDateTime) {
        urgencyText = requestData.requiredDateTime.includes('ASAP') ? 
          'URGENT - NEEDED IMMEDIATELY' : 
          `NEEDED BY: ${requestData.requiredDateTime}`;
      } else {
        urgencyText = 'URGENT REQUEST';
      }
      
      // More attention-grabbing notification title
      const title = `🚨 URGENT: ${bloodGroup} Blood Needed in ${city}`;
      
      // More detailed body with clear call to action
      const body = `${requestData.name || 'Someone'} urgently needs ${bloodGroup} blood${requestData.purpose ? ' for ' + requestData.purpose : ''}. ${urgencyText}. Can you help save a life today?`;
      
      const notificationData = {
        type: 'blood_request_match',
        requestId,
        bloodGroup,
        city,
        receiverName: requestData.name || 'Patient',
        requiredDateTime: requestData.requiredDateTime || 'ASAP',
        purpose: requestData.purpose || 'Medical emergency',
        hospital: requestData.hospital || '',
        mobile: requestData.mobile || '',
        screen: 'Notifications',
        action: 'view_request',
        urgent: true,
        timestamp: Date.now()
      };

      // Send notifications individually to ensure better delivery
      const notificationPromises = matchingDonors.map(async (donor, index) => {
        try {
          // Use either pushToken or expoPushToken, whichever is available
          const token = donor.pushToken || donor.expoPushToken;
          
          if (!token) {
            console.log(`⚠️ No push token for donor ${donor.name || donor.id}`);
            return false;
          }
          
          console.log(`📤 Sending to donor ${index + 1}/${matchingDonors.length}: ${donor.name || donor.id}`);
          const result = await this.sendPushNotification(token, title, body, notificationData);
          console.log(`📱 Donor ${donor.name || donor.id} notification result: ${result ? '✅ Success' : '❌ Failed'}`);
          return result;
        } catch (error) {
          console.log(`❌ Error sending to donor ${donor.name || donor.id}:`, error);
          return false;
        }
      });
      
      const results = await Promise.allSettled(notificationPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
      
      console.log(`📊 NOTIFICATION RESULTS: ${successCount}/${matchingDonors.length} sent successfully`);
      
      // Also send local notification to confirm
      await this.sendLocalNotification(
        successCount > 0 ? '✅ Request Sent' : '⚠️ Request Sent Partially',
        `Your ${bloodGroup} blood request has been sent to ${successCount} matching donors.`,
        { type: 'request_confirmation', requestId },
        'blood-requests'
      );
      
      return successCount > 0;
    } catch (error) {
      console.log('❌ Error notifying donors:', error);
      return false;
    }
  }

  // Send notification to requester when donor responds
  async notifyRequesterOfDonorResponse(requesterId, responseData, requestData) {
    try {
      if (!requesterId) {
        console.log('⚠️ No requester ID provided for response notification');
        return false;
      }
      
      const { donorName, status, donorMobile } = responseData;
      let requestId, bloodGroup, city;
      
      // Handle both object formats
      if (typeof requestData === 'string') {
        requestId = requestData;
        // Try to get request details if only ID provided
        try {
          const requestDoc = await getDoc(doc(db, 'Bloodreceiver', requestId));
          if (requestDoc.exists()) {
            const data = requestDoc.data();
            bloodGroup = data.bloodGroup;
            city = data.city;
          }
        } catch (e) {
          console.log('Error getting request details:', e);
        }
      } else {
        requestId = requestData.id || requestData.requestId;
        bloodGroup = requestData.bloodGroup;
        city = requestData.city;
      }
      
      if (!requestId) {
        console.log('⚠️ No request ID found in response notification data');
        return false;
      }
      
      // Create unique key for this specific donor response notification
      // Include donor name and status to allow multiple donors to respond
      const notificationKey = this.generateNotificationKey('donor_response', requestId, `${requesterId}_${donorName}_${status}`);
      
      // Check if we've already sent this exact notification recently
      if (this.isNotificationAlreadySent(notificationKey)) {
        console.log(`🔄 Duplicate donor response notification prevented`);
        return true;
      }

      console.log(`🔍 Looking for requester with ID: ${requesterId}`);
      
      // First try to get the requester from the Bloodreceiver collection
      let requesterData = null;
      let pushToken = null;
      
      // Try multiple collections to find the requester
      const collections = ['users', 'BloodReceivers'];
      
      for (const collectionName of collections) {
        const requesterQuery = query(
          collection(db, collectionName),
          where('uid', '==', requesterId)
        );
        
        const requesterSnapshot = await getDocs(requesterQuery);
        if (!requesterSnapshot.empty) {
          requesterData = requesterSnapshot.docs[0].data();
          pushToken = requesterData.pushToken || requesterData.expoPushToken;
          if (pushToken) {
            console.log(`✅ Found requester in ${collectionName} collection`);
            break;
          }
        }
      }
      
      if (!requesterData) {
        console.log(`❌ Requester not found in any collection`);
        
        // Send local notification instead as fallback
        await this.sendLocalNotification(
          `${status === 'accepted' ? '✅' : '❌'} Donor Response`,
          `${donorName} has ${status === 'accepted' ? 'accepted' : 'declined'} a blood request.`,
          { type: 'response_confirmation' },
          'donor-responses'
        );
        
        return false;
      }

      if (!pushToken) {
        console.log('⚠️ Requester has no push token, sending local notification instead');
        
        // Send local notification as fallback
        await this.sendLocalNotification(
          `${status === 'accepted' ? '✅' : '❌'} Donor Response`,
          `${donorName} has ${status === 'accepted' ? 'accepted' : 'declined'} your blood request.`,
          { type: 'response_confirmation', requestId, donorName, status },
          'donor-responses'
        );
        
        return false;
      }

      // Mark as sent to prevent duplicates
      this.markNotificationAsSent(notificationKey);

      // Prepare notification - Instagram-style immediate and clear
      const emoji = status === 'accepted' ? '✅' : '❌';
      const actionText = status === 'accepted' ? 'ACCEPTED' : 'declined';
      
      const title = `${emoji} ${donorName} ${actionText.toUpperCase()}!`;
      
      let body;
      if (status === 'accepted') {
        body = `Great news! ${donorName} accepted your ${bloodGroup || ''} blood request${city ? ' in ' + city : ''}.${donorMobile ? ` Contact: ${donorMobile}` : ' Check the app for contact details.'}`;
      } else {
        body = `${donorName} declined your ${bloodGroup || ''} blood request${city ? ' in ' + city : ''}. Don't worry, other donors may still respond.`;
      }

      const notificationData = {
        type: 'donor_response',
        requestId,
        donorName,
        status,
        bloodGroup: bloodGroup || '',
        city: city || '',
        donorMobile: donorMobile || '',
        screen: 'Notifications',
        action: 'view_response',
        urgent: status === 'accepted',
        timestamp: Date.now()
      };

      // Send push notification with high priority
      console.log(`📱 Sending donor response notification to requester`);
      const success = await this.sendPushNotification(
        pushToken,
        title,
        body,
        notificationData
      );
      
      // Also send local notification for better visibility
      await this.sendLocalNotification(
        title,
        body,
        notificationData,
        'donor-responses'
      );
      
      console.log(`${success ? '✅' : '❌'} Donor response notification ${success ? 'sent' : 'failed'}`);
      
      // If push notification failed, return true anyway since we sent a local notification
      return true;
    } catch (error) {
      console.log('❌ Error notifying requester:', error);
      return false;
    }
  }
  
  // Listen for notification received
  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      console.log('📲 Notification received:', data?.type || 'unknown');
      callback(notification);
    });
  }

  // Listen for notification response (taps)
  addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('👆 Notification tapped:', data?.type || 'unknown');
      callback(response);
    });
  }

  // Setup notification handlers for navigation
  setupNotificationHandlers(navigation) {
    // Listen for notifications received in foreground
    const foregroundSubscription = this.addNotificationReceivedListener(notification => {
      // Just log the notification but DON'T create additional notifications
      console.log('📨 Foreground notification received');
    });

    // Listen for notification taps
    const responseSubscription = this.addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      
      if (!navigation) return;
      
      // Navigate based on notification type
      if (data.type === 'blood_request_match') {
        navigation.navigate('Notifications', {
          highlightRequestId: data.requestId
        });
      } 
      else if (data.type === 'donor_response') {
        navigation.navigate('Notifications', {
          highlightRequestId: data.requestId,
          donorName: data.donorName,
          status: data.status
        });
      }
      else {
        navigation.navigate('Notifications');
      }
    });

    // Return cleanup function
    return () => {
      Notifications.removeNotificationSubscription(foregroundSubscription);
      Notifications.removeNotificationSubscription(responseSubscription);
    };
  }
}

// Create a singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;
