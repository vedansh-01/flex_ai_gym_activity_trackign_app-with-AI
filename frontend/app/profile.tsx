import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileScreen from '../src/screens/ProfileScreen';
import { useRouter } from 'expo-router';
import * as storage from '../src/utils/storage';
import { theme } from '../src/theme/theme';

export default function ProfileRoute() {
  const router = useRouter();

  const handleLogout = async () => {
    await storage.deleteItem('userToken');
    router.replace('/(auth)');
  };

  return (
    <View style={s.container}>
      <View style={s.profileHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-down" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.profileTitle}>My Profile</Text>
        <View style={{ width: 44 }} />
      </View>
      <ProfileScreen onSaved={() => router.back()} onLogout={handleLogout} />
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: theme.colors.background },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  profileTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
});
