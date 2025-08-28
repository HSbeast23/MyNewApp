# Lottie Animation Test Script

This script verifies that the Lottie animation file is valid and exists in the correct location.

## Location

The Lottie animation for the splash screen should be located at:

```
./assets/animations/blood_splash.json
```

## How to Fix Common Issues

If you're seeing errors related to the Lottie animation when running your app, try these fixes:

1. **Check the file exists** in the exact location: `./assets/animations/blood_splash.json`

2. **Verify the JSON is valid** - Open the file in a text editor and make sure it's a valid JSON file.
   If it's corrupted, download a fresh copy.

3. **Update path references** - Make sure all references to the animation file use the exact same path:

   - In SplashScreen.js: `require('../../assets/animations/blood_splash.json')`
   - In App.js: `require('./assets/animations/blood_splash.json')`

4. **Add error handling** - We've added error handling code that will show a fallback UI if the animation
   file can't be loaded.

5. **Check Lottie version** - Make sure you're using a compatible version of lottie-react-native.
   Current version: `lottie-react-native: "7.2.2"`

## Testing the Animation

To test if your animation is working:

1. Ensure the file exists
2. Run your app in Expo Go
3. Watch for the animation on the splash screen

If the animation works in Expo Go but not in the APK, it might be an issue with how assets are bundled.
Make sure your app.json has the correct `assetBundlePatterns` setting:

```json
"assetBundlePatterns": ["**/*"]
```

This ensures all assets (including animations) are bundled in the APK.
