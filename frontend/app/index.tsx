import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import AuthScreen       from '../src/screens/AuthScreen';
import OnboardingScreen from '../src/screens/OnboardingScreen';
import TabNavigator     from '../src/navigation/TabNavigator';

import { API_URL } from '../src/apiConfig';

// IMPORTANT: We always render the same <View> wrapper so Expo Router's Stack
// never sees a component type change — this prevents the "next is not a function" error.

export default function Index() {
  const [screen, setScreen] = useState<'loading' | 'auth' | 'onboarding' | 'app'>('loading');

  useEffect(() => { checkSession(); }, []);

  async function checkSession() {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) { setScreen('auth'); return; }

      const res = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user = await res.json();
        setScreen(user.isOnboarded ? 'app' : 'onboarding');
      } else {
        // Invalid / expired token — clear it and show auth
        await SecureStore.deleteItemAsync('userToken');
        setScreen('auth');
      }
    } catch {
      // Network down — if token exists, go to app; otherwise auth
      const token = await SecureStore.getItemAsync('userToken');
      setScreen(token ? 'app' : 'auth');
    }
  }

  async function handleLoginSuccess(token: string) {
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const user = await res.json();
        setScreen(user.isOnboarded ? 'app' : 'onboarding');
      } else {
        setScreen('onboarding');
      }
    } catch {
      setScreen('onboarding');
    }
  }

  async function handleLogout() {
    await SecureStore.deleteItemAsync('userToken');
    setScreen('auth');
  }

  // Always render the SAME outer container — Expo Router sees a stable tree
  return (
    <View style={styles.root}>
      {screen === 'loading' && (
        <View style={styles.splash}>
          <Text style={styles.logo}>Flex<Text style={styles.accent}>AI</Text></Text>
          <ActivityIndicator color="#FF5722" style={{ marginTop: 24 }} />
        </View>
      )}

      {screen === 'auth' && (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {screen === 'onboarding' && (
        <OnboardingScreen
          onComplete={() => setScreen('app')}
          onLogout={handleLogout}
        />
      )}

      {screen === 'app' && (
        <TabNavigator onLogout={handleLogout} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#121212' },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo:   { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  accent: { color: '#FF5722' },
});
