// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';


// Import task-manager and background-fetch with error handling
let TaskManager;
let BackgroundFetch;
let BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

try {
  TaskManager = require('expo-task-manager');
  BackgroundFetch = require('expo-background-fetch');
} catch (error) {
  console.log('Background tasks not supported in this environment:', error);
}

// Configure notification behavior for better visibility
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

// Define background task for notifications when app is closed
if (TaskManager && BackgroundFetch) {
  try {
    TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
      try {
        // This task will be executed when the app is in background
        console.log('Background notification task executed');
        // Return success to ensure the task keeps running
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error("Background fetch failed:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });
    console.log('Background notification task registered successfully');
  } catch (error) {
    console.log('Failed to define background task:', error);
  }
}

class NotificationService {
  constructor() {
    this.isExpoGo = Constants.appOwnership === 'expo';
    this.hasBackgroundTasks = !!TaskManager && !!BackgroundFetch;
    this.initializeNotifications();
    
    // Only try to register background tasks if the modules are available
    if (this.hasBackgroundTasks) {
      this.registerBackgroundTask();
    } else {
      console.log('Background tasks not available - skipping registration');
    }
  }

  async registerBackgroundTask() {
    // Skip if background tasks not supported
    if (!this.hasBackgroundTasks) {
      console.log('Background tasks not supported - skipping registration');
      return false;
    }
    
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 60 * 15, // 15 minutes
        stopOnTerminate: false,    // Keep running after app is closed
        startOnBoot: true,         // Start task on device boot
      });
      console.log('Background notification task registered');
      return true;
    } catch (err) {
      console.log('Background task registration failed:', err);
      return false;
    }
  }

  async initializeNotifications() {
    try {
      // Request permissions with all options for maximum visibility
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // In Expo Go, we can only use local notifications
      if (this.isExpoGo) {
        console.log('Running in Expo Go - using local notifications only');
        return true;
      }

      // Create multiple channels for different notification types
      if (Platform.OS === 'android') {
        // High priority channel for blood requests
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
        
        // High priority channel for donor responses
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
        
        // Default channel for other notifications
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default Notifications',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.log('Notification initialization error:', error);
      return false;
    }
  }

  // Enhanced notification method with guaranteed foreground visibility
  async sendLocalNotification(title, body, data = {}, channelId = 'default') {
    try {
      // Clean up any date objects in the data to prevent serialization issues
      const cleanData = { ...data };
      Object.keys(cleanData).forEach(key => {
        // Convert Date objects to ISO strings to prevent serialization errors
        if (cleanData[key] instanceof Date) {
          cleanData[key] = cleanData[key].toISOString();
        }
        
        // Handle Firebase timestamp objects
        if (cleanData[key] && typeof cleanData[key].toDate === 'function') {
          cleanData[key] = cleanData[key].toDate().toISOString();
        }
      });
      
      // Set presentationOptions to ensure notification shows even when app is in foreground
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: cleanData,
          sound: 'default',
          priority: 'high',
          vibrate: [0, 250, 250, 250],
          autoDismiss: false, // Prevent auto-dismiss
          // Android specific
          channelId: channelId,
          color: channelId === 'blood-requests' ? '#FF0000' : 
                 channelId === 'donor-responses' ? '#00FF00' : '#FF231F7C',
          // iOS specific
          categoryIdentifier: channelId,
          // Important - make sure notification shows in foreground
          _displayInForeground: true,
        },
        trigger: null, // Show immediately
      });
      
      console.log(`Notification scheduled with ID: ${identifier} (${title})`);
      return identifier;
    } catch (error) {
      console.log('Local notification error:', error);
      return false;
    }
  }

  // Schedule notification for later (works in Expo Go)
  async scheduleNotification(title, body, triggerDate, data = {}, channelId = 'default') {
    try {
      // Ensure the trigger date is valid
      if (!(triggerDate instanceof Date) || isNaN(triggerDate.getTime())) {
        console.error('Invalid trigger date for scheduled notification:', triggerDate);
        return false;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: 'high',
          vibrate: [0, 250, 250, 250],
          // Android specific
          channelId: channelId,
          color: channelId === 'blood-requests' ? '#FF0000' : 
                 channelId === 'donor-responses' ? '#00FF00' : '#FF231F7C',
          // iOS specific
          categoryIdentifier: channelId,
        },
        trigger: {
          date: triggerDate,
          channelId: channelId,
        },
      });
      console.log(`Scheduled notification with ID: ${identifier} for ${triggerDate.toString()}`);
      return identifier;
    } catch (error) {
      console.log('Scheduled notification error:', error);
      return false;
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.log('Cancel notifications error:', error);
      return false;
    }
  }

  // Get notification permissions status
  async getPermissionStatus() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.log('Get permission status error:', error);
      return 'undetermined';
    }
  }

  // Alias for sendLocalNotification to match existing usage
  async showLocalNotification(title, body, data = {}) {
    return this.sendLocalNotification(title, body, data);
  }

  // Blood donation specific notifications with enhanced information
  async notifyBloodRequestMatch(receiverName, bloodGroup, city, requiredDateTime, purpose = '', hospital = '', mobile = '') {
    const timeStr = requiredDateTime ? 
      (requiredDateTime instanceof Date ? requiredDateTime.toLocaleString() : new Date(requiredDateTime).toLocaleString()) 
      : 'ASAP';
      
    return this.sendLocalNotification(
      `🩸 Blood Match: ${bloodGroup} in ${city}`,
      `${receiverName || 'Someone'} needs ${bloodGroup} blood in ${city}. ${purpose ? `For: ${purpose}. ` : ''}Required by: ${timeStr}. Tap to help!`,
      { 
        type: 'blood_request_match', 
        bloodGroup, 
        city, 
        receiverName,
        requiredDateTime,
        purpose,
        hospital,
        mobile
      },
      'blood-requests' // Use blood requests channel
    );
  }

  async notifyDonorResponse(response, donorName, bloodGroup, city = '', mobile = '') {
    const emoji = response === 'accepted' ? '✅' : '❌';
    const actionText = response === 'accepted' ? 'accepted' : 'declined';
    const message = `${donorName} has ${actionText} your ${bloodGroup} blood request${city ? ` in ${city}` : ''}. ${response === 'accepted' && mobile ? `Contact: ${mobile}` : ''}`;
    
    return this.sendLocalNotification(
      `${emoji} Donor: ${donorName}`,
      message,
      { 
        type: 'donor_response', 
        response, 
        donorName, 
        bloodGroup,
        city,
        mobile,
        status: response 
      },
      'donor-responses' // Use donor responses channel
    );
  }

  async notifyAppointmentReminder(appointmentTime, location, bloodGroup, receiverName) {
    // Ensure appointmentTime is a Date object
    const appointmentDate = appointmentTime instanceof Date ? appointmentTime : new Date(appointmentTime);
    // Schedule 30 minutes before
    const reminderTime = new Date(appointmentDate.getTime() - 30 * 60 * 1000);
    
    return this.scheduleNotification(
      `⏰ ${bloodGroup} Blood Donation Reminder`,
      `Your blood donation appointment with ${receiverName} is in 30 minutes at ${location}`,
      reminderTime,
      { 
        type: 'appointment_reminder', 
        location,
        bloodGroup,
        receiverName
      },
      'blood-requests'
    );
  }

  // Enhanced method for donor matching notifications with more complete information
  async notifyDonorOfMatch(requestData) {
    const { 
      receiverName, 
      bloodGroup, 
      city, 
      requiredDateTime, 
      id: requestId, 
      purpose, 
      hospital,
      mobile,
      bloodUnits
    } = requestData;
    
    // Fix date formatting issues
    let timeStr = 'As soon as possible';
    let formattedDate = null;
    
    try {
      if (requiredDateTime) {
        // Handle Firestore timestamps or regular date objects
        if (requiredDateTime.toDate && typeof requiredDateTime.toDate === 'function') {
          formattedDate = requiredDateTime.toDate();
        } else if (requiredDateTime instanceof Date) {
          formattedDate = requiredDateTime;
        } else if (typeof requiredDateTime === 'string' || typeof requiredDateTime === 'number') {
          formattedDate = new Date(requiredDateTime);
        }
        
        // Only use date if it's valid
        if (formattedDate instanceof Date && !isNaN(formattedDate.getTime())) {
          timeStr = formattedDate.toLocaleDateString() + ' ' + formattedDate.toLocaleTimeString();
        } else if (typeof requiredDateTime === 'string' && requiredDateTime.trim()) {
          // If it's a string but not a valid date, show the actual string entered by the receiver
          timeStr = requiredDateTime;
          formattedDate = null; // Clear formattedDate since it's not valid
        }
      }
    } catch (error) {
      console.log('Error formatting date:', error);
      // If there's an error but we have the original string, use it
      if (typeof requiredDateTime === 'string' && requiredDateTime.trim()) {
        timeStr = requiredDateTime;
      }
    }
    
    // Create an urgent title with blood group and city
    const title = `🚨 URGENT: ${bloodGroup} Blood Needed in ${city}`;
    
    // Create a detailed message with all required information
    const message = `${receiverName || 'A patient'} urgently needs ${bloodUnits || '1'} unit(s) of ${bloodGroup} blood in ${city}.
${purpose ? `Purpose: ${purpose}` : 'For medical treatment'}
${hospital ? `Hospital: ${hospital}` : ''}
Required by: ${timeStr}
Your blood type matches! Please respond.`;
    
    // Send as high-priority notification
    return this.sendLocalNotification(
      title,
      message,
      { 
        type: 'blood_request_match', 
        requestId,
        bloodGroup, 
        city, 
        receiverName,
        requiredDateTime: formattedDate ? formattedDate.toISOString() : (typeof requiredDateTime === 'string' ? requiredDateTime : null),
        formattedDateTime: timeStr,
        purpose,
        hospital,
        mobile,
        bloodUnits
      },
      'blood-requests'
    );
  }

  // Enhanced method for receiver response notifications with more details
  async notifyReceiverOfResponse(responseData, requestData) {
    const { donorName, status, donorMobile } = responseData;
    const { bloodGroup, city, purpose } = requestData;
    
    const emoji = status === 'accepted' ? '✅' : '❌';
    const actionText = status === 'accepted' ? 'accepted' : 'declined';
    const contactInfo = status === 'accepted' && donorMobile ? ` Contact: ${donorMobile}` : '';
    
    return this.sendLocalNotification(
      `${emoji} ${status.toUpperCase()}: ${donorName}`,
      `${donorName} has ${actionText} your ${bloodGroup} blood request in ${city}.${contactInfo}`,
      {
        type: 'donor_response',
        donorName,
        status,
        bloodGroup,
        city,
        purpose,
        donorMobile
      },
      'donor-responses'
    );
  }

  // Enhanced method to get push token
  async getExpoPushToken() {
    try {
      // Check if device can receive push notifications
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission not granted for push token');
        return null;
      }
      
      // Get the token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      console.log('Expo push token:', tokenData.data);
      return tokenData.data;
    } catch (error) {
      console.log('Error getting push token:', error);
      return null;
    }
  }

  // Listen for notification interactions with enhanced logging
  addNotificationListener(callback) {
    return Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification.request.content);
      callback(notification);
    });
  }

  addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response.notification.request.content);
      callback(response);
    });
  }

  // Enhanced method to handle notification taps and navigate to appropriate screen
  setupNotificationHandlers(navigation) {
    // Listen for notifications received while app is running in foreground
    const foregroundListener = this.addNotificationListener(notification => {
      const data = notification.request.content.data;
      console.log('Foreground notification received:', data);
      
      // For foreground notifications, we need to ensure they show properly
      // Setting Notifications.setNotificationHandler ensures they'll display
      // even when the app is in foreground
      
      // You can also trigger any custom in-app UI banner here if needed
      if (data.type === 'blood_request_match') {
        console.log('Blood request match notification received in foreground');
        // Make sure data is shown in notification center regardless of app state
        Notifications.scheduleNotificationAsync({
          content: notification.request.content,
          trigger: null, // Show immediately
        });
      }
    });

    // Listen for user tapping on notifications (works for both foreground and background)
    const tapListener = this.addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped with data:', data);
      
      // Navigate based on notification type
      if (data.type === 'blood_request_match') {
        // Navigate to notifications screen and pass the blood request info
        navigation?.navigate('Notifications', { 
          screen: 'NotificationsScreen',
          params: {
            highlightRequestId: data.requestId,
            notificationType: 'blood_request_match',
            bloodGroup: data.bloodGroup,
            city: data.city
          }
        });
      } 
      else if (data.type === 'donor_response') {
        // Navigate to notifications screen and pass the response info
        navigation?.navigate('Notifications', {
          screen: 'NotificationsScreen', 
          params: {
            highlightRequestId: data.requestId,
            notificationType: 'donor_response',
            donorName: data.donorName,
            status: data.status
          }
        });
      }
      else {
        // Default navigation to notifications screen
        navigation?.navigate('Notifications');
      }
    });

    // Set up handler for background notifications received when app was closed
    const setUpBackgroundHandler = async () => {
      Notifications.setNotificationCategoryAsync('blood-requests', [
        {
          identifier: 'accept',
          buttonTitle: 'Accept Request',
          options: {
            opensAppToForeground: true,
          }
        },
        {
          identifier: 'view',
          buttonTitle: 'View Details',
          options: {
            opensAppToForeground: true,
          }
        }
      ]);
      
      Notifications.setNotificationCategoryAsync('donor-responses', [
        {
          identifier: 'call',
          buttonTitle: 'Call Donor',
          options: {
            opensAppToForeground: true,
          }
        },
        {
          identifier: 'view',
          buttonTitle: 'View Details',
          options: {
            opensAppToForeground: true,
          }
        }
      ]);
    };
    
    setUpBackgroundHandler();

    // Return cleanup function
    return () => {
      foregroundListener && Notifications.removeNotificationSubscription(foregroundListener);
      tapListener && Notifications.removeNotificationSubscription(tapListener);
    };
  }
  
  // Check if notification is scheduled
  async checkScheduledNotifications() {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Scheduled notifications:', scheduledNotifications.length);
      return scheduledNotifications;
    } catch (error) {
      console.log('Error checking scheduled notifications:', error);
      return [];
    }
  }
  
  // Enable background notifications
  async enableBackgroundNotifications() {
    // Skip if background tasks not supported
    if (!this.hasBackgroundTasks) {
      console.log('Background tasks not supported - cannot enable background notifications');
      return false;
    }
    
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 60 * 15, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background notifications enabled');
      return true;
    } catch (error) {
      console.log('Error enabling background notifications:', error);
      return false;
    }
  }
}

export default new NotificationService();

// Export the class as well for type checking
export { NotificationService };
