import React from 'react';
import { useFonts } from 'expo-font'; // ✅ Use expo-font
import AppNavigator from './src/navigation/AppNavigator';

// ✅ Import the vector icon fonts you use
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,

    // ✅ Add vector icon fonts here
    ...Ionicons.font,
    ...FontAwesome5.font,
  });

  if (!fontsLoaded) {
    return null; // Or a splash screen
  }

  return <AppNavigator />;
}
