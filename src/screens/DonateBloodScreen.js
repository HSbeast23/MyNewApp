// DonateBloodScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';
import { useTranslation } from '../hooks/useTranslation';

const tamilNaduCities = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
  // ... (same full list)
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const medicalConditionsList = [
  'Diabetes',
  'Hypertension',
  'Heart Disease',
  'Cancer',
  'Thalassemia',
  'HIV',
  'Malaria',
  'Tuberculosis',
  'Asthma',
  'None',
];

export default function DonateBloodScreen() {
  const { t, currentLanguage } = useTranslation();
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    city: '',
    gender: '',
    bloodGroup: '',
    age: '',
    medicalConditions: [],
  });

  const [loading, setLoading] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);

  const handleConditionToggle = (condition) => {
    setForm((prev) => {
      let conditions;
      
      if (condition === 'None') {
        // If 'None' is selected, clear all other conditions
        conditions = prev.medicalConditions.includes('None') ? [] : ['None'];
      } else {
        // If any other condition is selected, remove 'None' first
        const filteredConditions = prev.medicalConditions.filter(c => c !== 'None');
        conditions = filteredConditions.includes(condition)
          ? filteredConditions.filter((c) => c !== condition)
          : [...filteredConditions, condition];
      }
      
      return { ...prev, medicalConditions: conditions };
    });
  };

  // Get push notification token
  const getPushToken = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Push notification permission not granted');
        return null;
      }

      // For Expo Go, we don't need to specify projectId
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Push token generated:', token.data);
      return token.data;
    } catch (error) {
      console.log('Error getting push token:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.mobile ||
      !form.city ||
      !form.gender ||
      !form.bloodGroup ||
      !form.age
    ) {
      Alert.alert('Error', 'Please fill all mandatory fields');
      return;
    }

    if (form.mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (parseInt(form.age) < 18 || parseInt(form.age) > 65) {
      Alert.alert('Error', 'Age must be between 18 and 65 for blood donation');
      return;
    }

    // Medical condition validation - only allow donation if 'None' is selected
    if (form.medicalConditions.length === 0) {
      Alert.alert('Medical Condition Required', 'Please select your medical condition status. If you have no medical conditions, select "None".');
      return;
    }

    // Check if any medical condition other than 'None' is selected
    const hasOtherConditions = form.medicalConditions.some(condition => condition !== 'None');
    if (hasOtherConditions) {
      Alert.alert(
        'Medical Condition Restriction', 
        'Sorry, individuals with medical conditions cannot donate blood for safety reasons. Please consult with a healthcare professional.',
        [{ text: 'OK', onPress: () => {} }]
      );
      return;
    }

    // If 'None' is selected along with other conditions, show error
    if (form.medicalConditions.includes('None') && form.medicalConditions.length > 1) {
      Alert.alert('Invalid Selection', 'Please select either "None" or specific medical conditions, not both.');
      return;
    }

    setLoading(true);
    try {
      const pushToken = await getPushToken();
      const user = auth.currentUser;
      
      // Save donor data
      await addDoc(collection(db, 'BloodDonors'), {
        name: form.name,
        mobile: form.mobile,
        city: form.city,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        age: form.age,
        medicalConditions: form.medicalConditions,
        pushToken: pushToken,
        expoPushToken: pushToken, // Add this for compatibility
        uid: user?.uid,
        createdAt: serverTimestamp(),
        isActive: true,
      });

      // CRITICAL: Check for existing matching blood requests
      const matchingRequestsQuery = query(
        collection(db, 'Bloodreceiver'),
        where('bloodGroup', '==', form.bloodGroup),
        where('city', '==', form.city),
        where('status', '==', 'pending')
      );
      
      const matchingRequestsSnapshot = await getDocs(matchingRequestsQuery);
      const matchCount = matchingRequestsSnapshot.size;
      
      let successMessage = 'Thank you for registering as a blood donor!';
      
      if (matchCount > 0) {
        successMessage += ` Great news! There ${matchCount === 1 ? 'is' : 'are'} ${matchCount} matching blood request${matchCount === 1 ? '' : 's'} in your area. Check your Notifications to help save ${matchCount === 1 ? 'a life' : 'lives'}!`;
      } else {
        successMessage += ' You will receive notifications when someone needs your blood type in your city.';
      }
      
      Alert.alert(
        'Success', 
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              setForm({
                name: '',
                mobile: '',
                city: '',
                gender: '',
                bloodGroup: '',
                age: '',
                medicalConditions: [],
              });
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to register donor: ' + e.message);
    } finally {
      setLoading(false);
    }
  };
if (!fontsLoaded) {
  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
      <ActivityIndicator size="large" color="#b71c1c" />
    </View>
  );
}

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="water" size={40} color="#b71c1c" />
        <Text style={styles.title}>{t('bloodDonationForm')}</Text>
        <Text style={styles.subtitle}>{t('registerAsDonor')}</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            placeholder={t('enterFullName')}
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.mobile}
            onChangeText={(text) => setForm({ ...form, mobile: text })}
            placeholder={t('enterMobileNumber')}
            placeholderTextColor="#888"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCityPicker(!showCityPicker)}
        >
          <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
          <Text style={[styles.pickerButtonText, !form.city && styles.placeholderText]}>
            {form.city || 'Select your city'}
          </Text>
          <Ionicons name="chevron-down-outline" size={20} color="#666" />
        </TouchableOpacity>

        {showCityPicker && (
          <View style={styles.pickerContainer}>
            <ScrollView 
              style={styles.cityScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {tamilNaduCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.cityOption}
                  onPress={() => {
                    setForm({ ...form, city });
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={styles.cityOptionText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>Gender</Text>
        <View style={styles.optionsRow}>
          {['Male', 'Female', 'Other'].map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.optionButton,
                form.gender === gender && styles.optionButtonSelected,
              ]}
              onPress={() => setForm({ ...form, gender })}
            >
              <Text style={[
                styles.optionText,
                form.gender === gender && styles.optionTextSelected
              ]}>{gender}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Blood Group</Text>
        <View style={styles.bloodGroupGrid}>
          {bloodGroups.map((bg) => (
            <TouchableOpacity
              key={bg}
              style={[
                styles.bloodGroupButton,
                form.bloodGroup === bg && styles.bloodGroupButtonSelected,
              ]}
              onPress={() => setForm({ ...form, bloodGroup: bg })}
            >
              <Text style={[
                styles.bloodGroupText,
                form.bloodGroup === bg && styles.bloodGroupTextSelected
              ]}>{bg}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={form.age}
            onChangeText={(text) => setForm({ ...form, age: text })}
            placeholder="Enter your age (18-65)"
            placeholderTextColor="#888"
            maxLength={2}
          />
        </View>

        <Text style={styles.sectionTitle}>Medical Conditions</Text>
        <Text style={styles.sectionSubtitle}>Select any conditions that apply to you</Text>
        <View style={styles.conditionsContainer}>
          {medicalConditionsList.map((cond) => (
            <TouchableOpacity
              key={cond}
              style={[
                styles.conditionChip,
                form.medicalConditions.includes(cond) && styles.conditionChipSelected,
              ]}
              onPress={() => handleConditionToggle(cond)}
            >
              <Text style={[
                styles.conditionText,
                form.medicalConditions.includes(cond) && styles.conditionTextSelected
              ]}>{cond}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="heart" size={20} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitText}>Register as Donor</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  title: { 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 26, 
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickerButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  placeholderText: {
    color: '#888',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  cityScrollView: {
    maxHeight: 250,
    paddingVertical: 5,
  },
  cityOption: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  cityOptionText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  bloodGroupOption: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  bloodGroupOptionText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionButtonSelected: {
    backgroundColor: '#b71c1c',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bloodGroupButton: {
    width: '22%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bloodGroupButtonSelected: {
    backgroundColor: '#b71c1c',
  },
  bloodGroupText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  bloodGroupTextSelected: {
    color: '#fff',
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  conditionChip: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  conditionChipSelected: {
    backgroundColor: '#b71c1c',
  },
  conditionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  conditionTextSelected: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#b71c1c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#b71c1c',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
});
