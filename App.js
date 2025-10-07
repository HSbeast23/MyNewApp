import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { Asset } from 'expo-asset';
import LottieView from 'lottie-react-native';

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
  const [showLottieSplash, setShowLottieSplash] = useState(true);
  const navigationRef = useRef(null);
  const lottieRef = useRef(null);

  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
  });

  // Preload assets (images and animations) before displaying app
  const cacheImages = useCallback(async () => {
    try {
      // Important images to preload
      const images = [
        require('./assets/icon.jpg'),
        require('./assets/images/splash.png'),
        require('./assets/logo.jpg'),
      ];
      
      // Preload adaptive icon - we know it's .jpg
      try {
        images.push(require('./assets/adaptive-icon.jpg'));
      } catch (e) {
        if (__DEV__) {
          console.log('Adaptive icon not found, skipping preload');
        }
      }
      
      // Preload images
      const imageAssets = images.map(image => Asset.fromModule(image).downloadAsync());
      
      // For Lottie animations, we just need to make sure the file exists
      // We can't preload JSON like an Asset, so we'll just check if it exists
      let lottieFileExists = false;
      try {
        // Just require the file to verify it exists
        const lottieAnimation = require('./assets/animations/blood_splash.json');
        lottieFileExists = true;
        if (__DEV__) {
          console.log('Lottie animation file found');
        }
      } catch (e) {
        console.warn('Lottie animation file not found:', e);
      }
      
      await Promise.all([...imageAssets]);
      if (__DEV__) {
        console.log('Assets preloaded successfully');
      }
      return true;
    } catch (e) {
      console.warn('Error preloading assets:', e);
      return true; // Return true anyway to avoid blocking the app
    }
  }, []);

  // When fonts loaded, set app ready and hide splash
  useEffect(() => {
    const prepare = async () => {
      try {
        // Cache important assets first
        await cacheImages();
        
        // Wait for fonts to load with a timeout
        if (fontsLoaded) {
          if (__DEV__) {
            console.log('Fonts loaded successfully');
          }
          // Add a small delay to ensure all resources are loaded
          await new Promise(resolve => setTimeout(resolve, 200));
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn("App preparation error:", e);
        if (fontsLoaded || fontError) {
          setAppIsReady(true);
        } else {
          // Ensure we don't get stuck if fonts fail to load
          setTimeout(() => {
            if (__DEV__) {
              console.log('Fallback timer for font loading triggered');
            }
            setAppIsReady(true);
          }, 3000); // Fallback after 3 seconds
        }
      }
    };
    
    // Set ultimate fallback timer to prevent being stuck on splash screen
    const fallbackTimer = setTimeout(() => {
      if (__DEV__) {
        console.log('Ultimate fallback timer triggered');
      }
      setAppIsReady(true);
    }, 8000);
    
    prepare();
    
    return () => clearTimeout(fallbackTimer);
  }, [fontsLoaded, fontError, cacheImages]);

  // Handle Lottie splash animation completion
  const handleLottieAnimationFinish = useCallback(() => {
    setShowLottieSplash(false);
  }, []);

  // Prevent UI flicker — hide splash only after root view is laid out
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error hiding splash screen:', e);
      }
    }
  }, [appIsReady]);

  // Navigation setup
  const onNavigationReady = useCallback(() => {
    // Navigation ready - no additional setup needed
  }, []);
  
  // Early return with loading state
  if (!appIsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#b71c1c" />
      </View>
    ); // Fallback loading indicator in case splash doesn't show
  }
  
  // Show Lottie splash animation after the native splash
  if (showLottieSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <LottieView
          ref={lottieRef}
          source={require('./assets/animations/blood_splash.json')}
          autoPlay
          loop={false}
          style={{ width: 300, height: 300 }}
          onAnimationFinish={handleLottieAnimationFinish}
        />
      </View>
    );
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
