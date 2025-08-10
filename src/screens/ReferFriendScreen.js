import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, Dimensions, Linking } from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/auth';

const { width, height } = Dimensions.get('window');

export default function ReferFriendScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [userProfile, setUserProfile] = useState(null);
  const [referralCode, setReferralCode] = useState('');

  // Fetch user data and generate referral code
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userQuery = query(
          collection(db, 'users'),
          where('uid', '==', user.uid)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserProfile(userData);
          // Generate referral code from user ID
          setReferralCode(`BL${user.uid.slice(-6).toUpperCase()}`);
        }
      } catch (error) {
        console.log('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const shareMessage = `🩸 Join me on BloodLink - The life-saving blood donation app!\n\n💝 Help save lives by connecting blood donors with those in need.\n\n🎁 Use my referral code: ${referralCode}\n\n📱 Download BloodLink now and be a hero!\n\n#BloodDonation #SaveLives #BloodLink`;

  const handleShare = async (platform) => {
    try {
      switch (platform) {
        case 'whatsapp':
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
          const supported = await Linking.canOpenURL(whatsappUrl);
          if (supported) {
            await Linking.openURL(whatsappUrl);
          } else {
            Alert.alert('WhatsApp not installed', 'Please install WhatsApp to share via WhatsApp');
          }
          break;

        case 'instagram':
          // Instagram doesn't support direct text sharing, so we'll use general share
          await Share.share({
            message: shareMessage,
            title: 'Join BloodLink - Save Lives!',
          });
          break;

        case 'facebook':
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=https://bloodlink.app&quote=${encodeURIComponent(shareMessage)}`;
          await Linking.openURL(facebookUrl);
          break;

        case 'twitter':
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
          await Linking.openURL(twitterUrl);
          break;

        case 'telegram':
          const telegramUrl = `https://t.me/share/url?url=https://bloodlink.app&text=${encodeURIComponent(shareMessage)}`;
          await Linking.openURL(telegramUrl);
          break;

        case 'sms':
          const smsUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
          await Linking.openURL(smsUrl);
          break;

        case 'email':
          const emailUrl = `mailto:?subject=Join BloodLink - Save Lives!&body=${encodeURIComponent(shareMessage)}`;
          await Linking.openURL(emailUrl);
          break;

        default:
          // General share
          await Share.share({
            message: shareMessage,
            title: 'Join BloodLink - Save Lives!',
          });
          break;
      }
    } catch (error) {
      console.log('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  const copyReferralCode = async () => {
    try {
      // For Expo, we'll show an alert with the code
      Alert.alert(
        'Referral Code Copied!',
        `Your referral code: ${referralCode}\n\nShare this code with friends when they sign up!`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral code');
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Refer Friends</Text>
        <Text style={styles.headerSubtitle}>Share the gift of life</Text>
      </View>

      {/* Referral Card */}
      <View style={styles.referralCard}>
        <View style={styles.referralIcon}>
          <FontAwesome5 name="user-friends" size={40} color="#b71c1c" />
        </View>
        <Text style={styles.referralTitle}>Your Referral Code</Text>
        <TouchableOpacity style={styles.codeContainer} onPress={copyReferralCode}>
          <Text style={styles.referralCode}>{referralCode}</Text>
          <Ionicons name="copy" size={20} color="#b71c1c" />
        </TouchableOpacity>
        <Text style={styles.codeInstructions}>Tap to copy • Share with friends</Text>
      </View>

      {/* Benefits Section */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>Why Refer Friends?</Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <MaterialIcons name="favorite" size={24} color="#e91e63" />
            <Text style={styles.benefitText}>Help save more lives together</Text>
          </View>
          <View style={styles.benefitItem}>
            <FontAwesome5 name="users" size={24} color="#2196f3" />
            <Text style={styles.benefitText}>Build a stronger donor community</Text>
          </View>
          <View style={styles.benefitItem}>
            <MaterialIcons name="star" size={24} color="#ff9800" />
            <Text style={styles.benefitText}>Earn recognition as a life saver</Text>
          </View>
          <View style={styles.benefitItem}>
            <FontAwesome5 name="award" size={24} color="#4caf50" />
            <Text style={styles.benefitText}>Get special donor badges</Text>
          </View>
        </View>
      </View>

      {/* Share Options */}
      <View style={styles.shareSection}>
        <Text style={styles.sectionTitle}>Share via</Text>
        
        {/* Social Media Row 1 */}
        <View style={styles.shareRow}>
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: '#25D366' }]}
            onPress={() => handleShare('whatsapp')}
          >
            <FontAwesome5 name="whatsapp" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: '#E4405F' }]}
            onPress={() => handleShare('instagram')}
          >
            <FontAwesome5 name="instagram" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Instagram</Text>
          </TouchableOpacity>
        </View>

        {/* Social Media Row 2 */}
        <View style={styles.shareRow}>
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: '#1877F2' }]}
            onPress={() => handleShare('facebook')}
          >
            <FontAwesome5 name="facebook" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Facebook</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: '#1DA1F2' }]}
            onPress={() => handleShare('twitter')}
          >
            <FontAwesome5 name="twitter" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Twitter</Text>
          </TouchableOpacity>
        </View>

        {/* Communication Row */}
        <View style={styles.shareRow}>
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: '#0088cc' }]}
            onPress={() => handleShare('telegram')}
          >
            <FontAwesome5 name="telegram" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Telegram</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: '#34B7F1' }]}
            onPress={() => handleShare('sms')}
          >
            <Ionicons name="chatbubble" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>SMS</Text>
          </TouchableOpacity>
        </View>

        {/* More Options Row */}
        <View style={styles.shareRow}>
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: '#EA4335' }]}
            onPress={() => handleShare('email')}
          >
            <Ionicons name="mail" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.shareButton, { backgroundColor: '#666' }]}
            onPress={() => handleShare('more')}
          >
            <Ionicons name="share" size={24} color="#fff" />
            <Text style={styles.shareButtonText}>More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Impact</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Friends Referred</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Lives Impacted</Text>
          </View>
        </View>
      </View>

      {/* Call to Action */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Every Share Saves Lives</Text>
        <Text style={styles.ctaText}>
          When you refer a friend to BloodLink, you're not just sharing an app - you're expanding our life-saving network. Every new donor could be someone's hero.
        </Text>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => handleShare('more')}
        >
          <FontAwesome5 name="share-alt" size={20} color="#fff" />
          <Text style={styles.ctaButtonText}>Share Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#b71c1c',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#ffcdd2',
    marginTop: 5,
  },
  referralCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  referralIcon: {
    marginBottom: 20,
  },
  referralTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 15,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#b71c1c',
    borderStyle: 'dashed',
  },
  referralCode: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#b71c1c',
    marginRight: 10,
    letterSpacing: 2,
  },
  codeInstructions: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 10,
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  benefitsList: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#555',
    marginLeft: 15,
    flex: 1,
  },
  shareSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  shareButtonText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
    fontSize: 14,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#b71c1c',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  ctaSection: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  ctaButton: {
    backgroundColor: '#b71c1c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#b71c1c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 10,
    fontSize: 16,
  },
});
