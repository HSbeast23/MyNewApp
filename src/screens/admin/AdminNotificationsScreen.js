import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { db } from '../../services/auth';
import { collection, getDocs, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const AdminNotificationsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    totalNotifications: 0,
    donationNotifications: 0,
    requestNotifications: 0,
    systemNotifications: 0,
  });

  useEffect(() => {
    fetchNotifications();
    
    // Real-time listener for notifications
    const unsubscribe = onSnapshot(
      query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(100)),
      () => {
        fetchNotifications();
      },
      (error) => console.error('Notifications listener error:', error)
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [searchQuery, filterType, notifications]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationsList = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate stats
      const donationNotifs = notificationsList.filter(n => n.type === 'donation' || n.title?.includes('Donation')).length;
      const requestNotifs = notificationsList.filter(n => n.type === 'request' || n.title?.includes('Request')).length;
      const systemNotifs = notificationsList.filter(n => n.type === 'system' || n.title?.includes('System')).length;
      
      setNotifications(notificationsList);
      setStats({
        totalNotifications: notificationsList.length,
        donationNotifications: donationNotifs,
        requestNotifications: requestNotifs,
        systemNotifications: systemNotifs,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterNotifications = () => {
    let result = [...notifications];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(notif => 
        (notif.title && notif.title.toLowerCase().includes(query)) ||
        (notif.body && notif.body.toLowerCase().includes(query)) ||
        (notif.type && notif.type.toLowerCase().includes(query))
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(notif => {
        if (filterType === 'donation') {
          return notif.type === 'donation' || notif.title?.includes('Donation');
        } else if (filterType === 'request') {
          return notif.type === 'request' || notif.title?.includes('Request');
        } else if (filterType === 'system') {
          return notif.type === 'system' || notif.title?.includes('System');
        }
        return true;
      });
    }
    
    setFilteredNotifications(result);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const sendBroadcastNotification = () => {
    Alert.prompt(
      'Broadcast Notification',
      'Enter notification message to send to all users',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message) => {
            if (!message || message.trim() === '') {
              Alert.alert('Error', 'Message cannot be empty');
              return;
            }
            
            try {
              await addDoc(collection(db, 'notifications'), {
                title: 'Admin Broadcast',
                body: message,
                type: 'system',
                broadcast: true,
                createdAt: serverTimestamp(),
                isRead: false,
              });
              
              Alert.alert('Success', 'Broadcast notification sent successfully');
              fetchNotifications();
            } catch (error) {
              console.error('Error sending notification:', error);
              Alert.alert('Error', 'Failed to send notification');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const deleteNotification = async (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'notifications', notificationId));
              Alert.alert('Success', 'Notification deleted successfully');
              fetchNotifications();
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Just now';
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'donation':
        return { name: 'water', color: '#e74c3c' };
      case 'request':
        return { name: 'medical', color: '#3498db' };
      case 'system':
        return { name: 'megaphone', color: '#f39c12' };
      default:
        return { name: 'notifications', color: '#95a5a6' };
    }
  };

  const getNotificationTypeChip = (type) => {
    const colors = {
      donation: '#e74c3c',
      request: '#3498db',
      system: '#f39c12',
    };
    
    return (
      <Chip 
        style={[styles.typeChip, { backgroundColor: colors[type] || '#95a5a6' }]}
        textStyle={styles.chipText}
      >
        {type || 'general'}
      </Chip>
    );
  };

  const renderNotificationItem = ({ item }) => {
    const iconConfig = getNotificationIcon(item.type);
    
    return (
      <Card style={styles.notificationCard}>
        <Card.Content style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '20' }]}>
              <Ionicons name={iconConfig.name} size={24} color={iconConfig.color} />
            </View>
            <View style={styles.notificationInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.notificationTitle} numberOfLines={1}>
                  {item.title || 'Notification'}
                </Text>
                {getNotificationTypeChip(item.type)}
              </View>
              <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => deleteNotification(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body || 'No message'}
          </Text>
          
          {item.broadcast && (
            <View style={styles.broadcastBadge}>
              <Ionicons name="radio-outline" size={14} color="#f39c12" />
              <Text style={styles.broadcastText}>Broadcast to all users</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{stats.totalNotifications}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#e74c3c' }]}>{stats.donationNotifications}</Text>
            <Text style={styles.statLabel}>Donations</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#3498db' }]}>{stats.requestNotifications}</Text>
            <Text style={styles.statLabel}>Requests</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#f39c12' }]}>{stats.systemNotifications}</Text>
            <Text style={styles.statLabel}>System</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Broadcast Button */}
      <TouchableOpacity 
        style={styles.broadcastButton}
        onPress={sendBroadcastNotification}
      >
        <Ionicons name="megaphone" size={20} color="#fff" />
        <Text style={styles.broadcastButtonText}>Send Broadcast Notification</Text>
      </TouchableOpacity>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#7f8c8d" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'donation' && styles.filterButtonActive]}
          onPress={() => setFilterType('donation')}
        >
          <Text style={[styles.filterButtonText, filterType === 'donation' && styles.filterButtonTextActive]}>
            Donations
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'request' && styles.filterButtonActive]}
          onPress={() => setFilterType('request')}
        >
          <Text style={[styles.filterButtonText, filterType === 'request' && styles.filterButtonTextActive]}>
            Requests
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'system' && styles.filterButtonActive]}
          onPress={() => setFilterType('system')}
        >
          <Text style={[styles.filterButtonText, filterType === 'system' && styles.filterButtonTextActive]}>
            System
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e74c3c']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#bdc3c7" />
              <Text style={styles.emptyText}>No notifications found</Text>
              <Text style={styles.emptySubText}>
                {searchQuery ? 'Try a different search term' : 'Notifications will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 2,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 2,
  },
  broadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f39c12',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 3,
  },
  broadcastButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  filterButtonText: {
    color: '#7f8c8d',
    fontWeight: '500',
    fontSize: 12,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  notificationCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  notificationContent: {
    paddingVertical: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  typeChip: {
    height: 24,
  },
  chipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notificationTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
  deleteButton: {
    padding: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  broadcastBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  broadcastText: {
    fontSize: 12,
    color: '#f39c12',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AdminNotificationsScreen;
