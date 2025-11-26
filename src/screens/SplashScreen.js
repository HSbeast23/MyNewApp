import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { auth, db } from '../services/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AppSplashScreen({ navigation }) {
  const animationRef = useRef(null);
  
  useEffect(() => {
    let fallbackTimer;
    let unsubscribe = () => {};

    const prepare = async () => {
      try {
        // Shorter timeout - 3 seconds max
        fallbackTimer = setTimeout(() => {
          console.log('⚠️ Fallback timer triggered - moving to Login');
          navigation.replace('Login');
        }, 3000);

        // Listen to auth state changes
        unsubscribe = onAuthStateChanged(auth, async (user) => {
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
          } catch (e) {
            console.log('Error in authentication flow:', e);
            navigation.replace('Login');
          }
        });
      } catch (e) {
        console.warn(e);
        navigation.replace('Login');
      }
    };

    prepare();

    return () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      unsubscribe();
    };
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
