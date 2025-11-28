import { useCallback, useEffect, useRef, useState } from 'react';
import auth from '@react-native-firebase/auth';

const RESEND_INTERVAL_SECONDS = 120;

const humanizeFirebaseError = (error) => {
  if (!error) return 'Something went wrong. Please try again.';
  const message = error.message || '';

  switch (error.code) {
    case 'auth/invalid-phone-number':
      return 'The phone number is invalid. Please double-check and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Try again later or use a different number.';
    case 'auth/invalid-verification-code':
      return 'The OTP you entered is incorrect.';
    case 'auth/code-expired':
      return 'That OTP has expired. Please request a new one.';
    default:
      if (message.includes('timeout')) {
        return 'Request timed out. Check your network connection and retry.';
      }
      return message || 'Unable to complete the request. Please try again.';
  }
};

const useFirebaseOtp = () => {
  const [verificationId, setVerificationId] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setCountdown(RESEND_INTERVAL_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const sendCode = useCallback(
    async (phoneNumber) => {
      setSending(true);
      setError(null);
      try {
        const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
        setVerificationId(confirmation.verificationId);
        startTimer();
        return confirmation.verificationId;
      } catch (err) {
        setError(humanizeFirebaseError(err));
        throw err;
      } finally {
        setSending(false);
      }
    },
    [startTimer]
  );

  const verifyCode = useCallback(
    async (code, overrideVerificationId) => {
      const activeId = overrideVerificationId || verificationId;
      if (!activeId) {
        throw new Error('Missing verification identifier. Please request a new OTP.');
      }

      setVerifying(true);
      setError(null);
      try {
        const credential = auth.PhoneAuthProvider.credential(activeId, code);
        const result = await auth().signInWithCredential(credential);
        return result;
      } catch (err) {
        setError(humanizeFirebaseError(err));
        throw err;
      } finally {
        setVerifying(false);
      }
    },
    [verificationId]
  );

  const resendCode = useCallback(
    async (phoneNumber) => {
      if (countdown > 0) {
        return verificationId;
      }
      return sendCode(phoneNumber);
    },
    [countdown, sendCode, verificationId]
  );

  return {
    countdown,
    sending,
    verifying,
    error,
    sendCode,
    verifyCode,
    resendCode,
    hydrateVerificationId: setVerificationId,
    clearError: () => setError(null),
  };
};

export default useFirebaseOtp;
