import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

import AppNavigator from './src/navigation/AppNavigator';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { auth } from './src/services/auth';

SplashScreen.preventAutoHideAsync(); // Keep splash screen visible while loading

// Define theme outside the component to avoid recreation on each render
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#b71c1c',
    accent: '#e74c3c',
  },
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const navigationRef = useRef(null);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  // Set up authentication state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // User authentication handled - no push notifications needed
    });
    
    return () => unsubscribe();
  }, []);

  // When fonts loaded, set app ready and hide splash
  useEffect(() => {
    const prepare = async () => {
      try {
        // Wait for fonts to load
        if (fontsLoaded) {
          setAppIsReady(true);
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn("App preparation error:", e);
        if (fontsLoaded) {
          setAppIsReady(true);
          await SplashScreen.hideAsync();
        }
      }
    };
    
    prepare();
  }, [fontsLoaded]);

  // Prevent UI flicker — hide splash only after root view is laid out
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Navigation setup
  const onNavigationReady = useCallback(() => {
    // Navigation ready - no additional setup needed
  }, []);
  
  // Early return with loading state
  if (!appIsReady) {
    return null; // Keep splash visible
  }
  
  return (
    <PaperProvider theme={theme}>
      <LanguageProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
            <AppNavigator />
          </NavigationContainer>
        </View>
      </LanguageProvider>
    </PaperProvider>
  );
}
