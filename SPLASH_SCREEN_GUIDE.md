# BloodLink App Splash Screen Configuration Guide

## Overview

This document explains how the splash screen is configured in the BloodLink app. There are three stages to the splash screen:

1. **Native Splash Screen** (configured in app.json)
2. **Lottie Animation Splash** (shown in App.js after native splash)
3. **Auth/Welcome Screen** (shown after Lottie animation finishes)

## 1. Native Splash Screen Configuration

The native splash screen is configured in `app.json` and is the first screen users see when opening the app:

```json
"splash": {
  "image": "./assets/images/splash.png",
  "resizeMode": "contain",
  "backgroundColor": "#ffffff"
},
```

**Important Notes:**

- The path `./assets/images/splash.png` must exist in your project
- This splash screen is shown by the operating system before your JavaScript code runs
- For Android APK builds, this gets compiled into native resources

## 2. Lottie Animation Splash

After the native splash screen, your app shows a Lottie animation from `./assets/animations/blood_splash.json`. This is controlled by the App.js file:

```javascript
// Show Lottie splash animation after the native splash
if (showLottieSplash) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LottieView
        ref={lottieRef}
        source={require("./assets/animations/blood_splash.json")}
        autoPlay
        loop={false}
        style={{ width: 300, height: 300 }}
        onAnimationFinish={handleLottieAnimationFinish}
      />
    </View>
  );
}
```

**Important Notes:**

- This animation runs after the native splash screen disappears
- The file must exist at `./assets/animations/blood_splash.json`
- When the animation finishes, it calls `handleLottieAnimationFinish` which sets `showLottieSplash` to false

## 3. Ensuring All Assets Are Preloaded

To prevent any delays or blank screens, all assets are preloaded before the app starts:

1. **App Icons:** Located in `./assets/icon.jpg` and `./assets/adaptive-icon.jpg`
2. **Splash Image:** Located in `./assets/images/splash.png`
3. **Logo:** Located in `./assets/logo.jpg`
4. **Lottie Animation:** Located in `./assets/animations/blood_splash.json`
5. **Fonts:** Poppins fonts (Regular, Medium, Bold)

## 4. Splash Screen Flow in Production APK

1. Native splash screen shows (from `app.json` configuration)
2. React Native initializes and preloads all assets
3. Native splash screen hides
4. Lottie animation plays
5. When animation finishes, app shows main navigation or login screen

## 5. Troubleshooting

If your app gets stuck on the splash screen in production:

1. **Check Asset Paths:** Ensure all paths in `app.json` and source code are correct
2. **Verify Files Exist:** Make sure all referenced files exist in the correct locations
3. **Fallback Timers:** App has multiple fallback timers to prevent getting stuck:
   - 3-second fallback if fonts don't load
   - 8-second ultimate fallback in App.js
   - 10-second fallback in SplashScreen.js

## 6. File Locations Summary

- **Native Splash Image:** `./assets/images/splash.png`
- **App Icon:** `./assets/icon.jpg`
- **Adaptive Icon:** `./assets/adaptive-icon.jpg`
- **Lottie Animation:** `./assets/animations/blood_splash.json`

## 7. Build Notes

When building with EAS, all these assets will be bundled into your APK. The app is configured to use `assetBundlePatterns` to include all assets:

```json
"assetBundlePatterns": ["**/*"]
```

This ensures all your assets are properly included in the final build.
