import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window'); // ✅ Declare only once at the top!

// Your slide data
const slides = [
  { id: '1', image: require('../../assets/slide1.png') },
  { id: '2', image: require('../../assets/slide2.png') },
  { id: '3', image: require('../../assets/slide3.png') },
  { id: '4', image: require('../../assets/slide4.png') },
];

export default function HomeScreen({ navigation }) {
  const userName = "Haarhish";
  const userId = "BloodLink-163283";
  const userBloodGroup = "B+";

  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>BloodLink</Text>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </View>

        {/* User card */}
        <View style={styles.userCard}>
          <Text style={styles.userId}>{userId}</Text>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.bloodGroup}>
            <Text style={styles.bloodGroupText}>{userBloodGroup}</Text>
          </View>
        </View>

        {/* ✅ Slider */}
        <View style={styles.posterContainer}>
          <FlatList
            data={slides}
            renderItem={({ item }) => (
              <View style={{ width, justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  source={item.image}
                  style={{ width: '90%', height: 200, resizeMode: 'contain' }}
                />
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

          {/* Pagination dots */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Action icons */}
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

        <View style={styles.iconRow}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="location" size={36} color="#1976d2" />
            <Text style={styles.iconLabel}>BloodLink Near</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="people-outline" size={36} color="#f57c00" />
            <Text style={styles.iconLabel}>Beneficiaries</Text>
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
  },
});
