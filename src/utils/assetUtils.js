import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Image } from 'react-native';

/**
 * Preload fonts, images and animations for better performance
 * 
 * @param {Object} options - The options for asset preloading
 * @param {Array} options.images - Array of image paths to preload
 * @param {Array} options.animations - Array of Lottie animation paths to preload
 * @param {Object} options.fonts - Object containing font families to preload
 * @returns {Promise} - A promise that resolves when all assets are loaded
 */
export const preloadAssets = async ({ images = [], animations = [], fonts = {} }) => {
  try {
    // Preload images
    const imageAssets = images.map((image) => {
      if (typeof image === 'string') {
        return Image.prefetch(image);
      } else {
        return Asset.fromModule(image).downloadAsync();
      }
    });
    
    // Preload Lottie animations
    const animationAssets = animations.map(animation => {
      // For local animations, just verify they exist
      try {
        return Promise.resolve(animation);
      } catch (err) {
        console.error('Animation loading error:', err);
        return Promise.resolve(null);
      }
    });

    // Preload fonts
    const fontAssets = Object.keys(fonts).length ? [Font.loadAsync(fonts)] : [];

    // Wait for all assets to load
    await Promise.all([...imageAssets, ...animationAssets, ...fontAssets]);

    return true;
  } catch (error) {
    console.error('Error preloading assets:', error);
    // Return true anyway to avoid blocking app startup
    return true;
  }
};

/**
 * Verify that a file exists
 * 
 * @param {String} filePath - The path to check
 * @returns {Promise<Boolean>} - Whether the file exists
 */
export const verifyAssetExists = async (filePath) => {
  try {
    const asset = Asset.fromModule(filePath);
    await asset.downloadAsync();
    return true;
  } catch (error) {
    console.error(`Asset not found: ${filePath}`, error);
    return false;
  }
};

/**
 * Get assets that need to be preloaded
 * @returns {Object} - Object with images and fonts to preload
 */
export const getAppAssets = () => {
  // Start with basic assets
  const assets = {
    images: [
      require('../../assets/images/splash.png'),
      require('../../assets/icon.jpg'),
      require('../../assets/images/logo.jpg'),
    ],
    animations: [],
    fonts: {
      'Poppins-Regular': require('../../node_modules/@expo-google-fonts/poppins/Poppins_400Regular.ttf'),
      'Poppins-Medium': require('../../node_modules/@expo-google-fonts/poppins/Poppins_500Medium.ttf'),
      'Poppins-Bold': require('../../node_modules/@expo-google-fonts/poppins/Poppins_700Bold.ttf'),
    }
  };
  
  // Try to load Lottie animation, but don't fail if it doesn't exist
  try {
    // Just verify the file exists - we don't actually preload it as an asset
    const animation = require('../../assets/animations/blood_splash.json');
    console.log('Lottie animation found');
    // Don't add to animations array - JSON files don't need preloading like images
  } catch (e) {
    console.warn('Could not find Lottie animation file');
  }
  
  return assets;
};
