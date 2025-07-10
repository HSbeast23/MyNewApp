import React, { useState } from 'react';
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

// ✅ Firebase Auth
import { auth } from '../services/auth'; // your auth.js
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';

// ✅ Expo Google Auth
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [secureTextConfirm, setSecureTextConfirm] = useState(true);
  const [agree, setAgree] = useState(false);

  const navigation = useNavigation();

  // ✅ Google Auth request
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.authentication;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
          console.log('✅ Google Sign-In successful');
          Alert.alert('Success', 'Signed in with Google!');
          navigation.replace('MainDrawer');
        })
        .catch((error) => {
          console.log(error);
          Alert.alert('Error', error.message);
        });
    }
  }, [response]);

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
      console.log(error);
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
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

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={secureTextConfirm}
          style={styles.inputPassword}
        />
        <TouchableOpacity
          onPress={() => setSecureTextConfirm(!secureTextConfirm)}
        >
          <Ionicons
            name={secureTextConfirm ? 'eye-off' : 'eye'}
            size={22}
            color="gray"
          />
        </TouchableOpacity>
      </View>

      {/* ✅ Google Auth Button */}
      <TouchableOpacity
        style={styles.socialButton}
        onPress={() => promptAsync()}
      >
        <FontAwesome5 name="google" size={24} color="black" />
        <Text style={styles.socialText}> Continue with Google</Text>
      </TouchableOpacity>

      {/* Your existing Apple button */}
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
          {' '}
          I agree to the Terms & Privacy Policy
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Join BloodLink Now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ✅ Styles unchanged
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
  input: {
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontFamily: 'Poppins_400Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
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
