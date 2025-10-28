import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { db, auth } from '../services/auth';
import { useTranslation } from '../hooks/useTranslation';

const illustration = require('../../assets/images/users.png');

export default function EnableLocationScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const navigateToMain = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'MainDrawer' }] });
  }, [navigation]);

  const persistLocationLocally = useCallback(async (coords) => {
    try {
      const stored = await AsyncStorage.getItem('userProfile');
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored);
      const updatedProfile = {
        ...parsed,
        locationEnabled: true,
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      };
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    } catch (storageError) {
      if (__DEV__) {
        console.log('Failed to update cached profile with location', storageError);
      }
    }
  }, []);

  const handleEnableLocation = useCallback(
    async ({ skipRequest = false, silent = false } = {}) => {
      try {
        setIsSaving(true);
        let permission = await Location.getForegroundPermissionsAsync();

        if (!skipRequest || permission.status !== 'granted') {
          permission = await Location.requestForegroundPermissionsAsync();
        }

        if (permission.status !== 'granted') {
          if (!silent) {
            Alert.alert(t('locationPermissionNeededTitle'), t('locationPermissionDenied'));
          }
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const user = auth.currentUser;
        if (!user) {
          if (!silent) {
            Alert.alert(t('error'), t('locationUpdateError'));
          }
          navigateToMain();
          return;
        }

        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            locationEnabled: true,
            location: coords,
            locationUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await persistLocationLocally(coords);
        navigateToMain();
      } catch (error) {
        if (__DEV__) {
          console.log('Error enabling location', error);
        }
        if (!silent) {
          Alert.alert(t('error'), t('locationUpdateError'));
        }
      } finally {
        setIsSaving(false);
      }
    },
    [navigateToMain, persistLocationLocally, t]
  );

  useEffect(() => {
    let isMounted = true;

    const prepare = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigateToMain();
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (userData?.location?.latitude && userData?.location?.longitude) {
          navigateToMain();
          return;
        }

        const permission = await Location.getForegroundPermissionsAsync();
        if (permission.status === 'granted') {
          await handleEnableLocation({ skipRequest: true, silent: true });
          return;
        }
      } catch (error) {
        if (__DEV__) {
          console.log('Pre-check for location failed', error);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    prepare();

    return () => {
      isMounted = false;
    };
  }, [handleEnableLocation, navigateToMain]);

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b71c1c" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageWrapper}>
          <Image source={illustration} style={styles.image} resizeMode="contain" />
        </View>
        <Text style={styles.title}>{t('enableLocationTitle')}</Text>
        <Text style={styles.subtitle}>{t('enableLocationSubtitle')}</Text>
        <Text style={styles.description}>{t('enableLocationDescription')}</Text>

        <TouchableOpacity
          style={[styles.primaryButton, isSaving && styles.disabledButton]}
          onPress={() => handleEnableLocation({ skipRequest: false })}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('enableLocationButton')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={navigateToMain}
          disabled={isSaving}
        >
          <Text style={styles.secondaryButtonText}>{t('skipForNow')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 260,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#212121',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#424242',
    textAlign: 'center',
    marginTop: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#616161',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#b71c1c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  secondaryButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#b71c1c',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
});
