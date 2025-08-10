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
} from 'firebase/firestore';
import { db, auth } from '../services/auth';
import notificationService from '../services/notificationService';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import AppLoading from 'expo-app-loading';

export default function NotificationScreen() {
  const [userRole, setUserRole] = useState(null); // 'donor' or 'receiver'
  const [userCity, setUserCity] = useState('');
  const [userBloodGroup, setUserBloodGroup] = useState('');
  const [requests, setRequests] = useState([]); // For donor: matched requests
  const [responses, setResponses] = useState([]); // For receiver: donor responses

  // Load fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Fetch user details from auth or your user profile Firestore (replace with your own logic)
  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // TODO: Replace this hardcoded with your Firestore user profile fetch
      // Example: Fetch user doc from 'users' collection to get role, city, bloodGroup
      // For demo, hardcoded values:
      setUserRole('donor'); // or 'receiver'
      setUserCity('Chennai');
      setUserBloodGroup('A+');
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
    try {
      await updateDoc(doc(db, 'Bloodreceiver', requestId), {
        donorResponse: 'Accepted',
        donorId: auth.currentUser.uid,
        responseTimestamp: serverTimestamp(),
      });

      // Fetch request document to get receiver's Expo push token
      const requestDoc = await getDoc(doc(db, 'Bloodreceiver', requestId));
      const requestData = requestDoc.data();

      if (requestData?.expoPushToken) {
        await sendPushNotification(
          requestData.expoPushToken,
          'Your blood request has been Accepted by a donor!'
        );
      }

      Alert.alert('Accepted', 'You accepted the blood request.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Donor Decline handler
  const handleDecline = async (requestId) => {
    try {
      await updateDoc(doc(db, 'Bloodreceiver', requestId), {
        donorResponse: 'Declined',
        donorId: auth.currentUser.uid,
        responseTimestamp: serverTimestamp(),
      });

      // Fetch request document to get receiver's Expo push token
      const requestDoc = await getDoc(doc(db, 'Bloodreceiver', requestId));
      const requestData = requestDoc.data();

      if (requestData?.expoPushToken) {
        await sendPushNotification(
          requestData.expoPushToken,
          'Your blood request has been Declined by a donor.'
        );
      }

      Alert.alert('Declined', 'You declined the blood request.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (!fontsLoaded) return <AppLoading />;

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
