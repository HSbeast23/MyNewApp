import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width, height } = Dimensions.get('window');

export default function AboutUsScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const handleContact = (type, value) => {
    switch (type) {
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${value}`);
        break;
      case 'website':
        Linking.openURL(value);
        break;
      case 'social':
        Linking.openURL(value);
        break;
      default:
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>About BloodLink</Text>
        <Text style={styles.headerSubtitle}>Connecting lives through blood donation</Text>
      </View>

      {/* Mission Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="favorite" size={28} color="#b71c1c" />
          <Text style={styles.sectionTitle}>Our Mission</Text>
        </View>
        <Text style={styles.sectionText}>
          BloodLink is dedicated to bridging the gap between blood donors and recipients across Tamil Nadu. 
          We believe that every drop of blood donated can save lives, and our mission is to make blood donation 
          accessible, efficient, and impactful for everyone in our community.
        </Text>
      </View>

      {/* Vision Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="eye" size={28} color="#2196F3" />
          <Text style={styles.sectionTitle}>Our Vision</Text>
        </View>
        <Text style={styles.sectionText}>
          To create a world where no one suffers due to blood shortage. We envision a connected community 
          where voluntary blood donation becomes a way of life, ensuring that emergency blood requirements 
          are met promptly and efficiently.
        </Text>
      </View>

      {/* Values Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="hands-helping" size={24} color="#4CAF50" />
          <Text style={styles.sectionTitle}>Our Values</Text>
        </View>
        <View style={styles.valuesList}>
          <View style={styles.valueItem}>
            <MaterialIcons name="security" size={20} color="#FF9800" />
            <Text style={styles.valueText}><Text style={styles.valueBold}>Safety First:</Text> Ensuring all donations meet the highest safety standards</Text>
          </View>
          <View style={styles.valueItem}>
            <MaterialIcons name="accessibility" size={20} color="#9C27B0" />
            <Text style={styles.valueText}><Text style={styles.valueBold}>Accessibility:</Text> Making blood donation easy and accessible for everyone</Text>
          </View>
          <View style={styles.valueItem}>
            <MaterialIcons name="transparency" size={20} color="#00BCD4" />
            <Text style={styles.valueText}><Text style={styles.valueBold}>Transparency:</Text> Clear communication throughout the donation process</Text>
          </View>
          <View style={styles.valueItem}>
            <MaterialIcons name="group" size={20} color="#795548" />
            <Text style={styles.valueText}><Text style={styles.valueBold}>Community:</Text> Building a strong network of donors and recipients</Text>
          </View>
        </View>
      </View>

      {/* Impact Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="trending-up" size={28} color="#FF5722" />
          <Text style={styles.sectionTitle}>Our Impact</Text>
        </View>
        <View style={styles.impactGrid}>
          <View style={styles.impactCard}>
            <Text style={styles.impactNumber}>1000+</Text>
            <Text style={styles.impactLabel}>Lives Saved</Text>
          </View>
          <View style={styles.impactCard}>
            <Text style={styles.impactNumber}>500+</Text>
            <Text style={styles.impactLabel}>Active Donors</Text>
          </View>
          <View style={styles.impactCard}>
            <Text style={styles.impactNumber}>50+</Text>
            <Text style={styles.impactLabel}>Cities Covered</Text>
          </View>
          <View style={styles.impactCard}>
            <Text style={styles.impactNumber}>24/7</Text>
            <Text style={styles.impactLabel}>Support</Text>
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="settings" size={28} color="#607D8B" />
          <Text style={styles.sectionTitle}>How BloodLink Works</Text>
        </View>
        <View style={styles.stepsList}>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Register</Text>
              <Text style={styles.stepDescription}>Create your profile with basic details and blood group</Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect</Text>
              <Text style={styles.stepDescription}>Get matched with donors or recipients in your area</Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Donate</Text>
              <Text style={styles.stepDescription}>Coordinate and complete the life-saving donation</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="contact-support" size={28} color="#3F51B5" />
          <Text style={styles.sectionTitle}>Get in Touch</Text>
        </View>
        <Text style={styles.sectionText}>
          Have questions, suggestions, or want to partner with us? We'd love to hear from you!
        </Text>
        <View style={styles.contactGrid}>
          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleContact('email', 'BloodLink@gmail.com')}
          >
            <MaterialIcons name="email" size={24} color="#b71c1c" />
            <Text style={styles.contactLabel}>Email Us</Text>
            <Text style={styles.contactValue}>BloodLink@gmail.com</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleContact('phone', '+91-7695908575')}
          >
            <MaterialIcons name="phone" size={24} color="#b71c1c" />
            <Text style={styles.contactLabel}>Call Us</Text>
            <Text style={styles.contactValue}>+91-7695908575</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Social Media Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="share" size={28} color="#E91E63" />
          <Text style={styles.sectionTitle}>Follow Us</Text>
        </View>
        <Text style={styles.sectionText}>
          Stay updated with our latest initiatives and success stories
        </Text>
        <View style={styles.socialGrid}>
          <TouchableOpacity 
            style={styles.socialCard}
            onPress={() => handleContact('social', 'https://facebook.com/blood.link')}
          >
            <FontAwesome5 name="facebook" size={24} color="#1877F2" />
            <Text style={styles.socialLabel}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialCard}
            onPress={() => handleContact('social', 'https://twitter.com/bllod')}
          >
            <FontAwesome5 name="twitter" size={24} color="#1DA1F2" />
            <Text style={styles.socialLabel}>Twitter</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialCard}
            onPress={() => handleContact('social', 'https://instagram.com/haariz._.-23')}
          >
            <FontAwesome5 name="instagram" size={24} color="#E4405F" />
            <Text style={styles.socialLabel}>Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialCard}
            onPress={() => handleContact('social', 'https://linkedin.com/in/haarhish-vs')}
          >
            <FontAwesome5 name="linkedin" size={24} color="#0A66C2" />
            <Text style={styles.socialLabel}>LinkedIn</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Together, we can make a difference. Every donation counts, every life matters.
        </Text>
        <Text style={styles.footerSubtext}>
          BloodLink © 2024 - Saving lives, one donation at a time
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#b71c1c',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#ffcdd2',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginLeft: 12,
  },
  sectionText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    lineHeight: 24,
    textAlign: 'justify',
  },
  valuesList: {
    marginTop: 10,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  valueText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  valueBold: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  impactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  impactCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  impactNumber: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#b71c1c',
    marginBottom: 5,
  },
  impactLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
    textAlign: 'center',
  },
  stepsList: {
    marginTop: 15,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#b71c1c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    lineHeight: 20,
  },
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  contactCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  socialCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  socialLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginTop: 8,
  },
  footer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  footerText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  footerSubtext: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999',
    textAlign: 'center',
  },
});
