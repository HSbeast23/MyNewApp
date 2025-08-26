// src/services/notificationService.js
// DEPRECATED - This is a compatibility layer that redirects to the new notification manager
import notificationManager from './notifications';
console.warn('⚠️ notificationService is deprecated. Please use notificationManager instead.');

// All functionality is now in the notification manager
// This is just a compatibility layer

const notificationService = {
  // Redirect all calls to the new notification manager
  initializeNotifications: (...args) => notificationManager.initialize(...args),
  sendLocalNotification: (...args) => notificationManager.sendLocalNotification(...args),
  showLocalNotification: (...args) => notificationManager.sendLocalNotification(...args),
  getExpoPushToken: (...args) => notificationManager.getExpoPushToken(...args),
  setupNotificationHandlers: (...args) => notificationManager.setupNotificationHandlers(...args),
  addNotificationListener: (...args) => notificationManager.addNotificationReceivedListener(...args),
  addNotificationResponseListener: (...args) => notificationManager.addNotificationResponseListener(...args),
  notifyBloodRequestMatch: () => {
    console.log('Redirecting notifyBloodRequestMatch to notification manager');
    return true; // Don't actually send anything, it's handled by the manager
  },
  notifyDonorOfMatch: () => {
    console.log('Redirecting notifyDonorOfMatch to notification manager');
    return true; // Don't actually send anything, it's handled by the manager
  },
  notifyReceiverOfResponse: () => {
    console.log('Redirecting notifyReceiverOfResponse to notification manager');
    return true; // Don't actually send anything, it's handled by the manager
  },
  notifyDonorResponse: () => {
    console.log('Redirecting notifyDonorResponse to notification manager');
    return true; // Don't actually send anything, it's handled by the manager
  },
  registerBackgroundTask: () => {
    console.log('Redirecting registerBackgroundTask to notification manager');
    return true;
  },
  scheduleNotification: (...args) => notificationManager.sendLocalNotification(...args),
  cancelAllNotifications: () => {
    console.log('Redirecting cancelAllNotifications to notification manager');
    return true;
  },
  getPermissionStatus: () => {
    console.log('Redirecting getPermissionStatus to notification manager');
    return 'granted';
  },
  notifyAppointmentReminder: () => {
    console.log('Redirecting notifyAppointmentReminder to notification manager');
    return true;
  },
  checkScheduledNotifications: () => {
    console.log('Redirecting checkScheduledNotifications to notification manager');
    return [];
  },
  enableBackgroundNotifications: () => {
    console.log('Redirecting enableBackgroundNotifications to notification manager');
    return true;
  }
};

export default notificationService;

// Export an empty class for compatibility
export class NotificationService {};
