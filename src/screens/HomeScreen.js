// ... your imports unchanged
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ImageBackground,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import { auth, db } from '../services/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';

const { width } = Dimensions.get('window');

const slides = [
  { id: '1', image: require('../../assets/img1.webp'), text: 'Donor Card: Priority Help When You Need It.' },
  { id: '2', image: require('../../assets/img2.png'), text: 'Next Blood Camp: St. Francis Xavier — Join Us!' },
  { id: '3', image: require('../../assets/img3.webp'), text: 'Donate Blood. Save Lives.' },
  { id: '4', image: require('../../assets/img4.jpg'), text: 'One Unit Can Save Three Lives.' },
  { id: '5', image: require('../../assets/img5.jpg'), text: 'Your Blood Can Be Someone’s Lifeline.' },
];

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [userBloodGroup, setUserBloodGroup] = useState('');
  const [userCity, setUserCity] = useState('');
  const [showRedDot, setShowRedDot] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = auth.currentUser.uid;
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserName(data.name);
          setUserBloodGroup(data.bloodGroup);
          setUserCity(data.city);
          setUserId(`BloodLink-${uid.substring(0, 6).toUpperCase()}`);

          // ✅ DONOR: Matched blood request listener with manual seenBy check
          const donorQuery = query(
            collection(db, 'Bloodreceiver'),
            where('bloodGroup', '==', data.bloodGroup),
            where('city', '==', data.city),
            where('status', '==', 'pending')
          );

          const unsubscribeDonor = onSnapshot(donorQuery, (snapshot) => {
            let hasUnseen = false;

            snapshot.forEach((docSnap) => {
              const request = docSnap.data();
              const seenBy = request.seenBy || [];

              if (!seenBy.includes(uid)) {
                hasUnseen = true;
              }
            });

            if (hasUnseen) {
              setShowRedDot(true);
            }
          });

          // ✅ RECEIVER: If donor responded and receiver hasn’t seen it
          const receiverQuery = query(
            collection(db, 'Bloodreceiver'),
            where('uid', '==', uid)
          );

          const unsubscribeReceiver = onSnapshot(receiverQuery, (snapshot) => {
            let hasUnseenResponse = false;

            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              const responses = data.responses || [];

              for (let res of responses) {
                if (res.seenByReceiver === false) {
                  hasUnseenResponse = true;
                  break;
                }
              }
            });

            if (hasUnseenResponse) {
              setShowRedDot(true);
            }
          });

          return () => {
            unsubscribeDonor();
            unsubscribeReceiver();
          };
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <Ionicons name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerText}>BloodLink</Text>
            <TouchableOpacity onPress={() => {
              setShowRedDot(false);
              navigation.navigate('Notifications');
            }}>
              <View>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
                {showRedDot && (
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'red'
                  }} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* User Card */}
          <View style={styles.userCard}>
            {userName ? (
              <>
                <Text style={styles.userId}>{userId}</Text>
                <Text style={styles.userName}>{userName}</Text>
                <View style={styles.bloodGroup}>
                  <Text style={styles.bloodGroupText}>{userBloodGroup}</Text>
                </View>
              </>
            ) : (
              <Text style={{ fontFamily: 'Poppins_400Regular' }}>Loading user info...</Text>
            )}
          </View>

          {/* Poster Slider */}
          <View style={styles.posterContainer}>
            <FlatList
              data={slides}
              renderItem={({ item }) => (
                <View style={styles.slide}>
                  <ImageBackground
                    source={item.image}
                    style={styles.slideImage}
                    imageStyle={{ borderRadius: 12 }}
                  >
                    <View style={styles.textOverlay}>
                      <Text style={styles.overlayText}>{item.text}</Text>
                    </View>
                  </ImageBackground>
                </View>
              )}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              bounces={false}
              keyExtractor={(item) => item.id}
              onViewableItemsChanged={viewableItemsChanged}
              viewabilityConfig={viewConfig}
              ref={slidesRef}
            />
            <View style={styles.pagination}>
              {slides.map((_, index) => (
                <View
                  key={index}
                  style={[styles.dot, currentIndex === index && styles.dotActive]}
                />
              ))}
            </View>
          </View>

          {/* Action Icons Row 1 */}
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('RequestBlood')}
            >
              <MaterialIcons name="bloodtype" size={36} color="#d32f2f" />
              <Text style={styles.iconLabel}>Request for Blood</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('DonateBlood')}
            >
              <FontAwesome5 name="hand-holding-medical" size={36} color="#388e3c" />
              <Text style={styles.iconLabel}>Donate</Text>
            </TouchableOpacity>
          </View>

          {/* Action Icons Row 2 */}
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                setShowRedDot(false);
                navigation.navigate('Notifications');
              }}
            >
              <View>
                <Ionicons name="notifications" size={36} color="#1976d2" />
                {showRedDot && (
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'red',
                  }} />
                )}
              </View>
              <Text style={styles.iconLabel}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="history" size={36} color="#f57c00" />
              <Text style={styles.iconLabel}>History</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerItem}>
            <Ionicons name="home" size={24} color="#b71c1c" />
            <Text style={styles.footerText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerItem}
            onPress={() => navigation.navigate('DonateBlood')}
          >
            <MaterialCommunityIcons name="blood-bag" size={24} color="#b71c1c" />
            <Text style={styles.footerText}>Donate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerItem}
            onPress={() => navigation.navigate('RequestBlood')}
          >
            <MaterialCommunityIcons name="hand-heart" size={24} color="#b71c1c" />
            <Text style={styles.footerText}>Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// styles remain unchanged
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#b71c1c',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  wrapper: { flex: 1, backgroundColor: '#f2f2f2' },
  container: { paddingBottom: 80 },
  header: {
    backgroundColor: '#b71c1c',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  slide: {
    width: width * 0.9,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: width * 0.05,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  textOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
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
  },
});
