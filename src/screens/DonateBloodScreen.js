// DonateBloodScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/auth';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import AppLoading from 'expo-app-loading';

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
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
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

  const handleConditionToggle = (condition) => {
    setForm((prev) => {
      const conditions = prev.medicalConditions.includes(condition)
        ? prev.medicalConditions.filter((c) => c !== condition)
        : [...prev.medicalConditions, condition];
      return { ...prev, medicalConditions: conditions };
    });
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
      alert('Please fill all mandatory fields');
      return;
    }
    try {
      await addDoc(collection(db, 'BloodDonors'), {
        ...form,
        timestamp: serverTimestamp(),
      });
      alert('Thank you for registering as a donor!');
      setForm({
        name: '',
        mobile: '',
        city: '',
        gender: '',
        bloodGroup: '',
        age: '',
        medicalConditions: [],
      });
    } catch (e) {
      alert('Failed to register donor: ' + e.message);
    }
  };

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Blood Donor Registration</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={form.name}
        onChangeText={(text) => setForm({ ...form, name: text })}
        placeholder="Enter full name"
      />

      <Text style={styles.label}>Mobile Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={form.mobile}
        onChangeText={(text) => setForm({ ...form, mobile: text })}
        placeholder="Enter mobile number"
        maxLength={10}
      />

      <Text style={styles.label}>City</Text>
      <ScrollView style={styles.dropdown}>
        {tamilNaduCities.map((city) => (
          <TouchableOpacity
            key={city}
            onPress={() => setForm({ ...form, city })}
            style={[
              styles.dropdownItem,
              form.city === city && styles.selectedItem,
            ]}
          >
            <Text>{city}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
        {['Male', 'Female', 'Other'].map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.radio,
              form.gender === gender && styles.radioSelected,
            ]}
            onPress={() => setForm({ ...form, gender })}
          >
            <Text>{gender}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Blood Group</Text>
      <View style={styles.row}>
        {bloodGroups.map((bg) => (
          <TouchableOpacity
            key={bg}
            style={[
              styles.bloodGroup,
              form.bloodGroup === bg && styles.bloodGroupSelected,
            ]}
            onPress={() => setForm({ ...form, bloodGroup: bg })}
          >
            <Text>{bg}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={form.age}
        onChangeText={(text) => setForm({ ...form, age: text })}
        placeholder="Enter your age"
      />

      <Text style={styles.label}>Medical Conditions</Text>
      <View style={styles.conditionsContainer}>
        {medicalConditionsList.map((cond) => (
          <TouchableOpacity
            key={cond}
            style={[
              styles.conditionBox,
              form.medicalConditions.includes(cond) && styles.conditionBoxSelected,
            ]}
            onPress={() => handleConditionToggle(cond)}
          >
            <Text>{cond}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Register as Donor</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, marginBottom: 20 },
  label: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 10,
    marginTop: 5,
    fontFamily: 'Poppins_400Regular',
  },
  dropdown: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    marginTop: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#d0f0c0',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  radio: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 15,
    marginRight: 10,
    marginTop: 5,
  },
  radioSelected: {
    backgroundColor: '#8fbc8f',
  },
  bloodGroup: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginTop: 5,
  },
  bloodGroupSelected: {
    backgroundColor: '#fa8072',
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  conditionBox: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 8,
    marginRight: 10,
    marginTop: 5,
  },
  conditionBoxSelected: {
    backgroundColor: '#add8e6',
  },
  submitBtn: {
    backgroundColor: '#fa8072',
    padding: 15,
    borderRadius: 8,
    marginTop: 25,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
});
