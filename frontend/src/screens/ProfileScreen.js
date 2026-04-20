import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  SafeAreaView, StyleSheet, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { ACTIVITY_LEVELS, calculateBMR, calculateTDEE, getMacroTargets, calculateBMI } from '../utils/fitnessCalc';

import { API_URL } from '../apiConfig';

const GENDERS = [
  { key: 'male',   label: 'Male',   emoji: '♂️' },
  { key: 'female', label: 'Female', emoji: '♀️' },
  { key: 'other',  label: 'Other',  emoji: '⚧️' },
];

const GOALS = [
  { key: 'weight_loss',        label: 'Lose Weight',        emoji: '📉', desc: 'Caloric deficit' },
  { key: 'muscle_gain',        label: 'Build Muscle',       emoji: '💪', desc: 'Caloric surplus' },
  { key: 'maintenance',        label: 'Stay Fit',           emoji: '⚖️', desc: 'Maintain physique' },
  { key: 'body_recomposition', label: 'Body Recomp',        emoji: '🔄', desc: 'Lose fat & gain muscle' },
];

const WEEKLY_LOSS_OPTIONS = [
  { value: 0.25, label: '0.25 kg/week', badge: '🐢 Gentle',      desc: '~275 kcal/day deficit' },
  { value: 0.5,  label: '0.5 kg/week',  badge: '⚡ Recommended', desc: '~550 kcal/day deficit' },
  { value: 0.75, label: '0.75 kg/week', badge: '💪 Aggressive',  desc: '~825 kcal/day deficit' },
  { value: 1.0,  label: '1.0 kg/week',  badge: '🔥 Maximum',     desc: '~1100 kcal/day deficit' },
];

// All 4 options available for both weight_loss and body_recomposition

export default function ProfileScreen({ onSaved }) {
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [profile, setProfile]           = useState(null);

  const [name, setName]                 = useState('');
  const [age, setAge]                   = useState('');
  const [gender, setGender]             = useState('');
  const [weight, setWeight]             = useState('');
  const [height, setHeight]             = useState('');
  const [activityLevel, setActivity]    = useState('');
  const [goal, setGoal]                 = useState('');
  const [weeklyLossGoal, setWeeklyLoss] = useState(null);
  const [takesCreatine, setTakesCreatine] = useState(false);
  const [creatineDose, setCreatineDose]   = useState('5');

  const needsLossStep = goal === 'weight_loss' || goal === 'body_recomposition';
  const lossOptions   = WEEKLY_LOSS_OPTIONS; // all 4 options for both goals

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res   = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setName(data.name || '');
        setAge(data.profile?.age?.toString()    || '');
        setGender(data.profile?.gender          || '');
        setWeight(data.profile?.weight?.toString() || '');
        setHeight(data.profile?.height?.toString() || '');
        setActivity(data.profile?.activityLevel || '');
        setGoal(data.profile?.goal              || '');
        setWeeklyLoss(data.profile?.weeklyLossGoal ?? null);
        setTakesCreatine(!!data.profile?.takesCreatine);
        setCreatineDose(data.profile?.creatineDose?.toString() || '5');
      }
    } catch (e) {
      console.log('Profile fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res   = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          age:            parseInt(age),
          gender,
          weight:         parseFloat(weight),
          height:         parseFloat(height),
          activityLevel,
          goal,
          weeklyLossGoal: needsLossStep ? weeklyLossGoal : null,
          takesCreatine,
          creatineDose: takesCreatine ? parseFloat(creatineDose) : 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        Alert.alert('✅ Saved', 'Your profile has been updated.');
        if (typeof onSaved === 'function') onSaved(); // tell TabNavigator to refresh dashboard
      } else {
        Alert.alert('Error', data.message || 'Failed to save.');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  // Live calculation — updates instantly as user changes fields
  const getLiveStats = () => {
    const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age);
    if (!w || !h || !a || !gender || !activityLevel) return null;
    const bmr    = calculateBMR(w, h, a, gender);
    const tdee   = calculateTDEE(bmr, activityLevel);
    const macros = getMacroTargets(tdee, goal || 'maintenance', w,
      needsLossStep ? weeklyLossGoal : null);
    const bmi    = calculateBMI(w, h);
    return { bmr: Math.round(bmr), tdee, macros, bmi };
  };
  const liveStats = getLiveStats();

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator color="#FF5722" size="large" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Avatar Header ── */}
        <View style={s.header}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{name.charAt(0).toUpperCase() || '?'}</Text>
          </View>
          <Text style={s.headerName}>{name || 'Your Profile'}</Text>
          <Text style={s.headerEmail}>{profile?.email || ''}</Text>
        </View>

        {/* ── Live Stats Cards ── */}
        {liveStats && (
          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <Text style={s.statVal}>{liveStats.bmr}</Text>
              <Text style={s.statLbl}>BMR (kcal)</Text>
            </View>
            <View style={[s.statCard, { borderColor: '#FF5722' }]}>
              <Text style={[s.statVal, { color: '#FF5722' }]}>{liveStats.tdee}</Text>
              <Text style={s.statLbl}>TDEE (kcal)</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statVal}>{liveStats.bmi.bmi}</Text>
              <Text style={s.statLbl}>BMI ({liveStats.bmi.status})</Text>
            </View>
          </View>
        )}

        {/* ── Personal Info ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>PERSONAL INFO</Text>
          <Text style={s.fieldLabel}>Full Name</Text>
          <TextInput style={s.input} value={name} onChangeText={setName}
            placeholder="Your name" placeholderTextColor="#3F3F46" />
          <Text style={s.fieldLabel}>Age</Text>
          <TextInput style={s.input} value={age} onChangeText={setAge}
            placeholder="e.g. 24" placeholderTextColor="#3F3F46" keyboardType="numeric" />
          <Text style={s.fieldLabel}>Gender</Text>
          <View style={s.optionRow}>
            {GENDERS.map(g => (
              <TouchableOpacity key={g.key}
                style={[s.optionCard, gender === g.key && s.optionCardActive]}
                onPress={() => setGender(g.key)}>
                <Text>{g.emoji}</Text>
                <Text style={[s.optionLabel, gender === g.key && { color: '#FF5722' }]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Body Metrics ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>BODY METRICS</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Weight (kg)</Text>
              <TextInput style={s.input} value={weight} onChangeText={setWeight}
                placeholder="75" placeholderTextColor="#3F3F46" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Height (cm)</Text>
              <TextInput style={s.input} value={height} onChangeText={setHeight}
                placeholder="175" placeholderTextColor="#3F3F46" keyboardType="decimal-pad" />
            </View>
          </View>
        </View>

        {/* ── Activity Level ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ACTIVITY LEVEL</Text>
          {ACTIVITY_LEVELS.map(a => (
            <TouchableOpacity key={a.key}
              style={[s.listCard, activityLevel === a.key && s.listCardActive]}
              onPress={() => setActivity(a.key)}>
              <Text style={s.listEmoji}>{a.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.listLabel, activityLevel === a.key && { color: '#FF5722' }]}>{a.label}</Text>
                <Text style={s.listDesc}>{a.description}</Text>
              </View>
              {activityLevel === a.key && <Ionicons name="checkmark-circle" size={20} color="#FF5722" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Fitness Goal — 2×2 grid ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>FITNESS GOAL</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {GOALS.map(g => (
              <TouchableOpacity key={g.key}
                style={[s.goalCard, goal === g.key && s.optionCardActive]}
                onPress={() => {
                  setGoal(g.key);
                  // Clear weekly loss if switching to non-deficit goal
                  if (g.key !== 'weight_loss' && g.key !== 'body_recomposition') {
                    setWeeklyLoss(null);
                  }
                }}>
                <Text style={{ fontSize: 26 }}>{g.emoji}</Text>
                <Text style={[s.goalLabel, goal === g.key && { color: '#FF5722' }]}>{g.label}</Text>
                <Text style={s.goalDesc}>{g.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Weekly Loss Target (conditional) ── */}
        {needsLossStep && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>WEEKLY WEIGHT LOSS TARGET</Text>
            <Text style={s.subLabel}>How much weight do you want to lose per week?</Text>
            {lossOptions.map(opt => (
              <TouchableOpacity key={opt.value}
                style={[s.listCard, weeklyLossGoal === opt.value && s.listCardActive]}
                onPress={() => setWeeklyLoss(opt.value)}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <Text style={[s.listLabel, weeklyLossGoal === opt.value && { color: '#FF5722' }]}>
                      {opt.label}
                    </Text>
                    <View style={{
                      backgroundColor: weeklyLossGoal === opt.value ? '#FF5722' : '#27272A',
                      borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{opt.badge}</Text>
                    </View>
                  </View>
                  <Text style={s.listDesc}>{opt.desc}</Text>
                </View>
                {weeklyLossGoal === opt.value && <Ionicons name="checkmark-circle" size={20} color="#FF5722" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Macro Targets Preview ── */}
        {liveStats && (
          <View style={s.macroCard}>
            <Text style={s.sectionTitle}>YOUR DAILY TARGETS</Text>
            {needsLossStep && weeklyLossGoal && (
              <Text style={{ color: '#A1A1AA', fontSize: 12, marginBottom: 10 }}>
                TDEE {liveStats.tdee} − {Math.round((weeklyLossGoal * 7700) / 7)} deficit
                = {liveStats.macros.calories} kcal/day
              </Text>
            )}
          </View>
        )}

        {/* ── Supplements & Hydration ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SUPPLEMENTS & HYDRATION</Text>
          <View style={[s.listCard, { borderStyle: 'dashed', backgroundColor: '#161616' }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.listLabel}>Take Creatine?</Text>
              <Text style={s.listDesc}>Increases performance & hydration needs</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setTakesCreatine(!takesCreatine)}
              style={[s.toggleBtn, takesCreatine && s.toggleBtnActive]}
            >
              <Text style={[s.toggleTxt, takesCreatine && { color: '#fff' }]}>{takesCreatine ? 'YES' : 'NO'}</Text>
            </TouchableOpacity>
          </View>

          {takesCreatine && (
            <View style={{ marginTop: 10 }}>
              <Text style={s.fieldLabel}>Daily Dose (grams)</Text>
              <TextInput 
                style={s.input} 
                value={creatineDose} 
                onChangeText={setCreatineDose}
                keyboardType="numeric" 
                placeholder="5" 
                placeholderTextColor="#3F3F46" 
              />
            </View>
          )}

          {weight && (
            <View style={[s.macroCard, { borderColor: '#60A5FA33', marginTop: 10 }]}>
              <Text style={[s.listLabel, { color: '#60A5FA', textAlign: 'center' }]}>💧 Personalized Water Goal</Text>
              <Text style={[s.statVal, { fontSize: 24, textAlign: 'center', marginTop: 4 }]}>
                {((parseFloat(weight) * 35 + (activityLevel ? {sedentary:0, lightly_active:350, moderately_active:700, very_active:1000, extremely_active:1500}[activityLevel] : 0) + (takesCreatine ? (parseFloat(creatineDose) || 0) * 100 : 0)) / 1000).toFixed(1)} L / day
              </Text>
              <Text style={[s.listDesc, { textAlign: 'center' }]}>Based on weight, activity, and supplements</Text>
            </View>
          )}
        </View>

        {/* ── Save ── */}
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnText}>💾  Save Profile</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const MacroChip = ({ label, value, color }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text style={{ color, fontSize: 18, fontWeight: '800' }}>{value}</Text>
    <Text style={{ color: '#A1A1AA', fontSize: 11, marginTop: 2 }}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#121212' },
  scroll:     { padding: 20, paddingBottom: 60 },

  header:       { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FF5722', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:   { color: '#fff', fontSize: 32, fontWeight: '900' },
  headerName:   { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerEmail:  { color: '#A1A1AA', fontSize: 13, marginTop: 4 },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:  { flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', borderRadius: 14, padding: 12, alignItems: 'center' },
  statVal:   { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLbl:   { color: '#A1A1AA', fontSize: 10, marginTop: 4, textAlign: 'center' },

  section:      { marginBottom: 20 },
  sectionTitle: { color: '#FF5722', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  subLabel:     { color: '#A1A1AA', fontSize: 13, marginBottom: 12, marginTop: -6 },
  fieldLabel:   { color: '#A1A1AA', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  input:        { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 14 },

  optionRow:      { flexDirection: 'row', gap: 10 },
  optionCard:     { flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', gap: 6 },
  optionCardActive: { borderColor: '#FF5722', backgroundColor: '#1E1210' },
  optionLabel:    { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },

  // 2×2 goal grid
  goalCard:  { width: '47%', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  goalLabel: { color: '#A1A1AA', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  goalDesc:  { color: '#52525B', fontSize: 10, textAlign: 'center' },

  listCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', borderRadius: 12, padding: 14, gap: 12, marginBottom: 8 },
  listCardActive: { borderColor: '#FF5722', backgroundColor: '#1E1210' },
  listEmoji:      { fontSize: 22 },
  listLabel:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  listDesc:       { color: '#A1A1AA', fontSize: 11, marginTop: 2 },

  macroCard: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', borderRadius: 16, padding: 16, marginBottom: 20 },
  macroRow:  { flexDirection: 'row', marginTop: 12 },

  saveBtn:    { backgroundColor: '#FF5722', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText:{ color: '#fff', fontWeight: '800', fontSize: 16 },

  toggleBtn: { backgroundColor: '#27272A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  toggleBtnActive: { backgroundColor: '#FF5722' },
  toggleTxt: { color: '#A1A1AA', fontSize: 12, fontWeight: '800' },
});
