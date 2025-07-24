// ✅ src/screens/BloodRequestForm.js

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
} from 'react-native';

import { auth, db } from '../services/auth';
import { addDoc, collection } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
export default function BloodRequestForm({ navigation }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [gender, setGender] = useState('');
  const [bloodUnits, setBloodUnits] = useState('');
  const [purpose, setPurpose] = useState('');
  const [conditions, setConditions] = useState([]);
  const [requiredDateTime, setRequiredDateTime] = useState('');

  const [showBloodModal, setShowBloodModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

 const genders = ['Male', 'Female'];
 

  const cities = [
  'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri',
  'Dindigul','Erode','Kallakurichi','Kancheepuram','Karur','Krishnagiri',
  'Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur',
  'Pudukottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi',
  'Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli',
  'Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur',
  'Vellore','Viluppuram','Virudhunagar'
];
const purposes = [
  'Accident / Emergency','Surgery (heart/kidney/brain)',
  'Organ Transplant','Pregnancy / Delivery','Cancer Treatment',
  'Anemia / Thalassemia / Sickle Cell','Dialysis / Renal Failure',
  'Dengue / Malaria / Viral Fever','COVID‑19 Complications',
  'Blood Disorders','Post‑operative Care','Other'
];
const medicalConditions = [
  'Diabetes','Hypertension','Cardiac Issues','Liver Disease',
  'Kidney Disease','HIV','Hepatitis B or C','Cancer',
  'None of the Above'
];


  const validatePhone = (number) => /^[6-9]\d{9}$/.test(number);

  const toggleCondition = (item) => {
    if (conditions.includes(item)) {
      setConditions(conditions.filter(c => c !== item));
    } else {
      setConditions([...conditions, item]);
    }
  };

  const handleSubmit = async () => {
    if (!name || !city || !contactNumber || !bloodGroup || !gender || !bloodUnits || !purpose || !requiredDateTime) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (!validatePhone(contactNumber)) {
      Alert.alert('Invalid Phone', 'Please enter a valid Indian mobile number.');
      return;
    }

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }

      await addDoc(collection(db, 'Bloodreceiver'), {
        name,
  city,
  gender,
  mobile:contactNumber,
  bloodGroup,
  bloodUnits,
  purpose,
  conditions,
  requiredDateTime,
  createdAt: serverTimestamp(),
  status: "pending", // required for matching logic
  uid: auth.currentUser.uid
      
        
      });

      Alert.alert('Success', 'Your blood request has been submitted!');
      setName('');
      setCity('');
      setContactNumber('');
      setBloodGroup('');
      setGender('');
      setBloodUnits('');
      setPurpose('');
      setConditions([]);
      setRequiredDateTime('');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Request Blood</Text>

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

          <View style={styles.bulletContainer}>
            <Text style={styles.label}>Blood Units Needed:</Text>
            <View style={styles.bulletRow}>
              {[1, 2, 3, 4, 5].map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.bullet,
                    bloodUnits == unit.toString() && styles.selectedBullet,
                  ]}
                  onPress={() => setBloodUnits(unit.toString())}
                >
                  <Text
                    style={[
                      styles.bulletText,
                      bloodUnits == unit.toString() && styles.selectedBulletText,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

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

          <TouchableOpacity onPress={() => setShowPurposeModal(true)}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {purpose ? `Purpose: ${purpose}` : 'Select Purpose of Blood Need'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowConditionModal(true)}>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {conditions.length > 0 ? `Conditions: ${conditions.join(', ')}` : 'Select Medical Conditions'}
              </Text>
            </View>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Required Date / Time (e.g. 20 July, 4:00 PM)"
            placeholderTextColor="#888"
            value={requiredDateTime}
            onChangeText={setRequiredDateTime}
          />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Request Blood</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderModal(showBloodModal, setShowBloodModal, 'Select Blood Group', bloodGroups, setBloodGroup)}
      {renderModal(showGenderModal, setShowGenderModal, 'Select Gender', genders, setGender)}
      {renderModal(showCityModal, setShowCityModal, 'Select City', cities, setCity)}
      {renderModal(showPurposeModal, setShowPurposeModal, 'Select Purpose', purposes, setPurpose)}

      <Modal visible={showConditionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Medical Conditions</Text>
            {medicalConditions.map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.modalOption}
                onPress={() => toggleCondition(item)}
              >
                <Text style={styles.modalOptionText}>
                  {conditions.includes(item) ? '✅ ' : ''}{item}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowConditionModal(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const renderModal = (visible, setVisible, title, options, onSelect) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                onSelect(item);
                setVisible(false);
              }}
            >
              <Text style={styles.modalOptionText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity onPress={() => setVisible(false)}>
          <Text style={styles.modalClose}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDECEC' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
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
  bulletContainer: {
    marginBottom: 15,
  },
  bulletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  bullet: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 20,
    width: 40,
    alignItems: 'center',
  },
  selectedBullet: {
    backgroundColor: '#b71c1c',
  },
  bulletText: {
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  selectedBulletText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    color: '#444',
  },
});
