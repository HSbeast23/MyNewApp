// src/screens/NotificationDiagnosticsScreen.js
import React from 'react';
import { SafeAreaView, StatusBar, View, StyleSheet } from 'react-native';
import NotificationDiagnostics from '../components/NotificationDiagnostics';

export default function NotificationDiagnosticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.content}>
        <NotificationDiagnostics />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
});
