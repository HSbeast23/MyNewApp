import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../services/auth';

const { width, height } = Dimensions.get('window');

// Blood bank data for Tamil Nadu cities
const bloodBanksByCity = {
  'Chennai': [
    {
      name: 'Tamil Nadu State AIDS Control Society Blood Bank',
      address: 'Teynampet, Chennai',
      phone: '+91-44-2432-1856',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing', 'Emergency Supply']
    },
    {
      name: 'Apollo Blood Bank',
      address: 'Greams Road, Chennai',
      phone: '+91-44-2829-4429',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Platelet Donation', 'Blood Testing']
    },
    {
      name: 'Voluntary Health Services Blood Bank',
      address: 'Adyar, Chennai',
      phone: '+91-44-2441-1755',
      hours: '8:00 AM - 8:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    },
    {
      name: 'Government General Hospital Blood Bank',
      address: 'Park Town, Chennai',
      phone: '+91-44-2819-2100',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply', 'Free Service']
    },
    {
      name: 'Stanley Medical College Blood Bank',
      address: 'Old Jail Road, Chennai',
      phone: '+91-44-2829-8600',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Testing', 'Emergency Supply', 'Student Training']
    },
    {
      name: 'Fortis Malar Blood Bank',
      address: 'Adyar, Chennai',
      phone: '+91-44-4289-2300',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Platelet Donation', 'Blood Testing', 'Component Separation']
    },
    {
      name: 'MIOT International Blood Bank',
      address: 'Mount Poonamalle Road, Chennai',
      phone: '+91-44-4200-2400',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing', 'Emergency Supply']
    },
    {
      name: 'Sri Ramachandra Blood Bank',
      address: 'Porur, Chennai',
      phone: '+91-44-4528-1100',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Research', 'Blood Testing', 'Student Programs']
    },
    {
      name: 'Global Hospitals Blood Bank',
      address: 'Perumbakkam, Chennai',
      phone: '+91-44-4477-7100',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply', 'Platelet Donation']
    },
    {
      name: 'Vijaya Hospital Blood Bank',
      address: 'Vadapalani, Chennai',
      phone: '+91-44-2471-9100',
      hours: '8:00 AM - 8:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing']
    },
    {
      name: 'Gleneagles Blood Bank',
      address: 'Perumbakkam, Chennai',
      phone: '+91-44-4444-1100',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply', 'Component Therapy']
    },
    {
      name: 'Billroth Blood Bank',
      address: 'Shenoy Nagar, Chennai',
      phone: '+91-44-2821-3900',
      hours: '8:00 AM - 6:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing']
    },
    {
      name: 'Madras Medical Mission Blood Bank',
      address: 'Mogappair, Chennai',
      phone: '+91-44-2656-7800',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Cardiac Surgery Support', 'Emergency Supply']
    },
    {
      name: 'Dr. Kamakshi Memorial Blood Bank',
      address: 'Pallikaranai, Chennai',
      phone: '+91-44-4896-9000',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing', 'Emergency Supply']
    },
    {
      name: 'Lifeline Blood Bank',
      address: 'Adyar, Chennai',
      phone: '+91-44-4289-4500',
      hours: '8:00 AM - 8:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    }
  ],
  'Coimbatore': [
    {
      name: 'Kovai Medical Center Blood Bank',
      address: 'Avinashi Road, Coimbatore',
      phone: '+91-422-4324-400',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing', 'Emergency Supply']
    },
    {
      name: 'Government Blood Bank',
      address: 'Coimbatore Medical College, Coimbatore',
      phone: '+91-422-2570-170',
      hours: '24/7',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    },
    {
      name: 'PSG Hospitals Blood Bank',
      address: 'Peelamedu, Coimbatore',
      phone: '+91-422-2570-200',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing', 'Research']
    },
    {
      name: 'Ganga Hospital Blood Bank',
      address: 'Mettupalayam Road, Coimbatore',
      phone: '+91-422-2485-100',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Trauma Support', 'Emergency Supply', 'Orthopedic Surgery']
    },
    {
      name: 'Sri Ramakrishna Hospital Blood Bank',
      address: 'Sidhapudur, Coimbatore',
      phone: '+91-422-2324-100',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing', 'Emergency Supply']
    },
    {
      name: 'Gem Hospital Blood Bank',
      address: 'Ramnagar, Coimbatore',
      phone: '+91-422-2200-200',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply', 'Component Therapy']
    },
    {
      name: 'G Kuppuswamy Naidu Memorial Blood Bank',
      address: 'Nethaji Road, Coimbatore',
      phone: '+91-422-2204-100',
      hours: '8:00 AM - 8:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing']
    },
    {
      name: 'Royal Care Hospital Blood Bank',
      address: 'Sungam, Coimbatore',
      phone: '+91-422-2310-100',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    },
    {
      name: 'Sheela Hospital Blood Bank',
      address: 'Saibaba Colony, Coimbatore',
      phone: '+91-422-2515-800',
      hours: '8:00 AM - 8:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing']
    },
    {
      name: 'Vikram Hospital Blood Bank',
      address: 'Race Course Road, Coimbatore',
      phone: '+91-422-2217-800',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    },
    {
      name: 'Ashwin Hospital Blood Bank',
      address: 'Saravanampatti, Coimbatore',
      phone: '+91-422-2666-100',
      hours: '8:00 AM - 6:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing']
    },
    {
      name: 'Coimbatore District Blood Bank',
      address: 'Collectorate, Coimbatore',
      phone: '+91-422-2422-100',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply', 'Free Service']
    }
  ],
  'Madurai': [
    {
      name: 'Government Rajaji Hospital Blood Bank',
      address: 'Madurai Medical College, Madurai',
      phone: '+91-452-2530-570',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing', 'Emergency Supply']
    }
  ],
  'Salem': [
    {
      name: 'Government Mohan Kumaramangalam Medical College Blood Bank',
      address: 'Salem Medical College, Salem',
      phone: '+91-427-2241-171',
      hours: '24/7',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    }
  ],
  'Tiruchirappalli': [
    {
      name: 'K.A.P. Viswanatham Government Medical College Blood Bank',
      address: 'Tiruchirappalli Medical College, Tiruchirappalli',
      phone: '+91-431-2460-895',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing', 'Emergency Supply']
    }
  ],
  'Kumbakonam': [
    {
      name: 'Kumbakonam Government Hospital Blood Bank',
      address: 'Hospital Road, Kumbakonam',
      phone: '+91-435-2421-234',
      hours: '8:00 AM - 6:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    },
    {
      name: 'Kumbakonam Medical College Blood Bank',
      address: 'Medical College Road, Kumbakonam',
      phone: '+91-435-2421-800',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing', 'Student Training']
    },
    {
      name: 'Sri Venkateshwara Hospital Blood Bank',
      address: 'Thanjavur Road, Kumbakonam',
      phone: '+91-435-2422-500',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    },
    {
      name: 'Arogya Hospital Blood Bank',
      address: 'Swamimalai Road, Kumbakonam',
      phone: '+91-435-2422-900',
      hours: '8:00 AM - 8:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing']
    },
    {
      name: 'Sri Saraswathi Hospital Blood Bank',
      address: 'TSR Big Street, Kumbakonam',
      phone: '+91-435-2421-600',
      hours: '8:00 AM - 6:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    },
    {
      name: 'Kumbakonam District Blood Bank',
      address: 'Collectorate, Kumbakonam',
      phone: '+91-435-2421-400',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply', 'Free Service']
    },
    {
      name: 'Mahatma Gandhi Memorial Blood Bank',
      address: 'Darasuram Road, Kumbakonam',
      phone: '+91-435-2421-350',
      hours: '8:00 AM - 6:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    },
    {
      name: 'Sri Lakshmi Hospital Blood Bank',
      address: 'Nageswaran Street, Kumbakonam',
      phone: '+91-435-2422-700',
      hours: '8:00 AM - 8:00 PM',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Blood Testing']
    },
    {
      name: 'Thanjavur Medical College Blood Bank',
      address: 'Thanjavur Road, Kumbakonam',
      phone: '+91-435-2422-250',
      hours: '24/7',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply', 'Research']
    },
    {
      name: 'Sri Ramakrishna Mission Blood Bank',
      address: 'Mission Hospital Road, Kumbakonam',
      phone: '+91-435-2421-500',
      hours: '8:00 AM - 6:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Charitable Service']
    },
    {
      name: 'Kumbakonam Red Cross Blood Bank',
      address: 'Red Cross Road, Kumbakonam',
      phone: '+91-435-2421-700',
      hours: '8:00 AM - 8:00 PM',
      bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply', 'Disaster Relief']
    },
    {
      name: 'Kumbakonam Nursing Home Blood Bank',
      address: 'Ayikudi Road, Kumbakonam',
      phone: '+91-435-2422-150',
      hours: '8:00 AM - 6:00 PM',
      bloodTypes: ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'],
      services: ['Blood Collection', 'Blood Storage', 'Emergency Supply']
    }
  ]
};

export default function BloodBankServiceScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [userProfile, setUserProfile] = useState(null);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [userCity, setUserCity] = useState('');

  // Fetch user data and get blood banks for their city
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
          setUserCity(userData.city || '');
          
          // Get blood banks for user's city
          const cityBloodBanks = bloodBanksByCity[userData.city] || [];
          setBloodBanks(cityBloodBanks);
        } else {
          // Try direct document access
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            setUserCity(userData.city || '');
            
            const cityBloodBanks = bloodBanksByCity[userData.city] || [];
            setBloodBanks(cityBloodBanks);
          }
        }
      } catch (error) {
        console.log('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDirections = (bankName, address) => {
    const query = encodeURIComponent(`${bankName}, ${address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  const getBloodTypeColor = (bloodType) => {
    const colors = {
      'O+': '#FF5722', 'O-': '#FF3D00',
      'A+': '#2196F3', 'A-': '#1976D2',
      'B+': '#4CAF50', 'B-': '#388E3C',
      'AB+': '#9C27B0', 'AB-': '#7B1FA2'
    };
    return colors[bloodType] || '#666';
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
        <Text style={styles.headerTitle}>Blood Bank Services</Text>
        <Text style={styles.headerSubtitle}>
          {userCity ? `Blood banks in ${userCity}` : 'Find nearby blood banks'}
        </Text>
      </View>

      {/* User Location Info */}
      <View style={styles.locationCard}>
        <View style={styles.locationIcon}>
          <Ionicons name="location" size={24} color="#b71c1c" />
        </View>
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>Your Location</Text>
          <Text style={styles.locationText}>{userCity || 'Location not set'}</Text>
        </View>
      </View>

      {/* Emergency Blood Request Banner */}
      <View style={styles.emergencyBanner}>
        <FontAwesome5 name="tint" size={24} color="#fff" />
        <View style={styles.emergencyText}>
          <Text style={styles.emergencyTitle}>Need Blood Urgently?</Text>
          <Text style={styles.emergencySubtitle}>Contact blood banks directly for emergency requirements</Text>
        </View>
        <View style={styles.emergencyIcon}>
          <MaterialIcons name="emergency" size={24} color="#fff" />
        </View>
      </View>

      {/* Blood Banks List */}
      <View style={styles.bloodBanksSection}>
        <Text style={styles.sectionTitle}>
          {bloodBanks.length > 0 ? `${bloodBanks.length} Blood Banks Found` : 'No Blood Banks Found'}
        </Text>
        
        {bloodBanks.length === 0 ? (
          <View style={styles.noBloodBanksCard}>
            <FontAwesome5 name="tint" size={48} color="#ccc" />
            <Text style={styles.noBloodBanksTitle}>No blood banks found</Text>
            <Text style={styles.noBloodBanksText}>
              {userCity 
                ? `We don't have blood bank data for ${userCity} yet. We're working to add more cities.`
                : 'Please update your location in Personal Details to see nearby blood banks.'
              }
            </Text>
          </View>
        ) : (
          bloodBanks.map((bank, index) => (
            <View key={index} style={styles.bloodBankCard}>
              <View style={styles.bankHeader}>
                <View style={styles.bankIcon}>
                  <FontAwesome5 name="tint" size={32} color="#b71c1c" />
                </View>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>{bank.name}</Text>
                  <Text style={styles.bankHours}>🕐 {bank.hours}</Text>
                </View>
              </View>
              
              <View style={styles.bankDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{bank.address}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="call-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{bank.phone}</Text>
                </View>
              </View>
              
              {/* Available Blood Types */}
              <View style={styles.bloodTypesSection}>
                <Text style={styles.bloodTypesTitle}>Available Blood Types:</Text>
                <View style={styles.bloodTypesContainer}>
                  {bank.bloodTypes.map((type, typeIndex) => (
                    <View 
                      key={typeIndex} 
                      style={[styles.bloodTypeTag, { backgroundColor: getBloodTypeColor(type) }]}
                    >
                      <Text style={styles.bloodTypeText}>{type}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* Services */}
              <View style={styles.servicesSection}>
                <Text style={styles.servicesTitle}>Services:</Text>
                <View style={styles.servicesContainer}>
                  {bank.services.map((service, serviceIndex) => (
                    <View key={serviceIndex} style={styles.serviceTag}>
                      <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
                      <Text style={styles.serviceText}>{service}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.bankActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleCall(bank.phone)}
                >
                  <Ionicons name="call" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Call</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.directionsButton]}
                  onPress={() => handleDirections(bank.name, bank.address)}
                >
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Directions</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Information Cards */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>Blood Donation Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="info" size={24} color="#2196F3" />
            <Text style={styles.infoTitle}>Who Can Donate?</Text>
          </View>
          <Text style={styles.infoText}>
            • Age: 18-65 years{"\n"}
            • Weight: Minimum 50 kg{"\n"}
            • Hemoglobin: Minimum 12.5 g/dl{"\n"}
            • Good general health{"\n"}
            • No recent illness or medication
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <FontAwesome5 name="clock" size={20} color="#FF9800" />
            <Text style={styles.infoTitle}>Donation Intervals</Text>
          </View>
          <Text style={styles.infoText}>
            • Whole Blood: Every 3 months{"\n"}
            • Platelets: Every 2 weeks{"\n"}
            • Plasma: Every 2 weeks{"\n"}
            • Double Red Cells: Every 4 months
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <MaterialIcons name="favorite" size={24} color="#E91E63" />
            <Text style={styles.infoTitle}>Benefits of Donating</Text>
          </View>
          <Text style={styles.infoText}>
            • Save up to 3 lives per donation{"\n"}
            • Free health checkup{"\n"}
            • Reduces risk of heart disease{"\n"}
            • Burns calories{"\n"}
            • Feel good about helping others
          </Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footerInfo}>
        <Text style={styles.footerTitle}>Want to add your blood bank?</Text>
        <Text style={styles.footerText}>
          Contact us to include your blood bank in our directory and help connect more donors with those in need.
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
  locationCard: {
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
  locationIcon: {
    marginRight: 15,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 2,
  },
  emergencyBanner: {
    backgroundColor: '#d32f2f',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  emergencyText: {
    flex: 1,
    marginLeft: 15,
  },
  emergencyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  emergencySubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#ffcdd2',
  },
  emergencyIcon: {
    marginLeft: 15,
  },
  bloodBanksSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 15,
  },
  noBloodBanksCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  noBloodBanksTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
  },
  noBloodBanksText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  bloodBankCard: {
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
  bankHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  bankIcon: {
    marginRight: 15,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  bankHours: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  bankDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  bloodTypesSection: {
    marginBottom: 15,
  },
  bloodTypesTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  bloodTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bloodTypeTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  bloodTypeText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  servicesSection: {
    marginBottom: 15,
  },
  servicesTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginLeft: 5,
  },
  bankActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#b71c1c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 0.48,
  },
  directionsButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
    fontSize: 14,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  infoSectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 15,
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
    lineHeight: 22,
  },
  footerInfo: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  footerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
