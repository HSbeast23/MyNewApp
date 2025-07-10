import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem
} from '@react-navigation/drawer';

import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

// ✅ Screens
import HomeScreen from '../screens/HomeScreen';
import DonateBloodScreen from '../screens/DonateBloodScreen';
import RequestBloodScreen from '../screens/RequestBloodScreen';
import FounderScreen from '../screens/FounderScreen';
import AdvisorScreen from '../screens/AdvisorScreen';
import USaversNearScreen from '../screens/USaversNearScreen';
import MyProfileScreen from '../screens/MyProfileScreen';
import ReferFriendScreen from '../screens/ReferFriendScreen';
import DonateHistoryScreen from '../screens/DonateHistoryScreen';
import HospitalServicesScreen from '../screens/HospitalServicesScreen';
import BloodBankServiceScreen from '../screens/BloodBankServiceScreen';
import LanguagesScreen from '../screens/LanguagesScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import RateUsScreen from '../screens/RateUsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import LogoutScreen from '../screens/LogoutScreen';

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
      <Drawer.Screen name="DonateBlood" component={DonateBloodScreen} />
      <Drawer.Screen name="RequestBlood" component={RequestBloodScreen} />
      <Drawer.Screen name="Founder" component={FounderScreen} />
      <Drawer.Screen name="Advisor" component={AdvisorScreen} />
      <Drawer.Screen name="USavers Near" component={USaversNearScreen} />
      <Drawer.Screen name="My Profile" component={MyProfileScreen} />
      <Drawer.Screen name="Refer Friend" component={ReferFriendScreen} />
      <Drawer.Screen name="Donate History" component={DonateHistoryScreen} />
      <Drawer.Screen name="Hospital Services" component={HospitalServicesScreen} />
      <Drawer.Screen name="Blood Bank Service" component={BloodBankServiceScreen} />
      <Drawer.Screen name="Languages" component={LanguagesScreen} />
      <Drawer.Screen name="About Us" component={AboutUsScreen} />
      <Drawer.Screen name="Privacy Policy" component={PrivacyPolicyScreen} />
      <Drawer.Screen name="Rate Us" component={RateUsScreen} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="Logout" component={LogoutScreen} />
    </Drawer.Navigator>
  );
}

function CustomDrawerContent(props) {
  return (
    <View style={{ flex: 1, backgroundColor: '#b71c1c' }}>
      {/* HEADER */}
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

      {/* EVERYTHING SCROLLABLE */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}
      >
        <View style={{ flex: 1 }}>
          {props.state.routeNames.map((name, index) => (
            <DrawerItem
              key={index}
              label={getLabel(name)}
              icon={({ color, size }) => getIcon(name, color, size)}
              labelStyle={{ color: '#fff' }}
              onPress={() => props.navigation.navigate(name)}
            />
          ))}
        </View>
      </DrawerContentScrollView>
    </View>
  );
}

// ✅ Label names
function getLabel(name) {
  switch (name) {
    case 'DonateBlood': return 'Donate Blood';
    case 'RequestBlood': return 'Request Blood';
    default: return name;
  }
}

// ✅ Icons
function getIcon(name, color, size) {
  switch (name) {
    case 'Home': return <Ionicons name="home-outline" size={size} color={color} />;
    case 'DonateBlood': return <FontAwesome5 name="hand-holding-heart" size={size} color={color} />;
    case 'RequestBlood': return <Ionicons name="water-outline" size={size} color={color} />;
    case 'Founder': return <FontAwesome5 name="user-tie" size={size} color={color} />;
    case 'Advisor': return <Ionicons name="people-outline" size={size} color={color} />;
    case 'USavers Near': return <Ionicons name="location-outline" size={size} color={color} />;
    case 'My Profile': return <Ionicons name="person-circle-outline" size={size} color={color} />;
    case 'Refer Friend': return <Ionicons name="person-add-outline" size={size} color={color} />;
    case 'Donate History': return <Ionicons name="time-outline" size={size} color={color} />;
    case 'Hospital Services': return <MaterialIcons name="local-hospital" size={size} color={color} />;
    case 'Blood Bank Service': return <Ionicons name="water-outline" size={size} color={color} />;
    case 'Languages': return <Ionicons name="language-outline" size={size} color={color} />;
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

