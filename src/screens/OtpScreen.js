import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import nativeAuth from '@react-native-firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

import { auth as emailPasswordAuth, db } from '../services/auth';
import useFirebaseOtp from '../hooks/useFirebaseOtp';

const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
};

const OtpScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const { verificationId, phoneNumber, formData } = params;

  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  const {
    countdown,
    sending,
    verifying,
    error,
    resendCode,
    verifyCode,
    hydrateVerificationId,
    clearError,
  } = useFirebaseOtp();

  useEffect(() => {
    if (verificationId) {
      hydrateVerificationId(verificationId);
    }
  }, [verificationId, hydrateVerificationId]);

  useEffect(() => {
    if (error) {
      Alert.alert('OTP Error', error, [{ text: 'OK', onPress: () => clearError() }], {
        cancelable: true,
      });
    }
  }, [error, clearError]);

  const maskedPhoneNumber = useMemo(() => {
    if (!phoneNumber) return '';
    const tail = phoneNumber.slice(-4);
    return `+91 ••••••${tail}`;
  }, [phoneNumber]);

  const handleVerify = async () => {
    if (!verificationId || !phoneNumber || !formData) {
      Alert.alert('Missing data', 'Return to signup and try again.');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyCode(otp, verificationId);
      const fcmToken = await messaging().getToken();

      // Clear the temporary phone-auth session so email/password creation works as before
      await nativeAuth().signOut();

      const { fullName, email, password } = formData;
      const userCredential = await createUserWithEmailAndPassword(emailPasswordAuth, email, password);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        fullName,
        email,
        phoneNumber,
        isPhoneVerified: true,
        profileComplete: false,
        createdAt: serverTimestamp(),
        fcmToken,
      });

      Alert.alert('Success', 'Phone verified and account created!', [
        {
          text: 'Continue',
          onPress: () =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'PersonalDetails',
                    params: { fullName, email, phoneNumber },
                  },
                ],
              })
            ),
        },
      ]);
    } catch (err) {
      Alert.alert('Verification failed', err.message || 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!phoneNumber) return;
    try {
      const newId = await resendCode(phoneNumber);
      hydrateVerificationId(newId);
      setOtp('');
      Alert.alert('OTP Sent', 'We have sent a new code to your number.');
    } catch (err) {
      Alert.alert('Resend failed', err.message || 'Unable to resend OTP right now.');
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#b71c1c" />
      </View>
    );
  }

  if (!verificationId || !phoneNumber || !formData) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Missing verification details. Please restart the signup flow.</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.secondaryButtonText}>Back to Signup</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Verify Your Number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {maskedPhoneNumber}
        </Text>

        <TextInput
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.otpInput}
          placeholder="••••••"
          placeholderTextColor="#ccc"
        />

        <TouchableOpacity
          style={[styles.primaryButton, (verifying || submitting) && styles.disabledButton]}
          onPress={handleVerify}
          disabled={verifying || submitting}
        >
          {verifying || submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendLabel}>Didn’t get the code?</Text>
          <TouchableOpacity
            disabled={countdown > 0 || sending}
            onPress={handleResend}
          >
            <Text
              style={[
                styles.resendText,
                (countdown > 0 || sending) && styles.disabledText,
              ]}
            >
              {countdown > 0 ? `Resend in ${formatCountdown(countdown)}` : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#111',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 32,
  },
  otpInput: {
    backgroundColor: '#fff',
    borderRadius: 16,
    height: 70,
    fontSize: 32,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 12,
    textAlign: 'center',
    color: '#111',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#b71c1c',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  resendLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
  },
  resendText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#b71c1c',
  },
  disabledText: {
    color: '#aaa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#b71c1c',
    marginBottom: 20,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b71c1c',
  },
  secondaryButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#b71c1c',
  },
});

export default OtpScreen;
