# BloodLink OTP Backend

Simple Express server that powers the `/auth/sendOtp`, `/auth/verifyOtp`, and `/auth/resend` endpoints used by the mobile app during development.

## Environment Variables

Create `backend/.env` (or copy from `.env.example`) with:

```
PORT=4000
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
OTP_TTL_MS=300000
OTP_RESEND_INTERVAL_MS=30000
MAX_ATTEMPTS_PER_OTP=5
```

> ⚠️ Use an App Password when Gmail has 2FA enabled. Never commit the real `.env`.

## Getting Started

```bash
cd backend
npm install
npm run dev
```

The server listens on `http://localhost:4000` by default. The React Native app should have `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000` so that the OTP screen hits these endpoints.

## Endpoints

- `POST /auth/sendOtp` – body `{ email }`
- `POST /auth/verifyOtp` – body `{ email, otp }`
- `POST /auth/resend` – body `{ email }`
- `GET /health` – simple health check

Internally the server stores OTPs in memory with a 5-minute TTL. This is sufficient for local testing; for production use a persistent store (Redis/DB) and stronger rate limiting.
