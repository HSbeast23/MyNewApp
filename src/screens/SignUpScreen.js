import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import {
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../services/auth';
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
      // ✅ Use your updated Web OAuth Client ID here
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
      await signInWithCredential(auth, googleCredential);

      Alert.alert('✅ Success', 'Signed in with Google!');
      navigation.replace('MainDrawer');
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
      await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ User registered:', { fullName, email });
      Alert.alert('Success', 'Account created! Welcome to BloodLink!');
      navigation.replace('MainDrawer');
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

      <TouchableOpacity
        style={styles.socialButton}
        onPress={handleGoogleSignIn}
      >
        <FontAwesome5 name="google" size={24} color="black" />
        <Text style={styles.socialText}> Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.socialButton}>
        <Image
          source={require('../../assets/apple.png')}
          style={{ width: 24, height: 24, marginRight: 8 }}
          resizeMode="contain"
        />
        <Text style={styles.socialText}> Continue with Apple</Text>
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
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    alignSelf: 'center',
    marginBottom: 30,
    fontFamily: 'Poppins_700Bold',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
    fontFamily: 'Poppins_400Regular',
  },
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
    marginBottom: 12,
  },
  socialText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkboxText: {
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Poppins_400Regular',
  },
  button: {
    backgroundColor: 'red',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
});
