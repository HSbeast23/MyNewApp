import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { signOutUser } from '../services/auth'; // ✅ this helper signs out Google & Firebase!
import { useNavigation } from '@react-navigation/native';

export default function LogoutScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await signOutUser();
        console.log('✅ User signed out from Google & Firebase.');
        Alert.alert('Logged Out', 'You have been signed out.');
        navigation.replace('Login'); // ✅ or 'SignUp'
      } catch (error) {
        console.log(error);
        Alert.alert('Error', 'Could not sign out.');
      }
    };
````
    doLogout();
  }, []);

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
