import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../../services/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const AdminSetup = ({ navigation }) => {
  const defaultAdminEmail = process.env.EXPO_PUBLIC_ADMIN_EMAIL || '';
  const defaultAdminPassword = process.env.EXPO_PUBLIC_ADMIN_PASSWORD || '';

  const [email, setEmail] = useState(defaultAdminEmail);
  const [password, setPassword] = useState(defaultAdminPassword);
  const [confirmPassword, setConfirmPassword] = useState(defaultAdminPassword);
  const [name, setName] = useState('Admin User');
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Default admin credentials are sourced from environment variables for security
  const canBootstrapAdmin = Boolean(defaultAdminEmail && defaultAdminPassword);

  useEffect(() => {
    checkIfAdminExists();
  }, []);

  const checkIfAdminExists = async () => {
    if (!canBootstrapAdmin) {
      console.warn('Admin bootstrap credentials are not set. Define EXPO_PUBLIC_ADMIN_EMAIL and EXPO_PUBLIC_ADMIN_PASSWORD in your .env file.');
      setCheckingAdmin(false);
      return;
    }

    try {
      // Try to sign in with default admin credentials
      await signInWithEmailAndPassword(auth, defaultAdminEmail, defaultAdminPassword);
      Alert.alert(
        'Admin Account Exists',
        `Use these credentials to sign in:\nEmail: ${defaultAdminEmail}\nPassword: ${defaultAdminPassword}`,
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.log('Admin check error:', error.code);
      // If the error is because the admin doesn't exist, show the setup form
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setCheckingAdmin(false);
      } else {
        Alert.alert(
          'Error',
          'There was an issue checking for admin account. Please try again.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    }
  };

  const handleCreateAdmin = async () => {
    if (!email || !password || !confirmPassword || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Special case for default admin password which is shorter than 6 chars
    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // Create the admin user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create an admin document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        name: name,
        isAdmin: true,
        bloodGroup: 'N/A',
        phone: 'N/A',
        createdAt: new Date(),
      });

      Alert.alert(
        'Admin Created',
        'Admin account has been created successfully.',
        [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Error creating admin:', error);
      let errorMessage = 'Failed to create admin account.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Try logging in.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Checking admin configuration...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerContainer}>
        <Ionicons name="shield" size={60} color="#e74c3c" />
        <Text style={styles.title}>Advanced Access</Text>
        <Text style={styles.subtitle}>Setup privileged account</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#888"
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor="#888"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreateAdmin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Create Admin Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backButtonText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
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
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 15,
    shadowColor: '#e74c3c',
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 16,
  },
});

export default AdminSetup;
