import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';

const { width } = Dimensions.get('window');

/**
 * ImageCarousel Component
 * 
 * A reusable image carousel component with auto-scrolling and clickable images.
 * 
 * @param {Object} props
 * @param {Array} props.slides - Array of slide objects with image source and URL
 * @param {number} props.autoScrollInterval - Time in ms between auto-scrolls (default: 3000)
 * @param {Object} props.style - Additional styles for the container
 * @param {number} props.imageHeight - Height of the images (default: 200)
 * @param {boolean} props.showIndicators - Whether to show pagination dots (default: true)
 * @param {boolean} props.showOverlay - Whether to show title overlay (default: true)
 * @returns {React.Component}
 */
const ImageCarousel = ({
  slides,
  autoScrollInterval = 3000,
  style,
  imageHeight = 200,
  showIndicators = true,
  showOverlay = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pressedIndex, setPressedIndex] = useState(null);
  const flatListRef = useRef(null);
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Handle viewable items change
  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  // Auto scroll functionality
  useEffect(() => {
    let scrollInterval;
    
    if (autoScrollInterval > 0) {
      scrollInterval = setInterval(() => {
        if (currentIndex < slides.length - 1) {
          flatListRef.current?.scrollToIndex({
            index: currentIndex + 1,
            animated: true,
          });
        } else {
          // Loop back to the first slide
          flatListRef.current?.scrollToIndex({
            index: 0,
            animated: true,
          });
        }
      }, autoScrollInterval);
    }
    
    // Clean up interval on unmount
    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [currentIndex, slides.length, autoScrollInterval]);

  // Handle image tap/click
  const handleImagePress = async (url, index) => {
    if (!url) {
      Alert.alert('Error', 'No URL provided for this image');
      return;
    }
    
    // Set loading state and pressed index for visual feedback
    setIsLoading(true);
    setPressedIndex(index);
    
    // Log the URL being opened (for debugging)
    console.log(`Attempting to open URL: ${url}`);
    
    // Simplified approach: Try opening the URL directly
    try {
      // For testing - display which URL is being opened
      Alert.alert(
        'Opening Website',
        `Opening: ${url}`,
        [
          {
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => {
              setIsLoading(false);
              setPressedIndex(null);
            }
          },
          {
            text: 'Continue', 
            onPress: async () => {
              try {
                await Linking.openURL(url);
              } catch (err) {
                console.error('Error in final URL open:', err);
                Alert.alert('Error', 'Could not open the website. Please check your internet connection.');
              } finally {
                setIsLoading(false);
                setPressedIndex(null);
              }
            }
          }
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error with link handling:', error);
      Alert.alert(
        'Error',
        'Could not open the website. Please check your internet connection.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
      setPressedIndex(null);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.slideContainer, 
              { height: imageHeight },
              pressedIndex === index && styles.pressedSlide
            ]}
            activeOpacity={0.7}
            onPress={() => handleImagePress(item.url, index)}
            disabled={isLoading}
          >
            <Image
              source={item.image}
              style={[styles.image, { height: imageHeight }]}
            />
            {showOverlay && item.title && (
              <View style={styles.overlay}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.hint}>
                  {isLoading && pressedIndex === index ? 'Opening...' : 'Tap to learn more'}
                </Text>
              </View>
            )}
            
            {isLoading && pressedIndex === index && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
      />

      {showIndicators && (
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  slideContainer: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  pressedSlide: {
    opacity: 0.9,
  },
  image: {
    width: width - 40,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    color: '#f0f0f0',
    fontSize: 12,
    marginTop: 2,
  },
  pagination: {
    flexDirection: 'row',
    marginTop: 10,
  },
  dot: {
    height: 8,
    width: 8,
    backgroundColor: '#ccc',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#000',
    width: 12,
  },
});

export default ImageCarousel;
