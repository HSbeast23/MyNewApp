import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';

// ✅ Import Firebase Auth
import { auth } from '../services/auth'; // adjust the path!
import { signOut } from 'firebase/auth';

export default function LogoutScreen({ navigation }) {
  useEffect(() => {
    const doLogout = async () => {
      try {
        await signOut(auth);
        console.log('✅ User signed out.');
        Alert.alert('Logged Out', 'You have been signed out.');
        navigation.replace('Login'); // ✅ Go back to LoginScreen
      } catch (error) {
        console.log(error);
        Alert.alert('Error', 'Could not sign out.');
      }
    };

    doLogout();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Logging you out...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, fontWeight: 'bold' },
});
