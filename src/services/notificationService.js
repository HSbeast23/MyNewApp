// src/services/notificationService.js
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.isExpoGo = Constants.appOwnership === 'expo';
    this.initializeNotifications();
  }

  async initializeNotifications() {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
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

      // For development builds, you can get push token
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
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

  // Send local notification (works in Expo Go)
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
      return true;
    } catch (error) {
      console.log('Local notification error:', error);
      return false;
    }
  }

  // Schedule notification for later (works in Expo Go)
  async scheduleNotification(title, body, triggerDate, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: {
          date: triggerDate,
        },
      });
      return true;
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

  // Blood donation specific notifications
  async notifyBloodRequestMatch(donorName, bloodGroup, location) {
    return this.sendLocalNotification(
      '🩸 Blood Request Match!',
      `${donorName} needs ${bloodGroup} blood in ${location}. Tap to help save a life!`,
      { type: 'blood_request', bloodGroup, location }
    );
  }

  async notifyDonorResponse(response, donorName) {
    const emoji = response === 'accepted' ? '✅' : '❌';
    const message = response === 'accepted' 
      ? `${donorName} accepted your blood request!` 
      : `${donorName} declined your blood request.`;
    
    return this.sendLocalNotification(
      `${emoji} Blood Request Update`,
      message,
      { type: 'donor_response', response, donorName }
    );
  }

  async notifyAppointmentReminder(appointmentTime, location) {
    const reminderTime = new Date(appointmentTime.getTime() - 30 * 60 * 1000); // 30 minutes before
    
    return this.scheduleNotification(
      '⏰ Blood Donation Reminder',
      `Your blood donation appointment is in 30 minutes at ${location}`,
      reminderTime,
      { type: 'appointment_reminder', location }
    );
  }

  // Listen for notification interactions
  addNotificationListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationService();
