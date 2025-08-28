import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Image } from 'react-native';

/**
 * Preloads images
 * @param {array} images - Array of image modules
 * @returns {Promise} Promise resolving when images are cached
 */
export const cacheImages = async (images) => {
  return images.map(image => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
};

/**
 * Preloads fonts
 * @param {object} fonts - Font object mapping
 * @returns {Promise} Promise resolving when fonts are loaded
 */
export const cacheFonts = async (fonts) => {
  return fonts.map(font => Font.loadAsync(font));
};

/**
 * Preloads all assets (images and fonts)
 * @param {array} images - Array of image modules to preload
 * @param {array} fonts - Array of font objects to preload
 * @returns {Promise} Promise resolving when all assets are loaded
 */
export const preloadAssets = async ({ images = [], fonts = [] }) => {
  try {
    const imagePromises = cacheImages(images);
    const fontPromises = cacheFonts(fonts);
    
    await Promise.all([...imagePromises, ...fontPromises]);
    return true;
  } catch (e) {
    console.warn('Error preloading assets:', e);
    return false;
  }
};
