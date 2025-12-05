import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';

import { auth, db } from '../services/auth';

const AuthorizationStatus = messaging.AuthorizationStatus || {};
const isKnownStatus = (status, name) =>
  typeof AuthorizationStatus[name] === 'number' && status === AuthorizationStatus[name];

const isAuthorized = (status) => {
  if (status === undefined || status === null) {
    // Android may resolve undefined when permission already granted
    return true;
  }

  if (typeof status === 'boolean') {
    return status;
  }

  if (typeof status === 'number') {
    return (
      isKnownStatus(status, 'AUTHORIZED') ||
      isKnownStatus(status, 'PROVISIONAL') ||
      isKnownStatus(status, 'NOT_DETERMINED') ||
      status > 0
    );
  }

  return false;
};

const ensurePermission = async () => {
  try {
    if (Platform.OS === 'android') {
      await messaging().setAutoInitEnabled(true);
    }

    const status = await messaging().requestPermission();
    return isAuthorized(status);
  } catch (error) {
    console.log('[FCM] Permission request failed', error?.message || error);
    return false;
  }
};

const persistToken = async (uid, token) => {
  if (!uid || !token) {
    return;
  }

  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        fcmToken: token,
        fcmUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log('[FCM] Token synced for user', uid);
  } catch (error) {
    console.log('[FCM] Failed to save token', { uid, message: error?.message || error });
    throw error;
  }
};

const acquireToken = async (explicitToken) => {
  if (explicitToken) {
    return explicitToken;
  }

  const hasPermission = await ensurePermission();
  if (!hasPermission) {
    console.log('[FCM] Notification permission not granted');
    return null;
  }

  try {
    const token = await messaging().getToken();
    return token || null;
  } catch (error) {
    console.log('[FCM] Failed to get device token', error?.message || error);
    return null;
  }
};

export const syncFcmTokenForCurrentUser = async (explicitToken) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }

  const token = await acquireToken(explicitToken);
  if (!token) {
    return null;
  }

  await persistToken(currentUser.uid, token);
  return token;
};

const useFcmTokenManager = () => {
  const refreshUnsubscribeRef = useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (refreshUnsubscribeRef.current) {
          refreshUnsubscribeRef.current();
          refreshUnsubscribeRef.current = null;
        }
        return;
      }

      await syncFcmTokenForCurrentUser();

      if (refreshUnsubscribeRef.current) {
        refreshUnsubscribeRef.current();
      }

      refreshUnsubscribeRef.current = messaging().onTokenRefresh(async (token) => {
        try {
          await syncFcmTokenForCurrentUser(token);
          console.log('[FCM] Device token refreshed');
        } catch (error) {
          console.log('[FCM] Failed to persist refreshed token', error?.message || error);
        }
      });
    });

    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      if (refreshUnsubscribeRef.current) {
        refreshUnsubscribeRef.current();
        refreshUnsubscribeRef.current = null;
      }
    };
  }, []);
};

export default useFcmTokenManager;
