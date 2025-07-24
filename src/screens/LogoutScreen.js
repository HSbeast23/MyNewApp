// src/screens/LogoutScreen.js
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { signOutUser } from '../services/auth';
import { useNavigation } from '@react-navigation/native';

export default function LogoutScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const doLogout = async () => {
      await signOutUser();
      navigation.replace('Login'); // or your login screen name
    };
    doLogout();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text>Logging you out...</Text>
    </View>
  );
}
