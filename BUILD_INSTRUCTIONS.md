# BloodLink App Build Instructions

This guide provides instructions for building your BloodLink app as a standalone APK.

## Configuration Overview

The app has been configured with the following settings:

- **App Name**: BloodLink
- **Package Name**: com.haarhish.MyNewApp (unchanged as requested)
- **Icon**: Using ./assets/icon.png
- **Splash Screen**: Using ./assets/images/splash.png with "contain" resize mode
- **Firebase**: All Firebase configurations are preserved

## Build Instructions

1. **Prerequisites**:

   - Make sure you have the EAS CLI installed:

   ```
   npm install -g eas-cli
   ```

   - Log in to your Expo account:

   ```
   eas login
   ```

2. **Check Configuration**:

   - Verify app.json has the correct settings
   - Make sure all assets are in the right folders

3. **Build for Preview**:

   ```
   eas build -p android --profile preview
   ```

4. **Build for Production**:
   ```
   eas build -p android --profile production
   ```

## Troubleshooting Splash Screen Issues

If you encounter splash screen freezes:

1. **Font Loading**: The app has a fallback timer that ensures it doesn't get stuck on the splash screen, even if font loading fails.

2. **Resource Loading**: Make sure all required resources (especially animations) exist in the correct paths.

3. **Firebase Initialization**: If Firebase initialization is slow, it won't block the splash screen as authentication state is handled separately.

4. **Error Handling**: All critical operations have error handling and timeouts to prevent the app from getting stuck.

## Lottie Animation

Your splash screen uses Lottie animation from `assets/animations/blood_splash.json`. Make sure this file is included in your assets and the path remains correct.

## Custom Splash Screen

Note that you have two splash screens:

1. **Expo Native Splash**: Configured in app.json, shows immediately when app starts
2. **Custom Lottie Animation Splash**: In SplashScreen.js, shows after Expo splash

Both are preserved and working as designed.
