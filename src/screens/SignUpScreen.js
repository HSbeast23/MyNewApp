import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import useFirebaseOtp from '../hooks/useFirebaseOtp';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [secureTextConfirm, setSecureTextConfirm] = useState(true);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { sendCode } = useFirebaseOtp();

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const handlePhoneChange = (value) => {
    setPhoneNumber(value.replace(/[^0-9]/g, ''));
  };

  const handleSendOtp = async () => {
    const numericPhone = phoneNumber.replace(/[^0-9]/g, '');
    const trimmedPhone = numericPhone.slice(-10);
    if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (!agree) {
      Alert.alert('Error', 'Please agree to the Terms & Privacy Policy');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (trimmedPhone.length !== 10) {
      Alert.alert('Error', 'Enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    const formattedPhone = `+91${trimmedPhone}`;
    try {
      const verificationId = await sendCode(formattedPhone);

      navigation.navigate('Otp', {
        verificationId,
        phoneNumber: formattedPhone,
        formData: {
          fullName,
          email,
          password,
        },
      });
    } catch (error) {
      Alert.alert('OTP Failed', error.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b71c1c" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Image source={require('../../assets/images/welcome.png')} style={styles.logo} />

        <Text style={styles.title}>
          Join <Text style={{ color: '#b71c1c' }}>BloodLink</Text>
        </Text>

        {/* Full Name */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone Number */}
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
          <Text style={styles.countryCode}>+91</Text>
          <View style={styles.divider} />
          <TextInput
            placeholder="10-digit mobile number"
            placeholderTextColor="#888"
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            style={styles.input}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureText}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
            <Ionicons name={secureText ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureTextConfirm}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setSecureTextConfirm(!secureTextConfirm)} style={styles.eyeIcon}>
            <Ionicons name={secureTextConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Agree Terms */}
        <TouchableOpacity onPress={() => setAgree(!agree)} style={styles.checkboxContainer}>
          <Ionicons name={agree ? 'checkbox' : 'square-outline'} size={24} color={agree ? '#b71c1c' : '#888'} />
          <Text style={styles.checkboxText}>I agree to the Terms & Privacy Policy</Text>
        </TouchableOpacity>

        {/* Create Account Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Send OTP</Text>}
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkHighlight}>Login here</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 40,
    textAlign: 'center',
    color: '#333',
  },
  inputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  countryCode: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginRight: 6,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  eyeIcon: {
    padding: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  checkboxText: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    flex: 1,
  },
  button: {
    backgroundColor: '#b71c1c',
    paddingVertical: 16,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    shadowColor: '#b71c1c',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  linkText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  linkHighlight: {
    color: '#b71c1c',
    fontFamily: 'Poppins_600SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
