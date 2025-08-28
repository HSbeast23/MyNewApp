import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import LottieView from 'lottie-react-native';

import { auth, db } from '../services/auth'; // Make sure db is Firestore instance
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function SplashScreen({ navigation }) {
  const animationRef = useRef(null);
  
  useEffect(() => {
    // Ultimate fallback timer - make sure we never get stuck on splash
    const fallbackTimer = setTimeout(() => {
      console.log('⚠️ Fallback timer triggered - moving to Login');
      navigation.replace('Login');
    }, 10000); // 10 seconds fallback
    
    // Make sure auth state change listener is set up only once
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Adding a slight delay ensures the Lottie animation can play
      setTimeout(async () => {
        try {
          if (user) {
            console.log('✅ User logged in:', user.email);
            clearTimeout(fallbackTimer); // Clear fallback timer

            try {
              // Safely fetch user document
              const userDocRef = doc(db, 'users', user.uid);
              let userDocSnap;
              
              try {
                userDocSnap = await getDoc(userDocRef);
              } catch (fetchError) {
                console.error('Error fetching user document:', fetchError);
                navigation.replace('PersonalDetails');
                return;
              }

              if (userDocSnap && userDocSnap.exists()) {
                const data = userDocSnap.data();
                
                // Check if user is an admin
                if (data.isAdmin) {
                  navigation.replace('AdminPanel'); // Navigate to admin panel
                } else if (data.profileComplete) {
                  navigation.replace('MainDrawer'); // Profile done → Home
                } else {
                  navigation.replace('PersonalDetails'); // Profile incomplete → PersonalDetails form
                }
              } else {
                navigation.replace('PersonalDetails'); // No doc → PersonalDetails
              }
            } catch (error) {
              console.log('Firestore fetch error:', error);
              navigation.replace('PersonalDetails');
            }
          } else {
            console.log('🔒 No user logged in, go to Login.');
            clearTimeout(fallbackTimer); // Clear fallback timer
            navigation.replace('Login');
          }
        } catch (e) {
          console.log('Error in authentication flow:', e);
          clearTimeout(fallbackTimer); // Clear fallback timer
          navigation.replace('Login'); // Fallback to login
          
          // Log additional diagnostics to help debug issues
          console.log('Device info:', Platform.OS, Platform.Version);
          console.log('App state:', { auth: !!auth, db: !!db });
        }
      }, 3000);
    });

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, [navigation]);

  // Load the Lottie animation with error handling
  let lottieSource;
  try {
    lottieSource = require('../../assets/animations/blood_splash.json');
  } catch (e) {
    console.error('Failed to load Lottie animation:', e);
    // We'll handle this in the render
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
        />
      ) : (
        // Fallback if animation doesn't load
        <View style={{ width: 300, height: 300, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#b71c1c', fontSize: 24, fontWeight: 'bold' }}>BLOOD-LINK</Text>
        </View>
      )}
      <ActivityIndicator 
        size="small" 
        color="#b71c1c" 
        style={styles.loader}
      />
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
  loader: {
    marginTop: 20,
  },
});
