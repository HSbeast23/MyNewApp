import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import { db } from '../../services/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const AdminAnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [bloodGroupData, setBloodGroupData] = useState({});
  const [monthlyData, setMonthlyData] = useState({});
  const [locationData, setLocationData] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [donationStats, setDonationStats] = useState({
    totalDonations: 0,
    pendingDonations: 0,
    completedDonations: 0,
  });
  
  // Colors for different visual elements
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Fetch blood group distribution from donations
        const donationsCollection = collection(db, 'donations');
        const donationsSnapshot = await getDocs(donationsCollection);
        
        // Count donations by blood group
        const bloodGroups = {};
        const months = {};
        const locations = {};
        
        let totalDonations = 0;
        let pendingDonations = 0;
        let completedDonations = 0;
        
        donationsSnapshot.forEach(doc => {
          const data = doc.data();
          totalDonations++;
          
          // Blood group counting
          const bloodGroup = data.bloodGroup || 'Unknown';
          bloodGroups[bloodGroup] = (bloodGroups[bloodGroup] || 0) + 1;
          
          // Status counting
          if (data.status === 'completed') {
            completedDonations++;
          } else {
            pendingDonations++;
          }
          
          // Monthly data
          if (data.createdAt && data.createdAt.toDate) {
            const date = data.createdAt.toDate();
            const monthName = date.toLocaleString('default', { month: 'short' });
            months[monthName] = (months[monthName] || 0) + 1;
          }
          
          // Location data
          const location = data.hospital || data.location || 'Unknown';
          locations[location] = (locations[location] || 0) + 1;
        });
        
        // Format location data (take top 5 locations)
        const sortedLocations = Object.entries(locations)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value], index) => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            value,
            color: colors[index % colors.length],
          }));
        
        setTotalDonations(totalDonations);
        setBloodGroupData(bloodGroups);
        setMonthlyData(months);
        setLocationData(sortedLocations);
        setDonationStats({
          totalDonations,
          pendingDonations,
          completedDonations,
        });
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);

  // Helper function to get last 6 months
  const getLastSixMonths = () => {
    const months = [];
    const date = new Date();
    
    for (let i = 0; i < 6; i++) {
      months.unshift(date.toLocaleString('default', { month: 'short' }));
      date.setMonth(date.getMonth() - 1);
    }
    
    return months;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading analytics data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Blood Donation Analytics</Text>
      
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>{donationStats.totalDonations}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={[styles.statNumber, { color: '#3498db' }]}>
              {donationStats.pendingDonations}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={[styles.statNumber, { color: '#2ecc71' }]}>
              {donationStats.completedDonations}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Monthly Donations</Text>
        <Card style={styles.chartCard}>
          <Card.Content>
            {Object.keys(monthlyData).length > 0 ? (
              <View style={styles.monthlyContainer}>
                {getLastSixMonths().map((month, index) => (
                  <View key={month} style={styles.monthItem}>
                    <Text style={styles.monthName}>{month}</Text>
                    <View style={styles.progressContainer}>
                      <ProgressBar 
                        progress={monthlyData[month] ? monthlyData[month] / totalDonations : 0} 
                        color="#e74c3c" 
                        style={styles.progressBar} 
                      />
                    </View>
                    <Text style={styles.monthCount}>{monthlyData[month] || 0}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No monthly data available</Text>
            )}
          </Card.Content>
        </Card>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Blood Group Distribution</Text>
        <Card style={styles.chartCard}>
          <Card.Content>
            {Object.keys(bloodGroupData).length > 0 ? (
              <View style={styles.bloodGroupContainer}>
                {Object.entries(bloodGroupData).map(([group, count], index) => (
                  <View key={group} style={styles.bloodGroupItem}>
                    <View style={[styles.bloodGroupIndicator, { backgroundColor: colors[index % colors.length] }]} />
                    <Text style={styles.bloodGroupName}>{group}</Text>
                    <ProgressBar 
                      progress={count / totalDonations} 
                      color={colors[index % colors.length]} 
                      style={styles.progressBar} 
                    />
                    <Text style={styles.bloodGroupCount}>{count}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No blood group data available</Text>
            )}
          </Card.Content>
        </Card>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Top Donation Locations</Text>
        <Card style={styles.chartCard}>
          <Card.Content>
            {locationData.length > 0 ? (
              <View style={styles.locationsContainer}>
                {locationData.map((location, index) => (
                  <View key={index} style={styles.locationItem}>
                    <View style={styles.locationHeader}>
                      <View style={[styles.locationIndicator, { backgroundColor: location.color }]} />
                      <Text style={styles.locationName} numberOfLines={1}>{location.name}</Text>
                      <Text style={styles.locationCount}>{location.value}</Text>
                    </View>
                    <ProgressBar 
                      progress={location.value / totalDonations} 
                      color={location.color} 
                      style={styles.progressBar} 
                    />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noDataText}>No location data available</Text>
            )}
          </Card.Content>
        </Card>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Data updated as of {new Date().toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    backgroundColor: '#fff',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 5,
  },
  chartContainer: {
    marginBottom: 25,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  chartCard: {
    backgroundColor: '#fff',
    elevation: 2,
    paddingVertical: 10,
  },
  monthlyContainer: {
    paddingHorizontal: 10,
  },
  monthItem: {
    marginBottom: 12,
  },
  monthName: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  monthCount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
    textAlign: 'right',
  },
  bloodGroupContainer: {
    paddingHorizontal: 10,
  },
  bloodGroupItem: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  bloodGroupIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  bloodGroupName: {
    fontSize: 14,
    color: '#2c3e50',
    width: 40,
  },
  bloodGroupCount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  locationsContainer: {
    paddingHorizontal: 10,
  },
  locationItem: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  locationName: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  locationCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7f8c8d',
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
});

export default AdminAnalyticsScreen;
