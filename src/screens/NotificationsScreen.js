import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Alert
} from 'react-native';
import {
  collection, getDocs, query, where,
  updateDoc, doc, arrayUnion
} from 'firebase/firestore';
import * as Notifications from 'expo-notifications';
import { auth, db } from '../services/auth';
import { useFocusEffect } from '@react-navigation/native';

// ✅ Enable real app-style popup notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NotificationScreen = () => {
  const [user, setUser] = useState(null);
  const [donorMatches, setDonorMatches] = useState([]);
  const [receiverRequests, setReceiverRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) setUser(currentUser);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (user) fetchNotifications();
    }, [user])
  );

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const donorSnap = await getDocs(
        query(collection(db, 'BloodDonors'), where('userId', '==', user.uid))
      );
      const receiverSnap = await getDocs(
        query(collection(db, 'Bloodreceiver'), where('uid', '==', user.uid))
      );

      if (!donorSnap.empty) {
        const donorData = donorSnap.docs[0].data();
        const { bloodGroup, city } = donorData;

        const matchedSnap = await getDocs(
          query(
            collection(db, 'Bloodreceiver'),
            where('bloodGroup', '==', bloodGroup),
            where('city', '==', city),
            where('status', '==', 'pending')
          )
        );

        const matches = [];

        for (const docSnap of matchedSnap.docs) {
          const item = docSnap.data();
          const seenBy = item.seenBy || [];
          if (!seenBy.includes(user.uid)) {
            await updateDoc(doc(db, 'Bloodreceiver', docSnap.id), {
              seenBy: arrayUnion(user.uid)
            });
          }
          matches.push({ id: docSnap.id, ...item });
        }

        setDonorMatches(matches);
      }

      if (!receiverSnap.empty) {
        const requests = [];

        for (const docSnap of receiverSnap.docs) {
          const item = docSnap.data();
          const updatedResponses = [];
          let needUpdate = false;

          if (Array.isArray(item.responses)) {
            item.responses.forEach((res) => {
              if (res.seenByReceiver === false) {
                res.seenByReceiver = true;
                needUpdate = true;
              }
              updatedResponses.push(res);
            });
          }

          if (needUpdate) {
            await updateDoc(doc(db, 'Bloodreceiver', docSnap.id), {
              responses: updatedResponses
            });
          }

          requests.push({ id: docSnap.id, ...item });
        }

        setReceiverRequests(requests);
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendPushNotification = async (expoPushToken, title, message) => {
    const notificationPayload = {
      to: expoPushToken,
      sound: 'default',
      title,
      body: message,
      data: { screen: 'Notification' },
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });

      const data = await response.json();
      console.log('✅ Notification sent:', data);
    } catch (error) {
      console.error('❌ Notification error:', error);
    }
  };

  const handleResponse = async (receiverDocId, status) => {
    try {
      const currentUser = auth.currentUser;

      const donorSnap = await getDocs(
        query(collection(db, 'BloodDonors'), where('userId', '==', currentUser.uid))
      );
      const donor = donorSnap.docs[0]?.data();

      const receiverDocRef = doc(db, 'Bloodreceiver', receiverDocId);
      const receiverDocSnap = await getDocs(
        query(collection(db, 'Bloodreceiver'), where('__name__', '==', receiverDocId))
      );

      const receiverData = receiverDocSnap.docs[0]?.data();
      const receiverPushToken = receiverData?.pushToken;

      await updateDoc(receiverDocRef, {
        responses: arrayUnion({
          donorUid: currentUser.uid,
          donorName: donor?.name || 'Unknown',
          donorMobile: donor?.contactNumber || '',
          status,
          respondedAt: new Date(),
          seenByReceiver: false
        }),
        status,
        respondedBy: donor?.name || 'Donor'
      });

      if (receiverPushToken) {
        const msg = `Your blood request was ${status} by ${donor?.name}`;
        await sendPushNotification(receiverPushToken, 'Blood Request Update', msg);
      }

      Alert.alert('Success', `You have ${status} the request.`);
      fetchNotifications();
    } catch (err) {
      console.error('Error sending response:', err);
      Alert.alert('Error', 'Failed to send response');
    }
  };

  const renderDonorNotification = () => {
    if (donorMatches.length === 0) {
      return <Text style={styles.noData}>No new blood requests yet.</Text>;
    }

    return donorMatches.map((item, index) => {
      const alreadyResponded = item.responses?.some(r => r.donorUid === user.uid);

      return (
        <View key={index} style={styles.card}>
          <Text style={styles.title}>{item.name} needs {item.bloodUnits} units of {item.bloodGroup}</Text>
          <Text style={styles.text}>Purpose: {item.purpose}</Text>
          <Text style={styles.text}>City: {item.city}</Text>
          <Text style={styles.text}>Gender: {item.gender}</Text>
          <Text style={styles.text}>Required on: {item.requiredDateTime}</Text>
          <Text style={styles.text}>Phone: {item.mobile}</Text>

          {alreadyResponded ? (
            <Text style={styles.pending}>
              {(() => {
                const donorResponse = item.responses.find(r => r.donorUid === user.uid);
                if (donorResponse?.status === 'accepted') return 'You accepted the request';
                if (donorResponse?.status === 'declined') return 'You rejected the request';
                return 'You already responded';
              })()}
            </Text>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#38b000' }]}
                onPress={() => handleResponse(item.id, 'accepted')}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#e63946' }]}
                onPress={() => handleResponse(item.id, 'declined')}
              >
                <Text style={styles.buttonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    });
  };

  const renderReceiverNotification = () => {
    if (receiverRequests.length === 0) {
      return <Text style={styles.noData}>No blood requests found.</Text>;
    }

    return receiverRequests.map((item, index) => (
      <View key={index} style={styles.card}>
        <Text style={styles.title}>Your blood request for {item.bloodGroup}</Text>
        <Text style={styles.text}>City: {item.city}</Text>
        <Text style={styles.text}>Purpose: {item.purpose}</Text>

        {item.responses && item.responses.length > 0 ? (
          item.responses.map((res, i) => (
            <View key={i} style={styles.responseBox}>
              <Text style={styles.text}>👤 Donor: {res.donorName}</Text>
              <Text style={styles.text}>
                Status: <Text style={{ color: res.status === 'accepted' ? 'green' : 'red' }}>
                  {res.status.toUpperCase()}
                </Text>
              </Text>
              <Text style={styles.text}>Mobile {res.donorMobile}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.pending}>⏳ Waiting for donor response...</Text>
        )}
      </View>
    ));
  };

  // ✅ Handle tap on notification (optional for future navigation)
  useEffect(() => {
    const tapSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response?.notification?.request?.content?.data?.screen;
      if (screen === 'Notification') {
        fetchNotifications();
      }
    });

    return () => tapSubscription.remove();
  }, []);

  // ✅ NEW: Show push alerts while app is open (foreground)
  useEffect(() => {
    const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
      console.log("📲 Foreground notification received:", notification);
      const { title, body } = notification.request.content;
      Alert.alert(title || 'Notification', body || 'You have a new message');
    });

    return () => foregroundSub.remove();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D62828" />
        <Text>Loading Notifications...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Notifications</Text>

      {donorMatches.length > 0 && (
        <>
          <Text style={styles.section}>🩸 Matched Blood Requests (for Donors)</Text>
          {renderDonorNotification()}
        </>
      )}

      {receiverRequests.length > 0 && (
        <>
          <Text style={styles.section}>📩 Donor Responses (for Receivers)</Text>
          {renderReceiverNotification()}
        </>
      )}

      {donorMatches.length === 0 && receiverRequests.length === 0 && (
        <Text style={styles.noData}>No notifications available.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
    color: '#D62828',
    paddingTop: 24,
  },
  section: {
    fontSize: 24,
    marginTop: 20,
    marginBottom: 8,
    color: '#333',
  },
  card: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    marginBottom: 4,
    color: '#000',
  },
  text: {
    fontSize: 19,
    color: '#333',
  },
  pending: {
    fontSize: 23,
    color: '#FF8800',
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 0.48,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  responseBox: {
    backgroundColor: '#f1f1f1',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  noData: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationScreen;
