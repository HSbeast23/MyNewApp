import { useCallback, useEffect, useRef, useState } from 'react';

export const OTP_RESEND_INTERVAL_SECONDS = 120;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const DEFAULT_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 45000;

const ensureApiAvailable = () => {
  if (!API_BASE_URL) {
    throw new Error('Server URL is not configured. Set EXPO_PUBLIC_API_BASE_URL.');
  }
};

const postJson = async (endpoint, payload, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  ensureApiAvailable();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    let data = {};
    try {
      data = await response.json();
    } catch (err) {
      // Ignore JSON parse errors for empty bodies
    }

    if (!response.ok || data?.success === false) {
      const fallbackMessage = `Server error (HTTP ${response.status})`;
      const message = data?.message || fallbackMessage;
      console.error('OTP API error', {
        endpoint,
        status: response.status,
        body: data,
      });
      throw new Error(message);
    }

    return data;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('OTP API request failed', { endpoint, payload, message: err.message });
    }

    if (err.name === 'AbortError') {
      throw new Error('Server took too long to respond. Ensure the backend is running and reachable.');
    }

    if (err.message === 'Network request failed') {
      throw new Error('Unable to reach the OTP server. Confirm your phone and laptop share the same Wi-Fi and that port 4000 is allowed in the firewall.');
    }

    throw err;
  } finally {
    clearTimeout(id);
  }
};

const useOtp = () => {
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

  const runTimer = useCallback(
    (initialSeconds) => {
      clearTimer();
      if (!initialSeconds || initialSeconds <= 0) {
        setCountdown(0);
        return;
      }

      setCountdown(initialSeconds);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer]
  );

  const startTimer = useCallback(() => runTimer(OTP_RESEND_INTERVAL_SECONDS), [runTimer]);

  const hydrateCountdown = useCallback(
    (seconds) => {
      if (typeof seconds !== 'number') return;
      const safeValue = Math.max(0, Math.floor(seconds));
      if (safeValue === 0) {
        clearTimer();
        setCountdown(0);
        return;
      }
      runTimer(safeValue);
    },
    [runTimer, clearTimer]
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

    const sendCode = useCallback(
      async (email) => {
        if (!email) {
          throw new Error('Email is required.');
        }

      setSending(true);
      setError(null);
      try {
          await postJson('/auth/sendOtp', { email });
        startTimer();
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [startTimer]
  );

    const verifyCode = useCallback(async (email, otp) => {
      if (!email) {
        throw new Error('Email is required.');
    }
    if (!otp || otp.length !== 6) {
      throw new Error('Enter the 6-digit OTP.');
    }

    setVerifying(true);
    setError(null);
    try {
      const data = await postJson('/auth/verifyOtp', { email, otp });
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setVerifying(false);
    }
  }, []);

  const resendCode = useCallback(
    async (email) => {
      if (countdown > 0) {
        throw new Error('Please wait before requesting another OTP.');
      }

      if (!email) {
        throw new Error('Email is required.');
      }

      setSending(true);
      setError(null);
      try {
        await postJson('/auth/resend', { email });
        startTimer();
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setSending(false);
      }
    },
    [countdown, startTimer]
  );

  return {
    countdown,
    sending,
    verifying,
    error,
    sendCode,
    verifyCode,
    resendCode,
    clearError: () => setError(null),
    hydrateCountdown,
  };
};

export default useOtp;
