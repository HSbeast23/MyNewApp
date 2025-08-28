# Building and Sharing Your BloodLink APK

This guide shows you how to build an APK file of your BloodLink app that can be shared with friends.

## Prerequisites

1. Make sure you have the EAS CLI installed:

   ```
   npm install -g eas-cli
   ```

2. Make sure you are logged into your Expo account:
   ```
   eas login
   ```

## Build the APK

Run the following command in your project directory:

```bash
eas build -p android --profile apk
```

This process will:

1. Upload your code to Expo's build servers
2. Build your app into an APK file
3. Provide you with a download URL when complete (typically takes 10-15 minutes)

## Download and Share the APK

1. When the build completes, you'll see a URL in the terminal where you can download the APK.
2. You can also find this build in your Expo dashboard at https://expo.dev/accounts/[YOUR_USERNAME]/projects/bloodlink/builds
3. Download the APK file to your computer
4. Share this APK file with friends through:
   - Google Drive
   - WhatsApp
   - Email
   - Any file sharing service

## Installation Instructions for Your Friends

Tell your friends to:

1. Download the APK file to their Android device
2. Tap on the downloaded file
3. If prompted, enable "Install from Unknown Sources" in their device settings
4. Follow the on-screen instructions to install the app
5. Open the app after installation is complete

## Important Notes

- This APK is not from the Google Play Store, so Android will show a warning about unknown sources
- The APK is signed with your Expo account's credentials, so it's secure
- This method is perfect for sharing with friends but not suitable for public distribution
- For public distribution, you should submit to the Google Play Store

## Troubleshooting

If your friends have issues installing:

1. Make sure they've enabled "Install from Unknown Sources"
2. Check that they have enough storage space
3. Ensure they're using a compatible Android version (Android 8.0+)
4. If using Chrome to download, make sure Chrome has permission to install apps

For more information, visit: https://docs.expo.dev/build/introduction/
