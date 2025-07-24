// ✅ src/screens/DonateBloodForm.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  Switch,
} from 'react-native';

import { auth, db } from '../services/auth';
import { addDoc, collection } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';


export default function DonateBloodForm({ navigation }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [medicalCondition, setMedicalCondition] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isElderlyExperienced, setIsElderlyExperienced] = useState(false);

  const [showBloodModal, setShowBloodModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female'];
  const cities = [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem',
    'Tirunelveli', 'Vellore', 'Thoothukudi', 'Erode', 'Dindigul',
    'Thanjavur', 'Kanchipuram', 'Karur', 'Namakkal', 'Cuddalore',
    'Nagapattinam', 'Tiruvannamalai', 'Pudukkottai', 'Virudhunagar', 'Sivaganga',
  ];

  const conditionList = [
    'None',
    'Diabetes',
    'Heart Disease',
    'Cancer',
    'Hepatitis B/C',
    'HIV/AIDS',
    'Tuberculosis',
    'Kidney Disease',
    'Epilepsy',
    'Recent Surgery',
    'Currently on Antibiotics',
    'Pregnant (if applicable)',
  ];

  const validatePhone = (number) => /^[6-9]\d{9}$/.test(number);

  const handleSubmit = async () => {
    if (!name || !city || !contactNumber || !bloodGroup || !gender || !age || !medicalCondition) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (medicalCondition !== 'None') {
      Alert.alert(
        'Ineligible to Donate',
        'Based on your selected medical condition, you are not eligible to donate blood at this time.'
      );
      return;
    }

    if (!validatePhone(contactNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Indian mobile number.');
      return;
    }

    const donorAge = parseInt(age);
    if (donorAge >= 60 && isFirstTime && !isElderlyExperienced) {
      Alert.alert(
        'Ineligible',
        'Elderly first-time donors (age 60+) cannot donate blood.'
      );
      return;
    }

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }

      await addDoc(collection(db, 'BloodDonors'), {
        name,
        city,
        contactNumber,
        bloodGroup,
        gender,
        age: donorAge,
        isFirstTime,
        isElderlyExperienced,
        medicalCondition,
        createdAt: serverTimestamp(),
        userId: uid,
      });

      Alert.alert('Success', 'Your blood donation offer has been submitted!');

      setName('');
      setCity('');
      setContactNumber('');
      setBloodGroup('');
      setGender('');
      setAge('');
      setMedicalCondition('');
      setIsFirstTime(false);
      setIsElderlyExperienced(false);

      navigation.navigate('Home');

    } catch (error) {
      console.error('Error submitting donation:', error);
      Alert.alert('Error', 'Failed to submit donation.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Donate Blood</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />

          <TouchableOpacity onPress={() => setShowBloodModal(true)}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {bloodGroup ? `Blood Group: ${bloodGroup}` : 'Select Blood Group'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowGenderModal(true)}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {gender ? `Gender: ${gender}` : 'Select Gender'}
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

          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            placeholderTextColor="#888"
            keyboardType="numeric"
            maxLength={10}
            value={contactNumber}
            onChangeText={setContactNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="Age"
            placeholderTextColor="#888"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />

          <TouchableOpacity onPress={() => setShowConditionModal(true)}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {medicalCondition
                  ? `Medical Condition: ${medicalCondition}`
                  : 'Select Medical Condition'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>First Time Donor?</Text>
            <Switch
              value={isFirstTime}
              onValueChange={setIsFirstTime}
              trackColor={{ false: '#ccc', true: '#b71c1c' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Elderly Experienced?</Text>
            <Switch
              value={isElderlyExperienced}
              onValueChange={setIsElderlyExperienced}
              trackColor={{ false: '#ccc', true: '#b71c1c' }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Donate Blood</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals (unchanged): Blood Group, Gender, City, Condition */}
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

      <Modal visible={showGenderModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            <FlatList
              data={genders}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setGender(item);
                    setShowGenderModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowGenderModal(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      <Modal visible={showConditionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Medical Condition</Text>
            <FlatList
              data={conditionList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setMedicalCondition(item);
                    setShowConditionModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setShowConditionModal(false)}>
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#333',
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
