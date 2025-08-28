# BloodLink

<div align="center">
  <img src="assets/logo.png" alt="BloodLink Logo" width="200"/>
  <br>
  <h3>Connect Blood Donors with Recipients</h3>
  <p>A React Native Expo mobile application for blood donation management</p>
</div>

## ✨ Features

- **Blood Donation Requests:** Create and manage blood donation requests
- **Donor Matching:** Connect donors with recipients based on blood type and location
- **Hospital Services:** Integrate with local hospital services
- **Push Notifications:** Real-time alerts for donation requests and matches
- **Multi-language Support:** Localized for multiple languages
- **User Profiles:** Detailed donor and recipient profiles
- **Donation History:** Track past donations and contributions
- **Location Services:** Find nearby donation centers and hospitals

## 🛠️ Technologies

- **Frontend:**
  - React Native (Expo SDK 53)
  - React Navigation 7
  - Lottie Animations
  - React Native Paper
  - React Native Maps

- **Backend:**
  - Firebase Authentication
  - Cloud Firestore
  - Firebase Cloud Messaging (FCM)
  - Firebase Cloud Functions

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## 🚀 Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/HSBEAST23/BloodLink.git
cd BloodLink
```

### 2. Install dependencies
```bash
npm install
```

### 3. Firebase Setup
- Create a Firebase project at [firebase.google.com](https://firebase.google.com)
- Add Android app with package name `com.haarhish.MyNewApp`
- Add iOS app with bundle ID `com.haarhish.MyNewApp` (if developing for iOS)
- Download `google-services.json` and place it in the project root
- Download `GoogleService-Info.plist` and place it in the project root (if developing for iOS)
- For Firebase Functions, create a service account key and save it as:
  ```
  functions/serviceAccountKey.json
  ```

### 4. Environment Configuration
Create a `.env` file in the project root with the following variables:
```
API_KEY=your_firebase_api_key
AUTH_DOMAIN=your_firebase_auth_domain
PROJECT_ID=your_firebase_project_id
STORAGE_BUCKET=your_firebase_storage_bucket
MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
APP_ID=your_firebase_app_id
```

### 5. Run the app
```bash
npx expo start
```

### 6. Building APK/IPA
```bash
# For Android APK
eas build -p android --profile preview

# For iOS IPA
eas build -p ios --profile preview
```

## 📁 Project Structure

```
BloodLink/
├── App.js                 # Application entry point
├── app.json               # Expo configuration
├── assets/                # Images and animations
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # Application screens
│   ├── services/          # API services
│   └── translations/      # Localization files
└── functions/             # Firebase Cloud Functions
```

## ⚠️ Important Notes for Git

### Sensitive Files
Never commit the following files to Git:
- `google-services.json`
- `GoogleService-Info.plist`
- `functions/serviceAccountKey.json`
- `.env` files containing secrets
- `.jks` keystore files

### Before Pushing to GitHub
1. Check that no sensitive files are being committed
2. Run `git status` to see which files will be committed
3. Ensure your `.gitignore` includes all sensitive files

## 🔥 Firebase Functions

The app uses Firebase Cloud Functions for sending notifications. To deploy:

1. Install Firebase tools:
   ```bash
   npm install -g firebase-tools
   ```
2. Navigate to functions directory:
   ```bash
   cd functions
   ```
3. Deploy:
   ```bash
   firebase deploy --only functions
   ```

## 📱 Supported Platforms

- Android 5.0+
- iOS 12.0+ (requires development on macOS)

## 🧪 Testing

```bash
npm run test
```

## 📄 License

This project is licensed under the BSD License - see the LICENSE file for details.

## 📧 Contact

For any questions or suggestions, please contact the project maintainer:

- GitHub: [@HSBEAST23](https://github.com/HSBEAST23)

---

<div align="center">
  Made with ❤️ by Haarhish
</div>
