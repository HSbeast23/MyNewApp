import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { db } from '../../services/auth';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const AdminDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    totalRequests: 0,
    recentDonations: [],
    recentRequests: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch users count
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const usersCount = usersSnapshot.size;
        
        // Fetch donations count and recent donations
        const donationsCollection = collection(db, 'donations');
        const donationsSnapshot = await getDocs(donationsCollection);
        const donationsCount = donationsSnapshot.size;
        
        // Get 5 most recent donations
        const recentDonationsQuery = query(
          collection(db, 'donations'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentDonationsSnapshot = await getDocs(recentDonationsQuery);
        const recentDonations = recentDonationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch requests count and recent requests
        const requestsCollection = collection(db, 'bloodRequests');
        const requestsSnapshot = await getDocs(requestsCollection);
        const requestsCount = requestsSnapshot.size;
        
        // Get 5 most recent requests
        const recentRequestsQuery = query(
          collection(db, 'bloodRequests'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentRequestsSnapshot = await getDocs(recentRequestsQuery);
        const recentRequests = recentRequestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStats({
          totalUsers: usersCount,
          totalDonations: donationsCount,
          totalRequests: requestsCount,
          recentDonations,
          recentRequests
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return 'N/A';
    }
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderRecentItem = (item, type) => {
    return (
      <TouchableOpacity 
        key={item.id}
        style={styles.recentItem}
        onPress={() => navigation.navigate(
          type === 'donation' ? 'AdminDonationDetail' : 'AdminRequestDetail',
          { itemId: item.id }
        )}
      >
        <View style={styles.recentItemContent}>
          <View style={styles.recentItemHeader}>
            <Text style={styles.recentItemTitle}>
              {type === 'donation' 
                ? `${item.bloodGroup} donation` 
                : `${item.bloodGroup} request`}
            </Text>
            <Text style={styles.recentItemDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <Text numberOfLines={1} style={styles.recentItemName}>
            {item.name || 'Anonymous'}
          </Text>
          <View style={styles.recentItemFooter}>
            <Text style={styles.recentItemLocation}>
              {item.hospital || item.location || 'Not specified'}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color="#666"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Admin Dashboard</Text>
      
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>{stats.totalDonations}</Text>
            <Text style={styles.statLabel}>Donations</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>{stats.totalRequests}</Text>
            <Text style={styles.statLabel}>Requests</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Donations</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AdminDonations')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <Card style={styles.listCard}>
          <Card.Content style={styles.cardContent}>
            {stats.recentDonations.length > 0 ? (
              stats.recentDonations.map(donation => renderRecentItem(donation, 'donation'))
            ) : (
              <Text style={styles.noDataText}>No recent donations</Text>
            )}
          </Card.Content>
        </Card>
      </View>

      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AdminRequests')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <Card style={styles.listCard}>
          <Card.Content style={styles.cardContent}>
            {stats.recentRequests.length > 0 ? (
              stats.recentRequests.map(request => renderRecentItem(request, 'request'))
            ) : (
              <Text style={styles.noDataText}>No recent requests</Text>
            )}
          </Card.Content>
        </Card>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Analytics')}
        >
          <Ionicons name="analytics-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>View Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryActionButton]}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Ionicons name="people-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Manage Users</Text>
        </TouchableOpacity>
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
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  seeAllText: {
    color: '#e74c3c',
    fontSize: 14,
  },
  listCard: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  cardContent: {
    padding: 0,
  },
  recentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  recentItemDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  recentItemName: {
    fontSize: 14,
    color: '#34495e',
    marginVertical: 4,
  },
  recentItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentItemLocation: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
    elevation: 2,
  },
  secondaryActionButton: {
    backgroundColor: '#3498db',
    marginRight: 0,
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default AdminDashboardScreen;
