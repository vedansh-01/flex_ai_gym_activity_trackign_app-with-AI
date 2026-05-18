import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.emoji}>📈</Text>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Coming in Week 4 — deep progress{'\n'}graphs & trend analysis.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  subtitle: { color: '#A1A1AA', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
