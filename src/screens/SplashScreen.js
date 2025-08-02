// src/screens/SplashScreen.js

import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { auth } from '../services/auth';
import { onAuthStateChanged } from 'firebase/auth';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          console.log('✅ User found:', user.email);
          navigation.replace('MainDrawer');
        } else {
          console.log('🔒 No user, redirecting to Login...');
          navigation.replace('Login');
        }
      });
    }, 2500); // Wait 2.5 sec to show splash

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/animations/blood_splash.json')}
        autoPlay
        loop={false}
        style={{ width: 300, height: 300 }}
        onAnimationFinish={() => console.log('✅ Lottie animation finished')}
      />
      <Text style={styles.text}>Initializing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Theme color
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    color: '#999',
    marginTop: 20,
  },
});
