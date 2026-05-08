import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen    from '../screens/DashboardScreen';
import WorkoutLoggerScreen from '../screens/WorkoutLoggerScreen';
import NutritionScreen    from '../screens/NutritionScreen';
import AnalyticsScreen    from '../screens/AnalyticsScreen';
import CoachScreen        from '../screens/CoachScreen';
import ProfileScreen      from '../screens/ProfileScreen';

const TABS = [
  { key: 'dashboard',  label: 'Home',     icon: 'home-outline',                iconActive: 'home' },
  { key: 'workout',    label: 'Workout',  icon: 'barbell-outline',             iconActive: 'barbell' },
  { key: 'nutrition',  label: 'Nutrition',icon: 'restaurant-outline',          iconActive: 'restaurant' },
  { key: 'coach',      label: 'AI Coach', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
];

export default function TabNavigator({ onLogout }) {
  const [activeTab, setActiveTab]         = useState('dashboard');
  const [showProfile, setShowProfile]     = useState(false);
  // Increment this any time the dashboard should re-fetch (tab switch or profile close)
  const [dashRefreshKey, setDashRefreshKey] = useState(0);

  const goToTab = useCallback((key) => {
    setActiveTab(key);
    // Always re-fetch dashboard data when switching back to it
    if (key === 'dashboard') setDashRefreshKey(k => k + 1);
  }, []);

  const openProfile = useCallback(() => setShowProfile(true), []);

  const closeProfile = useCallback(() => {
    setShowProfile(false);
    // Dashboard must re-fetch after profile changes
    setDashRefreshKey(k => k + 1);
  }, []);

  // Profile slides over entire app as a modal-like layer
  if (showProfile) {
    return (
      <View style={s.container}>
        <View style={s.profileHeader}>
          <TouchableOpacity style={s.backBtn} onPress={closeProfile}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.profileTitle}>My Profile</Text>
          <View style={{ width: 44 }} />
        </View>
        <ProfileScreen onSaved={() => setDashRefreshKey(k => k + 1)} onLogout={onLogout} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        // key={dashRefreshKey} forces a full remount every time the dashboard needs fresh data
        return <DashboardScreen key={dashRefreshKey} onOpenProfile={openProfile} />;
      case 'workout':   return <WorkoutLoggerScreen />;
      case 'nutrition': return <NutritionScreen />;
      case 'coach':     return <CoachScreen onBack={() => goToTab('dashboard')} />;
      default:          return <DashboardScreen key={dashRefreshKey} onOpenProfile={openProfile} />;
    }
  };

  return (
    <View style={s.container}>
      <View style={s.screenArea}>
        {renderScreen()}
      </View>

      {/* ── Bottom Tab Bar (HIDDEN ON COACH SCREEN TO FIX KEYBOARD BUGS) ── */}
      {activeTab !== 'coach' && (
        <View style={s.tabBar}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={s.tabItem}
                onPress={() => goToTab(tab.key)}
                activeOpacity={0.7}
              >
                {isActive && <View style={s.activeDot} />}
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={22}
                  color={isActive ? '#FF5722' : '#52525B'}
                />
                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#121212' },
  screenArea: { flex: 1 },

  profileHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    backgroundColor: '#0E0E0E',
    borderBottomWidth: 1, borderBottomColor: '#1F1F1F',
  },
  backBtn:      { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  profileTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E0E0E',
    borderTopWidth: 1, borderTopColor: '#1F1F1F',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10, paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 4, position: 'relative', paddingTop: 6,
  },
  activeDot: {
    position: 'absolute', top: 0,
    width: 20, height: 3, borderRadius: 2, backgroundColor: '#FF5722',
  },
  tabLabel:       { fontSize: 10, color: '#52525B', fontWeight: '500' },
  tabLabelActive: { color: '#FF5722', fontWeight: '700' },
});
