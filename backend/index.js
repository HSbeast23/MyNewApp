// ✅ backend/index.js

const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const cors = require('cors');

// 🔐 Replace this with your actual service account file name
const serviceAccount = require('./serviceAccountKey.json');

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// 🛎️ POST endpoint to send push notification
app.post('/send-notification', async (req, res) => {
  const { token, title, body } = req.body;

  const message = {
    notification: {
      title,
      body,
    },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Successfully sent message:', response);
    res.status(200).send({ success: true, response });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).send({ success: false, error });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 FCM server running at http://localhost:${PORT}`);
});
