// App.js
import React, { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LogBox, Platform } from 'react-native';

// Fonts & Icons
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

// ✅ Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

LogBox.ignoreLogs(['Setting a timer']); // optional to clean warning

// ✅ Notification handler config
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
    // ✅ Google Sign-In
    GoogleSignin.configure({
      webClientId: '28623926287-ia50k6mpp036r640l2v820bneju10bih.apps.googleusercontent.com',
      offlineAccess: true,
    });

    // ✅ Push Notification Registration
    registerForPushNotificationsAsync();

    // ✅ Listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification Received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  if (!fontsLoaded) return null;

  return <AppNavigator />;
}

// ✅ Register for push notifications
async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notifications!');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}
