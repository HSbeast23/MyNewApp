# BloodLink App

A React Native Expo app for connecting blood donors with recipients.

## Setup Instructions

1. **Clone the repository**
   ```
   git clone https://github.com/HSBEAST23/MyNewApp.git
   cd MyNewApp
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Add Android app with package name `com.haarhish.MyNewApp`
   - Download `google-services.json` and place it in the project root
   - For Firebase Functions, create a service account key and save it as:
     ```
     functions/serviceAccountKey.json
     ```
   - **Note**: The real service account key should never be committed to Git

4. **Run the app**
   ```
   npx expo start
   ```

5. **Building APK**
   ```
   eas build -p android --profile preview
   ```

## Important Notes for Git

1. **Sensitive Files**: Never commit the following files to Git:
   - `google-services.json`
   - `functions/serviceAccountKey.json`
   - Any `.env` files containing secrets
   - `.jks` keystore files

2. **Before Pushing to GitHub**:
   - Check that no sensitive files are being committed
   - Run `git status` to see which files will be committed
   - Make sure `.gitignore` is properly set up

## Firebase Functions

The app uses Firebase Cloud Functions for sending notifications. To deploy:

1. Install Firebase tools: `npm install -g firebase-tools`
2. Navigate to functions directory: `cd functions`
3. Deploy: `firebase deploy --only functions`

## Features

- Blood donation requests
- Matching donors with recipients
- Push notifications
- User profiles
- Multi-language support

## Contact

For any questions, contact the project maintainer.
