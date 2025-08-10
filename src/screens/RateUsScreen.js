import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width } = Dimensions.get('window');

export default function RateUsScreen() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleStarPress = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleSubmitRating = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    Alert.alert(
      'Thank You! 🙏',
      `Thank you for rating BloodLink ${rating} star${rating > 1 ? 's' : ''}! Your feedback helps us improve and save more lives.`,
      [
        {
          text: 'OK',
          onPress: () => setSubmitted(true),
        },
      ]
    );
  };

  const handlePlayStoreReview = () => {
    Alert.alert(
      'Rate on Play Store',
      'Would you like to rate BloodLink on Google Play Store?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rate Now',
          onPress: () => {
            // In a real app, this would open the Play Store
            Alert.alert('Success', 'Thank you! This would open the Play Store in a real app.');
          },
        },
      ]
    );
  };

  const handleShareApp = () => {
    Alert.alert(
      'Share BloodLink',
      'Help us spread the word about BloodLink and save more lives!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => {
            Alert.alert('Success', 'Thank you! This would open sharing options in a real app.');
          },
        },
      ]
    );
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          style={styles.starButton}
        >
          <MaterialIcons
            name="star"
            size={40}
            color={i <= rating ? '#FFD700' : '#E0E0E0'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingText = () => {
    switch (rating) {
      case 1:
        return 'Poor - We can do better! 😔';
      case 2:
        return 'Fair - Thanks for the feedback! 🤔';
      case 3:
        return 'Good - We appreciate it! 😊';
      case 4:
        return 'Very Good - Thank you! 😄';
      case 5:
        return 'Excellent - You\'re amazing! 🌟';
      default:
        return 'Tap a star to rate BloodLink';
    }
  };

  if (submitted) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={80} color="#4CAF50" />
          <Text style={styles.successTitle}>Thank You! 🎉</Text>
          <Text style={styles.successText}>
            Your rating and feedback have been submitted successfully. 
            Your input helps us improve BloodLink and save more lives!
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.playStoreButton} onPress={handlePlayStoreReview}>
              <FontAwesome5 name="google-play" size={20} color="#fff" />
              <Text style={styles.buttonText}>Rate on Play Store</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.shareButton} onPress={handleShareApp}>
              <MaterialIcons name="share" size={20} color="#fff" />
              <Text style={styles.buttonText}>Share BloodLink</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setSubmitted(false);
              setRating(0);
              setFeedback('');
            }}
          >
            <Text style={styles.backButtonText}>Rate Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="favorite" size={60} color="#d32f2f" />
        <Text style={styles.title}>Rate BloodLink</Text>
        <Text style={styles.subtitle}>
          Help us improve and save more lives together! 🩸
        </Text>
      </View>

      <View style={styles.ratingSection}>
        <Text style={styles.ratingTitle}>How would you rate your experience?</Text>
        
        <View style={styles.starsContainer}>
          {renderStars()}
        </View>
        
        <Text style={styles.ratingText}>{getRatingText()}</Text>
      </View>

      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackTitle}>Share Your Feedback (Optional)</Text>
        <TextInput
          style={styles.feedbackInput}
          placeholder="Tell us what you think about BloodLink..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={feedback}
          onChangeText={setFeedback}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>What makes BloodLink special?</Text>
        
        <View style={styles.featureItem}>
          <MaterialIcons name="location-on" size={24} color="#d32f2f" />
          <Text style={styles.featureText}>Find nearby donors and blood banks instantly</Text>
        </View>
        
        <View style={styles.featureItem}>
          <MaterialIcons name="notifications" size={24} color="#d32f2f" />
          <Text style={styles.featureText}>Real-time notifications for blood requests</Text>
        </View>
        
        <View style={styles.featureItem}>
          <MaterialIcons name="security" size={24} color="#d32f2f" />
          <Text style={styles.featureText}>Secure and verified user profiles</Text>
        </View>
        
        <View style={styles.featureItem}>
          <MaterialIcons name="language" size={24} color="#d32f2f" />
          <Text style={styles.featureText}>Multi-language support (English & Tamil)</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRating}>
        <MaterialIcons name="send" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>Submit Rating</Text>
      </TouchableOpacity>

      <View style={styles.alternativeActions}>
        <TouchableOpacity style={styles.playStoreButton} onPress={handlePlayStoreReview}>
          <FontAwesome5 name="google-play" size={18} color="#fff" />
          <Text style={styles.buttonText}>Rate on Play Store</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shareButton} onPress={handleShareApp}>
          <MaterialIcons name="share" size={18} color="#fff" />
          <Text style={styles.buttonText}>Share with Friends</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💝 Every rating helps us reach more people and save more lives!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  ratingSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  starButton: {
    marginHorizontal: 5,
    padding: 5,
  },
  ratingText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
  },
  feedbackSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  feedbackTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 15,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    minHeight: 100,
  },
  featuresSection: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginLeft: 15,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#d32f2f',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
  },
  alternativeActions: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  playStoreButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  shareButton: {
    backgroundColor: '#2196F3',
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 6,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#4CAF50',
    marginTop: 20,
    marginBottom: 15,
  },
  successText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  backButton: {
    borderWidth: 2,
    borderColor: '#d32f2f',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  backButtonText: {
    color: '#d32f2f',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
