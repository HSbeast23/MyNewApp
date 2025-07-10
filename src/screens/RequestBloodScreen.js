import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';

// Google Fonts
import {
  useFonts,
  Poppins_400Regular,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import AppLoading from 'expo-app-loading';

export default function RequestBloodScreen({ navigation }) { // ✅ Must match your Drawer.Screen name!
  const [bloodGroup, setBloodGroup] = useState('');
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [location, setLocation] = useState(null);
  const [contactNumber, setContactNumber] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [requestStatus, setRequestStatus] = useState('Pending');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  const handleLocate = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Allow location permission.');
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
    Alert.alert(
      'Location Set',
      `Lat: ${loc.coords.latitude}, Lon: ${loc.coords.longitude}`
    );
  };

  const validatePhone = (number) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(number);
  };

  const handleSubmit = () => {
    if (!bloodGroup || !location || !validatePhone(contactNumber)) {
      Alert.alert('Error', 'Fill all fields properly.');
      return;
    }
    Alert.alert('Success', 'Blood request submitted!');
    navigation.navigate('Home'); // ✅ This works because you have 'Home' in your Drawer!
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Blood Request Form</Text>

      <Text style={styles.label}>Blood Group</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={bloodGroup}
          onValueChange={(value) => setBloodGroup(value)}
        >
          <Picker.Item label="Select Blood Group" value="" />
          {bloodGroups.map((group) => (
            <Picker.Item key={group} label={group} value={group} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Units Needed: {unitsNeeded}</Text>
      <Slider
        style={{ width: '100%' }}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={unitsNeeded}
        onValueChange={setUnitsNeeded}
        minimumTrackTintColor="#D32F2F"
        thumbTintColor="#D32F2F"
      />

      <Text style={styles.label}>Location</Text>
      <TouchableOpacity style={styles.input} onPress={handleLocate}>
        <Text style={styles.inputText}>
          {location
            ? `Lat: ${location.latitude}`
            : 'Auto-locate or pin on map'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Contact Number"
        keyboardType="numeric"
        value={contactNumber}
        onChangeText={setContactNumber}
        maxLength={10}
      />

      <View style={styles.priorityContainer}>
        <TouchableOpacity
          style={[
            styles.priorityButton,
            priority === 'Normal' && styles.activePriority,
          ]}
          onPress={() => setPriority('Normal')}
        >
          <Text
            style={[
              styles.priorityText,
              priority === 'Normal' && styles.activePriorityText,
            ]}
          >
            Normal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.priorityButton,
            priority === 'Urgent' && styles.activePriority,
          ]}
          onPress={() => setPriority('Urgent')}
        >
          <Text
            style={[
              styles.priorityText,
              priority === 'Urgent' && styles.activePriorityText,
            ]}
          >
            Urgent
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Request Blood Now</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Request Status: {requestStatus}</Text>

      <TouchableOpacity style={styles.socialButton}>
        <Text style={styles.socialText}>Share on WhatsApp</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.socialButton}>
        <Text style={styles.socialText}>Share on Social Media</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 40, // ✅ Keeps title pushed down
  },
  label: {
    marginTop: 15,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  inputText: {
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  priorityButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activePriority: {
    backgroundColor: '#D32F2F',
    borderColor: '#D32F2F',
  },
  priorityText: {
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },
  activePriorityText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
  },
  submitButton: {
    backgroundColor: '#D32F2F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
  },
  socialButton: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  socialText: {
    fontFamily: 'Poppins_400Regular',
  },
});
