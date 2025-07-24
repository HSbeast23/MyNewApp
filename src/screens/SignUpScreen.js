// ✅ src/screens/SignUpScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

import { auth, db } from '../services/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [secureTextConfirm, setSecureTextConfirm] = useState(true);
  const [agree, setAgree] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "675390254350-damalk9bl472c3qr3pan12krc2gano7u.apps.googleusercontent.com",
      offlineAccess: true,
    });
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);

      Alert.alert('✅ Success', 'Signed in with Google!');

      const uid = userCredential.user.uid;
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        console.log('✅ Personal data exists.');
        navigation.replace('MainDrawer');
      } else {
        console.log('⚠️ No personal data found.');
        navigation.replace('PersonalDataForm');
      }

    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('❌ Google Sign-In Failed', error.message);
    }
  };

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
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

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ User registered:', { fullName, email });
      Alert.alert('Success', 'Account created!');

      const uid = userCredential.user.uid;
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        console.log('✅ Personal data exists.');
        navigation.replace('MainDrawer');
      } else {
        console.log('⚠️ No personal data found.');
        navigation.replace('PersonalDataForm');
      }

    } catch (error) {
      console.error('Sign Up Error:', error);
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          placeholder="Enter your full name"
          placeholderTextColor="#888"
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureText}
            autoCapitalize="none"
            style={styles.inputPassword}
          />
          <TouchableOpacity onPress={() => setSecureText(!secureText)}>
            <Ionicons
              name={secureText ? 'eye-off' : 'eye'}
              size={22}
              color="gray"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Re-enter your password"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureTextConfirm}
            autoCapitalize="none"
            style={styles.inputPassword}
          />
          <TouchableOpacity onPress={() => setSecureTextConfirm(!secureTextConfirm)}>
            <Ionicons
              name={secureTextConfirm ? 'eye-off' : 'eye'}
              size={22}
              color="gray"
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn}>
        <FontAwesome5 name="google" size={24} color="black" />
        <Text style={styles.socialText}> Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setAgree(!agree)}
        style={styles.checkboxContainer}
      >
        <Ionicons
          name={agree ? 'checkbox' : 'square-outline'}
          size={24}
          color="black"
        />
        <Text style={styles.checkboxText}>
          {' '}I agree to the Terms & Privacy Policy
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Join BloodLink Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: {
    fontSize: 28,
    alignSelf: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins_700Bold',
  },
  inputContainer: { marginBottom: 15 },
  label: { fontSize: 14, color: '#000', marginBottom: 4, fontFamily: 'Poppins_500Medium' },
  input: {
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
    fontFamily: 'Poppins_400Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
    justifyContent: 'space-between',
  },
  inputPassword: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  socialText: { fontSize: 16, fontFamily: 'Poppins_500Medium' },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkboxText: { fontSize: 14, marginLeft: 8, fontFamily: 'Poppins_400Regular' },
  button: {
    backgroundColor: '#b71c1c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
});
