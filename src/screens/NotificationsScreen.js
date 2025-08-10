import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from '../services/auth';
import notificationService from '../services/notificationService';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';

export default function NotificationScreen() {
  const [userRole, setUserRole] = useState(null); // 'donor' or 'receiver'
  const [userCity, setUserCity] = useState('');
  const [userBloodGroup, setUserBloodGroup] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [requests, setRequests] = useState([]); // For donor: matched requests
  const [responses, setResponses] = useState([]); // For receiver: donor responses

  // Load fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Fetch user details from Firestore user profile
  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch user profile from users collection
        const userQuery = query(
          collection(db, 'users'),
          where('userId', '==', user.uid)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserProfile(userData);
          setUserCity(userData.city);
          setUserBloodGroup(userData.bloodGroup);
        }

        // Check if user has any blood requests (receiver) or donations (donor)
        const requestsQuery = query(
          collection(db, 'Bloodreceiver'),
          where('userId', '==', user.uid)
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        const donationsQuery = query(
          collection(db, 'BloodDonors'),
          where('userId', '==', user.uid)
        );
        const donationsSnapshot = await getDocs(donationsQuery);

        // Determine role based on recent activity or default to donor
        if (!requestsSnapshot.empty) {
          setUserRole('receiver');
        } else if (!donationsSnapshot.empty) {
          setUserRole('donor');
        } else {
          setUserRole('donor'); // Default to donor view
        }
      } catch (error) {
        console.log('Error fetching user details:', error);
        setUserRole('donor');
        setUserCity('Chennai');
        setUserBloodGroup('A+');
      }
    };
    fetchUserDetails();
  }, []);

  // Listen for matched requests (donor) or responses (receiver)
  useEffect(() => {
    if (!userRole) return;

    if (userRole === 'donor') {
      // Donor: listen for blood requests matching city & bloodGroup
      const q = query(
        collection(db, 'Bloodreceiver'),
        where('city', '==', userCity),
        where('bloodGroup', '==', userBloodGroup)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const matched = [];
        snapshot.forEach((doc) => matched.push({ id: doc.id, ...doc.data() }));
        setRequests(matched);
      });

      return () => unsubscribe();
    }

    if (userRole === 'receiver') {
      // Receiver: listen for donorResponse updates on own requests
      const q = query(
        collection(db, 'Bloodreceiver'),
        where('requesterId', '==', auth.currentUser.uid),
        where('donorResponse', '!=', null)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const updatedResponses = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            // Show local notification popup for donor response
            const data = change.doc.data();
            if (data.donorResponse) {
              // Use the notification service (works in Expo Go)
              notificationService.notifyDonorResponse(
                data.donorResponse, 
                data.donorName || 'A donor'
              );
            }
          }
        });

        // Also update the list UI
        snapshot.forEach((doc) => updatedResponses.push({ id: doc.id, ...doc.data() }));
        setResponses(updatedResponses);
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
  const handleAccept = async (requestId) => {
    Alert.alert(
      'Confirm Donation',
      'Are you sure you want to accept this blood donation request? The receiver will be notified and may contact you.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const requestRef = doc(db, 'Bloodreceiver', requestId);
              const donorName = userProfile?.name || 'A donor';
              
              await updateDoc(requestRef, {
                donorResponse: 'accepted',
                donorId: auth.currentUser.uid,
                donorName: donorName,
                responseTimestamp: serverTimestamp(),
              });

              // Get the request data to send notification to receiver
              const requestDoc = await getDoc(requestRef);
              const requestData = requestDoc.data();

              if (requestData.expoPushToken) {
                await sendPushNotification(
                  requestData.expoPushToken,
                  ` Great news! ${donorName} has accepted your ${requestData.bloodGroup} blood request. They will contact you soon.`
                );
              }

              Alert.alert('Success', 'You have accepted the blood request. The receiver will be notified and may contact you.');
              
              // Remove this request from the local state to update UI
              setRequests(prev => prev.filter(req => req.id !== requestId));
            } catch (error) {
              console.log(error);
              Alert.alert('Error', 'Failed to accept request');
            }
          }
        }
      ]
    );
  };

  // Donor Decline handler
  const handleDecline = async (requestId) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this blood donation request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              const requestRef = doc(db, 'Bloodreceiver', requestId);
              const donorName = userProfile?.name || 'A donor';
              
              await updateDoc(requestRef, {
                donorResponse: 'declined',
                donorId: auth.currentUser.uid,
                donorName: donorName,
                responseTimestamp: serverTimestamp(),
              });

              // Get the request data to send notification to receiver
              const requestDoc = await getDoc(requestRef);
              const requestData = requestDoc.data();

              if (requestData.expoPushToken) {
                await sendPushNotification(
                  requestData.expoPushToken,
                  `${donorName} was unable to fulfill your ${requestData.bloodGroup} blood request. We'll continue searching for other donors.`
                );
              }

              Alert.alert('Response Sent', 'You have declined the blood request. The receiver will be notified.');
              
              // Remove this request from the local state to update UI
              setRequests(prev => prev.filter(req => req.id !== requestId));
            } catch (error) {
              console.log(error);
              Alert.alert('Error', 'Failed to decline request');
            }
          }
        }
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
        <Text style={styles.title}>Matched Blood Requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.noData}>No matching blood requests found.</Text>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.label}>Name: {item.name}</Text>
                <Text style={styles.label}>Mobile: {item.mobile}</Text>
                <Text style={styles.label}>City: {item.city}</Text>
                <Text style={styles.label}>Blood Group: {item.bloodGroup}</Text>
                <Text style={styles.label}>Units Needed: {item.units}</Text>
                <Text style={styles.label}>Purpose: {item.purpose}</Text>
                <Text style={styles.label}>
                  Medical Conditions: {item.medicalConditions?.join(', ') || 'None'}
                </Text>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.btn, styles.acceptBtn]}
                    onPress={() => handleAccept(item.id)}
                  >
                    <Text style={styles.btnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.declineBtn]}
                    onPress={() => handleDecline(item.id)}
                  >
                    <Text style={styles.btnText}>Decline</Text>
                  </TouchableOpacity>
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
        <Text style={styles.title}>Donor Responses</Text>
        {responses.length === 0 ? (
          <Text style={styles.noData}>No donor responses yet.</Text>
        ) : (
          <FlatList
            data={responses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.label}>Request for: {item.purpose}</Text>
                <Text style={styles.label}>Donor Response: {item.donorResponse}</Text>
                <Text style={styles.label}>Donor ID: {item.donorId}</Text>
                <Text style={styles.label}>
                  Responded At: {item.responseTimestamp?.toDate().toLocaleString()}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    );
  }

  // Default loading or no role case
  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Loading user info...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, marginBottom: 20 },
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
  },
});
