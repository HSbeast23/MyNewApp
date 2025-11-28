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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

import { auth as emailPasswordAuth, db } from '../services/auth';
import useOtp, { OTP_RESEND_INTERVAL_SECONDS } from '../hooks/useFirebaseOtp';

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
  const { email, formData, otpExpiresAt } = params;

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
    clearError,
    hydrateCountdown,
  } = useOtp();

  useEffect(() => {
    if (!otpExpiresAt) return;
    const remainingSeconds = Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000));
    if (remainingSeconds > 0) {
      hydrateCountdown(remainingSeconds);
    }
  }, [otpExpiresAt, hydrateCountdown]);

  useEffect(() => {
    if (error) {
      Alert.alert('OTP Error', error, [{ text: 'OK', onPress: () => clearError() }], {
        cancelable: true,
      });
    }
  }, [error, clearError]);

  const maskedEmail = useMemo(() => {
    if (!email) return '';
    const [localPart, domain = ''] = email.split('@');
    if (!localPart) return email;
    const visible = localPart.slice(0, 2);
    return `${visible}${'•'.repeat(Math.max(1, localPart.length - 2))}@${domain}`;
  }, [email]);

  const handleVerify = async () => {
    if (!email || !formData) {
      Alert.alert('Missing data', 'Return to signup and try again.');
      return;
    }

    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code.');
      return;
    }

    setSubmitting(true);
    try {
      await verifyCode(email, otp);
      const fcmToken = await messaging().getToken();

      const { fullName, email: formEmail, password } = formData;
      const userCredential = await createUserWithEmailAndPassword(emailPasswordAuth, formEmail, password);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        fullName,
        email: formEmail,
        isEmailVerified: true,
        profileComplete: false,
        createdAt: serverTimestamp(),
        fcmToken,
      });

      Alert.alert('Success', 'Email verified and account created!', [
        {
          text: 'Continue',
          onPress: () =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: 'PersonalDetails',
                    params: { fullName, email: formEmail },
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
    if (!email) return;
    try {
      await resendCode(email);
      hydrateCountdown(OTP_RESEND_INTERVAL_SECONDS);
      setOtp('');
      Alert.alert('OTP Sent', 'We have emailed you a new code.');
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

  if (!email || !formData) {
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
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to {maskedEmail}
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
