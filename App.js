// App.js
import 'react-native-reanimated'; // Must be first
import React, { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { LogBox, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Fonts & Icons
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

// Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Silence timer warnings (optional)
LogBox.ignoreLogs(['Setting a timer']);

// ✅ Notification handler setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    ...Ionicons.font,
    ...FontAwesome5.font,
  });

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // ✅ Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '675390254350-damalk9bl472c3qr3pan12krc2gano7u.apps.googleusercontent.com',
      offlineAccess: true,
    });

    // ✅ Register for push notifications
    registerForPushNotificationsAsync();

    // ✅ Notification event listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification Received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 User interacted with notification:', response);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  if (!fontsLoaded) return null;

  return <AppNavigator />;
}

// ✅ Register device for push notifications
async function registerForPushNotificationsAsync() {
  console.log('📡 Running registerForPushNotificationsAsync...');

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('❌ Failed to get push token for notifications!');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    console.log('✅ Expo Push Token:', tokenData.data);
  } else {
    alert('⚠️ Must use a physical device for push notifications');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}
