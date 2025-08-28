# BloodLink App Build Guide

This guide helps you successfully build your BloodLink app as a standalone APK with EAS Build.

## Important Files and Configurations

### 1. Splash Screen Assets

The app uses a multi-stage splash screen:

- **Native Splash**: `./assets/images/splash.png`
- **Lottie Animation**: `./assets/animations/blood_splash.json`

Both must exist in the correct locations for your app to work properly.

### 2. App Icons

- **Main Icon**: `./assets/icon.jpg` (used for app icon)
- **Adaptive Icon**: `./assets/adaptive-icon.jpg` (used for Android adaptive icon)
- **Favicon**: `./assets/favicon.png` (used for web)

### 3. Package Name

Your Android package name is set to `com.haarhish.MyNewApp`. This should remain unchanged for consistency with your Firebase configuration.

## Build Steps

### 1. Pre-build Checks

Run these commands to verify your setup:

```bash
# Verify all required files exist
ls -la ./assets/animations/blood_splash.json
ls -la ./assets/images/splash.png
ls -la ./assets/icon.jpg

# Check package.json for correct dependencies
npm list lottie-react-native expo-splash-screen @expo-google-fonts/poppins
```

### 2. Development Build

For testing with developer tools:

```bash
eas build --profile development --platform android
```

### 3. Preview Build

For testing a production-like build:

```bash
eas build --profile preview --platform android
```

### 4. Production Build

For final release build:

```bash
eas build --profile production --platform android
```

## Troubleshooting Build Issues

### Splash Screen Stuck

If the splash screen gets stuck, check:

1. **Font Loading**: Fonts must load successfully, or fallback timer must trigger
2. **Lottie Animation**: The blood splash animation must exist at `./assets/animations/blood_splash.json`
3. **Asset Paths**: All paths in app.json and source code must be correct
4. **Firebase Initialization**: Firebase should initialize correctly without errors

### Firebase Issues

Your app uses Firebase for authentication and Firestore. Make sure:

1. **google-services.json**: Must exist in the project root
2. **Package Name**: Must match `com.haarhish.MyNewApp` in Firebase console
3. **Firebase SDK**: Latest version should be used

### Metro Bundler Issues

If bundling fails:

1. Clear cache: `npx expo start --clear`
2. Check for circular dependencies: `npx metro-memory-analyzer`
3. Make sure all imports are valid

## Final Checklist Before Building

- [ ] All required assets exist
- [ ] Splash screen configuration is correct in app.json
- [ ] Lottie animation path is correct
- [ ] Firebase configuration is correct
- [ ] Android package name is `com.haarhish.MyNewApp`
- [ ] All dependencies are installed
- [ ] App works correctly in Expo Go

Follow these instructions, and your app should build successfully as a standalone APK without any splash screen issues.
