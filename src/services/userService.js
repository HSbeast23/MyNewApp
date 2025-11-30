import { doc, getDoc } from 'firebase/firestore';
import { db } from './auth';

/**
 * Fetch full user profile from Firestore.
 */
export const fetchUserProfile = async (uid) => {
  if (!uid) {
    return null;
  }

  try {
    const snapshot = await getDoc(doc(db, 'users', uid));
    if (!snapshot.exists()) {
      return null;
    }

    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error('Failed to fetch user profile', { uid, message: error.message });
    return null;
  }
};

/**
 * Convenience helper to read the stored FCM token for a user.
 */
export const fetchUserFcmToken = async (uid) => {
  const profile = await fetchUserProfile(uid);
  return profile?.fcmToken || null;
};
