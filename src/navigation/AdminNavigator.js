import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem
} from '@react-navigation/drawer';

import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminAnalyticsScreen from '../screens/admin/AdminAnalyticsScreen';
import AdminUserManagementScreen from '../screens/admin/AdminUserManagementScreen';
import LogoutScreen from '../screens/LogoutScreen';

const Drawer = createDrawerNavigator();

export default function AdminNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#e74c3c',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#fff',
        drawerInactiveTintColor: '#fff',
        drawerLabelStyle: {
          marginLeft: -20,
          fontSize: 15,
          fontFamily: 'Poppins_500Medium',
        },
        drawerStyle: {
          backgroundColor: '#e74c3c', // Changed color to match theme
          width: 280,
        },
      }}
      drawerContent={(props) => <AdminDrawerContent {...props} />}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen} 
        options={{
          title: 'Admin Dashboard',
          headerRight: () => (
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Drawer.Screen 
        name="Analytics" 
        component={AdminAnalyticsScreen} 
        options={{
          title: 'Analytics',
        }}
      />
      <Drawer.Screen 
        name="UserManagement" 
        component={AdminUserManagementScreen} 
        options={{
          title: 'User Management',
        }}
      />
      <Drawer.Screen 
        name="Logout" 
        component={LogoutScreen} 
      />
    </Drawer.Navigator>
  );
}

function AdminDrawerContent(props) {
  return (
    <View style={{ flex: 1, backgroundColor: '#e74c3c' }}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={36} color="#e74c3c" />
          </View>
        </View>
        <Text style={styles.title}>ADMIN PANEL</Text>
        <Text style={styles.subtitle}>BloodLink Management</Text>
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
              label={name}
              icon={({ color, size }) => getAdminIcon(name, color, size)}
              labelStyle={{ color: '#fff' }}
              onPress={() => props.navigation.navigate(name)}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            // Go back to the main app by navigating to MainDrawer
            // This requires navigating up to the root navigator first
            props.navigation.getParent()?.navigate('MainDrawer');
          }}
        >
          <Ionicons name="arrow-back-outline" size={20} color="#fff" />
          <Text style={styles.backButtonText}>Back to App</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>
    </View>
  );
}

// Admin Icons
function getAdminIcon(name, color, size) {
  switch (name) {
    case 'Dashboard': return <MaterialIcons name="dashboard" size={size} color={color} />;
    case 'Analytics': return <Ionicons name="analytics-outline" size={size} color={color} />;
    case 'UserManagement': return <Ionicons name="people" size={size} color={color} />;
    case 'Logout': return <Feather name="log-out" size={size} color={color} />;
    default: return null;
  }
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#e74c3c',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  adminBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  headerButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
  },
});
