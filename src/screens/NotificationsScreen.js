import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Linking,
  Platform
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import notificationService from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';

export default function NotificationScreen() {
  const { t, currentLanguage } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  
  const [userRole, setUserRole] = useState(null); // 'donor' or 'receiver'
  const [userCity, setUserCity] = useState('');
  const [userBloodGroup, setUserBloodGroup] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [requests, setRequests] = useState([]); // For donor: matched requests
  const [responses, setResponses] = useState([]); // For receiver: donor responses
  const [newNotificationCount, setNewNotificationCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsViewed, setNotificationsViewed] = useState(false);
  
  // Function to handle phone calls
  const handlePhoneCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }
    
    let formattedNumber = phoneNumber;
    // Remove any non-numeric characters
    formattedNumber = formattedNumber.replace(/[^\d+]/g, '');
    
    // Add tel: prefix for linking
    const phoneUrl = `tel:${formattedNumber}`;
    
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch(err => {
        console.error('Error making phone call:', err);
        Alert.alert('Error', 'Could not make phone call');
      });
  };

  // Load fonts
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Mark notifications as viewed when screen is loaded
  useEffect(() => {
    const markNotificationsAsViewed = async () => {
      if (!userRole || !auth.currentUser) return;
      
      try {
        if (userRole === 'donor') {
          // For donors: mark blood requests as seen
          const q = query(
            collection(db, 'Bloodreceiver'),
            where('city', '==', userCity),
            where('bloodGroup', '==', userBloodGroup),
            where('status', '==', 'pending')
          );
          
          const snapshot = await getDocs(q);
          
          // Update each document that hasn't been seen by this donor
          const batch = db.batch ? db.batch() : null; // Check if batch is available
          let updateCount = 0;
          
          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            const docRef = doc(db, 'Bloodreceiver', docSnapshot.id);
            const currentSeenBy = data.seenBy || [];
            
            // Only update if this donor hasn't seen it yet
            if (!currentSeenBy.includes(auth.currentUser.uid)) {
              const updatedSeenBy = [...currentSeenBy, auth.currentUser.uid];
              
              if (batch) {
                // Use batch update if available
                batch.update(docRef, { seenBy: updatedSeenBy });
                updateCount++;
              } else {
                // Fallback to individual updates
                await updateDoc(docRef, { seenBy: updatedSeenBy });
                updateCount++;
              }
            }
          }
          
          // Commit batch if there were any updates
          if (batch && updateCount > 0) {
            await batch.commit();
          }
          
          if (updateCount > 0) {
            console.log(`Marked ${updateCount} donor notifications as viewed`);
          }
        } else if (userRole === 'receiver') {
          // For receivers: mark all responses as seen
          const q = query(
            collection(db, 'Bloodreceiver'),
            where('uid', '==', auth.currentUser.uid)
          );
          
          const snapshot = await getDocs(q);
          
          // Update each document with unseen responses
          for (const docSnapshot of snapshot.docs) {
            const data = docSnapshot.data();
            if (!data.responses || data.responses.length === 0) continue;
            
            // Check if any responses are unseen
            const hasUnseenResponses = data.responses.some(r => !r.seenByReceiver);
            
            if (hasUnseenResponses) {
              const updatedResponses = data.responses.map(r => ({
                ...r,
                seenByReceiver: true
              }));
              
              await updateDoc(doc(db, 'Bloodreceiver', docSnapshot.id), {
                responses: updatedResponses
              });
              
              console.log(`Marked all responses as viewed for request ${docSnapshot.id}`);
            }
          }
        }
        
        // Set flag to prevent duplicate marking
        setNotificationsViewed(true);
        // Reset notification count locally
        setNewNotificationCount(0);
      } catch (error) {
        console.error('Error marking notifications as viewed:', error);
      }
    };

    // Only run once when the screen is loaded and user role is determined
    if (userRole && userCity && userBloodGroup && !notificationsViewed) {
      markNotificationsAsViewed();
    }
  }, [userRole, userCity, userBloodGroup, notificationsViewed]);

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

  // Listen for matched requests (donor) or responses (receiver) with enhanced notification handling
  useEffect(() => {
    if (!userRole || !userCity || !userBloodGroup) return;
    
    // Reset the viewed state when dependencies change
    if (notificationsViewed) {
      setNotificationsViewed(false);
    }

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
        
        // Enhanced handling for donor notifications with immediate popup
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const hasResponded = data.responses?.some(response => response.donorUid === auth.currentUser?.uid);
            
            if (!hasResponded) {
              // Create complete request data for notification with all necessary details
              const requestData = {
                id: change.doc.id,
                receiverName: data.receiverName || data.name || 'A patient',
                bloodGroup: data.bloodGroup,
                city: data.city,
                requiredDateTime: data.requiredDateTime,
                purpose: data.purpose || 'Medical treatment',
                hospital: data.hospital || data.hospitalName || '',
                mobile: data.mobile || data.phone || '',
                bloodUnits: data.bloodUnits || '1'
              };
              
              // Format date for better display
              let formattedDate = "As soon as possible";
              try {
                if (data.requiredDateTime) {
                  let dateObj;
                  // Handle Firestore timestamps
                  if (data.requiredDateTime.toDate && typeof data.requiredDateTime.toDate === 'function') {
                    dateObj = data.requiredDateTime.toDate();
                  } 
                  // Handle Date objects
                  else if (data.requiredDateTime instanceof Date) {
                    dateObj = data.requiredDateTime;
                  }
                  // Handle string or number dates
                  else if (typeof data.requiredDateTime === 'string' || typeof data.requiredDateTime === 'number') {
                    dateObj = new Date(data.requiredDateTime);
                  }
                  
                  // Only use valid dates
                  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                    formattedDate = dateObj.toLocaleDateString() + ' at ' + 
                      dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    requestData.formattedDate = formattedDate;
                  } else if (typeof data.requiredDateTime === 'string' && data.requiredDateTime.trim()) {
                    // If it's a string but not a valid date, show the actual string entered by the receiver
                    formattedDate = data.requiredDateTime;
                    requestData.formattedDate = formattedDate;
                  }
                } else if (data.requiredDate || data.requiredTime) {
                  // Try to combine separate date and time fields if they exist
                  let dateString = '';
                  if (data.requiredDate) {
                    dateString += data.requiredDate;
                  }
                  if (data.requiredTime) {
                    dateString += ' ' + data.requiredTime;
                  }
                  if (dateString.trim()) {
                    formattedDate = dateString;
                    requestData.formattedDate = formattedDate;
                  }
                }
              } catch (err) {
                console.log('Date formatting error:', err);
                // If there's an error but we have the original string, use it
                if (typeof data.requiredDateTime === 'string' && data.requiredDateTime.trim()) {
                  formattedDate = data.requiredDateTime;
                  requestData.formattedDate = formattedDate;
                }
              }
              
              // Force notification to always show immediately regardless of app state
              setTimeout(() => {
                // Use the enhanced notification service method
                notificationService.notifyDonorOfMatch(requestData);
                
                // Log the matched request
                console.log(`Donor notification sent - Blood match: ${data.bloodGroup} in ${data.city}`);
              }, 500); // Small delay to ensure proper rendering
            }
          }
        });
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Only show requests that haven't been responded to by this donor
          const hasResponded = data.responses?.some(response => response.donorUid === auth.currentUser?.uid);
          const currentSeenBy = data.seenBy || [];
          const hasBeenSeen = currentSeenBy.includes(auth.currentUser.uid);
          
          if (!hasResponded) {
            // Format date for display with better error handling
            let formattedDate = "As soon as possible";
            try {
              if (data.requiredDateTime) {
                let dateObj;
                // Handle Firestore timestamps
                if (data.requiredDateTime.toDate && typeof data.requiredDateTime.toDate === 'function') {
                  dateObj = data.requiredDateTime.toDate();
                } 
                // Handle Date objects
                else if (data.requiredDateTime instanceof Date) {
                  dateObj = data.requiredDateTime;
                }
                // Handle string or number dates
                else if (typeof data.requiredDateTime === 'string' || typeof data.requiredDateTime === 'number') {
                  dateObj = new Date(data.requiredDateTime);
                }
                
                // Only use valid dates
                if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                  formattedDate = dateObj.toLocaleDateString() + ' at ' + 
                    dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } else if (typeof data.requiredDateTime === 'string' && data.requiredDateTime.trim()) {
                  // If it's a string but not a valid date, show the actual string entered by the receiver
                  formattedDate = data.requiredDateTime;
                }
              } else if (data.requiredDate || data.requiredTime) {
                // Try to combine separate date and time fields if they exist
                let dateString = '';
                if (data.requiredDate) {
                  dateString += data.requiredDate;
                }
                if (data.requiredTime) {
                  dateString += ' ' + data.requiredTime;
                }
                if (dateString.trim()) {
                  formattedDate = dateString;
                }
              }
            } catch (err) {
              console.log('Error formatting date:', err);
              // If there's an error but we have the original string, use it
              if (typeof data.requiredDateTime === 'string' && data.requiredDateTime.trim()) {
                formattedDate = data.requiredDateTime;
              }
            }

            matched.push({ 
              id: doc.id, 
              ...data,
              formattedDate,
              isNew: !hasBeenSeen,
              // Add highlight flag if this matches a notification that was just tapped
              isHighlighted: doc.id === route?.params?.highlightRequestId
            });
            
            // Count new notifications (unseen requests)
            const requestTime = data.createdAt?.toDate ? 
              data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);
              
            // Only count notifications as new if they haven't been seen AND were created recently
            if (!hasBeenSeen && requestTime && (Date.now() - requestTime.getTime()) < 24 * 60 * 60 * 1000) {
              newCount++;
            }
          }
        });
        
        // Sort by urgency/date (most urgent first)
        matched.sort((a, b) => {
          const aTime = a.requiredDateTime?.toDate ? a.requiredDateTime.toDate() : 
                       (a.requiredDateTime ? new Date(a.requiredDateTime) : new Date());
          const bTime = b.requiredDateTime?.toDate ? b.requiredDateTime.toDate() : 
                       (b.requiredDateTime ? new Date(b.requiredDateTime) : new Date());
          return aTime - bTime;
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
                  // Prepare request data for notification
                  const requestData = {
                    bloodGroup: data.bloodGroup,
                    city: data.city,
                    purpose: data.purpose || '',
                  };
                  
                  // Show enhanced local notification for new response with detailed donor info
                  notificationService.notifyReceiverOfResponse(response, requestData);
                  
                  // Log the donor response
                  console.log(`Receiver notification - Donor ${response.donorName} ${response.status} request`);
                  
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
              // Format response time for display with improved error handling
              let formattedResponseTime = "Recently";
              try {
                if (response.respondedAt) {
                  let dateObj;
                  // Handle Firestore timestamps
                  if (response.respondedAt.toDate && typeof response.respondedAt.toDate === 'function') {
                    dateObj = response.respondedAt.toDate();
                  } 
                  // Handle Date objects
                  else if (response.respondedAt instanceof Date) {
                    dateObj = response.respondedAt;
                  }
                  // Handle string or number dates
                  else if (typeof response.respondedAt === 'string' || typeof response.respondedAt === 'number') {
                    dateObj = new Date(response.respondedAt);
                  }
                  
                  // Only use valid dates
                  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                    formattedResponseTime = dateObj.toLocaleDateString() + ' at ' + 
                      dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  }
                }
              } catch (err) {
                console.log('Error formatting response time:', err);
                formattedResponseTime = "Recently";
              }
              
              // Format required date/time for display with better error handling
              // Default to "As soon as possible" only if no date was provided
              let formattedRequiredTime = "As soon as possible";
              try {
                if (data.requiredDateTime) {
                  let dateObj;
                  // Handle Firestore timestamps
                  if (data.requiredDateTime.toDate && typeof data.requiredDateTime.toDate === 'function') {
                    dateObj = data.requiredDateTime.toDate();
                  } 
                  // Handle Date objects
                  else if (data.requiredDateTime instanceof Date) {
                    dateObj = data.requiredDateTime;
                  }
                  // Handle string or number dates
                  else if (typeof data.requiredDateTime === 'string' || typeof data.requiredDateTime === 'number') {
                    dateObj = new Date(data.requiredDateTime);
                  }
                  
                  // Only use valid dates
                  if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                    formattedRequiredTime = dateObj.toLocaleDateString() + ' at ' + 
                      dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  } else if (typeof data.requiredDateTime === 'string' && data.requiredDateTime.trim()) {
                    // If it's a string but not a valid date, show the actual string entered by the receiver
                    formattedRequiredTime = data.requiredDateTime;
                  }
                } else if (data.requiredDate || data.requiredTime) {
                  // Try to combine separate date and time fields if they exist
                  let dateString = '';
                  if (data.requiredDate) {
                    dateString += data.requiredDate;
                  }
                  if (data.requiredTime) {
                    dateString += ' ' + data.requiredTime;
                  }
                  if (dateString.trim()) {
                    formattedRequiredTime = dateString;
                  }
                }
              } catch (err) {
                console.log('Error formatting required date/time:', err);
                // If there's an error but we have the original string, use it
                if (typeof data.requiredDateTime === 'string' && data.requiredDateTime.trim()) {
                  formattedRequiredTime = data.requiredDateTime;
                }
              }
              
              updatedResponses.push({ 
                id: `${doc.id}_${index}`, 
                requestId: doc.id,
                ...response,
                formattedResponseTime,
                requestData: {
                  purpose: data.purpose || 'Medical need',
                  bloodGroup: data.bloodGroup,
                  bloodUnits: data.bloodUnits || '1',
                  city: data.city,
                  hospital: data.hospital || '',
                  requiredDateTime: data.requiredDateTime,
                  formattedRequiredTime
                },
                // Add highlight flag if this matches a notification that was just tapped
                isHighlighted: (
                  doc.id === route?.params?.highlightRequestId && 
                  response.donorName === route?.params?.donorName &&
                  response.status === route?.params?.status
                )
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
          const aTime = a.respondedAt?.toDate ? a.respondedAt.toDate() : 
                       (a.respondedAt ? new Date(a.respondedAt) : new Date(0));
          const bTime = b.respondedAt?.toDate ? b.respondedAt.toDate() : 
                       (b.respondedAt ? new Date(b.respondedAt) : new Date(0));
          return bTime - aTime;
        });
        
        setResponses(updatedResponses);
        setNewNotificationCount(newCount);
      });

      return () => unsubscribe();
    }
  }, [userRole, userCity, userBloodGroup, route?.params, notificationsViewed]);

  // Enhanced function to send push notification to receiver device using Expo Push API
  async function sendPushNotification(expoPushToken, title, message, data = {}) {
    try {
      // Skip if no token is provided
      if (!expoPushToken) {
        console.log('No push token available');
        return false;
      }

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 
          Accept: 'application/json', 
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate'
        },
        body: JSON.stringify({
          to: expoPushToken,
          sound: 'default',
          title: title,
          body: message,
          priority: 'high',
          channelId: data.type === 'blood_request_match' ? 'blood-requests' : 'donor-responses',
          badge: 1,
          data: {
            screen: 'Notifications',
            ...data
          },
          // For Android
          android: {
            priority: 'high',
            sound: 'default',
            sticky: true,
            vibrate: [0, 250, 250, 250],
          },
          // For iOS
          _displayInForeground: true,
        }),
      });
      console.log(`Push notification sent to: ${expoPushToken}`);
      return true;
    } catch (err) {
      console.log('Push notification error:', err);
      return false;
    }
  }

  // Enhanced Donor Accept handler with improved notifications
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
              const donorMobile = userProfile?.mobile || userProfile?.phone || '';
              
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
                donorMobile: donorMobile,
                status: 'accepted',
                respondedAt: new Date(),
                seenByReceiver: false,
                donorBloodGroup: userBloodGroup,
                donorCity: userCity,
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

              // Send enhanced push notification to requester with donor details
              if (requestData.pushToken) {
                await sendPushNotification(
                  requestData.pushToken,
                  `✅ ${donorName} ACCEPTED`,
                  `Donor ${donorName} (${userBloodGroup}) from ${userCity} has accepted your blood request! Contact: ${donorMobile || 'Not provided'}`,
                  {
                    type: 'donor_response',
                    requestId: requestId,
                    donorName: donorName,
                    status: 'accepted',
                    bloodGroup: requestData.bloodGroup,
                    city: requestData.city,
                    donorMobile: donorMobile,
                    donorCity: userCity
                  }
                );
                
                // Also send a local notification
                notificationService.notifyReceiverOfResponse(
                  newResponse,
                  {
                    bloodGroup: requestData.bloodGroup,
                    city: requestData.city,
                    purpose: requestData.purpose || ''
                  }
                );
              }

              Alert.alert('Success', 'You have accepted the blood donation request!');
            } catch (error) {
              console.error('Accept request error:', error);
              Alert.alert('Error', 'Failed to accept request: ' + error.message);
            }
          },
        },
      ]
    );
  };

  // Enhanced Donor Decline handler with improved notifications
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
              const donorMobile = userProfile?.mobile || userProfile?.phone || '';
              
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
                donorMobile: donorMobile,
                status: 'declined',
                respondedAt: new Date(),
                seenByReceiver: false,
                donorBloodGroup: userBloodGroup,
                donorCity: userCity,
              };
              
              // Update the request with new response
              const updatedResponses = [...(requestData.responses || []), newResponse];
              const updatedSeenBy = [...(requestData.seenBy || []), currentUser?.uid];
              
              await updateDoc(doc(db, 'Bloodreceiver', requestId), {
                responses: updatedResponses,
                seenBy: updatedSeenBy,
                lastUpdated: serverTimestamp(),
              });

              // Send enhanced push notification to requester
              if (requestData.pushToken) {
                await sendPushNotification(
                  requestData.pushToken,
                  `❌ ${donorName} DECLINED`,
                  `${donorName} from ${userCity} has declined your blood request for ${requestData.bloodGroup}. We'll keep looking for other donors.`,
                  {
                    type: 'donor_response',
                    requestId: requestId,
                    donorName: donorName,
                    status: 'declined',
                    bloodGroup: requestData.bloodGroup,
                    city: requestData.city,
                    donorCity: userCity
                  }
                );
                
                // Also send a local notification
                notificationService.notifyReceiverOfResponse(
                  newResponse,
                  {
                    bloodGroup: requestData.bloodGroup,
                    city: requestData.city,
                    purpose: requestData.purpose || ''
                  }
                );
              }

              Alert.alert('Request Declined', 'You have declined the blood donation request.');
            } catch (error) {
              console.error('Decline request error:', error);
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
  // Enhanced UI for donor: list matched blood requests with accept/decline
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
              <View style={[
                styles.card, 
                styles.donorCard,
                item.isHighlighted && styles.highlightedCard,
                item.isNew && styles.newNotificationCard
              ]}>
                <View style={styles.urgentHeader}>
                  <Text style={styles.urgentText}>🩸 {t('urgentBloodNeeded').toUpperCase()}</Text>
                  <View style={styles.matchContainer}>
                    <Text style={styles.matchText}>✅ {t('perfectMatch')}!</Text>
                    <Text style={styles.matchDetails}>{userCity} + {userBloodGroup}</Text>
                  </View>
                  {item.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.receiverSection}>
                  <Text style={styles.sectionHeader}>📋 {t('patientDetails')}</Text>
                  <Text style={styles.receiverName}>👤 {item.receiverName || item.name}</Text>
                  <Text style={styles.label}>📞 {t('mobile')}: {item.mobile}</Text>
                  <Text style={styles.label}>📍 {t('location')}: {item.city}</Text>
                  <Text style={styles.label}>🩸 {t('bloodType')}: {item.bloodGroup}</Text>
                </View>

                <View style={styles.requestSection}>
                  <Text style={styles.sectionHeader}>🏥 {t('medicalInformation')}</Text>
                  <Text style={styles.label}>💉 {t('unitsNeeded')}: {item.bloodUnits || 1}</Text>
                  <Text style={styles.label}>🚨 {t('purpose')}: {item.purpose}</Text>
                  <Text style={styles.label}>⏰ {t('requiredBy')}: <Text style={styles.highlightText}>{item.formattedDate || 'As soon as possible'}</Text></Text>
                  {item.hospital && (
                    <Text style={styles.label}>🏥 {t('hospital')}: <Text style={styles.highlightText}>{item.hospital}</Text></Text>
                  )}
                  {item.conditions && (
                    <Text style={styles.label}>
                      🏥 {t('medicalConditions')}: {item.conditions.join(', ')}
                    </Text>
                  )}
                </View>

                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    📅 {t('requested')}: {
                      item.createdAt?.toDate ? 
                      (item.createdAt.toDate().toLocaleDateString() + ' ' + item.createdAt.toDate().toLocaleTimeString()) : 
                      (item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently')
                    }
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  // Reset notifications viewed state to trigger re-marking
                  setNotificationsViewed(false);
                  
                  // Reset highlight param and refresh data
                  if (navigation) {
                    navigation.setParams({
                      highlightRequestId: null,
                      notificationType: null
                    });
                  }
                  
                  // End refreshing
                  setTimeout(() => {
                    setRefreshing(false);
                  }, 1000);
                }}
              />
            }
          />
        )}
      </View>
    );
  }

  // Enhanced UI for receiver: show donor responses to their requests
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
              <View style={[
                styles.card, 
                item.status === 'accepted' ? styles.acceptedCard : styles.declinedCard,
                item.isHighlighted && styles.highlightedCard,
                !item.seenByReceiver && styles.newNotificationCard
              ]}>
                <View style={styles.requestHeaderSection}>
                  <Text style={styles.requestTitle}>{t('requestFor')}: {item.requestData?.purpose}</Text>
                  <View style={styles.requestDetailsBadge}>
                    <Text style={styles.requestDetailsText}>{item.requestData?.bloodGroup} • {item.requestData?.city}</Text>
                  </View>
                  {!item.seenByReceiver && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.requestDetailsSection}>
                  <Text style={styles.label}>💉 {t('bloodUnits')}: {item.requestData?.bloodUnits}</Text>
                  <Text style={styles.label}>⏰ {t('requiredBy')}: <Text style={styles.highlightText}>{item.requestData?.formattedRequiredTime}</Text></Text>
                  {item.requestData?.hospital && (
                    <Text style={styles.label}>🏥 {t('hospital')}: {item.requestData?.hospital}</Text>
                  )}
                </View>
                
                <View style={styles.responseSection}>
                  <Text style={styles.responseDivider}>--- {t('donorResponse')} ---</Text>
                  <View style={styles.donorInfoContainer}>
                    <View style={styles.donorInfo}>
                      <Text style={styles.donorName}>👤 {item.donorName}</Text>
                      {item.donorCity && (
                        <Text style={styles.label}>📍 {t('donorCity')}: {item.donorCity}</Text>
                      )}
                      {item.donorBloodGroup && (
                        <Text style={styles.label}>🩸 {t('donorBloodGroup')}: {item.donorBloodGroup}</Text>
                      )}
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      item.status === 'accepted' ? styles.acceptedBadge : styles.declinedBadge
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {item.status === 'accepted' ? '✅ ' + t('accepted') : '❌ ' + t('declined')}
                      </Text>
                    </View>
                  </View>
                  
                  {item.donorMobile && (
                    <View style={styles.contactSection}>
                      <Text style={styles.contactLabel}>{t('contactInfo')}:</Text>
                      <TouchableOpacity 
                        onPress={() => handlePhoneCall(item.donorMobile)}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.contactValue}>📞 <Text style={styles.phoneNumber}>{item.donorMobile}</Text></Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  <Text style={styles.timeLabel}>
                    ⏱️ {t('respondedAt')}: <Text style={styles.highlightText}>{item.formattedResponseTime || 'Recently'}</Text>
                  </Text>
                  
                  {item.status === 'accepted' && (
                    <View style={styles.acceptedMessageContainer}>
                      <Text style={styles.successMessage}>
                        🎉 {t('donorAcceptedMessage')}
                      </Text>
                      <TouchableOpacity 
                        style={styles.callButton}
                        onPress={() => handlePhoneCall(item.donorMobile)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.callButtonText}>📞 {t('callDonor')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  // Reset notifications viewed state to trigger re-marking
                  setNotificationsViewed(false);
                  
                  // Reset highlight param and refresh data
                  if (navigation) {
                    navigation.setParams({
                      highlightRequestId: null,
                      donorName: null,
                      status: null,
                      notificationType: null
                    });
                  }
                  
                  // End refreshing
                  setTimeout(() => {
                    setRefreshing(false);
                  }, 1000);
                }}
              />
            }
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
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Highlighted card for notifications that were just tapped
  highlightedCard: {
    borderWidth: 2,
    borderColor: '#ff9800',
    backgroundColor: '#fff8e1',
    shadowColor: "#ff9800",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  newNotificationCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    position: 'relative',
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
  requestHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  requestTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  requestDetailsBadge: {
    backgroundColor: '#e1f5fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestDetailsText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#0277bd',
  },
  requestDetailsSection: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  responseDivider: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
  },
  donorInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  donorInfo: {
    flex: 1,
  },
  donorName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  acceptedBadge: {
    backgroundColor: '#e8f5e9',
  },
  declinedBadge: {
    backgroundColor: '#ffebee',
  },
  statusBadgeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333',
  },
  contactSection: {
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
  },
  contactLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
  contactValue: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#333',
  },
  phoneNumber: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
  timeLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#757575',
    marginTop: 8,
  },
  acceptedMessageContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  successMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#2e7d32',
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  callButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  callButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  responseSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
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
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#b71c1c',
    textAlign: 'center',
  },
  matchContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  matchText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#4CAF50',
  },
  matchDetails: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4CAF50',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  newBadgeText: {
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
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
  highlightText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#b71c1c',
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
});
