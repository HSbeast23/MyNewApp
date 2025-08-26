// src/components/NotificationDiagnostics.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import notificationManager from '../services/notifications';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationDiagnostics() {
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  async function checkPermissions() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const result = {
        status,
        isOk: status === 'granted'
      };
      setResults(prev => ({ ...prev, permissions: result }));
      return result.isOk;
    } catch (error) {
      const result = {
        status: 'error',
        error: error.message,
        isOk: false
      };
      setResults(prev => ({ ...prev, permissions: result }));
      return false;
    }
  }

  async function checkPushToken() {
    try {
      // First check in AsyncStorage
      const storedToken = await AsyncStorage.getItem('expoPushToken');
      
      // Then get current token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      const result = {
        storedToken,
        currentToken: tokenData.data,
        isOk: !!tokenData.data
      };
      
      setResults(prev => ({ ...prev, pushToken: result }));
      return result.isOk;
    } catch (error) {
      const result = {
        error: error.message,
        isOk: false
      };
      setResults(prev => ({ ...prev, pushToken: result }));
      return false;
    }
  }

  async function checkNotificationChannels() {
    if (Platform.OS !== 'android') {
      const result = {
        message: 'Not on Android, channels not applicable',
        isOk: true
      };
      setResults(prev => ({ ...prev, channels: result }));
      return true;
    }
    
    try {
      const channels = await Notifications.getNotificationChannelsAsync();
      
      // Check for required channels
      const requiredChannels = ['blood-requests', 'donor-responses'];
      const missingChannels = requiredChannels.filter(
        required => !channels.some(c => c.id === required)
      );
      
      const result = {
        channels: channels.map(c => ({
          id: c.id,
          name: c.name,
          importance: c.importance
        })),
        missingChannels,
        isOk: missingChannels.length === 0
      };
      
      setResults(prev => ({ ...prev, channels: result }));
      return result.isOk;
    } catch (error) {
      const result = {
        error: error.message,
        isOk: false
      };
      setResults(prev => ({ ...prev, channels: result }));
      return false;
    }
  }

  async function checkUserProfile() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        const result = {
          message: 'No user logged in',
          isOk: false
        };
        setResults(prev => ({ ...prev, userProfile: result }));
        return false;
      }
      
      const result = {
        userId: currentUser.uid,
        email: currentUser.email,
        donor: null,
        requests: null,
        userDoc: null,
        isOk: true
      };
      
      // Check in users collection
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          result.userDoc = {
            hasPushToken: !!userData.pushToken,
            emailVerified: !!userData.emailVerified,
            isAdmin: !!userData.isAdmin,
            bloodGroup: userData.bloodGroup,
            city: userData.city
          };
          
          if (!userData.pushToken) {
            result.isOk = false;
          }
        } else {
          result.userDoc = {
            exists: false
          };
          result.isOk = false;
        }
      } catch (e) {
        result.userDoc = { error: e.message };
        result.isOk = false;
      }
      
      // Check if user is a donor
      try {
        const donorQuery = query(
          collection(db, 'BloodDonors'),
          where('uid', '==', currentUser.uid)
        );
        
        const donorSnapshot = await getDocs(donorQuery);
        if (!donorSnapshot.empty) {
          const donorData = donorSnapshot.docs[0].data();
          result.donor = {
            id: donorSnapshot.docs[0].id,
            bloodGroup: donorData.bloodGroup,
            city: donorData.city,
            hasPushToken: !!(donorData.pushToken || donorData.expoPushToken),
            isActive: !!donorData.isActive
          };
          
          if (!donorData.pushToken && !donorData.expoPushToken) {
            result.isOk = false;
          }
        } else {
          result.donor = { exists: false };
        }
      } catch (e) {
        result.donor = { error: e.message };
      }
      
      // Check for blood requests
      try {
        const requestQuery = query(
          collection(db, 'Bloodreceiver'),
          where('uid', '==', currentUser.uid)
        );
        
        const requestSnapshot = await getDocs(requestQuery);
        result.requests = {
          count: requestSnapshot.size
        };
        
        if (!requestSnapshot.empty) {
          const recentRequests = requestSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
            });
          
          if (recentRequests.length > 0) {
            result.requests.latest = {
              id: recentRequests[0].id,
              bloodGroup: recentRequests[0].bloodGroup,
              city: recentRequests[0].city,
              status: recentRequests[0].status,
              hasResponses: (recentRequests[0].responses?.length || 0) > 0
            };
          }
        }
      } catch (e) {
        result.requests = { error: e.message };
      }
      
      setResults(prev => ({ ...prev, userProfile: result }));
      return result.isOk;
    } catch (error) {
      const result = {
        error: error.message,
        isOk: false
      };
      setResults(prev => ({ ...prev, userProfile: result }));
      return false;
    }
  }

  async function testLocalNotification() {
    try {
      const identifier = await notificationManager.sendLocalNotification(
        '🔍 Diagnostic Test',
        'This is a test notification from the diagnostic tool.',
        { type: 'diagnostic_test' },
        'app-updates'
      );
      
      const result = {
        identifier,
        isOk: !!identifier
      };
      
      setResults(prev => ({ ...prev, testNotification: result }));
      return result.isOk;
    } catch (error) {
      const result = {
        error: error.message,
        isOk: false
      };
      setResults(prev => ({ ...prev, testNotification: result }));
      return false;
    }
  }

  async function runDiagnostics() {
    setIsRunning(true);
    setResults({});
    
    try {
      const permissionsOk = await checkPermissions();
      const tokenOk = await checkPushToken();
      const channelsOk = await checkNotificationChannels();
      const userOk = await checkUserProfile();
      const notificationOk = await testLocalNotification();
      
      const status = permissionsOk && tokenOk && channelsOk && userOk && notificationOk;
      setOverallStatus(status);
    } catch (error) {
      setResults(prev => ({ ...prev, error: error.message }));
      setOverallStatus(false);
    }
    
    setIsRunning(false);
  }

  useEffect(() => {
    // Auto-run diagnostics when component mounts
    runDiagnostics();
  }, []);

  const renderSectionHeader = (title, key, status) => {
    const isExpanded = expandedSection === key;
    const icon = status === undefined ? 'ellipsis-horizontal' : 
                 status ? 'checkmark-circle' : 'alert-circle';
    const color = status === undefined ? '#888' : 
                 status ? '#2ecc71' : '#e74c3c';
    
    return (
      <TouchableOpacity 
        style={styles.sectionHeader}
        onPress={() => setExpandedSection(isExpanded ? null : key)}
      >
        <View style={styles.headerLeft}>
          <Ionicons name={icon} size={24} color={color} style={styles.icon} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color="#666" 
        />
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification System Diagnostics</Text>
      
      {isRunning && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Running diagnostics...</Text>
        </View>
      )}
      
      {overallStatus !== null && (
        <View style={[styles.summaryContainer, 
          overallStatus ? styles.successContainer : styles.errorContainer
        ]}>
          <Ionicons 
            name={overallStatus ? 'checkmark-circle' : 'alert-circle'} 
            size={32} 
            color={overallStatus ? '#fff' : '#fff'} 
          />
          <Text style={styles.summaryText}>
            {overallStatus 
              ? 'Notification system is working properly' 
              : 'Issues detected with notification system'
            }
          </Text>
        </View>
      )}
      
      <View style={styles.resultsContainer}>
        {/* Permissions Section */}
        {renderSectionHeader('Notification Permissions', 'permissions', 
          results.permissions?.isOk)}
          
        {expandedSection === 'permissions' && results.permissions && (
          <View style={styles.sectionContent}>
            <Text style={styles.label}>Status: </Text>
            <Text style={styles.value}>{results.permissions.status}</Text>
            
            {!results.permissions.isOk && (
              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationTitle}>Recommendations:</Text>
                <Text style={styles.recommendation}>
                  - Go to device Settings  Apps  BloodLink  Notifications{'\n'}
                  - Enable notifications for the app
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Push Token Section */}
        {renderSectionHeader('Push Token', 'pushToken', 
          results.pushToken?.isOk)}
          
        {expandedSection === 'pushToken' && results.pushToken && (
          <View style={styles.sectionContent}>
            {results.pushToken.currentToken && (
              <>
                <Text style={styles.label}>Current Token: </Text>
                <Text style={styles.valueSmall}>{results.pushToken.currentToken}</Text>
              </>
            )}
            
            {results.pushToken.storedToken && (
              <>
                <Text style={styles.label}>Stored Token: </Text>
                <Text style={styles.valueSmall}>{results.pushToken.storedToken}</Text>
              </>
            )}
            
            {results.pushToken.error && (
              <>
                <Text style={styles.label}>Error: </Text>
                <Text style={styles.error}>{results.pushToken.error}</Text>
              </>
            )}
            
            {!results.pushToken.isOk && (
              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationTitle}>Recommendations:</Text>
                <Text style={styles.recommendation}>
                  - Reinstall the app{'\n'}
                  - Check internet connection{'\n'}
                  - Make sure Expo Push service is accessible
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Notification Channels Section */}
        {renderSectionHeader('Notification Channels', 'channels', 
          results.channels?.isOk)}
          
        {expandedSection === 'channels' && results.channels && (
          <View style={styles.sectionContent}>
            {results.channels.channels && (
              <>
                <Text style={styles.label}>Available Channels: </Text>
                {results.channels.channels.map((channel, index) => (
                  <Text key={index} style={styles.value}>
                    • {channel.name} (Importance: {channel.importance})
                  </Text>
                ))}
              </>
            )}
            
            {results.channels.missingChannels && 
             results.channels.missingChannels.length > 0 && (
              <>
                <Text style={styles.label}>Missing Channels: </Text>
                {results.channels.missingChannels.map((channel, index) => (
                  <Text key={index} style={styles.error}>• {channel}</Text>
                ))}
              </>
            )}
            
            {results.channels.message && (
              <Text style={styles.value}>{results.channels.message}</Text>
            )}
            
            {results.channels.error && (
              <>
                <Text style={styles.label}>Error: </Text>
                <Text style={styles.error}>{results.channels.error}</Text>
              </>
            )}
            
            {!results.channels.isOk && (
              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationTitle}>Recommendations:</Text>
                <Text style={styles.recommendation}>
                  - Restart the app{'\n'}
                  - Clear app data and cache{'\n'}
                  - Reinstall the app
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* User Profile Section */}
        {renderSectionHeader('User Profile', 'userProfile', 
          results.userProfile?.isOk)}
          
        {expandedSection === 'userProfile' && results.userProfile && (
          <View style={styles.sectionContent}>
            {results.userProfile.userId && (
              <>
                <Text style={styles.label}>User ID: </Text>
                <Text style={styles.valueSmall}>{results.userProfile.userId}</Text>
              </>
            )}
            
            {results.userProfile.email && (
              <>
                <Text style={styles.label}>Email: </Text>
                <Text style={styles.value}>{results.userProfile.email}</Text>
              </>
            )}
            
            {results.userProfile.userDoc && (
              <View style={styles.subsection}>
                <Text style={styles.subheader}>User Document:</Text>
                {results.userProfile.userDoc.exists === false ? (
                  <Text style={styles.error}>User document not found</Text>
                ) : (
                  <>
                    <Text style={styles.value}>
                      Push Token: {results.userProfile.userDoc.hasPushToken ? '✅' : '❌'}
                    </Text>
                    {results.userProfile.userDoc.bloodGroup && (
                      <Text style={styles.value}>
                        Blood Group: {results.userProfile.userDoc.bloodGroup}
                      </Text>
                    )}
                    {results.userProfile.userDoc.city && (
                      <Text style={styles.value}>
                        City: {results.userProfile.userDoc.city}
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}
            
            {results.userProfile.donor && (
              <View style={styles.subsection}>
                <Text style={styles.subheader}>Donor Profile:</Text>
                {results.userProfile.donor.exists === false ? (
                  <Text style={styles.value}>Not registered as donor</Text>
                ) : (
                  <>
                    <Text style={styles.value}>
                      Blood Group: {results.userProfile.donor.bloodGroup}
                    </Text>
                    <Text style={styles.value}>
                      City: {results.userProfile.donor.city}
                    </Text>
                    <Text style={styles.value}>
                      Push Token: {results.userProfile.donor.hasPushToken ? '✅' : '❌'}
                    </Text>
                    <Text style={styles.value}>
                      Status: {results.userProfile.donor.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </>
                )}
              </View>
            )}
            
            {results.userProfile.requests && (
              <View style={styles.subsection}>
                <Text style={styles.subheader}>Blood Requests:</Text>
                <Text style={styles.value}>
                  Total Requests: {results.userProfile.requests.count}
                </Text>
                
                {results.userProfile.requests.latest && (
                  <>
                    <Text style={styles.value}>
                      Latest Request: {results.userProfile.requests.latest.bloodGroup} in{' '}
                      {results.userProfile.requests.latest.city}
                    </Text>
                    <Text style={styles.value}>
                      Status: {results.userProfile.requests.latest.status}
                    </Text>
                    <Text style={styles.value}>
                      Has Responses: {results.userProfile.requests.latest.hasResponses ? 'Yes' : 'No'}
                    </Text>
                  </>
                )}
              </View>
            )}
            
            {results.userProfile.message && (
              <Text style={styles.error}>{results.userProfile.message}</Text>
            )}
            
            {results.userProfile.error && (
              <>
                <Text style={styles.label}>Error: </Text>
                <Text style={styles.error}>{results.userProfile.error}</Text>
              </>
            )}
            
            {!results.userProfile.isOk && (
              <View style={styles.recommendationContainer}>
                <Text style={styles.recommendationTitle}>Recommendations:</Text>
                <Text style={styles.recommendation}>
                  - Update your user profile{'\n'}
                  - Re-register as a donor{'\n'}
                  - Ensure your profile has a valid push token
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Test Notification Section */}
        {renderSectionHeader('Test Notification', 'testNotification', 
          results.testNotification?.isOk)}
          
        {expandedSection === 'testNotification' && results.testNotification && (
          <View style={styles.sectionContent}>
            {results.testNotification.identifier && (
              <>
                <Text style={styles.label}>Notification ID: </Text>
                <Text style={styles.value}>{results.testNotification.identifier}</Text>
                <Text style={styles.value}>
                  A test notification should have appeared on your device.
                </Text>
              </>
            )}
            
            {results.testNotification.error && (
              <>
                <Text style={styles.label}>Error: </Text>
                <Text style={styles.error}>{results.testNotification.error}</Text>
              </>
            )}
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.runButton}
        onPress={runDiagnostics}
        disabled={isRunning}
      >
        <Text style={styles.runButtonText}>Run Diagnostics Again</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  successContainer: {
    backgroundColor: '#2ecc71',
  },
  errorContainer: {
    backgroundColor: '#e74c3c',
  },
  summaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContent: {
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  value: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  valueSmall: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  error: {
    fontSize: 14,
    color: '#e74c3c',
    marginBottom: 8,
  },
  subsection: {
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  subheader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  recommendationContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff9db',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  recommendation: {
    fontSize: 14,
    color: '#666',
  },
  runButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  runButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
