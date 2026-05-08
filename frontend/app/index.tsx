import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as storage from '../src/utils/storage';

import AuthScreen from '../src/screens/AuthScreen';
import OnboardingScreen from '../src/screens/OnboardingScreen';
import TabNavigator from '../src/navigation/TabNavigator';

import { API_URL } from '../src/apiConfig';

export default function Index() {
  const [screen, setScreen] = useState('loading');

  useEffect(() => { checkSession(); }, []);

  async function checkSession() {
    try {
      const token = await storage.getItem('userToken');
      if (!token) { setScreen('auth'); return; }

      const res = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user = await res.json();
        if (!user.isVerified) {
          await storage.deleteItem('userToken');
          setScreen('auth');
          return;
        }
        setScreen(user.isOnboarded ? 'app' : 'onboarding');
      } else {
        await storage.deleteItem('userToken');
        setScreen('auth');
      }
    } catch (e) {
      setScreen('auth');
    }
  }

  const handleLoginSuccess = (token: any, user: any) => {
    if (user && user.isVerified === false) {
      setScreen('auth');
    } else {
      setScreen(user?.isOnboarded ? 'app' : 'onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    setScreen('app');
  };

  const handleLogout = async () => {
    await storage.deleteItem('userToken');
    setScreen('auth');
  };

  if (screen === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.logo}>FLEX<Text style={styles.accent}>AI</Text></Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {screen === 'auth' && (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}
      {screen === 'onboarding' && (
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
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
  root: { flex: 1, backgroundColor: '#0C0C0C' },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0C0C0C' },
  logo: { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  accent: { color: '#FF5722' },
});
