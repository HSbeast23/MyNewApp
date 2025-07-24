// App.js
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LogBox } from 'react-native';

// Vector fonts support
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

LogBox.ignoreLogs(['Setting a timer']); // optional to clean warning

export default function App() {
  // ✅ Fonts Load
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    ...Ionicons.font,
    ...FontAwesome5.font,
  });

  useEffect(() => {
    // ✅ Google Sign-In
    GoogleSignin.configure({
      webClientId: '28623926287-ia50k6mpp036r640l2v820bneju10bih.apps.googleusercontent.com',
      offlineAccess: true,
    });

    // 🚫 Push Notification setup temporarily removed
    // to avoid EAS/FCM config issues
  }, []);

  if (!fontsLoaded) return null;

  return <AppNavigator />;
}
