import React from 'react';
import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// ✅ Screens
import HomeScreen from '../screens/HomeScreen';
import DonateBloodForm from '../screens/DonateBloodScreen'; // ✅ correct
import BloodRequestForm from '../screens/RequestBloodScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import DonateHistoryScreen from '../screens/DonateHistoryScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import RateUsScreen from '../screens/RateUsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

import { signOutUser } from '../services/auth';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#fff',
        drawerLabelStyle: {
          marginLeft: -20,
          fontSize: 15,
          fontFamily: 'Poppins_500Medium',
        },
        drawerStyle: {
          backgroundColor: '#b71c1c',
          width: 280,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="DonateBlood" component={DonateBloodForm} />
      <Drawer.Screen name="RequestBlood" component={BloodRequestForm} />
      <Drawer.Screen name="My Profile" component={MyProfileScreen} />
      <Drawer.Screen name="Donate History" component={DonateHistoryScreen} />
      <Drawer.Screen name="About Us" component={AboutUsScreen} />
      <Drawer.Screen name="Privacy Policy" component={PrivacyPolicyScreen} />
      <Drawer.Screen name="Rate Us" component={RateUsScreen} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
    </Drawer.Navigator>
  );
}

function CustomDrawerContent(props) {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await signOutUser();
      Alert.alert('Logged out', 'You have been logged out.');
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Error', 'Something went wrong while logging out.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#b71c1c' }}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
          />
        </View>
        <Text style={styles.title}>BLOOD-LINK</Text>
        <Text style={styles.subtitle}>Noble to save life</Text>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}
      >
        <View style={{ flex: 1 }}>
          {props.state.routeNames
            .filter(name => name !== 'Logout')
            .map((name, index) => (
              <DrawerItem
                key={index}
                label={getLabel(name)}
                icon={({ color, size }) => getIcon(name, color, size)}
                labelStyle={{ color: '#fff' }}
                onPress={() => props.navigation.navigate(name)}
              />
            ))}
          <DrawerItem
            label="Logout"
            icon={({ color, size }) => getIcon('Logout', color, size)}
            labelStyle={{ color: '#fff' }}
            onPress={handleLogout}
          />
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

function getLabel(name) {
  switch (name) {
    case 'DonateBlood': return 'Donate Blood';
    case 'RequestBlood': return 'Request Blood';
    default: return name;
  }
}

function getIcon(name, color, size) {
  switch (name) {
    case 'Home': return <Ionicons name="home-outline" size={size} color={color} />;
    case 'DonateBlood': return <FontAwesome5 name="hand-holding-heart" size={size} color={color} />;
    case 'RequestBlood': return <Ionicons name="water-outline" size={size} color={color} />;
    case 'My Profile': return <Ionicons name="person-circle-outline" size={size} color={color} />;
    case 'Donate History': return <Ionicons name="time-outline" size={size} color={color} />;
    case 'About Us': return <Ionicons name="information-circle-outline" size={size} color={color} />;
    case 'Privacy Policy': return <Ionicons name="shield-checkmark-outline" size={size} color={color} />;
    case 'Rate Us': return <Ionicons name="star-outline" size={size} color={color} />;
    case 'Notifications': return <Ionicons name="notifications-outline" size={size} color={color} />;
    case 'Logout': return <Feather name="log-out" size={size} color={color} />;
    default: return null;
  }
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#b71c1c',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
});
