import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Picker } from '@react-native-picker/picker';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function MyProfileScreen() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    bloodGroup: '',
    city: '',
    email: '',
  });

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        // Initialize form data for editing
        setFormData({
          name: data.name || '',
          age: data.age ? String(data.age) : '',
          phone: data.phone || '',
          bloodGroup: data.bloodGroup || '',
          city: data.city || '',
          email: data.email || '',
        });
      } else {
        Alert.alert(
          'Profile Not Found',
          'Please complete your profile to continue using the app.'
        );
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateAndSave = async () => {
    if (
      !formData.name ||
      !formData.age ||
      !formData.phone ||
      !formData.bloodGroup ||
      !formData.city
    ) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
      Alert.alert('Error', 'Age must be between 18 and 65 for blood donation');
      return;
    }

    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      await setDoc(
        doc(db, 'users', userId),
        {
          name: formData.name,
          age: ageNum,
          phone: formData.phone,
          bloodGroup: formData.bloodGroup,
          city: formData.city,
          email: formData.email,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
      fetchUserProfile();
    } catch (error) {
      console.log('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b71c1c" />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b71c1c" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-circle-outline" size={100} color="#ccc" />
          <Text style={styles.emptyTitle}>Profile Not Found</Text>
          <Text style={styles.emptySubtitle}>
            Please complete your profile to continue using BloodLink
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={100} color="#b71c1c" />
        </View>
        {isEditing ? (
          <TextInput
            style={styles.nameInput}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Full Name"
          />
        ) : (
          <Text style={styles.name}>{userProfile.name}</Text>
        )}
        <Text style={styles.email}>{userProfile.email}</Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.infoCard}>
          {/* Age */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Age</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text })}
                placeholder="Age"
                keyboardType="numeric"
                maxLength={2}
              />
            ) : (
              <Text style={styles.infoValue}>{userProfile.age} years</Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Phone</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                maxLength={10}
              />
            ) : (
              <Text style={styles.infoValue}>{userProfile.phone}</Text>
            )}
          </View>

          {/* Blood Group */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="water-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Blood Group</Text>
            </View>
            {isEditing ? (
              <Picker
                selectedValue={formData.bloodGroup}
                style={Platform.OS === 'ios' ? styles.pickerIOS : styles.pickerAndroid}
                onValueChange={(itemValue) =>
                  setFormData({ ...formData, bloodGroup: itemValue })
                }
              >
                <Picker.Item label="Select blood group" value="" />
                {bloodGroups.map((bg) => (
                  <Picker.Item key={bg} label={bg} value={bg} />
                ))}
              </Picker>
            ) : (
              <Text style={[styles.infoValue, styles.bloodGroup]}>{userProfile.bloodGroup}</Text>
            )}
          </View>

          {/* City */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>City</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="City"
              />
            ) : (
              <Text style={styles.infoValue}>{userProfile.city}</Text>
            )}
          </View>
        </View>

        {isEditing ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: '#444' }]}
              onPress={() => {
                // Cancel editing, reset form data
                setFormData({
                  name: userProfile.name || '',
                  age: userProfile.age ? String(userProfile.age) : '',
                  phone: userProfile.phone || '',
                  bloodGroup: userProfile.bloodGroup || '',
                  city: userProfile.city || '',
                  email: userProfile.email || '',
                });
                setIsEditing(false);
              }}
            >
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={validateAndSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 5,
  },
  nameInput: {
    fontSize: 24,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#b71c1c',
    width: '80%',
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  infoContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginLeft: 10,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  bloodGroup: {
    backgroundColor: '#b71c1c',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#b71c1c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
  },
  input: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#b71c1c',
    paddingVertical: 2,
    width: 100,
    textAlign: 'right',
  },
  pickerAndroid: {
    height: 40,
    width: 150,
    color: '#333',
  },
  pickerIOS: {
    height: 100,
    width: 250,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#388e3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 10,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
