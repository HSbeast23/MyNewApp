// src/navigation/AppNavigator.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
// import WelcomeScreen from '../screens/WelcomeScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LoginScreen from '../screens/LoginScreen';
import PersonalDetailsScreen from '../screens/PersonalDetailsScreen';
import AdminSetup from '../screens/admin/AdminSetup';
import EnableLocationScreen from '../screens/EnableLocationScreen';

// User and Admin Navigators
import DrawerNavigator from './DrawerNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      {/* <Stack.Screen name="Welcome" component={WelcomeScreen} /> */}
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
  <Stack.Screen name="EnableLocation" component={EnableLocationScreen} />
      <Stack.Screen name="AdminSetup" component={AdminSetup} />

      {/* Regular user navigation */}
      <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
      
      {/* Admin navigation */}
      <Stack.Screen name="AdminPanel" component={AdminNavigator} />
    </Stack.Navigator>
  );
}
