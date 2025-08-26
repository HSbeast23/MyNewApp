// src/services/pushNotificationService.js
// DEPRECATED - This file is a compatibility layer that redirects to the new notification manager
import notificationManager from './notifications';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from './auth';

console.warn('⚠️ pushNotificationService is deprecated. Please use notificationManager instead.');

class PushNotificationService {
  constructor() {
    this.expoPushUrl = 'https://exp.host/--/api/v2/push/send';
    console.log('Using unified notification manager');
    
    // Initialize time window setting for deduplication
    this.notificationTimeout = 30 * 1000; // 30 seconds timeout (Instagram-style short)
  }

  // -------- COMPATIBILITY METHODS ---------
  // All these methods now redirect to the notification manager

  // Key management methods
  generateNotificationKey(type, requestId, userId = null) {
    return notificationManager.generateNotificationKey(type, requestId, userId);
  }

  isNotificationAlreadySent(key) {
    return notificationManager.isNotificationAlreadySent(key);
  }

  markNotificationAsSent(key) {
    return notificationManager.markNotificationAsSent(key);
  }

  // Push notification methods
  async sendExpoPushNotification(expoPushToken, title, body, data = {}) {
    return notificationManager.sendPushNotification(expoPushToken, title, body, data);
  }

  // User management methods
  async storeUserPushToken(userId, pushToken) {
    return notificationManager.storeUserPushToken(userId, pushToken);
  }

  // Finding donors
  async findMatchingDonors(bloodGroup, city) {
    return notificationManager.findMatchingDonors(bloodGroup, city);
  }

  // Core notification functionality
  async notifyMatchingDonors(requestData) {
    return notificationManager.notifyMatchingDonors(requestData);
  }

  async notifyRequesterOfDonorResponse(requesterId, responseData, requestData) {
    return notificationManager.notifyRequesterOfDonorResponse(requesterId, responseData, requestData);
  }

  // Initialization
  async initializePushNotifications(userId) {
    return notificationManager.initialize(userId);
  }

  // Test methods
  async sendTestNotification(userId) {
    try {
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('uid', '==', userId)
      ));

      if (userDoc.empty) {
        console.log('User not found for test notification');
        return false;
      }

      const userData = userDoc.docs[0].data();
      if (!userData.pushToken) {
        console.log('User has no push token for test notification');
        return false;
      }

      return await notificationManager.sendPushNotification(
        userData.pushToken,
        '🩸 BloodLink Test',
        'Push notifications are working! You will receive alerts for blood requests.',
        { type: 'test_notification' }
      );
    } catch (error) {
      console.log('Error sending test notification:', error);
      return false;
    }
  }
}

export default new PushNotificationService();
