import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

import { auth, db } from '../services/auth'; // Make sure db is Firestore instance
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setTimeout(async () => {
        if (user) {
          console.log('✅ User logged in:', user.email);

          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
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
          navigation.replace('Login');
        }
      }, 3000);
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
