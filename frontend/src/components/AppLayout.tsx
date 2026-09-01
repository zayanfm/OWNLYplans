// frontend/src/components/AppLayout.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MOCK_APP_CONFIG, AppConfig } from '../constants/appConfig';
import { API_BASE_URL } from '../constants/appConfig';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [config, setConfig] = useState<AppConfig>(MOCK_APP_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch live configuration from backend API
    fetch(`${API_BASE_URL}/api/config`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.theme) {
          setConfig((prev) => ({
            ...prev,
            appName: data.appName || prev.appName,
          }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Backend unavailable, using fallback config:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D81E05" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.outerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F4F0" />
      <View style={styles.mobileFrame}>
        {/* Dynamic Island Simulation */}
        <View style={styles.dynamicIsland} />
        
        {/* Main Content View */}
        <View style={styles.contentArea}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F4F0',
  },
  mobileFrame: {
    width: width > 400 ? 390 : '100%',
    flex: 1,
    backgroundColor: '#F5F4F0',
    borderRadius: width > 400 ? 40 : 0,
    overflow: 'hidden',
    position: 'relative',
  },
  dynamicIsland: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    width: 120,
    height: 36,
    backgroundColor: '#000000',
    borderRadius: 20,
    zIndex: 200,
  },
  contentArea: {
    flex: 1,
    marginTop: 54, // Space for simulated status bar / island
  },
});