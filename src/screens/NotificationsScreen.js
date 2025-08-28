import React, { useState, useEffect, useCallback } from 'react';
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
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, getDocs, orderBy, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from '@expo-google-fonts/poppins';

export default function NotificationsScreen() {
  const { t } = useTranslation();
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
  const [loading, setLoading] = useState(true);
  
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

  // Mark all notifications as seen when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userRole && auth.currentUser?.uid) {
        markAllAsSeen();
      }
    }, [userRole, userCity, userBloodGroup])
  );

  // Function to mark all notifications as seen
  const markAllAsSeen = async () => {
    try {
      if (userRole === 'donor') {
        // For donors: mark blood requests as seen
        const requestsQuery = query(
          collection(db, 'Bloodreceiver'),
          where('bloodGroup', '==', userBloodGroup),
          where('city', '==', userCity),
          where('status', '==', 'pending')
        );
        
        const snapshot = await getDocs(requestsQuery);
        
        // Update each document that hasn't been seen by this donor
        const updatePromises = [];
        
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const seenBy = data.seenBy || [];
          
          if (!seenBy.includes(auth.currentUser.uid)) {
            updatePromises.push(
              updateDoc(doc(db, 'Bloodreceiver', docSnapshot.id), {
                seenBy: arrayUnion(auth.currentUser.uid)
              })
            );
          }
        });
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log(`Marked ${updatePromises.length} requests as seen`);
        }
      } else if (userRole === 'receiver') {
        // For receivers: mark all responses as seen
        const requestsQuery = query(
          collection(db, 'Bloodreceiver'),
          where('uid', '==', auth.currentUser.uid)
        );
        
        const snapshot = await getDocs(requestsQuery);
        
        // Update each request with unseen responses
        const updatePromises = [];
        
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          if (!data.responses || data.responses.length === 0) return;
          
          // Check for unseen responses
          const hasUnseenResponses = data.responses.some(r => !r.seenByReceiver);
          
          if (hasUnseenResponses) {
            const updatedResponses = data.responses.map(r => ({
              ...r,
              seenByReceiver: true
            }));
            
            updatePromises.push(
              updateDoc(doc(db, 'Bloodreceiver', docSnapshot.id), {
                responses: updatedResponses
              })
            );
          }
        });
        
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          console.log(`Updated ${updatePromises.length} requests with seen responses`);
        }
      }
      
      // Reset notification count
      setNewNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
    }
  };

  // Get user details on component mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch user data
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile(userData);
          setUserCity(userData.city || '');
          setUserBloodGroup(userData.bloodGroup || '');
          
          // Determine if user is donor or receiver based on most recent activity
          const isDonor = await checkUserIsDonor(currentUser.uid);
          setUserRole(isDonor ? 'donor' : 'receiver');
        } else {
          setUserRole(null);
          setUserCity('');
          setUserBloodGroup('');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, []);

  // Check if user is primarily a donor or show both donor and receiver UI
  const checkUserIsDonor = async (userId) => {
    try {
      // Check for blood requests (as receiver)
      const receiverQuery = query(
        collection(db, 'Bloodreceiver'),
        where('uid', '==', userId)
      );
      const receiverDocs = await getDocs(receiverQuery);
      
      // Check for donor profile
      const donorQuery = query(
        collection(db, 'BloodDonors'),
        where('uid', '==', userId)
      );
      const donorDocs = await getDocs(donorQuery);
      
      console.log(`Found ${donorDocs.size} donor docs and ${receiverDocs.size} receiver docs for user ${userId}`);
      
      // Show donor view by default - This ensures the matching flow works
      // If user hasn't made any requests, they're definitely a donor
      if (receiverDocs.size === 0) {
        return true;
      }
      
      // Check if there's a recent pending request (within last 7 days)
      let hasRecentPendingRequest = false;
      receiverDocs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'pending') {
          const requestTime = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          const daysSinceRequest = (Date.now() - requestTime.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceRequest < 7) {
            hasRecentPendingRequest = true;
          }
        }
      });
      
      // If there's a recent pending request, show receiver view
      if (hasRecentPendingRequest) {
        return false;
      }
      
      // Otherwise show donor view
      return true;
    } catch (error) {
      console.error('Error checking user role:', error);
      // Default to donor if there's an error
      return true;
    }
  };

  // Listen for matching blood requests (for donors)
  useEffect(() => {
    if (!userRole || userRole !== 'donor' || !userCity || !userBloodGroup) return;
    
    // Query for matching blood requests
    const q = query(
      collection(db, 'Bloodreceiver'),
      where('bloodGroup', '==', userBloodGroup),
      where('city', '==', userCity),
      where('status', '==', 'pending')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchedRequests = [];
      let newCount = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const seenBy = data.seenBy || [];
        
        // Check if this donor has already responded
        const hasResponded = data.responses?.some(r => r.donorUid === auth.currentUser?.uid);
        
        if (!hasResponded) {
          const isNew = !seenBy.includes(auth.currentUser?.uid);
          
          // Format required date/time
          const formattedDate = formatDateTime(data.requiredDateTime) || 'As soon as possible';
          
          matchedRequests.push({
            id: doc.id,
            ...data,
            formattedDate,
            isNew,
            isHighlighted: doc.id === route?.params?.highlightRequestId
          });
          
          if (isNew) {
            newCount++;
          }
        }
      });
      
      // Sort by urgency (closest date first)
      matchedRequests.sort((a, b) => {
        if (!a.requiredDateTime && !b.requiredDateTime) return 0;
        if (!a.requiredDateTime) return 1;
        if (!b.requiredDateTime) return -1;
        
        const aDate = a.requiredDateTime.toDate ? a.requiredDateTime.toDate() : new Date(a.requiredDateTime);
        const bDate = b.requiredDateTime.toDate ? b.requiredDateTime.toDate() : new Date(b.requiredDateTime);
        
        return aDate - bDate;
      });
      
      setRequests(matchedRequests);
      setNewNotificationCount(newCount);
    });
    
    return () => unsubscribe();
  }, [userRole, userCity, userBloodGroup]);

  // Listen for donor responses (for receivers)
  useEffect(() => {
    if (!userRole || userRole !== 'receiver' || !auth.currentUser?.uid) return;
    
    // Query for user's blood requests
    const q = query(
      collection(db, 'Bloodreceiver'),
      where('uid', '==', auth.currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allResponses = [];
      let newCount = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.responses || data.responses.length === 0) return;
        
        // Process each response
        data.responses.forEach((response, index) => {
          const formattedResponseTime = formatDateTime(response.respondedAt) || 'Recently';
          const formattedRequiredTime = formatDateTime(data.requiredDateTime) || 'As soon as possible';
          
          allResponses.push({
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
            isHighlighted: (
              doc.id === route?.params?.highlightRequestId && 
              response.donorName === route?.params?.donorName &&
              response.status === route?.params?.status
            )
          });
          
          // Count unseen responses
          if (!response.seenByReceiver) {
            newCount++;
          }
        });
      });
      
      // Sort responses by time (newest first)
      allResponses.sort((a, b) => {
        const aTime = a.respondedAt?.toDate ? a.respondedAt.toDate() : 
                    (a.respondedAt ? new Date(a.respondedAt) : new Date(0));
        const bTime = b.respondedAt?.toDate ? b.respondedAt.toDate() : 
                    (b.respondedAt ? new Date(b.respondedAt) : new Date(0));
        return bTime - aTime;
      });
      
      setResponses(allResponses);
      setNewNotificationCount(newCount);
    });
    
    return () => unsubscribe();
  }, [userRole]);

  // Helper function to format dates
  const formatDateTime = (dateValue) => {
    if (!dateValue) return null;
    
    try {
      let dateObj;
      
      // Handle Firestore timestamps
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        dateObj = dateValue.toDate();
      } 
      // Handle Date objects
      else if (dateValue instanceof Date) {
        dateObj = dateValue;
      }
      // Handle string or number dates
      else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        dateObj = new Date(dateValue);
      }
      
      // Return formatted date if valid
      if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString() + ' at ' + 
          dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }
      
      // Return the original string if it's not a valid date but has content
      if (typeof dateValue === 'string' && dateValue.trim()) {
        return dateValue;
      }
      
      return null;
    } catch (err) {
      console.log('Error formatting date:', err);
      return null;
    }
  };

  // Handle donor accepting a blood request
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
              
              // Get request data
              const requestDoc = await getDoc(doc(db, 'Bloodreceiver', requestId));
              if (!requestDoc.exists()) {
                Alert.alert('Error', 'Request not found');
                return;
              }
              
              const requestData = requestDoc.data();
              
              // Create response
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
              
              // Update the request document
              await updateDoc(doc(db, 'Bloodreceiver', requestId), {
                responses: arrayUnion(newResponse),
                seenBy: arrayUnion(currentUser?.uid),
                respondedBy: donorName,
                status: 'accepted',
                lastUpdated: serverTimestamp(),
              });
              
              // Response sent successfully - no notification service needed
              
              Alert.alert('Success', 'You have accepted the blood donation request!');
            } catch (error) {
              console.error('Error accepting request:', error);
              Alert.alert('Error', 'Failed to accept request: ' + error.message);
            }
          },
        },
      ]
    );
  };

  // Handle donor declining a blood request
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
              
              // Get request data
              const requestDoc = await getDoc(doc(db, 'Bloodreceiver', requestId));
              if (!requestDoc.exists()) {
                Alert.alert('Error', 'Request not found');
                return;
              }
              
              const requestData = requestDoc.data();
              
              // Create response
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
              
              // Update the request document
              await updateDoc(doc(db, 'Bloodreceiver', requestId), {
                responses: arrayUnion(newResponse),
                seenBy: arrayUnion(currentUser?.uid),
                lastUpdated: serverTimestamp(),
              });
              
              // Firebase function will handle the notification to the requester
              
              // Response sent successfully - no notification service needed
              
              Alert.alert('Request Declined', 'You have declined the blood donation request.');
            } catch (error) {
              console.error('Error declining request:', error);
              Alert.alert('Error', 'Failed to decline request: ' + error.message);
            }
          },
        },
      ]
    );
  };

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Reset highlight params
    if (navigation) {
      navigation.setParams({
        highlightRequestId: null,
        donorName: null,
        status: null
      });
    }
    
    // Mark all as seen again
    markAllAsSeen().finally(() => {
      setRefreshing(false);
    });
  };

  // Loading state
  if (loading || !fontsLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#b71c1c" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  // No profile state
  if (!userProfile || !userCity || !userBloodGroup) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={60} color="#999" />
        <Text style={styles.noProfileText}>Please complete your profile first</Text>
        <TouchableOpacity
          style={styles.setupButton}
          onPress={() => navigation.navigate('MyProfile')}
        >
          <Text style={styles.setupButtonText}>Set Up Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Donor view
  if (userRole === 'donor') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Blood Request Matches</Text>
          {newNotificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{newNotificationCount}</Text>
            </View>
          )}
        </View>
        
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="water-outline" size={60} color="#999" />
            <Text style={styles.emptyText}>No matching blood requests found</Text>
            <Text style={styles.emptySubtext}>You'll be notified when someone needs your blood type</Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[
                styles.card,
                styles.requestCard,
                item.isHighlighted && styles.highlightedCard,
                item.isNew && styles.newCard
              ]}>
                <View style={styles.cardHeader}>
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>URGENT REQUEST</Text>
                  </View>
                  {item.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.requestInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.requestLabel}>Patient:</Text>
                    <Text style={styles.requestValue}>{item.name || 'Anonymous'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.requestLabel}>Blood Group:</Text>
                    <Text style={styles.bloodType}>{item.bloodGroup}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.requestLabel}>Units Needed:</Text>
                    <Text style={styles.requestValue}>{item.bloodUnits || '1'}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.requestLabel}>Location:</Text>
                    <Text style={styles.requestValue}>{item.city}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.requestLabel}>Purpose:</Text>
                    <Text style={styles.requestValue}>{item.purpose || 'Medical need'}</Text>
                  </View>
                  
                  {item.hospital && (
                    <View style={styles.infoRow}>
                      <Text style={styles.requestLabel}>Hospital:</Text>
                      <Text style={styles.requestValue}>{item.hospital}</Text>
                    </View>
                  )}
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.requestLabel}>Required By:</Text>
                    <Text style={styles.urgentValue}>{item.formattedDate}</Text>
                  </View>
                  
                  {item.mobile && (
                    <View style={styles.infoRow}>
                      <Text style={styles.requestLabel}>Contact:</Text>
                      <TouchableOpacity onPress={() => handlePhoneCall(item.mobile)}>
                        <Text style={styles.phoneValue}>{item.mobile}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    <Ionicons name="time-outline" size={12} color="#666" /> 
                    {item.createdAt?.toDate ? 
                      new Date(item.createdAt.toDate()).toLocaleString() : 
                      'Recently'}
                  </Text>
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton]} 
                    onPress={() => handleAccept(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.declineButton]} 
                    onPress={() => handleDecline(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#b71c1c']}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    );
  }

  // Receiver view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Donor Responses</Text>
        {newNotificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{newNotificationCount}</Text>
          </View>
        )}
      </View>
      
      {responses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="hand-holding-heart" size={60} color="#999" />
          <Text style={styles.emptyText}>No donor responses yet</Text>
          <Text style={styles.emptySubtext}>When donors respond to your requests, they'll appear here</Text>
        </View>
      ) : (
        <FlatList
          data={responses}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.card,
              styles.responseCard,
              item.status === 'accepted' ? styles.acceptedCard : styles.declinedCard,
              item.isHighlighted && styles.highlightedCard,
              !item.seenByReceiver && styles.newCard
            ]}>
              <View style={styles.responseHeader}>
                <View style={[
                  styles.statusBadge,
                  item.status === 'accepted' ? styles.acceptedBadge : styles.declinedBadge
                ]}>
                  <Text style={styles.statusText}>
                    {item.status === 'accepted' ? 'ACCEPTED' : 'DECLINED'}
                  </Text>
                </View>
                
                {!item.seenByReceiver && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.requestSummary}>
                <Text style={styles.summaryTitle}>Your Request</Text>
                <Text style={styles.summaryBloodType}>
                  {item.requestData.bloodGroup} • {item.requestData.bloodUnits} unit(s) • {item.requestData.city}
                </Text>
                <Text style={styles.summaryDetail}>
                  For: {item.requestData.purpose}
                </Text>
                <Text style={styles.summaryDetail}>
                  By: {item.requestData.formattedRequiredTime}
                </Text>
                {item.requestData.hospital && (
                  <Text style={styles.summaryDetail}>
                    At: {item.requestData.hospital}
                  </Text>
                )}
              </View>
              
              <View style={styles.donorInfo}>
                <Text style={styles.donorTitle}>Donor Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.donorLabel}>Name:</Text>
                  <Text style={styles.donorValue}>{item.donorName}</Text>
                </View>
                
                {item.donorBloodGroup && (
                  <View style={styles.infoRow}>
                    <Text style={styles.donorLabel}>Blood Group:</Text>
                    <Text style={styles.bloodType}>{item.donorBloodGroup}</Text>
                  </View>
                )}
                
                {item.donorCity && (
                  <View style={styles.infoRow}>
                    <Text style={styles.donorLabel}>Location:</Text>
                    <Text style={styles.donorValue}>{item.donorCity}</Text>
                  </View>
                )}
                
                {item.donorMobile && item.status === 'accepted' && (
                  <View style={styles.infoRow}>
                    <Text style={styles.donorLabel}>Contact:</Text>
                    <TouchableOpacity onPress={() => handlePhoneCall(item.donorMobile)}>
                      <Text style={styles.phoneValue}>{item.donorMobile}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                <Text style={styles.responseTime}>
                  <Ionicons name="time-outline" size={12} color="#666" /> 
                  {item.formattedResponseTime}
                </Text>
              </View>
              
              {item.status === 'accepted' && item.donorMobile && (
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => handlePhoneCall(item.donorMobile)}
                >
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text style={styles.callButtonText}>Call Donor</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#b71c1c']}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#333',
  },
  badge: {
    backgroundColor: '#b71c1c',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#b71c1c',
  },
  responseCard: {
    borderLeftWidth: 4,
  },
  acceptedCard: {
    borderLeftColor: '#4caf50',
  },
  declinedCard: {
    borderLeftColor: '#f44336',
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: '#ff9800',
    shadowColor: '#ff9800',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  newCard: {
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#ffebee',
  },
  urgentBadge: {
    backgroundColor: '#b71c1c',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  urgentText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  newBadge: {
    backgroundColor: '#4caf50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  requestInfo: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  requestLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#555',
    width: 100,
  },
  requestValue: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  bloodType: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#b71c1c',
  },
  urgentValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#b71c1c',
  },
  phoneValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
  timeInfo: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4caf50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  acceptedBadge: {
    backgroundColor: '#e8f5e9',
  },
  declinedBadge: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#333',
  },
  requestSummary: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  summaryBloodType: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#b71c1c',
    marginBottom: 4,
  },
  summaryDetail: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  donorInfo: {
    padding: 16,
  },
  donorTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  donorLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: '#555',
    width: 100,
  },
  donorValue: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  responseTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4caf50',
    padding: 12,
    gap: 8,
  },
  callButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  noProfileText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 16,
  },
  setupButton: {
    backgroundColor: '#b71c1c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  setupButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  }
});
