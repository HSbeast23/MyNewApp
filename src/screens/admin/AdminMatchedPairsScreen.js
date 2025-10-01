import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { db } from '../../services/auth';
import { collection, getDocs, doc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const AdminMatchedPairsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [filteredPairs, setFilteredPairs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMatchedPairs();
    
    // Real-time listener for Bloodreceiver (where matches are stored)
    const unsubscribeRequests = onSnapshot(
      collection(db, 'Bloodreceiver'),
      () => {
        console.log('Bloodreceiver collection updated, refreshing matched pairs...');
        fetchMatchedPairs();
      },
      (error) => console.error('Bloodreceiver listener error:', error)
    );

    return () => {
      unsubscribeRequests();
    };
  }, []);

  useEffect(() => {
    filterPairs();
  }, [searchQuery, filterStatus, matchedPairs]);

  const fetchMatchedPairs = async () => {
    try {
      setLoading(true);
      console.log('Fetching matched pairs...');
      
      // Fetch all blood requests from Bloodreceiver collection
      const requestsSnapshot = await getDocs(collection(db, 'Bloodreceiver'));
      const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('Bloodreceiver documents fetched:', requests.length);
      
      // Find matched pairs from responses array in Bloodreceiver
      const pairs = [];
      
      requests.forEach(request => {
        // Check if request has responses array
        if (request.responses && request.responses.length > 0) {
          // Filter only accepted responses
          const acceptedResponses = request.responses.filter(r => r.status === 'accepted');
          
          acceptedResponses.forEach((response, index) => {
            pairs.push({
              id: `${request.id}-${response.donorUid || index}`,
              requestId: request.id,
              donorUid: response.donorUid,
              request: request,
              response: response,
              donorName: response.donorName || 'Unknown Donor',
              donorMobile: response.donorMobile || 'N/A',
              donorBloodGroup: response.donorBloodGroup || request.bloodGroup,
              donorCity: response.donorCity || request.city,
              receiverName: request.name || 'Unknown Receiver',
              receiverMobile: request.mobile || 'N/A',
              bloodGroup: request.bloodGroup,
              bloodUnits: request.bloodUnits || '1',
              purpose: request.purpose || 'Medical need',
              hospital: request.hospital || 'Not specified',
              city: request.city,
              status: request.status === 'completed' || request.status === 'fulfilled' ? 'completed' : 'active',
              matchedAt: response.respondedAt || request.createdAt,
            });
          });
        }
      });
      
      // Sort by matched date (most recent first)
      pairs.sort((a, b) => {
        const dateA = a.matchedAt?.toDate?.() || new Date(0);
        const dateB = b.matchedAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      console.log('Matched pairs found:', pairs.length);
      setMatchedPairs(pairs);
    } catch (error) {
      console.error('Error fetching matched pairs:', error);
      Alert.alert('Error', 'Failed to load matched pairs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPairs = () => {
    let result = [...matchedPairs];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(pair => 
        (pair.donorName && pair.donorName.toLowerCase().includes(query)) ||
        (pair.receiverName && pair.receiverName.toLowerCase().includes(query)) ||
        (pair.bloodGroup && pair.bloodGroup.includes(query)) ||
        (pair.city && pair.city.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(pair => pair.status === filterStatus);
    }
    
    setFilteredPairs(result);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMatchedPairs();
  };

  const markAsCompleted = async (pair) => {
    Alert.alert(
      'Mark as Completed',
      `Mark this matched pair as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              console.log('Marking as completed:', pair.id);
              
              // Update request status to completed
              await updateDoc(doc(db, 'Bloodreceiver', pair.requestId), {
                status: 'completed'
              });
              
              Alert.alert('Success', 'Matched pair marked as completed');
              fetchMatchedPairs();
            } catch (error) {
              console.error('Error updating pair:', error);
              Alert.alert('Error', 'Failed to update matched pair');
            }
          }
        }
      ]
    );
  };

  const unmatchPair = async (pair) => {
    Alert.alert(
      'Unmatch Pair',
      `Are you sure you want to unmatch this donor and receiver?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Unmatching pair:', pair.id);
              
              // Get the request document
              const requestRef = doc(db, 'Bloodreceiver', pair.requestId);
              const requestDoc = await getDocs(query(collection(db, 'Bloodreceiver'), where('__name__', '==', pair.requestId)));
              
              if (requestDoc.empty) {
                Alert.alert('Error', 'Request not found');
                return;
              }
              
              const requestData = requestDoc.docs[0].data();
              
              // Remove the specific response from responses array
              const updatedResponses = requestData.responses.filter(
                r => r.donorUid !== pair.donorUid
              );
              
              // Update request with filtered responses and set status back to pending
              await updateDoc(requestRef, {
                responses: updatedResponses,
                status: updatedResponses.length > 0 ? 'accepted' : 'pending',
                respondedBy: updatedResponses.length > 0 ? updatedResponses[updatedResponses.length - 1].donorName : null,
              });
              
              await updateDoc(doc(db, 'bloodRequests', pair.requestId), {
                matchedDonationId: null,
                status: 'pending',
                matchedAt: null,
              });
              
              Alert.alert('Success', 'Pair unmatched successfully');
              fetchMatchedPairs();
            } catch (error) {
              console.error('Error unmatching pair:', error);
              Alert.alert('Error', 'Failed to unmatch pair');
            }
          }
        }
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPairItem = ({ item }) => (
    <Card style={styles.pairCard}>
      <Card.Content>
        {/* Header */}
        <View style={styles.pairHeader}>
          <View style={styles.bloodGroupBadge}>
            <MaterialCommunityIcons name="blood-bag" size={20} color="#fff" />
            <Text style={styles.bloodGroupText}>{item.bloodGroup}</Text>
          </View>
          <Chip 
            style={item.status === 'completed' ? styles.completedChip : styles.activeChip}
            textStyle={styles.chipText}
          >
            {item.status === 'completed' ? '✓ Completed' : '⚡ Active'}
          </Chip>
        </View>

        {/* Donor Info */}
        <View style={styles.personCard}>
          <View style={styles.personHeader}>
            <Ionicons name="person" size={20} color="#e74c3c" />
            <Text style={styles.personLabel}>DONOR</Text>
          </View>
          <Text style={styles.personName}>{item.donorName || 'Anonymous'}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color="#7f8c8d" />
            <Text style={styles.detailText}>{item.donorMobile || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color="#7f8c8d" />
            <Text style={styles.detailText}>{item.donorCity || 'N/A'}</Text>
          </View>
        </View>

        {/* Connection Line */}
        <View style={styles.connectionLine}>
          <View style={styles.dashedLine} />
          <MaterialCommunityIcons name="link-variant" size={24} color="#2ecc71" />
          <View style={styles.dashedLine} />
        </View>

        {/* Receiver Info */}
        <View style={styles.personCard}>
          <View style={styles.personHeader}>
            <MaterialCommunityIcons name="hospital-box" size={20} color="#3498db" />
            <Text style={styles.personLabel}>RECEIVER</Text>
          </View>
          <Text style={styles.personName}>{item.receiverName || 'Anonymous'}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color="#7f8c8d" />
            <Text style={styles.detailText}>{item.receiverMobile || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color="#7f8c8d" />
            <Text style={styles.detailText}>{item.city || 'N/A'}</Text>
          </View>
          {item.purpose && (
            <View style={styles.detailRow}>
              <Ionicons name="information-circle-outline" size={14} color="#7f8c8d" />
              <Text style={styles.detailText}>{item.purpose}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.pairFooter}>
          <Text style={styles.matchedDate}>Matched: {formatDate(item.matchedAt)}</Text>
          <View style={styles.actionButtons}>
            {item.status !== 'completed' && (
              <TouchableOpacity 
                style={[styles.actionBtn, styles.completeBtn]}
                onPress={() => markAsCompleted(item)}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#2ecc71" />
                <Text style={[styles.actionBtnText, { color: '#2ecc71' }]}>Complete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.actionBtn, styles.unmatchBtn]}
              onPress={() => unmatchPair(item)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#e74c3c" />
              <Text style={[styles.actionBtnText, { color: '#e74c3c' }]}>Unmatch</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={styles.statNumber}>{matchedPairs.length}</Text>
            <Text style={styles.statLabel}>Total Matches</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#f39c12' }]}>
              {matchedPairs.filter(p => p.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <Text style={[styles.statNumber, { color: '#2ecc71' }]}>
              {matchedPairs.filter(p => p.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by donor, receiver, blood group, or city"
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
          style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'all' && styles.filterButtonTextActive]}>
            All ({matchedPairs.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'active' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('active')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'active' && styles.filterButtonTextActive]}>
            Active ({matchedPairs.filter(p => p.status === 'active').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterStatus === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[styles.filterButtonText, filterStatus === 'completed' && styles.filterButtonTextActive]}>
            Completed ({matchedPairs.filter(p => p.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Matched Pairs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Loading matched pairs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPairs}
          renderItem={renderPairItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#e74c3c']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="link-variant-off" size={60} color="#bdc3c7" />
              <Text style={styles.emptyText}>No matched pairs found</Text>
              <Text style={styles.emptySubText}>
                {searchQuery ? 'Try a different search term' : 'Matched pairs will appear here'}
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
    marginHorizontal: 4,
    elevation: 2,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  statLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 4,
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
    height: 45,
    fontSize: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
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
    fontSize: 13,
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
  pairCard: {
    marginBottom: 16,
    elevation: 3,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  pairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bloodGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bloodGroupText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
  completedChip: {
    backgroundColor: '#2ecc71',
  },
  activeChip: {
    backgroundColor: '#f39c12',
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  personCard: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  personLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  connectionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderStyle: 'dashed',
  },
  pairFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  matchedDate: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  completeBtn: {
    backgroundColor: '#d5f4e6',
  },
  unmatchBtn: {
    backgroundColor: '#fadbd8',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
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

export default AdminMatchedPairsScreen;
