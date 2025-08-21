import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Card, Chip, Menu, Divider } from 'react-native-paper';
import { db } from '../../services/auth';
import { collection, getDocs, doc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const AdminUserManagementScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterType, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isAdmin: doc.data().isAdmin || false,
        isActive: doc.data().isActive !== false, // default to true if not set
      }));
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    let result = [...users];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.phone && user.phone.includes(query))
      );
    }
    
    // Apply type filter
    if (filterType === 'admin') {
      result = result.filter(user => user.isAdmin);
    } else if (filterType === 'active') {
      result = result.filter(user => user.isActive);
    } else if (filterType === 'inactive') {
      result = result.filter(user => !user.isActive);
    }
    
    setFilteredUsers(result);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const toggleUserStatus = async (user) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isActive: !user.isActive
      });
      
      // Update local state
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      );
      
      setUsers(updatedUsers);
      Alert.alert('Success', `User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const toggleAdminStatus = async (user) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isAdmin: !user.isAdmin
      });
      
      // Update local state
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u
      );
      
      setUsers(updatedUsers);
      Alert.alert('Success', `Admin privileges ${user.isAdmin ? 'removed' : 'granted'}`);
    } catch (error) {
      console.error('Error toggling admin status:', error);
      Alert.alert('Error', 'Failed to update admin status');
    }
  };

  const deleteUser = async (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name || user.email || 'this user'}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userRef = doc(db, 'users', user.id);
              await deleteDoc(userRef);
              
              // Update local state
              const updatedUsers = users.filter(u => u.id !== user.id);
              setUsers(updatedUsers);
              
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  const showMenu = (user) => {
    setSelectedUser(user);
    setMenuVisible(true);
  };

  const hideMenu = () => {
    setMenuVisible(false);
  };

  const renderUserItem = ({ item }) => (
    <Card style={styles.userCard}>
      <Card.Content style={styles.userCardContent}>
        <View style={styles.userInfo}>
          <View style={styles.userIconContainer}>
            <Ionicons name="person-circle" size={40} color="#e74c3c" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name || 'No Name'}</Text>
            <Text style={styles.userEmail}>{item.email || 'No Email'}</Text>
            <Text style={styles.userPhone}>{item.phone || 'No Phone'}</Text>
            
            <View style={styles.chipContainer}>
              {item.bloodGroup && (
                <Chip 
                  style={styles.bloodGroupChip}
                  textStyle={styles.chipText}
                >
                  {item.bloodGroup}
                </Chip>
              )}
              
              {item.isAdmin && (
                <Chip 
                  style={styles.adminChip}
                  textStyle={styles.chipText}
                >
                  Admin
                </Chip>
              )}
              
              <Chip 
                style={item.isActive ? styles.activeChip : styles.inactiveChip}
                textStyle={styles.chipText}
              >
                {item.isActive ? 'Active' : 'Inactive'}
              </Chip>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => showMenu(item)}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#7f8c8d" />
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>User Management</Text>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email or phone"
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
          style={[styles.filterButton, filterType === 'admin' && styles.filterButtonActive]}
          onPress={() => setFilterType('admin')}
        >
          <Text style={[styles.filterButtonText, filterType === 'admin' && styles.filterButtonTextActive]}>
            Admins
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'active' && styles.filterButtonActive]}
          onPress={() => setFilterType('active')}
        >
          <Text style={[styles.filterButtonText, filterType === 'active' && styles.filterButtonTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, filterType === 'inactive' && styles.filterButtonActive]}
          onPress={() => setFilterType('inactive')}
        >
          <Text style={[styles.filterButtonText, filterType === 'inactive' && styles.filterButtonTextActive]}>
            Inactive
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e74c3c" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={60} color="#bdc3c7" />
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubText}>
                {searchQuery ? 'Try a different search term' : 'Add users to get started'}
              </Text>
            </View>
          }
        />
      )}
      
      {selectedUser && (
        <Menu
          visible={menuVisible}
          onDismiss={hideMenu}
          anchor={{ x: 0, y: 0 }}
          style={styles.menu}
        >
          <Menu.Item
            onPress={() => {
              hideMenu();
              toggleUserStatus(selectedUser);
            }}
            title={selectedUser.isActive ? "Deactivate User" : "Activate User"}
            leadingIcon={selectedUser.isActive ? "close-circle" : "checkmark-circle"}
          />
          <Menu.Item
            onPress={() => {
              hideMenu();
              toggleAdminStatus(selectedUser);
            }}
            title={selectedUser.isAdmin ? "Remove Admin Rights" : "Make Admin"}
            leadingIcon={selectedUser.isAdmin ? "person" : "person-add"}
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              hideMenu();
              deleteUser(selectedUser);
            }}
            title="Delete User"
            leadingIcon="trash"
            titleStyle={{ color: '#e74c3c' }}
          />
        </Menu>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#e74c3c',
  },
  filterButtonText: {
    color: '#7f8c8d',
    fontWeight: '500',
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
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  userCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  userIconContainer: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  bloodGroupChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#3498db',
  },
  adminChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#f39c12',
  },
  activeChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#2ecc71',
  },
  inactiveChip: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#95a5a6',
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
  },
  menuButton: {
    padding: 5,
  },
  menu: {
    marginTop: 50,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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

export default AdminUserManagementScreen;
