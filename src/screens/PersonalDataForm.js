// ✅ src/screens/PersonalDataForm.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';

import { auth, db } from '../services/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const cities = [
  'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
  'Tirunelveli', 'Vellore', 'Thoothukudi', 'Erode', 'Dindigul',
  'Thanjavur', 'Kanchipuram', 'Karur', 'Namakkal', 'Cuddalore',
  'Nagapattinam', 'Tiruvannamalai', 'Pudukkottai', 'Virudhunagar', 'Sivaganga',
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PersonalDataForm({ navigation }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [city, setCity] = useState('');

  const [showBloodModal, setShowBloodModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const handleSave = async () => {
    if (!name || !age || !phone || !bloodGroup || !city) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Indian mobile number.');
      return;
    }

    try {
      const uid = auth.currentUser.uid;

      await setDoc(doc(db, 'users', uid), {
        name,
        age: parseInt(age),
        phone,
        bloodGroup,
        city,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Your details have been saved!');
      navigation.replace('MainDrawer');

    } catch (error) {
      console.error('Error saving personal data:', error);
      Alert.alert('Error', 'Failed to save data.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Complete Your Profile</Text>

          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            placeholder="Age"
            placeholderTextColor="#888"
            value={age}
            onChangeText={setAge}
            style={styles.input}
            keyboardType="numeric"
          />

          <TextInput
            placeholder="Mobile Number"
            placeholderTextColor="#888"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TouchableOpacity onPress={() => setShowBloodModal(true)}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {bloodGroup ? `Blood Group: ${bloodGroup}` : 'Select Blood Group'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowCityModal(true)}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {city ? `City: ${city}` : 'Select City'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Save & Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Blood Group Modal */}
      <Modal visible={showBloodModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Blood Group</Text>
            <FlatList
              data={bloodGroups}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setBloodGroup(item);
                    setShowBloodModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowBloodModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* City Modal */}
      <Modal visible={showCityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select City</Text>
            <FlatList
              data={cities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setCity(item);
                    setShowCityModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowCityModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDECEC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 20,
    color: '#b71c1c',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
  },
  dropdownText: {
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#b71c1c',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '80%',
    maxHeight: '70%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 10,
    color: '#b71c1c',
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  modalClose: {
    marginTop: 10,
    textAlign: 'center',
    color: '#b71c1c',
    fontFamily: 'Poppins_600SemiBold',
  },
});
