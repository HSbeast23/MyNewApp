// ✅ src/screens/LoginScreen.js

import React, { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// ✅ Use your own auth.js
import { auth, db } from '../services/auth'; // matches your structure
WebBrowser.maybeCompleteAuthSession();

import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Expo AuthSession Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '675390254350-damalk9bl472c3qr3pan12krc2gano7u.apps.googleusercontent.com',
    androidClientId: '675390254350-damalk9bl472c3qr3pan12krc2gano7u.apps.googleusercontent.com',
    iosClientId: '675390254350-damalk9bl472c3qr3pan12krc2gano7u.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          Alert.alert('✅ Success', 'Signed in with Google!');
          const uid = userCredential.user.uid;
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            navigation.replace('MainDrawer');
          } else {
            navigation.replace('PersonalDataForm');
          }
        })
        .catch((error) => {
          Alert.alert('❌ Google Sign-In Failed', error.message);
        });
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    promptAsync();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    try {
      // ✅ Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful!');

      const uid = userCredential.user.uid;

      // ✅ Check if personal data exists
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (userDoc.exists()) {
        console.log('✅ Personal data exists.');
        navigation.replace('MainDrawer');
      } else {
        console.log('⚠️ No personal data found. Navigating to form.');
        navigation.replace('PersonalDataForm');
      }

    } catch (error) {
      console.log('❌ Login Error:', error);
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Image
        source={require('../../assets/images/welcome.png')}
        style={styles.logo}
      />

      <Text style={styles.title}>
        Login to <Text style={{ color: '#b71c1c' }}>BloodLink</Text>
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#eee', flexDirection: 'row', alignItems: 'center', marginBottom: 10 }]} onPress={handleGoogleSignIn}>
        <FontAwesome5 name="google" size={22} color="black" style={{ marginRight: 8 }} />
        <Text style={[styles.buttonText, { color: '#333' }]}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkText}>
          Don’t have an account?{' '}
          <Text style={styles.linkHighlight}>Register here</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 25,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    width: '100%',
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 14,
    marginBottom: 15,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  button: {
    backgroundColor: '#b71c1c',
    paddingVertical: 15,
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  linkText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#333',
  },
  linkHighlight: {
    color: '#1976D2',
    fontFamily: 'Poppins_600SemiBold',
  },
});
