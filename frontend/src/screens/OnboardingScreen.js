import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  SafeAreaView, ScrollView, StyleSheet, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { ACTIVITY_LEVELS, calculateBMR, calculateTDEE, calculateWaterGoal } from '../utils/fitnessCalc';

import { API_URL } from '../apiConfig';

const GENDERS = [
  { key: 'male',   label: 'Male',   emoji: '♂️' },
  { key: 'female', label: 'Female', emoji: '♀️' },
  { key: 'other',  label: 'Other',  emoji: '⚧️' },
];

const GOALS = [
  { key: 'weight_loss',        label: 'Lose Weight',        emoji: '📉', desc: 'Burn fat, caloric deficit' },
  { key: 'muscle_gain',        label: 'Build Muscle',       emoji: '💪', desc: 'Caloric surplus, high protein' },
  { key: 'maintenance',        label: 'Stay Fit',           emoji: '⚖️', desc: 'Maintain current physique' },
  { key: 'body_recomposition', label: 'Body Recomposition', emoji: '🔄', desc: 'Lose fat & gain muscle simultaneously' },
];

const WEEKLY_LOSS_OPTIONS = [
  { value: 0.25, label: '0.25 kg / week', badge: '🐢 Gentle',       desc: '~275 kcal/day deficit — sustainable' },
  { value: 0.5,  label: '0.5 kg / week',  badge: '⚡ Recommended',  desc: '~550 kcal/day deficit — standard' },
  { value: 0.75, label: '0.75 kg / week', badge: '💪 Aggressive',   desc: '~825 kcal/day deficit — challenging' },
  { value: 1.0,  label: '1.0 kg / week',  badge: '🔥 Max',          desc: '~1100 kcal/day deficit — very demanding' },
];

// Same 4 options for both weight_loss and body_recomposition

const BASE_STEPS = ['Personal', 'Body', 'Activity', 'Goal', 'Supps'];

export default function OnboardingScreen({ onComplete, onLogout }) {
  const [step, setStep]               = useState(0);
  const [saving, setSaving]           = useState(false);
  const [age, setAge]                 = useState('');
  const [gender, setGender]           = useState('');
  const [weight, setWeight]           = useState('');
  const [height, setHeight]           = useState('');
  const [activityLevel, setActivity]  = useState('');
  const [goal, setGoal]               = useState('');
  const [weeklyLossGoal, setWeeklyLoss] = useState(null);
  const [takesCreatine, setTakesCreatine] = useState(false);
  const [creatineDose, setCreatineDose]   = useState('5');

  const needsLossStep = goal === 'weight_loss' || goal === 'body_recomposition';
  const STEPS = needsLossStep ? [...BASE_STEPS, 'Target'] : BASE_STEPS;
  const totalSteps = STEPS.length;

  const goNext = () => {
    if (step === 0) {
      if (!age || parseInt(age) < 10 || parseInt(age) > 100) {
        Alert.alert('Invalid Age', 'Enter a valid age (10–100).'); return;
      }
      if (!gender) { Alert.alert('Required', 'Please select your gender.'); return; }
    }
    if (step === 1) {
      if (!weight || parseFloat(weight) < 30) {
        Alert.alert('Invalid Weight', 'Enter a valid weight in kg.'); return;
      }
      if (!height || parseFloat(height) < 100) {
        Alert.alert('Invalid Height', 'Enter a valid height in cm.'); return;
      }
    }
    if (step === 2 && !activityLevel) {
      Alert.alert('Required', 'Please select your activity level.'); return;
    }
    if (step === 3) {
      if (!goal) { Alert.alert('Required', 'Please select your fitness goal.'); return; }
      if (needsLossStep) { setStep(4); return; } // go to weekly target step
      setStep(needsLossStep ? 5 : 4); return; // skip target if not needed
    }
    if (step === 4 && needsLossStep) {
      if (!weeklyLossGoal) { Alert.alert('Required', 'Please select your weekly target.'); return; }
      setStep(5); return;
    }
    if (step === (needsLossStep ? 5 : 4)) {
      handleSubmit(); return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          age: parseInt(age),
          gender,
          weight: parseFloat(weight),
          height: parseFloat(height),
          activityLevel,
          goal,
          weeklyLossGoal: weeklyLossGoal || null,
          takesCreatine,
          creatineDose: takesCreatine ? parseFloat(creatineDose) : 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Server error' }));
        console.error('Profile save failed:', err.message);
        // Still proceed — user can fix in Profile screen later
      } else {
        const saved = await res.json();
        console.log('✅ Profile saved:', saved.profile?.tdee, 'kcal TDEE');
      }
    } catch (e) {
      console.error('Onboarding network error:', e.message);
    } finally {
      setSaving(false);
      if (typeof onComplete === 'function') onComplete();
    }
  };

  const previewTDEE = () => {
    if (!weight || !height || !age || !gender || !activityLevel) return null;
    const bmr = calculateBMR(parseFloat(weight), parseFloat(height), parseInt(age), gender);
    return calculateTDEE(bmr, activityLevel);
  };

  const lossOptions = WEEKLY_LOSS_OPTIONS; // all 4 options for both goals

  return (
    <SafeAreaView style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Top bar */}
        <View style={s.topBar}>
          <Text style={s.logo}>Flex<Text style={{ color: '#fff' }}>AI</Text></Text>
          <TouchableOpacity onPress={onLogout} style={s.signOutBtn}>
            <Text style={s.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        <View style={s.progressRow}>
          {STEPS.map((label, i) => (
            <View key={i} style={{ alignItems: 'center', flexDirection: 'row' }}>
              <View style={[s.dot, i <= step && s.dotActive]}>
                {i < step
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <Text style={{ color: i <= step ? '#fff' : '#52525B', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                }
              </View>
              {i < STEPS.length - 1 && <View style={[s.line, i < step && s.lineActive]} />}
            </View>
          ))}
        </View>
        <View style={s.stepLabelRow}>
          {STEPS.map((label, i) => (
            <Text key={i} style={[s.stepLabel, i === step && s.stepLabelActive]}>{label}</Text>
          ))}
        </View>

        {/* ── Step 0: Personal ── */}
        {step === 0 && (
          <View style={s.stepBox}>
            <Text style={s.stepEmoji}>👤</Text>
            <Text style={s.title}>Tell us about yourself</Text>
            <Text style={s.subtitle}>We use this to calculate your exact calorie needs</Text>
            <Text style={s.fieldLabel}>AGE</Text>
            <TextInput style={s.input} value={age} onChangeText={setAge}
              placeholder="e.g. 24" placeholderTextColor="#3F3F46" keyboardType="numeric" maxLength={3} />
            <Text style={s.fieldLabel}>GENDER</Text>
            <View style={s.optRow}>
              {GENDERS.map(g => (
                <TouchableOpacity key={g.key} style={[s.optCard, gender === g.key && s.optCardActive]} onPress={() => setGender(g.key)}>
                  <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                  <Text style={[s.optLabel, gender === g.key && { color: '#FF5722' }]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 1: Body ── */}
        {step === 1 && (
          <View style={s.stepBox}>
            <Text style={s.stepEmoji}>⚖️</Text>
            <Text style={s.title}>Your Body Metrics</Text>
            <Text style={s.subtitle}>Used for precise calorie burn in every workout</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>WEIGHT (kg)</Text>
                <TextInput style={s.input} value={weight} onChangeText={setWeight}
                  placeholder="e.g. 75" placeholderTextColor="#3F3F46" keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>HEIGHT (cm)</Text>
                <TextInput style={s.input} value={height} onChangeText={setHeight}
                  placeholder="e.g. 175" placeholderTextColor="#3F3F46" keyboardType="decimal-pad" />
              </View>
            </View>
            {weight && height && (
              <View style={s.previewCard}>
                <Text style={s.previewLabel}>BMI</Text>
                <Text style={s.previewVal}>
                  {(parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Step 2: Activity ── */}
        {step === 2 && (
          <View style={s.stepBox}>
            <Text style={s.stepEmoji}>🏃</Text>
            <Text style={s.title}>Activity Level</Text>
            <Text style={s.subtitle}>How active are you on a typical week?</Text>
            {ACTIVITY_LEVELS.map(a => (
              <TouchableOpacity key={a.key}
                style={[s.listCard, activityLevel === a.key && s.listCardActive]}
                onPress={() => setActivity(a.key)}
              >
                <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.listLabel, activityLevel === a.key && { color: '#FF5722' }]}>{a.label}</Text>
                  <Text style={s.listDesc}>{a.description}</Text>
                </View>
                {activityLevel === a.key && <Ionicons name="checkmark-circle" size={20} color="#FF5722" />}
              </TouchableOpacity>
            ))}
            {activityLevel && previewTDEE() && (
              <View style={s.previewCard}>
                <Text style={s.previewLabel}>Estimated Daily Calories (TDEE)</Text>
                <Text style={[s.previewVal, { color: '#FF5722' }]}>{previewTDEE()} kcal/day</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Step 3: Goal ── */}
        {step === 3 && (
          <View style={s.stepBox}>
            <Text style={s.stepEmoji}>🎯</Text>
            <Text style={s.title}>Fitness Goal</Text>
            <Text style={s.subtitle}>We'll adjust your targets accordingly</Text>
            {GOALS.map(g => (
              <TouchableOpacity key={g.key}
                style={[s.listCard, goal === g.key && s.listCardActive]}
                onPress={() => setGoal(g.key)}
              >
                <Text style={{ fontSize: 24 }}>{g.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.listLabel, goal === g.key && { color: '#FF5722' }]}>{g.label}</Text>
                  <Text style={s.listDesc}>{g.desc}</Text>
                </View>
                {goal === g.key && <Ionicons name="checkmark-circle" size={20} color="#FF5722" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Step 4: Weekly Weight Loss Target (conditional) ── */}
        {step === 4 && needsLossStep && (
          <View style={s.stepBox}>
            <Text style={s.stepEmoji}>📊</Text>
            <Text style={s.title}>Weekly Target</Text>
            <Text style={s.subtitle}>
              How much weight do you want to lose per week?
              {'\n'}(1 kg fat = 7,700 kcal)
            </Text>
            {lossOptions.map(opt => (
              <TouchableOpacity key={opt.value}
                style={[s.listCard, weeklyLossGoal === opt.value && s.listCardActive]}
                onPress={() => setWeeklyLoss(opt.value)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <Text style={[s.listLabel, weeklyLossGoal === opt.value && { color: '#FF5722' }]}>
                      {opt.label}
                    </Text>
                    <View style={{ backgroundColor: weeklyLossGoal === opt.value ? '#FF5722' : '#27272A', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{opt.badge}</Text>
                    </View>
                  </View>
                  <Text style={s.listDesc}>{opt.desc}</Text>
                </View>
                {weeklyLossGoal === opt.value && <Ionicons name="checkmark-circle" size={20} color="#FF5722" />}
              </TouchableOpacity>
            ))}

            {/* Live calorie target preview */}
            {weeklyLossGoal && previewTDEE() && (
              <View style={s.previewCard}>
                <Text style={s.previewLabel}>Your daily calorie target will be</Text>
                <Text style={[s.previewVal, { color: '#FF5722' }]}>
                  {Math.round(previewTDEE() - (weeklyLossGoal * 7700) / 7)} kcal/day
                </Text>
                <Text style={{ color: '#A1A1AA', fontSize: 12, marginTop: 4 }}>
                  TDEE {previewTDEE()} − {Math.round((weeklyLossGoal * 7700) / 7)} deficit
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Step 5 / 4: Supplements ── */}
        {step === (needsLossStep ? 5 : 4) && (
          <View style={s.stepBox}>
            <Text style={s.stepEmoji}>💊</Text>
            <Text style={s.title}>Supplements</Text>
            <Text style={s.subtitle}>Do you use supplements like Creatine?{'\n'}This helps us set your hydration goal.</Text>
            
            <Text style={s.fieldLabel}>DO YOU TAKE CREATINE?</Text>
            <View style={s.optRow}>
              {[
                { key: false, label: 'No',  emoji: '❌' },
                { key: true,  label: 'Yes', emoji: '✅' },
              ].map(opt => (
                <TouchableOpacity 
                  key={String(opt.key)} 
                  style={[s.optCard, takesCreatine === opt.key && s.optCardActive]} 
                  onPress={() => setTakesCreatine(opt.key)}
                >
                  <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                  <Text style={[s.optLabel, takesCreatine === opt.key && { color: '#FF5722' }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {takesCreatine && (
              <View style={{ marginTop: 10 }}>
                <Text style={s.fieldLabel}>DAILY DOSE (grams)</Text>
                <TextInput 
                  style={s.input} 
                  value={creatineDose} 
                  onChangeText={setCreatineDose}
                  placeholder="e.g. 5" 
                  placeholderTextColor="#3F3F46" 
                  keyboardType="numeric" 
                />
                <Text style={{ color: '#52525B', fontSize: 11, textAlign: 'center' }}>
                  Standard dose is usually 3–5g daily.
                </Text>
              </View>
            )}

            {weight && activityLevel && (
              <View style={[s.previewCard, { borderStyle: 'dashed', backgroundColor: '#161616' }]}>
                <Text style={s.previewLabel}>Personalized Water Goal</Text>
                <Text style={[s.previewVal, { color: '#60A5FA' }]}>
                  {(calculateWaterGoal(parseFloat(weight), activityLevel, takesCreatine, creatineDose) / 1000).toFixed(1)} Liters/day
                </Text>
                <Text style={{ color: '#52525B', fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  Adjusted for weight ({weight}kg), activity, and {takesCreatine ? 'creatine intake' : 'hydration base'}.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Navigation ── */}
        <View style={s.navRow}>
          {step > 0 && (
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(prev => prev - 1)}>
              <Ionicons name="arrow-back" size={20} color="#A1A1AA" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.nextBtn, saving && { opacity: 0.6 }]} onPress={goNext} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={s.nextBtnText}>
                    {step === totalSteps - 1 ? '🚀  Start Training' : 'Continue'}
                  </Text>
                  {step < totalSteps - 1 && <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />}
                </>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scroll:    { padding: 24, paddingBottom: 48 },
  topBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  logo:      { color: '#FF5722', fontSize: 20, fontWeight: '900' },
  signOutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#27272A' },
  signOutText: { color: '#71717A', fontSize: 12 },

  progressRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  dot:     { width: 26, height: 26, borderRadius: 13, backgroundColor: '#27272A', alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: '#FF5722' },
  line:    { width: 28, height: 2, backgroundColor: '#27272A', marginHorizontal: 3 },
  lineActive: { backgroundColor: '#FF5722' },
  stepLabelRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 28 },
  stepLabel: { color: '#52525B', fontSize: 10 },
  stepLabelActive: { color: '#FF5722', fontWeight: '700' },

  stepBox:   { marginBottom: 24 },
  stepEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title:     { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle:  { color: '#A1A1AA', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },

  fieldLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  input:      { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 15, color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 18 },

  optRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  optCard:     { flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 6 },
  optCardActive: { borderColor: '#FF5722', backgroundColor: '#1E1210' },
  optLabel:    { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },

  listCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', borderRadius: 14, padding: 14, gap: 12, marginBottom: 10 },
  listCardActive: { borderColor: '#FF5722', backgroundColor: '#1E1210' },
  listLabel:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  listDesc:   { color: '#A1A1AA', fontSize: 12, marginTop: 2 },

  previewCard: { backgroundColor: '#1E1210', borderWidth: 1, borderColor: '#FF5722', borderRadius: 14, padding: 16, marginTop: 12, alignItems: 'center' },
  previewLabel: { color: '#A1A1AA', fontSize: 12, marginBottom: 4 },
  previewVal:  { color: '#fff', fontSize: 26, fontWeight: '800' },

  navRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  backBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A', alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flex: 1, backgroundColor: '#FF5722', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
