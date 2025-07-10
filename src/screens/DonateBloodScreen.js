// DonateBloodScreen.js ✅
// Make sure file name matches!

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';

export default function DonateBloodScreen() { // ✅ Use the same name!
  const navigation = useNavigation();

  const [donorName, setDonorName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [age, setAge] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [location, setLocation] = useState(null);
  const [experience, setExperience] = useState('');

  const handleLocate = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });
  };

  const handleSubmit = () => {
    if (!donorName || !bloodGroup || !age || !contactNumber || !location || !experience) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const donorAge = parseInt(age);
    if (isNaN(donorAge) || donorAge < 18 || donorAge > 65) {
      Alert.alert('Invalid Age', 'Donor age must be between 18 and 65.');
      return;
    }

    if (experience === 'First Time' && donorAge >= 60) {
      Alert.alert(
        'Age Restriction',
        'First time donors above or equal to 60 years cannot donate blood.'
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(contactNumber)) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    Alert.alert('Success', 'Thank you for registering as a donor!');
    navigation.navigate('Home'); // ✅ You already have Home in your drawer!
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Become a Blood Donor</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Your Name"
        placeholderTextColor="#555"
        value={donorName}
        onChangeText={setDonorName}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={bloodGroup}
          onValueChange={(itemValue) => setBloodGroup(itemValue)}
        >
          <Picker.Item label="Select Blood Group" value="" />
          <Picker.Item label="A+" value="A+" />
          <Picker.Item label="A-" value="A-" />
          <Picker.Item label="B+" value="B+" />
          <Picker.Item label="B-" value="B-" />
          <Picker.Item label="AB+" value="AB+" />
          <Picker.Item label="AB-" value="AB-" />
          <Picker.Item label="O+" value="O+" />
          <Picker.Item label="O-" value="O-" />
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Enter Your Age"
        placeholderTextColor="#555"
        keyboardType="numeric"
        maxLength={2}
        value={age}
        onChangeText={setAge}
      />

      <TextInput
        style={styles.input}
        placeholder="Your Contact Number"
        placeholderTextColor="#555"
        keyboardType="numeric"
        maxLength={10}
        value={contactNumber}
        onChangeText={setContactNumber}
      />

      <TouchableOpacity style={styles.input} onPress={handleLocate}>
        <Text style={styles.inputText}>
          {location
            ? `Lat: ${location.latitude.toFixed(4)}, Long: ${location.longitude.toFixed(4)}`
            : 'Auto-locate or pin on map'}
        </Text>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            experience === 'First Time' && styles.activeOption,
          ]}
          onPress={() => setExperience('First Time')}
        >
          <Text style={styles.optionText}>First Time</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            experience === 'Alderly Experienced' && styles.activeOption,
          ]}
          onPress={() => setExperience('Alderly Experienced')}
        >
          <Text style={styles.optionText}>Alderly Experienced</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Become a Donor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#000',
    textAlign: 'center',
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
  inputText: {
    fontFamily: 'Poppins_400Regular',
    color: '#555',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D32F2F',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeOption: {
    backgroundColor: '#D32F2F',
  },
  optionText: {
    color: '#000',
    fontFamily: 'Poppins_400Regular',
  },
  submitButton: {
    backgroundColor: '#D32F2F',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
});
