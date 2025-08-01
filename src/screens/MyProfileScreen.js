// src/screens/MyProfileScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { auth, db } from '../services/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function MyProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          setProfile(null);
          return;
        }
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfile(userDocSnap.data());
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#b71c1c" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No profile data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ Profile Avatar */}
      <Image
        source={require('../../assets/icon.jpg')} // Use ../../ if needed!
        style={styles.avatar}
      />

      <Text style={styles.title}>My Profile</Text>

      <View style={styles.card}>
        <View style={styles.profileItem}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{profile.name || '-'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.label}>Age</Text>
          <Text style={styles.value}>{profile.age || '-'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.label}>Mobile Number</Text>
          <Text style={styles.value}>{profile.phone || '-'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.label}>Blood Group</Text>
          <Text style={styles.value}>{profile.bloodGroup || '-'}</Text>
        </View>

        <View style={styles.profileItem}>
          <Text style={styles.label}>City</Text>
          <Text style={styles.value}>{profile.city || '-'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#b71c1c',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4, // Android shadow
  },
  profileItem: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#555',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#222',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  text: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    textAlign: 'center',
  },
});

