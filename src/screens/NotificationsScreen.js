import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import { sendPushNotification } from '../services/notificationService';
import notificationService from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';

export default function NotificationScreen() {
  const { t, currentLanguage } = useTranslation();
  const [userRole, setUserRole] = useState(null); // 'donor' or 'receiver'
  const [userCity, setUserCity] = useState('');
  const [userBloodGroup, setUserBloodGroup] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [requests, setRequests] = useState([]); // For donor: matched requests
  const [responses, setResponses] = useState([]); // For receiver: donor responses
  const [newNotificationCount, setNewNotificationCount] = useState(0);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Fetch user details and determine role based on RECENT activity
  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch user profile from users collection
        const userQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserProfile(userData);
          setUserCity(userData.city);
          setUserBloodGroup(userData.bloodGroup);
        } else {
          // Try to get user data from document ID
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserProfile(userData);
              setUserCity(userData.city);
              setUserBloodGroup(userData.bloodGroup);
            }
          } catch (error) {
            console.log('Error fetching user profile:', error);
          }
        }

        // Check for blood requests (receiver) - simplified query without composite index
        const requestsQuery = query(
          collection(db, 'Bloodreceiver'),
          where('uid', '==', user.uid)
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        // Check for donations (donor) - simplified query without composite index
        const donationsQuery = query(
          collection(db, 'BloodDonors'),
          where('uid', '==', user.uid)
        );
        const donationsSnapshot = await getDocs(donationsQuery);

        // Determine role based on most recent activity (client-side filtering)
        if (!requestsSnapshot.empty || !donationsSnapshot.empty) {
          const requests = requestsSnapshot.docs.map(doc => ({ ...doc.data(), type: 'request' }));
          const donations = donationsSnapshot.docs.map(doc => ({ ...doc.data(), type: 'donation' }));
          
          // Combine and sort by creation time
          const allActivity = [...requests, ...donations]
            .filter(item => item.createdAt) // Only items with timestamp
            .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
          
          if (allActivity.length > 0) {
            // Set role based on most recent activity
            const mostRecent = allActivity[0];
            setUserRole(mostRecent.type === 'request' ? 'receiver' : 'donor');
          } else {
            // Fallback: if user has requests, they're a receiver
            setUserRole(!requestsSnapshot.empty ? 'receiver' : 'donor');
          }
        } else {
          // No activity found, default to donor
          setUserRole('donor');
        }
      } catch (error) {
        console.log('Error fetching user details:', error);
        // If there's an error, try to get basic user profile at least
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            setUserCity(userData.city || '');
            setUserBloodGroup(userData.bloodGroup || '');
            setUserRole('donor'); // Default role if we can't determine from activity
          } else {
            // No user data found at all
            setUserRole(null);
            setUserCity('');
            setUserBloodGroup('');
          }
        } catch (fallbackError) {
          console.log('Fallback user fetch also failed:', fallbackError);
          setUserRole(null);
          setUserCity('');
          setUserBloodGroup('');
        }
      }
    };
    fetchUserDetails();
  }, []);

  // Listen for matched requests (donor) or responses (receiver)
  useEffect(() => {
    if (!userRole || !userCity || !userBloodGroup) return;

    if (userRole === 'donor') {
      // Donor: listen for blood requests matching city & bloodGroup that are still pending
      const q = query(
        collection(db, 'Bloodreceiver'),
        where('city', '==', userCity),
        where('bloodGroup', '==', userBloodGroup),
        where('status', '==', 'pending')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const matched = [];
        let newCount = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Only show requests that haven't been responded to by this donor
          const hasResponded = data.responses?.some(response => response.donorUid === auth.currentUser?.uid);
          if (!hasResponded) {
            matched.push({ id: doc.id, ...data });
            // Count new notifications (requests created in last 24 hours)
            const requestTime = data.createdAt?.toDate();
            if (requestTime && (Date.now() - requestTime.getTime()) < 24 * 60 * 60 * 1000) {
              newCount++;
            }
          }
        });
        
        setRequests(matched);
        setNewNotificationCount(newCount);
      });

      return () => unsubscribe();
    }

    if (userRole === 'receiver') {
      // Receiver: listen for responses on own requests
      const q = query(
        collection(db, 'Bloodreceiver'),
        where('uid', '==', auth.currentUser.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const updatedResponses = [];
        let newCount = 0;
        
        // Handle real-time changes for notifications
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const data = change.doc.data();
            if (data.responses && data.responses.length > 0) {
              // Check for new responses that haven't been seen
              data.responses.forEach((response) => {
                if (!response.seenByReceiver) {
                  // Show local notification for new response
                  notificationService.showLocalNotification(
                    'Donor Response',
                    `${response.donorName} has ${response.status} your blood request.`
                  );
                  
                  // Mark response as seen by receiver
                  const updatedResponses = data.responses.map(r => 
                    r.donorUid === response.donorUid ? { ...r, seenByReceiver: true } : r
                  );
                  
                  updateDoc(doc(db, 'Bloodreceiver', change.doc.id), {
                    responses: updatedResponses
                  }).catch(err => console.log('Error marking response as seen:', err));
                }
              });
            }
          }
        });
        
        // Collect all responses from all requests
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.responses && data.responses.length > 0) {
            // Add each response as a separate item with request context
            data.responses.forEach((response, index) => {
              updatedResponses.push({ 
                id: `${doc.id}_${index}`, 
                requestId: doc.id,
                ...response,
                requestData: {
                  purpose: data.purpose,
                  bloodGroup: data.bloodGroup,
                  bloodUnits: data.bloodUnits,
                  city: data.city,
                  requiredDateTime: data.requiredDateTime
                }
              });
              
              // Count unseen responses as new notifications
              if (!response.seenByReceiver) {
                newCount++;
              }
            });
          }
        });
        
        // Sort responses by most recent first
        updatedResponses.sort((a, b) => {
          const aTime = a.respondedAt?.toDate() || new Date(0);
          const bTime = b.respondedAt?.toDate() || new Date(0);
          return bTime - aTime;
        });
        
        setResponses(updatedResponses);
        setNewNotificationCount(newCount);
      });

      return () => unsubscribe();
    }
  }, [userRole, userCity, userBloodGroup]);

  // Send push notification to receiver device using Expo Push API
  async function sendPushNotification(expoPushToken, message) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: expoPushToken,
          sound: 'default',
          title: 'Blood Request Update',
          body: message,
          data: { screen: 'NotificationScreen' },
        }),
      });
    } catch (err) {
      console.log('Push notification error:', err);
    }
  }

  // Donor Accept handler
  const handleAccept = (requestId) => {
    Alert.alert(
      'Accept Blood Request',
      'Are you sure you want to accept this blood donation request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              const donorName = userProfile?.name || 'A donor';
              
              // Get current request data
              const requestDoc = await getDoc(doc(db, 'Bloodreceiver', requestId));
              if (!requestDoc.exists()) {
                Alert.alert('Error', 'Request not found');
                return;
              }
              
              const requestData = requestDoc.data();
              const newResponse = {
                donorUid: currentUser?.uid,
                donorName: donorName,
                donorMobile: userProfile?.mobile || userProfile?.phone || '',
                status: 'accepted',
                respondedAt: new Date(),
                seenByReceiver: false,
              };
              
              // Update the request with new response
              const updatedResponses = [...(requestData.responses || []), newResponse];
              const updatedSeenBy = [...(requestData.seenBy || []), currentUser?.uid];
              
              await updateDoc(doc(db, 'Bloodreceiver', requestId), {
                responses: updatedResponses,
                seenBy: updatedSeenBy,
                respondedBy: donorName,
                status: 'accepted',
                lastUpdated: new Date(),
              });

              // Send push notification to requester
              if (requestData.pushToken) {
                await sendPushNotification(
                  requestData.pushToken,
                  `🎉 Donor Found! ${donorName} has accepted your blood request. They will contact you soon.`
                );
              }

              Alert.alert('Success', 'You have accepted the blood donation request!');
            } catch (error) {
              Alert.alert('Error', 'Failed to accept request: ' + error.message);
            }
          },
        },
      ]
    );
  };

  // Donor Decline handler
  const handleDecline = (requestId) => {
    Alert.alert(
      'Decline Blood Request',
      'Are you sure you want to decline this blood donation request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              const donorName = userProfile?.name || 'A donor';
              
              // Get current request data
              const requestDoc = await getDoc(doc(db, 'Bloodreceiver', requestId));
              if (!requestDoc.exists()) {
                Alert.alert('Error', 'Request not found');
                return;
              }
              
              const requestData = requestDoc.data();
              const newResponse = {
                donorUid: currentUser?.uid,
                donorName: donorName,
                donorMobile: userProfile?.mobile || userProfile?.phone || '',
                status: 'declined',
                respondedAt: new Date(),
                seenByReceiver: false,
              };
              
              // Update the request with new response
              const updatedResponses = [...(requestData.responses || []), newResponse];
              const updatedSeenBy = [...(requestData.seenBy || []), currentUser?.uid];
              
              await updateDoc(doc(db, 'Bloodreceiver', requestId), {
                responses: updatedResponses,
                seenBy: updatedSeenBy,
                lastUpdated: serverTimestamp(),
              });

              // Send push notification to requester
              if (requestData.pushToken) {
                await sendPushNotification(
                  requestData.pushToken,
                  `❌ Request Declined. ${donorName} has declined your blood request. We'll keep looking for other donors.`
                );
              }

              Alert.alert('Request Declined', 'You have declined the blood donation request.');
            } catch (error) {
              Alert.alert('Error', 'Failed to decline request: ' + error.message);
            }
          },
        },
      ]
    );
  };

if (!fontsLoaded) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator size="large" color="#b71c1c" />
    </View>
  );
}
  // UI for donor: list matched blood requests with accept/decline
  if (userRole === 'donor') {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('bloodRequestMatch')}</Text>
          {newNotificationCount > 0 && (
            <View style={styles.redDot}>
              <Text style={styles.redDotText}>{newNotificationCount}</Text>
            </View>
          )}
        </View>
        {requests.length === 0 ? (
          <Text style={styles.noData}>{t('noMatchingRequestsFound')}</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.card, styles.donorCard]}>
                <View style={styles.urgentHeader}>
                  <Text style={styles.urgentText}>🩸 {t('urgentBloodNeeded').toUpperCase()}</Text>
                  <Text style={styles.matchText}>✅ {t('perfectMatch')}!</Text>
                </View>
                
                <View style={styles.receiverSection}>
                  <Text style={styles.sectionHeader}>📋 Patient Details</Text>
                  <Text style={styles.receiverName}>👤 {item.name}</Text>
                  <Text style={styles.label}>📞 Mobile: {item.mobile}</Text>
                  <Text style={styles.label}>📍 Location: {item.city}</Text>
                  <Text style={styles.label}>🩸 Blood Type: {item.bloodGroup}</Text>
                </View>

                <View style={styles.requestSection}>
                  <Text style={styles.sectionHeader}>🏥 Medical Information</Text>
                  <Text style={styles.label}>💉 Units Needed: {item.bloodUnits}</Text>
                  <Text style={styles.label}>🚨 Purpose: {item.purpose}</Text>
                  <Text style={styles.label}>⏰ Required By: {item.requiredDateTime}</Text>
                  <Text style={styles.label}>
                    🏥 Medical Conditions: {item.conditions?.join(', ') || 'None'}
                  </Text>
                </View>

                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    📅 Requested: {item.createdAt?.toDate().toLocaleDateString()} at {item.createdAt?.toDate().toLocaleTimeString()}
                  </Text>
                </View>

                <View style={styles.actionSection}>
                  <Text style={styles.actionPrompt}>{t('canYouHelpSaveLife')}</Text>
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={[styles.btn, styles.acceptBtn]}
                      onPress={() => handleAccept(item.id)}
                    >
                      <Text style={styles.btnText}>✅ {t('acceptAndHelp')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.declineBtn]}
                      onPress={() => handleDecline(item.id)}
                    >
                      <Text style={styles.btnText}>❌ {t('decline')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  // UI for receiver: show donor responses to their requests
  if (userRole === 'receiver') {
    return (
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t('donorResponses')}</Text>
          {newNotificationCount > 0 && (
            <View style={styles.redDot}>
              <Text style={styles.redDotText}>{newNotificationCount}</Text>
            </View>
          )}
        </View>
        {responses.length === 0 ? (
          <Text style={styles.noData}>{t('noDonorResponsesYet')}</Text>
        ) : (
          <FlatList
            data={responses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.card, item.status === 'accepted' ? styles.acceptedCard : styles.declinedCard]}>
                <Text style={styles.requestTitle}>Request for: {item.requestData?.purpose}</Text>
                <Text style={styles.label}>Blood Group: {item.requestData?.bloodGroup}</Text>
                <Text style={styles.label}>Units: {item.requestData?.bloodUnits}</Text>
                <Text style={styles.label}>City: {item.requestData?.city}</Text>
                <Text style={styles.divider}>--- Donor Response ---</Text>
                <Text style={styles.label}>Donor Name: {item.donorName}</Text>
                <Text style={styles.label}>Donor Mobile: {item.donorMobile}</Text>
                <Text style={[styles.statusText, item.status === 'accepted' ? styles.acceptedStatus : styles.declinedStatus]}>
                  Status: {item.status.toUpperCase()}
                </Text>
                <Text style={styles.label}>
                  Responded At: {item.respondedAt?.toDate().toLocaleString()}
                </Text>
                {item.status === 'accepted' && (
                  <Text style={styles.successMessage}>
                    🎉 Great! The donor will contact you soon. Please coordinate the donation details.
                  </Text>
                )}
              </View>
            )}
          />
        )}
      </View>
    );
  }

  // Default loading or no user data case
  if (!userProfile || !userCity || !userBloodGroup) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Please complete your profile first...</Text>
        <Text style={styles.subText}>Go to Personal Details to set up your profile.</Text>
      </View>
    );
  }

  // No role determined yet
  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Loading notifications...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, flex: 1 },
  redDot: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  redDotText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  noData: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
  },
  label: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
  },
  declineBtn: {
    backgroundColor: '#f44336',
  },
  btnText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  acceptedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    backgroundColor: '#f0fff0',
  },
  declinedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    backgroundColor: '#fff5f5',
  },
  requestTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  divider: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    marginVertical: 4,
  },
  acceptedStatus: {
    color: '#4CAF50',
  },
  declinedStatus: {
    color: '#f44336',
  },
  successMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#4CAF50',
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    textAlign: 'center',
  },
  donorCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#b71c1c',
    backgroundColor: '#fff8f8',
    padding: 20,
  },
  urgentHeader: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  urgentText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#b71c1c',
    textAlign: 'center',
  },
  matchText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  receiverSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  requestSection: {
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionHeader: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  receiverName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#b71c1c',
    marginBottom: 4,
  },
  timeInfo: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  timeText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#1976d2',
    textAlign: 'center',
  },
  actionSection: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionPrompt: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
  },
});
