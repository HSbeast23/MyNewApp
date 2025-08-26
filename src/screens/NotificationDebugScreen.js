import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { auth } from '../services/auth';
import notificationService from '../services/notifications';

export default function NotificationDebugScreen() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Unknown');
  const [expoPushToken, setExpoPushToken] = useState('None');
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    checkPermissions();
    getExpoPushToken();
  }, []);
  
  // Add a log entry with timestamp
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`[${timestamp}] ${message}`, ...prevLogs]);
  };
  
  // Check notification permissions
  const checkPermissions = async () => {
    try {
      setLoading(true);
      addLog('Checking notification permissions...');
      
      const settings = await Notifications.getPermissionsAsync();
      setStatus(JSON.stringify(settings, null, 2));
      
      addLog(`Permission status: ${settings.status}`);
      addLog(`Can request permission: ${settings.canAskAgain}`);
      
      setLoading(false);
    } catch (error) {
      addLog(`Error checking permissions: ${error.message}`);
      setLoading(false);
      Alert.alert('Error', `Failed to check permissions: ${error.message}`);
    }
  };
  
  // Request notification permissions
  const requestPermissions = async () => {
    try {
      setLoading(true);
      addLog('Requesting notification permissions...');
      
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {},
      });
      
      addLog(`Permission request result: ${status}`);
      await checkPermissions();
      
      setLoading(false);
    } catch (error) {
      addLog(`Error requesting permissions: ${error.message}`);
      setLoading(false);
      Alert.alert('Error', `Failed to request permissions: ${error.message}`);
    }
  };
  
  // Get Expo push token
  const getExpoPushToken = async () => {
    try {
      addLog('Getting Expo push token...');
      
      if (!Device.isDevice) {
        addLog('Push notifications are only available on physical devices');
        setExpoPushToken('Not available on simulator/emulator');
        return;
      }
      
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      addLog(`Project ID: ${projectId || 'Not found'}`);
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId
      });
      
      setExpoPushToken(token.data);
      addLog(`Successfully retrieved token: ${token.data.substring(0, 10)}...`);
    } catch (error) {
      addLog(`Error getting push token: ${error.message}`);
      Alert.alert('Error', `Failed to get push token: ${error.message}`);
    }
  };
  
  // Test channels setup
  const testChannels = async () => {
    try {
      setLoading(true);
      addLog('Setting up notification channels...');
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('debug-channel', {
          name: 'Debug Notifications',
          description: 'Notifications for debugging purposes',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF0000',
          sound: 'default',
        });
        
        addLog('Debug channel created successfully');
      } else {
        addLog('Channels are only needed on Android');
      }
      
      setLoading(false);
    } catch (error) {
      addLog(`Error setting up channels: ${error.message}`);
      setLoading(false);
      Alert.alert('Error', `Failed to set up channels: ${error.message}`);
    }
  };
  
  // Test sending a local notification
  const testLocalNotification = async () => {
    try {
      setLoading(true);
      addLog('Sending local notification...');
      
      // Schedule notification to show immediately
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification',
          body: 'This is a test notification from the debug screen.',
          data: { screen: 'NotificationsScreen' },
          sound: 'default',
          badge: 1,
        },
        trigger: null, // Show immediately
      });
      
      addLog(`Local notification sent with ID: ${notificationId}`);
      setLoading(false);
    } catch (error) {
      addLog(`Error sending notification: ${error.message}`);
      setLoading(false);
      Alert.alert('Error', `Failed to send notification: ${error.message}`);
    }
  };
  
  // Test using notification service
  const testServiceNotification = async () => {
    try {
      setLoading(true);
      addLog('Testing notification service...');
      
      // Initialize if not done already
      if (auth.currentUser) {
        await notificationService.initialize(auth.currentUser.uid);
        addLog('Notification service initialized');
      } else {
        addLog('Warning: No user logged in for notification service');
      }
      
      // Send notification using service
      const notificationId = await notificationService.sendLocalNotification(
        'Service Notification',
        'This notification was sent through the notification service.',
        { type: 'test', screen: 'NotificationsScreen' },
        'default'
      );
      
      addLog(`Service notification sent with ID: ${notificationId || 'unknown'}`);
      setLoading(false);
    } catch (error) {
      addLog(`Error with service notification: ${error.message}`);
      setLoading(false);
      Alert.alert('Error', `Failed with service notification: ${error.message}`);
    }
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Permissions</Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expo Push Token</Text>
          <Text style={styles.tokenText}>{expoPushToken}</Text>
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={checkPermissions}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Check Permissions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={requestPermissions}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={testChannels}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Channels</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={testLocalNotification}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Local Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={testServiceNotification}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test Service Notification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.clearButton]} 
            onPress={clearLogs}
          >
            <Text style={styles.buttonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          {logs.length === 0 ? (
            <Text style={styles.emptyLog}>No logs yet</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))
          )}
        </View>
      </ScrollView>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#b71c1c" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'monospace',
  },
  tokenText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'monospace',
    flexWrap: 'wrap',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#b71c1c',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: '48%',
    elevation: 2,
  },
  clearButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyLog: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  logText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
