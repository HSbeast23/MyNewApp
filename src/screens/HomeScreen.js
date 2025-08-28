import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import { useTranslation } from '../hooks/useTranslation';
import ImageCarousel from '../components/ImageCarousel';

const { width } = Dimensions.get('window'); // ✅ Declare only once at the top!

// Carousel slide data with URLs
// CHANGE IMAGES AND URLs HERE
const slides = [
  { 
    id: '1', 
    image: require('../../assets/im1.webp'),
    url: 'https://www.aabb.org/for-donors-patients/give-blood', // Blood donation information
    title: 'Donate Blood'
  },
  { 
    id: '2', 
    image: require('../../assets/im2.png'),
    url: 'https://www.who.int/campaigns/world-blood-donor-day', // World Blood Donor Day
    title: 'Blood Awareness'
  },
  { 
    id: '3', 
    image: require('../../assets/im3.webp'),
    url: 'https://www.nhs.uk/conditions/blood-transfusion/', // Blood transfusion info
    title: 'Blood Facts'
  },
];

export default function HomeScreen({ navigation, route }) {
  const { t, currentLanguage } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const slidesRef = useRef(null);
  
  // Check for success message from form submission
  useEffect(() => {
    if (route.params?.successMessage) {
      setSuccessMessage(route.params.successMessage);
      setShowSuccessCard(true);
      
      // Show success message
      Alert.alert(
        route.params.successType === 'donation' ? 'Donation Registered' : 'Request Submitted',
        route.params.successMessage,
        [{ text: 'OK' }]
      );
      
      // Clear params to avoid showing the alert again on screen focus
      navigation.setParams({ successMessage: undefined, successType: undefined });
      
      // Hide the success card after 5 seconds
      setTimeout(() => {
        setShowSuccessCard(false);
      }, 5000);
    }
  }, [route.params?.successMessage]);

  // Fetch real user data
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Get user profile
        const userQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid)
        );
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          setUserProfile(userSnapshot.docs[0].data());
        } else {
          // Try direct document access
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        }
      } catch (error) {
        console.log('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Listen for notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !userProfile) return;

    let unsubscribe = () => { };

    // Check if user is a donor or receiver and listen for relevant notifications
    const setupNotificationListener = async () => {
      try {
        // Check if user has requests (receiver)
        const requestsQuery = query(
          collection(db, 'Bloodreceiver'),
          where('uid', '==', user.uid)
        );
        const requestsSnapshot = await getDocs(requestsQuery);

        if (!requestsSnapshot.empty) {
          // User is a receiver - listen for donor responses
          unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
            let newCount = 0;
            snapshot.forEach((doc) => {
              const data = doc.data();
              if (data.responses && data.responses.length > 0) {
                data.responses.forEach((response) => {
                  if (!response.seenByReceiver) {
                    newCount++;
                  }
                });
              }
            });
            setNotificationCount(newCount);
          });
        } else {
          // User is a donor - listen for matching requests
          const donorQuery = query(
            collection(db, 'Bloodreceiver'),
            where('city', '==', userProfile.city),
            where('bloodGroup', '==', userProfile.bloodGroup),
            where('status', '==', 'pending')
          );

          unsubscribe = onSnapshot(donorQuery, (snapshot) => {
            let newCount = 0;
            snapshot.forEach((doc) => {
              const data = doc.data();
              const hasResponded = data.responses?.some(response => response.donorUid === user.uid);
              if (!hasResponded) {
                const requestTime = data.createdAt?.toDate();
                if (requestTime && (Date.now() - requestTime.getTime()) < 24 * 60 * 60 * 1000) {
                  newCount++;
                }
              }
            });
            setNotificationCount(newCount);
          });
        }
      } catch (error) {
        console.log('Error setting up notification listener:', error);
      }
    };

    setupNotificationListener();

    return () => unsubscribe();
  }, [userProfile]);

  // Notification functionality removed for cleaner code
  // No need for these carousel-related functions since they're now handled by the ImageCarousel component

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>BloodLink</Text>
          <TouchableOpacity
            style={styles.notificationContainer}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Success message card */}
        {showSuccessCard && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* User card */}
        <View style={styles.userCard}>
          <Text style={styles.userId}>BloodLink-{userProfile?.uid?.slice(-6) || '000000'}</Text>
          <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
          <View style={styles.bloodGroup}>
            <Text style={styles.bloodGroupText}>{userProfile?.bloodGroup || 'Unknown'}</Text>
          </View>
        </View>

        {/* Enhanced Carousel with clickable images */}
        <View style={styles.posterContainer}>
          <ImageCarousel 
            slides={slides}
            autoScrollInterval={4000}
            imageHeight={200}
            style={styles.carousel}
          />
        </View>

        {/* Action icons */}
        <View style={styles.iconRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('RequestBlood')}
          >
            <MaterialIcons name="bloodtype" size={36} color="#d32f2f" />
            <Text style={styles.iconLabel}>{t('requestBlood')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('DonateBlood')}
          >
            <FontAwesome5 name="hand-holding-medical" size={36} color="#388e3c" />
            <Text style={styles.iconLabel}>{t('donateBlood')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.iconRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={styles.iconWithBadge}>
              <Ionicons name="notifications" size={36} color="#d32f2f" />
              {notificationCount > 0 && (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.iconLabel}>{t('notifications')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Donate History')}
          >
            <MaterialIcons name="history" size={36} color="#ff5722" />
            <Text style={styles.iconLabel}>{t('donateHistory')}</Text>
          </TouchableOpacity>
        </View>
        

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="home" size={24} color="#b71c1c" />
          <Text style={styles.footerText}>{t('home')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('DonateBlood')}
        >
          <MaterialCommunityIcons name="blood-bag" size={24} color="#b71c1c" />
          <Text style={styles.footerText}>{t('donateBlood')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('RequestBlood')}
        >
          <MaterialCommunityIcons name="hand-heart" size={24} color="#b71c1c" />
          <Text style={styles.footerText}>{t('requestBlood')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  container: {
    paddingBottom: 80,
  },
  header: {
    backgroundColor: '#b71c1c',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  userCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
  },
  userId: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  userName: {
    marginTop: 5,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  bloodGroup: {
    marginTop: 10,
    backgroundColor: '#d32f2f',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bloodGroupText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  posterContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dot: {
    height: 10,
    width: 10,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: '#000',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  iconButton: {
    alignItems: 'center',
  },
  iconLabel: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#b71c1c',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    minHeight: 16,
    lineHeight: 16,
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  slideContainer: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative', // For overlay positioning
  },
  slideImage: {
    width: width - 40,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  slideOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  slideTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  slideTapHint: {
    color: '#f0f0f0',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
  },
  iconBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  successCard: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#388e3c',
  },
});
