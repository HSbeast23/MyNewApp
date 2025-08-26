import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width, height } = Dimensions.get('window');

export default function PrivacyPolicyScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const handleContact = (email) => {
    Linking.openURL(`mailto:${email}`);
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <Text style={styles.headerSubtitle}>Your privacy and data security matter to us</Text>
        <Text style={styles.lastUpdated}>Last updated: January 2024</Text>
      </View>

      {/* Introduction */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="security" size={28} color="#b71c1c" />
          <Text style={styles.sectionTitle}>Introduction</Text>
        </View>
        <Text style={styles.sectionText}>
          BloodLink ("we," "our," or "us") is committed to protecting your privacy and ensuring the security 
          of your personal information. This Privacy Policy explains how we collect, use, disclose, and 
          safeguard your information when you use our blood donation mobile application.
        </Text>
      </View>

      {/* Information We Collect */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="info" size={28} color="#2196F3" />
          <Text style={styles.sectionTitle}>Information We Collect</Text>
        </View>
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Personal Information</Text>
          <Text style={styles.bulletPoint}>• Full name and contact details</Text>
          <Text style={styles.bulletPoint}>• Blood group and medical information</Text>
          <Text style={styles.bulletPoint}>• Location and address information</Text>
          <Text style={styles.bulletPoint}>• Age and gender</Text>
          <Text style={styles.bulletPoint}>• Emergency contact information</Text>
        </View>
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Technical Information</Text>
          <Text style={styles.bulletPoint}>• Device information and identifiers</Text>
          <Text style={styles.bulletPoint}>• App usage data and analytics</Text>
          <Text style={styles.bulletPoint}>• Location data (with your permission)</Text>
        </View>
      </View>

      {/* How We Use Your Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="how-to-reg" size={28} color="#4CAF50" />
          <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        </View>
        <Text style={styles.bulletPoint}>• Match blood donors with recipients</Text>
        <Text style={styles.bulletPoint}>• Send notifications about donation requests</Text>
        <Text style={styles.bulletPoint}>• Facilitate communication between users</Text>
        <Text style={styles.bulletPoint}>• Improve our services and user experience</Text>
        <Text style={styles.bulletPoint}>• Ensure platform safety and security</Text>
        <Text style={styles.bulletPoint}>• Comply with legal requirements</Text>
      </View>

      {/* Information Sharing */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="share" size={28} color="#FF9800" />
          <Text style={styles.sectionTitle}>Information Sharing</Text>
        </View>
        <Text style={styles.sectionText}>
          We only share your information in the following circumstances:
        </Text>
        <Text style={styles.bulletPoint}>• With matched donors/recipients for coordination</Text>
        <Text style={styles.bulletPoint}>• With healthcare providers when necessary</Text>
        <Text style={styles.bulletPoint}>• With emergency services in critical situations</Text>
        <Text style={styles.bulletPoint}>• When required by law or legal process</Text>
        <Text style={styles.highlightText}>
          We never sell your personal information to third parties.
        </Text>
      </View>

      {/* Data Security */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="lock" size={28} color="#9C27B0" />
          <Text style={styles.sectionTitle}>Data Security</Text>
        </View>
        <Text style={styles.sectionText}>
          We implement industry-standard security measures to protect your information:
        </Text>
        <Text style={styles.bulletPoint}>• End-to-end encryption for sensitive data</Text>
        <Text style={styles.bulletPoint}>• Secure cloud storage with Firebase</Text>
        <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
        <Text style={styles.bulletPoint}>• Access controls and authentication</Text>
        <Text style={styles.bulletPoint}>• Data backup and recovery systems</Text>
      </View>

      {/* Your Rights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="account-circle" size={28} color="#00BCD4" />
          <Text style={styles.sectionTitle}>Your Rights</Text>
        </View>
        <Text style={styles.sectionText}>
          You have the following rights regarding your personal information:
        </Text>
        <Text style={styles.bulletPoint}>• Access and review your data</Text>
        <Text style={styles.bulletPoint}>• Update or correct inaccurate information</Text>
        <Text style={styles.bulletPoint}>• Delete your account and data</Text>
        <Text style={styles.bulletPoint}>• Opt-out of notifications</Text>
        <Text style={styles.bulletPoint}>• Request data portability</Text>
        <Text style={styles.bulletPoint}>• Withdraw consent at any time</Text>
      </View>

      {/* Data Retention */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="schedule" size={28} color="#FF5722" />
          <Text style={styles.sectionTitle}>Data Retention</Text>
        </View>
        <Text style={styles.sectionText}>
          We retain your information only as long as necessary to provide our services and comply with 
          legal obligations. When you delete your account, we remove your personal information within 
          30 days, except where required by law to retain certain records.
        </Text>
      </View>

      {/* Children's Privacy */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="child-care" size={28} color="#E91E63" />
          <Text style={styles.sectionTitle}>Children's Privacy</Text>
        </View>
        <Text style={styles.sectionText}>
          Our service is not intended for children under 18 years of age. We do not knowingly collect 
          personal information from children under 18. If you are a parent or guardian and believe your 
          child has provided us with personal information, please contact us immediately.
        </Text>
      </View>

      {/* Changes to Privacy Policy */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="update" size={28} color="#607D8B" />
          <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        </View>
        <Text style={styles.sectionText}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by 
          posting the new Privacy Policy in the app and updating the "Last updated" date. Your continued 
          use of the service after changes constitutes acceptance of the updated policy.
        </Text>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="contact-support" size={28} color="#3F51B5" />
          <Text style={styles.sectionTitle}>Contact Us</Text>
        </View>
        <Text style={styles.sectionText}>
          If you have any questions about this Privacy Policy or our data practices, please contact us:
        </Text>
        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleContact('privacy@bloodlink.com')}
        >
          <MaterialIcons name="email" size={24} color="#b71c1c" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>privacy@bloodlink.com</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.responseTime}>
          We will respond to your privacy inquiries within 48 hours.
        </Text>
      </View>

      {/* Legal Compliance */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="gavel" size={28} color="#795548" />
          <Text style={styles.sectionTitle}>Legal Compliance</Text>
        </View>
        <Text style={styles.sectionText}>
          This Privacy Policy complies with applicable data protection laws including the Information 
          Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or 
          Information) Rules, 2011 under the Information Technology Act, 2000 of India.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Your trust is important to us. We are committed to protecting your privacy and handling 
          your data responsibly.
        </Text>
        <Text style={styles.footerSubtext}>
          BloodLink Privacy Policy © 2024
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
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#ffcdd2',
    fontStyle: 'italic',
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
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    lineHeight: 22,
    textAlign: 'justify',
    marginBottom: 10,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    lineHeight: 22,
    marginBottom: 5,
  },
  highlightText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#b71c1c',
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 8,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  contactInfo: {
    marginLeft: 15,
  },
  contactLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#b71c1c',
  },
  responseTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
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
