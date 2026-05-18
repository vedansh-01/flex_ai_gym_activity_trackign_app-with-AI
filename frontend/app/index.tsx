import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as storage from '../src/utils/storage';
import { useRouter } from 'expo-router';
import { API_URL } from '../src/config/apiConfig';
import { theme } from '../src/theme/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const token = await storage.getItem('userToken');
      if (!token) {
        router.replace('/(auth)');
        return;
      }

      const res = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const user = await res.json();
        if (!user.isVerified) {
          await storage.deleteItem('userToken');
          router.replace('/(auth)');
          return;
        }
        
        if (user.isOnboarded) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/onboarding');
        }
      } else {
        await storage.deleteItem('userToken');
        router.replace('/(auth)');
      }
    } catch (e) {
      router.replace('/(auth)');
    }
  }

  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.logo}>FLEX<Text style={styles.accent}>AI</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  logo: { color: theme.colors.text, fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  accent: { color: theme.colors.primary },
});
