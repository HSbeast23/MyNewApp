import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/services/auth';

import AppNavigator from './src/navigation/AppNavigator';
import DrawerNavigator from './src/navigation/DrawerNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ✅ Show loader until fonts & auth are ready
  if (!fontsLoaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E53935" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <DrawerNavigator /> : <AppNavigator />}
    </NavigationContainer>
  );
}
