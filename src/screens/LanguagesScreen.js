import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';

const { width, height } = Dimensions.get('window');

const languages = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    description: 'Switch to English'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    description: 'தமிழுக்கு மாறவும்'
  }
];

export default function LanguagesScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) return;
    
    setIsChanging(true);
    try {
      await changeLanguage(languageCode);
      Alert.alert(
        t('success'),
        t('languageChanged'),
        [{ text: t('ok'), style: 'default' }]
      );
    } catch (error) {
      Alert.alert(
        t('error'),
        'Failed to change language. Please try again.',
        [{ text: t('ok'), style: 'default' }]
      );
    } finally {
      setIsChanging(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('languages')}</Text>
        <Text style={styles.headerSubtitle}>{t('selectLanguage')}</Text>
      </View>

      {/* Current Language Info */}
      <View style={styles.currentLanguageCard}>
        <View style={styles.currentLanguageIcon}>
          <MaterialIcons name="language" size={32} color="#b71c1c" />
        </View>
        <View style={styles.currentLanguageInfo}>
          <Text style={styles.currentLanguageTitle}>Current Language</Text>
          <Text style={styles.currentLanguageText}>
            {languages.find(lang => lang.code === currentLanguage)?.nativeName || 'English'}
          </Text>
        </View>
      </View>

      {/* Language Options */}
      <View style={styles.languagesSection}>
        <Text style={styles.sectionTitle}>Available Languages</Text>
        
        {languages.map((language, index) => {
          const isSelected = currentLanguage === language.code;
          
          return (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageCard,
                isSelected && styles.selectedLanguageCard
              ]}
              onPress={() => handleLanguageChange(language.code)}
              disabled={isChanging}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    isSelected && styles.selectedLanguageName
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageDescription,
                    isSelected && styles.selectedLanguageDescription
                  ]}>
                    {language.description}
                  </Text>
                </View>
              </View>
              
              <View style={styles.languageRight}>
                {isSelected ? (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    <Text style={styles.selectedText}>Selected</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Language Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="info" size={24} color="#2196F3" />
            <Text style={styles.infoTitle}>Language Support</Text>
          </View>
          <Text style={styles.infoText}>
            BloodLink supports multiple languages to make the app accessible to users across Tamil Nadu. 
            Your language preference will be saved and applied throughout the app.
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="translate" size={24} color="#FF9800" />
            <Text style={styles.infoTitle}>Translation Quality</Text>
          </View>
          <Text style={styles.infoText}>
            We strive to provide accurate translations. If you notice any translation errors or have 
            suggestions for improvement, please contact our support team.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          More languages coming soon! We're working to add support for additional regional languages.
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
    fontSize: 28,
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
  currentLanguageCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  currentLanguageIcon: {
    marginRight: 15,
  },
  currentLanguageInfo: {
    flex: 1,
  },
  currentLanguageTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  currentLanguageText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#b71c1c',
  },
  languagesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 15,
  },
  languageCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedLanguageCard: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#f1f8e9',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 15,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  selectedLanguageName: {
    color: '#2E7D32',
  },
  languageDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  selectedLanguageDescription: {
    color: '#4CAF50',
  },
  languageRight: {
    alignItems: 'center',
  },
  selectedIndicator: {
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4CAF50',
    marginTop: 4,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginLeft: 10,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    lineHeight: 20,
    textAlign: 'justify',
  },
  footer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
