import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width, height } = Dimensions.get('window');

export default function FounderScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const handleContact = (type, value) => {
    switch (type) {
      case 'email':
        Linking.openURL(`mailto:${value || 'BloodLink23@gmail.com'}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${value || '+91-7695908575'}`);
        break;
      case 'linkedin':
        Linking.openURL('https://linkedin.com/in/haarhish-vs');
        break;
      case 'instagram':
        Linking.openURL('https://instagram.com/haariz._._23');
        break;
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
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>Meet Our Founder</Text>
          <Text style={styles.headerSubtitle}>Saving Lives Through Technology</Text>
        </View>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>HVS</Text>
            </View>
          </View>
          
          <Text style={styles.founderName}>Haarhish VS</Text>
          <Text style={styles.founderTitle}>Founder & CEO</Text>
          <Text style={styles.location}>
            <Ionicons name="location" size={16} color="#666" /> Kumbakonam, Tamil Nadu
          </Text>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>About the Founder</Text>
        <Text style={styles.aboutText}>
          Haarhish VS, a visionary from the historic city of Kumbakonam, founded BloodLink with a mission to bridge the gap between blood donors and recipients. Growing up in Tamil Nadu, he witnessed firsthand the challenges people face during medical emergencies when blood is urgently needed.
        </Text>
        <Text style={styles.aboutText}>
          With a passion for technology and healthcare, Haarhish developed BloodLink to create a seamless, real-time platform that connects donors with those in need, ensuring that no life is lost due to blood shortage.
        </Text>
      </View>

      {/* Vision & Mission */}
      <View style={styles.visionSection}>
        <View style={styles.visionCard}>
          <FontAwesome5 name="eye" size={24} color="#b71c1c" />
          <Text style={styles.visionTitle}>Our Vision</Text>
          <Text style={styles.visionText}>
            To create a world where blood shortage is never a barrier to saving lives, connecting every donor with every patient in need.
          </Text>
        </View>
        
        <View style={styles.missionCard}>
          <FontAwesome5 name="heart" size={24} color="#b71c1c" />
          <Text style={styles.missionTitle}>Our Mission</Text>
          <Text style={styles.missionText}>
            Leveraging technology to build the most efficient blood donation network, making the process simple, transparent, and accessible to all.
          </Text>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsList}>
          <View style={styles.achievementItem}>
            <MaterialIcons name="people" size={30} color="#4CAF50" />
            <Text style={styles.achievementNumber}>1000+</Text>
            <Text style={styles.achievementLabel}>Lives Saved</Text>
          </View>
          <View style={styles.achievementItem}>
            <FontAwesome5 name="hand-holding-heart" size={30} color="#2196F3" />
            <Text style={styles.achievementNumber}>500+</Text>
            <Text style={styles.achievementLabel}>Active Donors</Text>
          </View>
          <View style={styles.achievementItem}>
            <MaterialIcons name="location-city" size={30} color="#FF9800" />
            <Text style={styles.achievementNumber}>50+</Text>
            <Text style={styles.achievementLabel}>Cities Covered</Text>
          </View>
        </View>
      </View>

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Get in Touch</Text>
        <Text style={styles.contactText}>
          Have questions or suggestions? We'd love to hear from you!
        </Text>
        
        <View style={styles.contactButtons}>
          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleContact('email', 'BloodLink23@gmail.com')}
          >
            <MaterialIcons name="email" size={24} color="#b71c1c" />
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>BloodLink23@gmail.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleContact('phone', '+91-7695908575')}
          >
            <MaterialIcons name="phone" size={24} color="#b71c1c" />
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>+91-7695908575</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.socialButtons}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleContact('linkedin')}
          >
            <FontAwesome5 name="linkedin" size={20} color="#0077B5" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => handleContact('instagram')}
          >
            <FontAwesome5 name="instagram" size={20} color="#E4405F" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Quote */}
      <View style={styles.quoteSection}>
        <Text style={styles.quote}>
          "Every drop of blood donated is a gift of life. Together, we can ensure no one waits for this gift."
        </Text>
        <Text style={styles.quoteAuthor}>- Haarhish VS</Text>
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
    height: height * 0.25,
    backgroundColor: '#b71c1c',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerOverlay: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#ffcdd2',
    textAlign: 'center',
    marginTop: 8,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    width: '100%',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#b71c1c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  founderName: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: 5,
  },
  founderTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#b71c1c',
    marginBottom: 10,
  },
  location: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  aboutSection: {
    padding: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#555',
    lineHeight: 24,
    textAlign: 'justify',
    marginBottom: 15,
  },
  visionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  visionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
  },
  missionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
  },
  visionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
  },
  missionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 10,
    marginBottom: 8,
  },
  visionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  missionText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  achievementsSection: {
    padding: 20,
  },
  achievementsList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  achievementItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 5,
    minWidth: width * 0.25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  achievementNumber: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginTop: 10,
  },
  achievementLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  contactSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: '#b71c1c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: width * 0.35,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 25,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quoteSection: {
    backgroundColor: '#b71c1c',
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  quote: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffcdd2',
    marginTop: 10,
  },
});
