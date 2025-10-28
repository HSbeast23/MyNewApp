import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useTranslation } from '../hooks/useTranslation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const tamilNaduCities = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
  "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul",
  "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Udhagamandalam",
  "Hosur", "Nagercoil", "Kanchipuram", "Kumbakonam", "Pudukkottai",
  "Ambur", "Palani", "Pollachi", "Rajapalayam", "Gudiyatham",
  "Vaniyambadi", "Gobichettipalayam", "Neyveli", "Pallavaram",
  "Valparai", "Sankarankovil", "Tenkasi", "Palayamkottai", "Mayiladuthurai",
  "Vikramasingapuram", "Arakkonam", "Sirkali", "Chidambaram", "Panruti",
  "Lalgudi", "Adyar", "Tiruvannamalai", "Nagapattinam", "Nandivaram-Guduvancheri",
  "Tiruppur", "Avadi", "Tambaram", "Ambattur"
];

export default function PersonalDetailsScreen() {
  const { t, currentLanguage } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { fullName, email } = route.params || {};

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [formData, setFormData] = useState({
    name: fullName || '',
    age: '',
    phone: '',
    bloodGroup: '',
    city: '',
  });

  const [showBloodGroupPicker, setShowBloodGroupPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.age || !formData.phone || !formData.bloodGroup || !formData.city) {
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
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not logged in');
        return;
      }

      const userData = {
        name: formData.name,
        age: ageNum,
        phone: formData.phone,
        bloodGroup: formData.bloodGroup,
        city: formData.city,
        email,
        profileComplete: true,
        updatedAt: serverTimestamp(),
      };

      // Update user doc with personal details, replacing old data or create if not exists
      await setDoc(doc(db, 'users', userId), userData, { merge: true });
      
      // Store user profile data in AsyncStorage for easy access in other screens
      await AsyncStorage.setItem('userProfile', JSON.stringify(userData));

      Alert.alert('Success', 'Profile created successfully! Welcome to BloodLink!', [
        {
          text: 'OK',
          onPress: () => navigation.replace('EnableLocation'),
        },
      ]);
    } catch (error) {
      console.log('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#b71c1c" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('personalDetails')}</Text>
        <Text style={styles.subtitle}>{t('completeYourProfile')}</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>{t('enterFullName')}</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder={t('enterFullName')}
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>{t('enterAge')}</Text>
          <TextInput
            style={styles.input}
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
            placeholder={t('enterAge')}
            placeholderTextColor="#888"
            keyboardType="numeric"
            maxLength={2}
          />

          <Text style={styles.label}>{t('enterPhoneNumber')}</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder={t('enterPhoneNumber')}
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Text style={styles.label}>{t('selectBloodGroup')}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowBloodGroupPicker(!showBloodGroupPicker)}
          >
            <Text style={[styles.pickerButtonText, !formData.bloodGroup && styles.placeholderText]}>
              {formData.bloodGroup || t('selectBloodGroup')}
            </Text>
          </TouchableOpacity>

          {showBloodGroupPicker && (
            <View style={styles.pickerContainer}>
              <ScrollView 
                style={styles.bloodGroupScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {bloodGroups.map((group) => (
                  <TouchableOpacity
                    key={group}
                    style={styles.bloodGroupOption}
                    onPress={() => {
                      setFormData({ ...formData, bloodGroup: group });
                      setShowBloodGroupPicker(false);
                    }}
                  >
                    <Text style={styles.bloodGroupOptionText}>{group}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>{t('selectYourCity')}</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <Text style={[styles.pickerButtonText, !formData.city && styles.placeholderText]}>
              {formData.city || t('selectYourCity')}
            </Text>
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
                      setFormData({ ...formData, city });
                      setShowCityPicker(false);
                    }}
                  >
                    <Text style={styles.cityOptionText}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{t('saveAndContinue')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    marginBottom: 5,
  },
  pickerButton: {
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 5,
  },
  pickerButtonText: {
    fontSize: 15,
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
  bloodGroupScrollView: {
    maxHeight: 250,
    paddingVertical: 5,
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
  submitButton: {
    backgroundColor: '#b71c1c',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 30,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
