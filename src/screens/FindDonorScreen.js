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
import MapView, { Marker, UrlTile } from 'react-native-maps';
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

const OSM_TILE_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';

export default function FindDonorScreen() {
  const { t } = useTranslation();
  const mapRef = useRef(null);
  const locationWatcherRef = useRef(null);

  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [hasRequestedInitialRegion, setHasRequestedInitialRegion] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);

  const persistLocation = useCallback(
    async (coords, { shouldAnimate = true } = {}) => {
      if (shouldAnimate && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          400
        );
        setHasRequestedInitialRegion(true);
      }

      const user = auth.currentUser;
      if (!user) {
        return;
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          locationEnabled: true,
          location: coords,
          locationUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    []
  );

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

        await persistLocation(coords, { shouldAnimate: true });
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
    [persistLocation, t]
  );

  const stopLocationWatcher = useCallback(() => {
    if (locationWatcherRef.current) {
      locationWatcherRef.current.remove();
      locationWatcherRef.current = null;
    }
  }, []);

  const startLocationWatcher = useCallback(async () => {
    if (locationWatcherRef.current) {
      return;
    }

    let permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await Location.requestForegroundPermissionsAsync();
    }

    if (permission.status !== 'granted') {
      Alert.alert(t('locationPermissionNeededTitle'), t('locationPermissionDenied'));
      return;
    }

    locationWatcherRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000,
        distanceInterval: 50,
      },
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        persistLocation(coords, { shouldAnimate: false }).catch((error) => {
          if (__DEV__) {
            console.log('Error persisting watched location', error);
          }
        });
      }
    );
  }, [persistLocation, t]);

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
      let isActive = true;

      (async () => {
        await updateCurrentUserLocation(true);
        if (isActive) {
          await startLocationWatcher();
        }
      })();

      return () => {
        isActive = false;
        stopLocationWatcher();
      };
    }, [startLocationWatcher, stopLocationWatcher, updateCurrentUserLocation])
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
          mapType="none"
          initialRegion={defaultRegion}
        >
          <UrlTile
            urlTemplate={OSM_TILE_URL}
            maximumZ={19}
            zIndex={-1}
            flipY={false}
          />

          {donors.map((user) => (
            <Marker
              key={user.id}
              coordinate={{
                latitude: user.location.latitude,
                longitude: user.location.longitude,
              }}
              pinColor="#b71c1c"
              onPress={() => setSelectedDonor(user)}
            />
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
          style={[styles.fab, isUpdatingLocation && styles.fabDisabled]}
          onPress={() => updateCurrentUserLocation(false)}
          disabled={isUpdatingLocation}
        >
          <Ionicons name="locate" size={20} color="#fff" />
          <Text style={styles.fabText}>{t('updateMyLocation')}</Text>
        </TouchableOpacity>
      </View>

      {selectedDonor && (
        <View style={styles.selectionCard}>
          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle} numberOfLines={1}>
              {selectedDonor.name || 'BloodLink User'}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDonor(null)} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#757575" />
            </TouchableOpacity>
          </View>
          {selectedDonor.bloodGroup && (
            <Text style={styles.selectionLine}>{`${t('bloodGroup')}: ${selectedDonor.bloodGroup}`}</Text>
          )}
          {selectedDonor.city && (
            <Text style={styles.selectionLine}>{`${t('city')}: ${selectedDonor.city}`}</Text>
          )}
          <Text style={styles.selectionLine}>{formatLastUpdated(selectedDonor.locationUpdatedAt)}</Text>

          <TouchableOpacity
            style={styles.selectionAction}
            onPress={() => handleOpenExternalMap(selectedDonor.location)}
          >
            <Text style={styles.selectionActionText}>{t('openInMaps')}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  fabDisabled: {
    opacity: 0.65,
  },
  fabText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
  },
  selectionCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectionTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#212121',
  },
  closeButton: {
    padding: 4,
  },
  selectionLine: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#424242',
    marginBottom: 4,
  },
  selectionAction: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#b71c1c',
    alignItems: 'center',
  },
  selectionActionText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
