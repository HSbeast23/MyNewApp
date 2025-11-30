const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
const DEFAULT_TIMEOUT_MS = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS) || 45000;

const ensureApiAvailable = () => {
  if (!API_BASE_URL) {
    throw new Error('Server URL is not configured. Set EXPO_PUBLIC_API_BASE_URL.');
  }
};

export const postJson = async (endpoint, payload, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) => {
  ensureApiAvailable();
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      console.error('API error', { endpoint, status: response.status, body: data });
      throw new Error(message);
    }

    return data;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('API request failed', { endpoint, payload, message: err.message });
    }

    if (err.name === 'AbortError') {
      throw new Error('Server took too long to respond. Ensure the backend is running and reachable.');
    }

    if (err.message === 'Network request failed') {
      throw new Error('Unable to reach the server. Confirm your device shares the same network and the port is reachable.');
    }

    throw err;
  } finally {
    clearTimeout(id);
  }
};

export const sendPushNotification = async (token, { title, body, data }) => {
  if (!token) {
    throw new Error('Missing FCM token.');
  }
  if (!title || !body) {
    throw new Error('Notification title and body are required.');
  }

  return postJson('/notify', { token, title, body, data });
};
