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
import * as Notifications from 'expo-notifications';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const tamilNaduCities = [
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
  "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul",
  "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Udhagamandalam",
  "Hosur", "Nagercoil", "Kanchipuram", "Kumarakonam", "Pudukkottai",
  "Ambur", "Palani", "Pollachi", "Rajapalayam", "Gudiyatham",
  "Vaniyambadi", "Gobichettipalayam", "Neyveli", "Pallavaram",
  "Valparai", "Sankarankovil", "Tenkasi", "Palayamkottai", "Mayiladuthurai",
  "Vikramasingapuram", "Arakkonam", "Sirkali", "Chidambaram", "Panruti",
  "Lalgudi", "Adyar", "Tiruvannamalai", "Nagapattinam", "Nandivaram-Guduvancheri",
  "Tiruppur", "Avadi", "Tambaram", "Ambattur"
];

export default function PersonalDetailsScreen() {
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

  // Get push notification token
  const getPushToken = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Push notifications permission is required for blood donation alerts.');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.log('Error getting push token:', error);
      return null;
    }
  };

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
      const pushToken = await getPushToken();

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
        expoPushToken: pushToken || '',
        profileComplete: true,
        updatedAt: serverTimestamp(),
      };

      // Update user doc with personal details, replacing old data or create if not exists
      await setDoc(doc(db, 'users', userId), userData, { merge: true });

      Alert.alert('Success', 'Profile created successfully! Welcome to BloodLink!', [
        {
          text: 'OK',
          onPress: () => navigation.replace('MainDrawer'),
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
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>Help us serve you better with these details</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter your full name"
            placeholderTextColor="#888"
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
            placeholder="Enter your age"
            placeholderTextColor="#888"
            keyboardType="numeric"
            maxLength={2}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter your phone number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Text style={styles.label}>Blood Group</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowBloodGroupPicker(!showBloodGroupPicker)}
          >
            <Text style={[styles.pickerButtonText, !formData.bloodGroup && styles.placeholderText]}>
              {formData.bloodGroup || 'Select your blood group'}
            </Text>
          </TouchableOpacity>

          {showBloodGroupPicker && (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.bloodGroup}
                onValueChange={(itemValue) => {
                  setFormData({ ...formData, bloodGroup: itemValue });
                  setShowBloodGroupPicker(false);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select blood group" value="" />
                {bloodGroups.map((group) => (
                  <Picker.Item key={group} label={group} value={group} />
                ))}
              </Picker>
            </View>
          )}

          <Text style={styles.label}>City</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowCityPicker(!showCityPicker)}
          >
            <Text style={[styles.pickerButtonText, !formData.city && styles.placeholderText]}>
              {formData.city || 'Select your city'}
            </Text>
          </TouchableOpacity>

          {showCityPicker && (
            <View style={styles.pickerContainer}>
              <ScrollView style={styles.cityScrollView}>
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
            <Text style={styles.submitButtonText}>Complete Profile</Text>
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
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 10,
    maxHeight: 200,
  },
  picker: {
    height: 150,
  },
  cityScrollView: {
    maxHeight: 200,
  },
  cityOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cityOptionText: {
    fontSize: 15,
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
