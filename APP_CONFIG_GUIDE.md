# BloodLink App Configuration Guide

This guide explains how to configure your BloodLink app for proper display names, splash screens, and icons in APK builds.

## App Naming Configuration

Your app has several name-related settings that affect how it appears on devices:

1. **Display Name** (What users see on their home screen)

   - Set in `app.json`: `"name": "BloodLink"` and `"displayName": "BloodLink"`

2. **Package Name** (Android's unique identifier - KEEP THIS UNCHANGED)

   - Set in `app.json`: `"package": "com.haarhish.MyNewApp"`

3. **Bundle Identifier** (iOS's unique identifier - KEEP THIS UNCHANGED)

   - Set in `app.json`: `"bundleIdentifier": "com.haarhish.MyNewApp"`

4. **Slug** (Used for Expo URLs and should match your app name)
   - Set in `app.json`: `"slug": "bloodlink"`

## Splash Screen Configuration

Your app has TWO splash screens:

### 1. Native Splash Screen (First to appear)

This is the static image shown when your app first launches. It's configured in `app.json`:

```json
"splash": {
  "image": "./assets/images/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#ffffff"
}
```

Key points:

- The image should be a PNG file at `./assets/images/splash.png`
- Size should be 1242x2436 pixels for best results
- Use "contain" resizeMode to ensure it displays properly on all devices
- Use a white background (#ffffff) to match your app's theme

### 2. Custom Lottie Animation Splash Screen (Second to appear)

This is your custom splash screen with the blood splash animation, controlled by `SplashScreen.js`:

```javascript
<LottieView
  source={require("../../assets/animations/blood_splash.json")}
  autoPlay
  loop={false}
  style={{ width: 300, height: 300 }}
  resizeMode="contain"
/>
```

Key points:

- The animation file should be at `./assets/animations/blood_splash.json`
- Make sure this file exists and is correctly formatted
- The animation should be short (3-5 seconds) to avoid annoying users

## Icon Configuration

Your app uses several icon files that should all be properly configured:

1. **Main App Icon** (Used on home screens)

   - Set in `app.json`: `"icon": "./assets/icon.jpg"`
   - Should be a 1024x1024 pixel image

2. **Adaptive Icon** (Used on newer Android devices)

   - Set in `app.json`:

   ```json
   "adaptiveIcon": {
     "foregroundImage": "./assets/adaptive-icon.png",
     "backgroundColor": "#ffffff"
   }
   ```

3. **Notification Icon** (Used in notification tray)
   - Set in `app.json` plugins section:
   ```json
   [
     "expo-notifications",
     {
       "icon": "./assets/icon.png",
       "color": "#b71c1c"
     }
   ]
   ```

## Building Your App

When building your app with EAS Build, the settings above will be used:

```bash
# For development testing
eas build --profile development --platform android

# For production APK
eas build --profile production --platform android
```

## Troubleshooting Naming Issues

If your app shows the wrong name or icon after building:

1. Check the `app.json` values for name, displayName, and icon paths
2. Make sure all image files exist in the correct locations
3. Clear the build cache and rebuild:
   ```bash
   eas build:cancel
   eas cache:clear
   eas build --profile production --platform android
   ```

## Important File Paths

- **App Icon**: `./assets/icon.jpg`
- **Splash Image**: `./assets/images/splash.png`
- **Adaptive Icon**: `./assets/adaptive-icon.png`
- **Animation**: `./assets/animations/blood_splash.json`
