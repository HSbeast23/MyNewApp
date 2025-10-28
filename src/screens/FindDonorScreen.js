import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Callout, Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { db, auth } from '../services/auth';
import { useTranslation } from '../hooks/useTranslation';

const defaultRegion = {
  latitude: 11.1271,
  longitude: 78.6569,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

export default function FindDonorScreen() {
  const { t } = useTranslation();
  const mapRef = useRef(null);

  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [hasRequestedInitialRegion, setHasRequestedInitialRegion] = useState(false);

  const updateCurrentUserLocation = useCallback(
    async (silent = false) => {
      try {
        setIsUpdatingLocation(true);
        let permission = await Location.getForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
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

        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            ...coords,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 400);
          setHasRequestedInitialRegion(true);
        }

        const user = auth.currentUser;
        if (user) {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              locationEnabled: true,
              location: coords,
              locationUpdatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.log('Failed to update current user location', error);
        }
        if (!silent) {
          Alert.alert(t('error'), t('locationUpdateError'));
        }
      } finally {
        setIsUpdatingLocation(false);
      }
    },
    [t]
  );

  const handleOpenExternalMap = useCallback(
    (coords) => {
      const url = Platform.select({
        ios: `http://maps.apple.com/?daddr=${coords.latitude},${coords.longitude}`,
        android: `geo:${coords.latitude},${coords.longitude}?q=${coords.latitude},${coords.longitude}`,
        default: `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`,
      });

      if (!url) {
        Alert.alert(t('error'), t('unableToOpenMaps'));
        return;
      }

      Linking.openURL(url).catch(() => Alert.alert(t('error'), t('unableToOpenMaps')));
    },
    [t]
  );

  const formatLastUpdated = useCallback(
    (timestamp) => {
      if (!timestamp) {
        return `${t('lastUpdated')}: —`;
      }

      const date = typeof timestamp?.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
      return `${t('lastUpdated')}: ${date.toLocaleString()}`;
    },
    [t]
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const nextDonors = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter(
            (user) =>
              user.location &&
              typeof user.location.latitude === 'number' &&
              typeof user.location.longitude === 'number'
          );

        setDonors(nextDonors);
        setIsLoading(false);

        if (!hasRequestedInitialRegion && nextDonors.length > 0 && mapRef.current) {
          const first = nextDonors[0].location;
          mapRef.current.animateToRegion(
            {
              latitude: first.latitude,
              longitude: first.longitude,
              latitudeDelta: 0.5,
              longitudeDelta: 0.5,
            },
            500
          );
          setHasRequestedInitialRegion(true);
        }
      },
      (error) => {
        if (__DEV__) {
          console.log('Error subscribing to donors', error);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hasRequestedInitialRegion]);

  useEffect(() => {
    updateCurrentUserLocation(true);
  }, [updateCurrentUserLocation]);

  useFocusEffect(
    useCallback(() => {
      updateCurrentUserLocation(true);
    }, [updateCurrentUserLocation])
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('findDonorMap')}</Text>
        <Text style={styles.infoText}>{t('findDonorHelperText')}</Text>
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          showsUserLocation
          showsCompass
          initialRegion={defaultRegion}
        >
          <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />

          {donors.map((user) => (
            <Marker
              key={user.id}
              coordinate={{
                latitude: user.location.latitude,
                longitude: user.location.longitude,
              }}
              pinColor="#b71c1c"
            >
              <Callout tooltip={false}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{user.name || 'BloodLink User'}</Text>
                  {user.bloodGroup && (
                    <Text style={styles.calloutLine}>{`${t('bloodGroup')}: ${user.bloodGroup}`}</Text>
                  )}
                  {user.city && (
                    <Text style={styles.calloutLine}>{`${t('city')}: ${user.city}`}</Text>
                  )}
                  <Text style={styles.calloutLine}>{formatLastUpdated(user.locationUpdatedAt)}</Text>
                  <TouchableOpacity
                    style={styles.calloutButton}
                    onPress={() => handleOpenExternalMap(user.location)}
                  >
                    <Text style={styles.calloutButtonText}>{t('openInMaps')}</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#b71c1c" />
          </View>
        )}

        {!isLoading && donors.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('noDonorsNearby')}</Text>
          </View>
        )}
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => updateCurrentUserLocation(false)}
          disabled={isUpdatingLocation}
        >
          {isUpdatingLocation ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="locate" size={20} color="#fff" />
          )}
          <Text style={styles.fabText}>{t('updateMyLocation')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  infoCard: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  infoTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#212121',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#616161',
    marginTop: 6,
  },
  mapWrapper: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  callout: {
    minWidth: 200,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  calloutTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#212121',
    marginBottom: 4,
  },
  calloutLine: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#424242',
    marginBottom: 2,
  },
  calloutButton: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#b71c1c',
  },
  calloutButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  emptyState: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#424242',
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b71c1c',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
  },
});
