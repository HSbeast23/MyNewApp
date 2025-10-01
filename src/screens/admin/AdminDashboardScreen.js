import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { db } from '../../services/auth';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonors: 0,
    totalReceivers: 0,
    totalDonations: 0,
    totalRequests: 0,
    activeDonations: 0,
    activeRequests: 0,
    completedDonations: 0,
    completedRequests: 0,
    matchedPairs: 0,
    adminCount: 0,
    recentDonations: [],
    recentRequests: [],
    bloodGroupStats: {},
    cityStats: {},
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Setup real-time listeners
    const unsubscribeDonations = onSnapshot(
      collection(db, 'BloodDonors'),
      () => {
        console.log('BloodDonors collection updated, refreshing dashboard...');
        fetchDashboardData();
      },
      (error) => console.error('Donations listener error:', error)
    );

    const unsubscribeRequests = onSnapshot(
      collection(db, 'Bloodreceiver'),
      () => {
        console.log('Bloodreceiver collection updated, refreshing dashboard...');
        fetchDashboardData();
      },
      (error) => console.error('Requests listener error:', error)
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      () => {
        console.log('Users collection updated, refreshing dashboard...');
        fetchDashboardData();
      },
      (error) => console.error('Users listener error:', error)
    );

    return () => {
      unsubscribeDonations();
      unsubscribeRequests();
      unsubscribeUsers();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Fetch all users with details
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usersCount = users.length;
      const adminCount = users.filter(u => u.isAdmin === true).length;
      console.log('Users fetched:', usersCount, 'Admins:', adminCount);
      
      // Fetch all donations (from BloodDonors collection)
      const donationsSnapshot = await getDocs(collection(db, 'BloodDonors'));
      const donations = donationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const donationsCount = donations.length;
      console.log('Donations (BloodDonors) fetched:', donationsCount);
      
      // Count active and completed donations
      const activeDonations = donations.filter(d => d.isActive === true || d.status === 'active' || (!d.status && d.isActive !== false)).length;
      const completedDonations = donations.filter(d => d.status === 'completed' || d.isActive === false).length;
      
      // Fetch all blood requests (from Bloodreceiver collection)
      const requestsSnapshot = await getDocs(collection(db, 'Bloodreceiver'));
      const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const requestsCount = requests.length;
      console.log('Requests (Bloodreceiver) fetched:', requestsCount);
      
      // Count active and completed requests
      const activeRequests = requests.filter(r => r.status === 'pending' || r.status === 'active' || !r.status).length;
      const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'fulfilled' || r.status === 'accepted').length;
      
      // Calculate unique donors and receivers from uid field
      const uniqueDonorIds = new Set(donations.map(d => d.uid).filter(uid => uid));
      const uniqueReceiverIds = new Set(requests.map(r => r.uid).filter(uid => uid));
      const totalDonors = uniqueDonorIds.size;
      const totalReceivers = uniqueReceiverIds.size;
      console.log('Unique donors:', totalDonors, 'Unique receivers:', totalReceivers);
      
      // Calculate matched pairs from requests that have responses array
      const requestsWithResponses = requests.filter(r => r.responses && r.responses.length > 0);
      const acceptedResponses = requestsWithResponses.reduce((count, r) => {
        const accepted = r.responses.filter(resp => resp.status === 'accepted').length;
        return count + accepted;
      }, 0);
      const matchedPairs = acceptedResponses;
      console.log('Matched pairs (accepted responses):', matchedPairs);
      
      // Blood group statistics
      const bloodGroupStats = {};
      [...donations, ...requests].forEach(item => {
        const group = item.bloodGroup || 'Unknown';
        bloodGroupStats[group] = (bloodGroupStats[group] || 0) + 1;
      });
      
      // City statistics
      const cityStats = {};
      [...donations, ...requests].forEach(item => {
        const city = item.city || 'Unknown';
        cityStats[city] = (cityStats[city] || 0) + 1;
      });
      
      // Get recent donations
      const recentDonationsQuery = query(
        collection(db, 'BloodDonors'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentDonationsSnapshot = await getDocs(recentDonationsQuery);
      const recentDonations = recentDonationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Recent donations:', recentDonations.length);
      
      // Get recent requests
      const recentRequestsQuery = query(
        collection(db, 'Bloodreceiver'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const recentRequestsSnapshot = await getDocs(recentRequestsQuery);
      const recentRequests = recentRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Recent requests:', recentRequests.length);
      
      setStats({
        totalUsers: usersCount,
        totalDonors,
        totalReceivers,
        totalDonations: donationsCount,
        totalRequests: requestsCount,
        activeDonations,
        activeRequests,
        completedDonations,
        completedRequests,
        matchedPairs,
        adminCount,
        recentDonations,
        recentRequests,
        bloodGroupStats,
        cityStats,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'fulfilled':
        return '#2ecc71';
      case 'matched':
        return '#3498db';
      case 'cancelled':
        return '#95a5a6';
      default:
        return '#f39c12';
    }
  };

  const getStatusBadge = (status) => {
    return (
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
        <Text style={styles.statusBadgeText}>{status || 'pending'}</Text>
      </View>
    );
  };

  const renderRecentItem = (item, type) => {
    return (
      <TouchableOpacity 
        key={item.id}
        style={styles.recentItem}
      >
        <View style={styles.recentItemContent}>
          <View style={styles.recentItemHeader}>
            <View style={styles.recentItemTitleRow}>
              <View style={[styles.bloodGroupBadge, { backgroundColor: type === 'donation' ? '#e74c3c' : '#3498db' }]}>
                <Text style={styles.bloodGroupBadgeText}>{item.bloodGroup || 'N/A'}</Text>
              </View>
              <Text style={styles.recentItemTitle}>
                {type === 'donation' ? 'Donation' : 'Request'}
              </Text>
            </View>
            {getStatusBadge(item.status)}
          </View>
          <Text numberOfLines={1} style={styles.recentItemName}>
            {item.name || 'Anonymous'}
          </Text>
          <View style={styles.recentItemFooter}>
            <View style={styles.recentItemInfo}>
              <Ionicons name="location-outline" size={14} color="#7f8c8d" />
              <Text style={styles.recentItemLocation}>
                {item.city || item.hospital || item.location || 'Not specified'}
              </Text>
            </View>
            <Text style={styles.recentItemDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e74c3c']} />
      }
    >
      {/* Header with Welcome Message */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Real-time Blood Donation Management</Text>
        <View style={styles.lastUpdated}>
          <Ionicons name="time-outline" size={14} color="#7f8c8d" />
          <Text style={styles.lastUpdatedText}>Live Updates</Text>
        </View>
      </View>

      {/* Main Statistics Cards - Row 1 */}
      <Text style={styles.sectionTitle}>📊 Overview Statistics</Text>
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, { backgroundColor: '#3498db' }]}>
          <Card.Content style={styles.statCardContent}>
            <Ionicons name="people" size={32} color="#fff" />
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </Card.Content>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: '#e74c3c' }]}>
          <Card.Content style={styles.statCardContent}>
            <MaterialCommunityIcons name="blood-bag" size={32} color="#fff" />
            <Text style={styles.statNumber}>{stats.totalDonors}</Text>
            <Text style={styles.statLabel}>Donors</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsRow}>
        <Card style={[styles.statCard, { backgroundColor: '#9b59b6' }]}>
          <Card.Content style={styles.statCardContent}>
            <MaterialCommunityIcons name="hospital-box" size={32} color="#fff" />
            <Text style={styles.statNumber}>{stats.totalReceivers}</Text>
            <Text style={styles.statLabel}>Receivers</Text>
          </Card.Content>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: '#2ecc71' }]}>
          <Card.Content style={styles.statCardContent}>
            <MaterialCommunityIcons name="link-variant" size={32} color="#fff" />
            <Text style={styles.statNumber}>{stats.matchedPairs}</Text>
            <Text style={styles.statLabel}>Matched Pairs</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Donations & Requests Statistics */}
      <Text style={styles.sectionTitle}>🩸 Donations & Requests</Text>
      <View style={styles.statsRow}>
        <Card style={styles.miniStatCard}>
          <Card.Content style={styles.miniStatCardContent}>
            <Text style={[styles.miniStatNumber, { color: '#e74c3c' }]}>{stats.totalDonations}</Text>
            <Text style={styles.miniStatLabel}>Total Donations</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.miniStatCard}>
          <Card.Content style={styles.miniStatCardContent}>
            <Text style={[styles.miniStatNumber, { color: '#f39c12' }]}>{stats.activeDonations}</Text>
            <Text style={styles.miniStatLabel}>Active</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.miniStatCard}>
          <Card.Content style={styles.miniStatCardContent}>
            <Text style={[styles.miniStatNumber, { color: '#2ecc71' }]}>{stats.completedDonations}</Text>
            <Text style={styles.miniStatLabel}>Completed</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.miniStatCard}>
          <Card.Content style={styles.miniStatCardContent}>
            <Text style={[styles.miniStatNumber, { color: '#3498db' }]}>{stats.totalRequests}</Text>
            <Text style={styles.miniStatLabel}>Total Requests</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.miniStatCard}>
          <Card.Content style={styles.miniStatCardContent}>
            <Text style={[styles.miniStatNumber, { color: '#f39c12' }]}>{stats.activeRequests}</Text>
            <Text style={styles.miniStatLabel}>Active</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.miniStatCard}>
          <Card.Content style={styles.miniStatCardContent}>
            <Text style={[styles.miniStatNumber, { color: '#2ecc71' }]}>{stats.completedRequests}</Text>
            <Text style={styles.miniStatLabel}>Fulfilled</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#3498db' }]}
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Ionicons name="people-outline" size={28} color="#fff" />
          <Text style={styles.actionButtonText}>Manage Users</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
          onPress={() => navigation.navigate('Analytics')}
        >
          <Ionicons name="analytics-outline" size={28} color="#fff" />
          <Text style={styles.actionButtonText}>View Analytics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
          onPress={() => navigation.navigate('MatchedPairs')}
        >
          <MaterialCommunityIcons name="link-variant" size={28} color="#fff" />
          <Text style={styles.actionButtonText}>Matched Pairs</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#f39c12' }]}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={28} color="#fff" />
          <Text style={styles.actionButtonText}>Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Donations */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🩸 Recent Donations</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All →</Text>
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

      {/* Recent Requests */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏥 Recent Blood Requests</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All →</Text>
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

      {/* System Info */}
      <Card style={styles.systemInfoCard}>
        <Card.Content>
          <Text style={styles.systemInfoTitle}>System Information</Text>
          <View style={styles.systemInfoRow}>
            <Text style={styles.systemInfoLabel}>Admin Accounts:</Text>
            <Text style={styles.systemInfoValue}>{stats.adminCount}</Text>
          </View>
          <View style={styles.systemInfoRow}>
            <Text style={styles.systemInfoLabel}>Database Status:</Text>
            <Text style={[styles.systemInfoValue, { color: '#2ecc71' }]}>● Online</Text>
          </View>
          <View style={styles.systemInfoRow}>
            <Text style={styles.systemInfoLabel}>Last Refresh:</Text>
            <Text style={styles.systemInfoValue}>{new Date().toLocaleTimeString()}</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  headerSection: {
    backgroundColor: '#e74c3c',
    padding: 20,
    paddingTop: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 4,
    borderRadius: 15,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  miniStatCard: {
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  miniStatCardContent: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  miniStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 20,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  listCard: {
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    padding: 0,
  },
  recentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodGroupBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 10,
  },
  bloodGroupBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  recentItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recentItemName: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 6,
    fontWeight: '500',
  },
  recentItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentItemLocation: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  recentItemDate: {
    fontSize: 11,
    color: '#95a5a6',
  },
  noDataText: {
    textAlign: 'center',
    padding: 30,
    color: '#95a5a6',
    fontStyle: 'italic',
    fontSize: 14,
  },
  systemInfoCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  systemInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  systemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  systemInfoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  systemInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
});

export default AdminDashboardScreen;
