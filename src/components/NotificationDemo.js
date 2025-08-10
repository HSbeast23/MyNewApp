// src/components/NotificationDemo.js
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import notificationService from '../services/notificationService';

export default function NotificationDemo() {
  useEffect(() => {
    // Set up notification listeners
    const notificationListener = notificationService.addNotificationListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseListener = notificationService.addNotificationResponseListener(response => {
      console.log('Notification response:', response);
      // Handle notification tap
      if (response.notification.request.content.data?.type === 'blood_request') {
        Alert.alert('Blood Request', 'Opening blood request details...');
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const testLocalNotification = async () => {
    const success = await notificationService.sendLocalNotification(
      '🩸 Test Notification',
      'This is a test notification that works in Expo Go!'
    );
    
    if (success) {
      Alert.alert('Success', 'Local notification sent! Check your notification panel.');
    } else {
      Alert.alert('Error', 'Failed to send notification. Check permissions.');
    }
  };

  const testBloodRequestNotification = async () => {
    const success = await notificationService.notifyBloodRequestMatch(
      'John Doe',
      'A+',
      'Chennai'
    );
    
    if (success) {
      Alert.alert('Success', 'Blood request notification sent!');
    }
  };

  const checkPermissions = async () => {
    const status = await notificationService.getPermissionStatus();
    Alert.alert('Permission Status', `Current status: ${status}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Demo</Text>
      <Text style={styles.subtitle}>Works in Expo Go! 🎉</Text>
      
      <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
        <Text style={styles.buttonText}>Test Local Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testBloodRequestNotification}>
        <Text style={styles.buttonText}>Test Blood Request Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={checkPermissions}>
        <Text style={styles.buttonText}>Check Permissions</Text>
      </TouchableOpacity>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ✅ Local notifications work in Expo Go{'\n'}
          ❌ Push notifications require development build{'\n'}
          🔔 Tap buttons above to test notifications
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
});
