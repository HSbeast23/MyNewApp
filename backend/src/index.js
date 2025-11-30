const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

dotenv.config();

const PORT = process.env.PORT || 4000;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const OTP_TTL_MS = Number(process.env.OTP_TTL_MS) || 5 * 60 * 1000;
const OTP_RESEND_INTERVAL_MS = Number(process.env.OTP_RESEND_INTERVAL_MS) || 30 * 1000;
const MAX_ATTEMPTS_PER_OTP = Number(process.env.MAX_ATTEMPTS_PER_OTP) || 5;

if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.warn('[OTP BACKEND] Missing EMAIL_USER or EMAIL_PASSWORD. Emails cannot be sent.');
}

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

// Firebase Admin (FCM)
let messaging = null;
try {
  const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountb.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    messaging = admin.messaging();
    console.log('[FCM] Firebase Admin initialized');
  } else {
    console.warn('[FCM] serviceAccountb.json not found. Push notifications disabled.');
  }
} catch (error) {
  console.error('[FCM] Failed to initialize Firebase Admin', error.message);
}

const app = express();
app.use(cors());
app.use(express.json());

const isValidEmail = (value = '') => /.+@.+\..+/.test(String(value).trim());
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const createOtpRecord = (otp) => ({
  otp,
  expiresAt: Date.now() + OTP_TTL_MS,
  attempts: 0,
  sentAt: Date.now(),
});

const sendOtpEmail = async (email, otp, subjectSuffix = 'OTP') => {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    throw new Error('Email credentials missing on server');
  }

  await transporter.sendMail({
    from: EMAIL_USER,
    to: email,
    subject: `BloodLink - ${subjectSuffix}`,
    html: `
      <h2>BloodLink OTP Verification</h2>
      <p>Your BloodLink OTP is: <b style="font-size:24px;color:#b71c1c;">${otp}</b></p>
      <p>Valid for 5 minutes. Do not share this with anyone.</p>
    `,
  });
};

const sendFcmNotification = async ({ token, title, body, data }) => {
  if (!messaging) {
    throw new Error('Firebase Admin not configured on server');
  }

  return messaging.send({
    token,
    notification: { title, body },
    data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
    android: { priority: 'high' },
    apns: { headers: { 'apns-priority': '10' } },
  });
};

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'email-otp', timestamp: new Date().toISOString() });
});

app.post('/auth/sendOtp', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Provide a valid email address' });
    }

    const otp = generateOtp();
    await sendOtpEmail(email, otp, 'Your OTP');
    otpStore.set(email, createOtpRecord(otp));
    console.log(`[OTP] Email sent to ${email}`);

    res.json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('[OTP] sendOtp failed', error.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/auth/verifyOtp', (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const otp = String(req.body?.otp || '').trim();

    if (!isValidEmail(email) || otp.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid email or OTP' });
    }

    const record = otpStore.get(email);
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found. Send a new one.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ success: false, message: 'OTP expired. Request a new code.' });
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      if (record.attempts >= MAX_ATTEMPTS_PER_OTP) {
        otpStore.delete(email);
        return res.status(400).json({ success: false, message: 'Too many attempts. Request a new OTP.' });
      }
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Try again.' });
    }

    otpStore.delete(email);
    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('[OTP] verifyOtp failed', error.message);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

app.post('/auth/resend', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Provide a valid email address' });
    }

    const record = otpStore.get(email);
    if (!record) {
      return res.status(400).json({ success: false, message: 'Send OTP first' });
    }

    if (Date.now() - record.sentAt < OTP_RESEND_INTERVAL_MS) {
      const waitSeconds = Math.ceil((OTP_RESEND_INTERVAL_MS - (Date.now() - record.sentAt)) / 1000);
      return res.status(429).json({ success: false, message: `Wait ${waitSeconds}s before requesting again.` });
    }

    const otp = generateOtp();
    await sendOtpEmail(email, otp, 'New OTP');
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      sentAt: Date.now(),
    });

    console.log(`[OTP] Email resent to ${email}`);
    res.json({ success: true, message: 'New OTP sent to email' });
  } catch (error) {
    console.error('[OTP] resend failed', error.message);
    res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
});

app.post('/notify', async (req, res) => {
  const { token, title, body, data } = req.body || {};

  if (!token || !title || !body) {
    return res.status(400).json({ success: false, message: 'token, title and body are required' });
  }

  try {
    const result = await sendFcmNotification({ token, title, body, data });
    res.json({ success: true, result });
  } catch (error) {
    console.error('[FCM] notify failed', error.message);
    res.status(500).json({ success: false, message: 'Failed to send push notification' });
  }
});

app.listen(PORT, () => {
  console.log(`BloodLink email OTP backend running on http://localhost:${PORT}`);
});
