import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

// ✅ Import Firebase Auth
import { auth } from '../services/auth'; // adjust your path
import { onAuthStateChanged } from 'firebase/auth';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // ✅ Wait 3 seconds before navigating
      setTimeout(() => {
        if (user) {
          console.log('✅ User logged in:', user.email);
          navigation.replace('MainDrawer');
        } else {
          console.log('🔒 No user logged in, go to Login.');
          navigation.replace('Login');
        }
      }, 3000); // 3000ms = 3 seconds
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/animations/blood_splash.json')}
        autoPlay
        loop={false}
        style={{ width: 300, height: 300 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // your theme color
    alignItems: 'center',
    justifyContent: 'center',
  },
});
