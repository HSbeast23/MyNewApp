import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';

import { auth, db } from '../services/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function AppSplashScreen({ navigation }) {
  const animationRef = useRef(null);
  const [appIsReady, setAppIsReady] = useState(false);
  
  useEffect(() => {
    async function prepare() {
      try {
        // Shorter timeout - 3 seconds max
        const fallbackTimer = setTimeout(() => {
          console.log('⚠️ Fallback timer triggered - moving to Login');
          navigation.replace('Login');
          setAppIsReady(true);
        }, 3000);
        
        // Listen to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          try {
            clearTimeout(fallbackTimer);
            
            if (user) {
              console.log('✅ User logged in:', user.email);

              try {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap && userDocSnap.exists()) {
                  const data = userDocSnap.data();
                  
                  // Navigate based on user role and profile status
                  if (data.isAdmin) {
                    navigation.replace('AdminPanel');
                  } else if (data.profileComplete) {
                    navigation.replace('MainDrawer');
                  } else {
                    navigation.replace('PersonalDetails');
                  }
                } else {
                  navigation.replace('PersonalDetails');
                }
              } catch (error) {
                console.log('Firestore fetch error:', error);
                navigation.replace('PersonalDetails');
              }
            } else {
              console.log('🔒 No user logged in, go to Login.');
              navigation.replace('Login');
            }
            
            setAppIsReady(true);
          } catch (e) {
            console.log('Error in authentication flow:', e);
            navigation.replace('Login');
            setAppIsReady(true);
          }
        });

        return () => {
          clearTimeout(fallbackTimer);
          unsubscribe();
        };
      } catch (e) {
        console.warn(e);
        navigation.replace('Login');
        setAppIsReady(true);
      } finally {
        // Hide the native splash screen after 1 second minimum
        setTimeout(async () => {
          await SplashScreen.hideAsync();
        }, 1000);
      }
    }

    prepare();
  }, [navigation]);

  // Load the Lottie animation with error handling
  let lottieSource;
  try {
    lottieSource = require('../../assets/animations/blood_splash.json');
  } catch (e) {
    console.error('Failed to load Lottie animation:', e);
  }

  return (
    <View style={styles.container}>
      {lottieSource ? (
        <LottieView
          ref={animationRef}
          source={lottieSource}
          autoPlay
          loop={false}
          style={{ width: 300, height: 300 }}
          onAnimationFinish={() => console.log('Animation finished')}
          resizeMode="contain"
          speed={1.5}
        />
      ) : (
        <View style={{ width: 300, height: 300, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#b71c1c', fontSize: 32, fontWeight: 'bold' }}>BloodLink</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
