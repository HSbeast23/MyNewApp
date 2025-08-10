// RequestBloodScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../services/auth';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { useTranslation } from '../hooks/useTranslation';

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

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const purposes = [
  'Surgery',
  'Accident',
  'Chronic Illness',
  'Child Birth',
  'Cancer Treatment',
  'Blood Disorder',
  'Other Medical Emergency',
];

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

export default function RequestBloodScreen() {
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
    units: 1,
    purpose: '',
    medicalConditions: [],
    requiredDateTime: new Date(),
  });

  const [loading, setLoading] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showPurposePicker, setShowPurposePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleConditionToggle = (condition) => {
    setForm((prev) => {
      const conditions = prev.medicalConditions.includes(condition)
        ? prev.medicalConditions.filter((c) => c !== condition)
        : [...prev.medicalConditions, condition];
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

  // Send push notification to matching donors
  const notifyMatchingDonors = async (requestData) => {
    try {
      // Find donors with matching blood group and city
      const donorsQuery = query(
        collection(db, 'BloodDonors'),
        where('bloodGroup', '==', requestData.bloodGroup),
        where('city', '==', requestData.city)
      );

      const donorsSnapshot = await getDocs(donorsQuery);

      const notifications = [];
      donorsSnapshot.forEach((doc) => {
        const donor = doc.data();
        if (donor.expoPushToken) {
          notifications.push({
            to: donor.expoPushToken,
            sound: 'default',
            title: '🩸 Blood Donation Request',
            body: `${requestData.bloodGroup} blood needed in ${requestData.city} for ${requestData.purpose}. Can you help?`,
            data: {
              screen: 'NotificationScreen',
              requestId: requestData.id,
              bloodGroup: requestData.bloodGroup,
              city: requestData.city,
            },
          });
        }
      });

      // Send notifications using Expo Push API
      if (notifications.length > 0) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notifications),
        });
        console.log(`Sent notifications to ${notifications.length} matching donors`);
      }
    } catch (error) {
      console.log('Error sending notifications:', error);
    }
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.mobile ||
      !form.city ||
      !form.gender ||
      !form.bloodGroup ||
      !form.purpose
    ) {
      Alert.alert('Error', 'Please fill all mandatory fields');
      return;
    }

    if (form.mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const pushToken = await getPushToken();
      const user = auth.currentUser;

      const requestData = {
        name: form.name,
        mobile: form.mobile,
        city: form.city,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        bloodUnits: form.units.toString(),
        purpose: form.purpose,
        conditions: form.medicalConditions,
        requiredDateTime: formatDateTime(form.requiredDateTime),
        pushToken: pushToken,
        uid: user?.uid,
        createdAt: serverTimestamp(),
        status: 'pending',
        responses: [],
        seenBy: [],
        respondedBy: null,
      };

      const docRef = await addDoc(collection(db, 'Bloodreceiver'), requestData);

      // Send notifications to matching donors
      await notifyMatchingDonors({ ...requestData, id: docRef.id });

      Alert.alert(
        'Success',
        'Your blood request has been submitted! Matching donors will be notified.',
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
                units: 1,
                purpose: '',
                medicalConditions: [],
                requiredDateTime: new Date(),
              });
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to submit request: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#b71c1c" />
      </View>
    );
  }
  const formatDateTime = (date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || form.requiredDateTime;
    setShowDatePicker(false);
    setForm({ ...form, requiredDateTime: currentDate });
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || form.requiredDateTime;
    setShowTimePicker(false);
    setForm({ ...form, requiredDateTime: currentTime });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="medical" size={40} color="#b71c1c" />
        <Text style={styles.title}>{t('bloodRequestForm')}</Text>
        <Text style={styles.subtitle}>{t('requestBloodForEmergency')}</Text>
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
            {form.city || t('selectYourCity')}
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

        <Text style={styles.sectionTitle}>{t('selectGender')}</Text>
        <View style={styles.optionsRow}>
          {[t('male'), t('female'), t('other')].map((gender, index) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.optionButton,
                form.gender === gender && styles.optionButtonSelected,
              ]}
              onPress={() => setForm({ ...form, gender: ['Male', 'Female', 'Other'][index] })}
            >
              <Text style={[
                styles.optionText,
                form.gender === gender && styles.optionTextSelected
              ]}>{gender}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('selectBloodGroup')}</Text>
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

        <Text style={styles.sectionTitle}>{t('bloodUnitsNeeded')}</Text>
        <View style={styles.unitsRow}>
          {[1, 2, 3, 4, 5].map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitButton,
                form.units === unit && styles.unitButtonSelected,
              ]}
              onPress={() => setForm({ ...form, units: unit })}
            >
              <Text style={[
                styles.unitText,
                form.units === unit && styles.unitTextSelected
              ]}>{unit}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowPurposePicker(!showPurposePicker)}
        >
          <Ionicons name="medical-outline" size={20} color="#666" style={styles.inputIcon} />
          <Text style={[styles.pickerButtonText, !form.purpose && styles.placeholderText]}>
            {form.purpose || 'Select purpose'}
          </Text>
          <Ionicons name="chevron-down-outline" size={20} color="#666" />
        </TouchableOpacity>

        {showPurposePicker && (
          <View style={styles.pickerContainer}>
            <ScrollView 
              style={styles.cityScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {purposes.map((purpose) => (
                <TouchableOpacity
                  key={purpose}
                  style={styles.purposeOption}
                  onPress={() => {
                    setForm({ ...form, purpose });
                    setShowPurposePicker(false);
                  }}
                >
                  <Text style={styles.purposeOptionText}>{purpose}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>Medical Conditions</Text>
        <Text style={styles.sectionSubtitle}>Select any conditions that apply</Text>
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

        <Text style={styles.sectionTitle}>Required Date & Time</Text>
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
            <Text style={styles.dateTimeText}>{formatDateTime(form.requiredDateTime)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={20} color="#666" style={styles.inputIcon} />
            <Text style={styles.dateTimeText}>Change Time</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={form.requiredDateTime}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            testID="timePicker"
            value={form.requiredDateTime}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        )}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#fff" style={styles.submitIcon} />
              <Text style={styles.submitText}>Submit Request</Text>
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
  purposeOption: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  purposeOptionText: {
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
  unitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  unitButton: {
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
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
  unitButtonSelected: {
    backgroundColor: '#b71c1c',
  },
  unitText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  unitTextSelected: {
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
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateTimeText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    flex: 1,
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
