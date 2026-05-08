import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, Alert, StatusBar
} from 'react-native';
import * as storage from '../utils/storage';
import MuscleModelSVG from '../components/MuscleModelSVG';
import { EXERCISES, MUSCLE_GROUPS, calculateCaloriesPerSet, calculateTotalCalories } from '../data/exercises';
import RecentWorkoutsSection from '../components/RecentWorkoutsSection';

import { API_URL } from '../apiConfig';
const DEFAULT_WEIGHT_KG = 70; // used only if profile hasn't loaded yet

// ─── Small reusable components ───────────────────────────────────────────────

const MuscleGroupPill = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: 20, marginRight: 8,
      backgroundColor: selected ? '#FF5722' : '#1A1A1A',
      borderWidth: 1,
      borderColor: selected ? '#FF5722' : '#27272A',
    }}
  >
    <Text style={{ color: selected ? '#fff' : '#A1A1AA', fontWeight: '600', fontSize: 13 }}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ExerciseCard = ({ exercise, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      backgroundColor: '#1A1A1A', borderRadius: 14,
      padding: 16, marginBottom: 10,
      borderWidth: 1, borderColor: '#27272A',
      flexDirection: 'row', alignItems: 'center',
    }}
  >
    <View style={{
      width: 44, height: 44, borderRadius: 12,
      backgroundColor: '#2A2A2A', alignItems: 'center',
      justifyContent: 'center', marginRight: 14,
    }}>
      <Text style={{ fontSize: 22 }}>{exercise.icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{exercise.name}</Text>
      <Text style={{ color: '#A1A1AA', fontSize: 12, marginTop: 2 }}>
        {exercise.primaryMuscles.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}
      </Text>
    </View>
    <View style={{
      backgroundColor: '#FF5722', width: 30, height: 30,
      borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>+</Text>
    </View>
  </TouchableOpacity>
);

// ─── Workout Logger Main Screen ────────────────────────────────────────────────

export default function WorkoutLoggerScreen({ navigation }) {
  const [userWeightKg, setUserWeightKg] = useState(DEFAULT_WEIGHT_KG);
  const [userActivityLevel, setActivityLevel] = useState('sedentary');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSets, setActiveSets] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');  // kg — user enters each session
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [recentWorkouts, setRecentWorkouts] = useState([]);

  // Fetch user profile + recent workouts on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await storage.getItem('userToken');
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          if (user.profile?.weight) setUserWeightKg(user.profile.weight);
          if (user.profile?.activityLevel) setActivityLevel(user.profile.activityLevel);
        }
      } catch (e) { /* use defaults */ }
    })();
    fetchRecentWorkouts();
  }, []);

  const fetchRecentWorkouts = useCallback(async () => {
    try {
      const token = await storage.getItem('userToken');
      const res = await fetch(`${API_URL}/workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const all = await res.json();
        // Keep only last 3 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 3);
        cutoff.setHours(0, 0, 0, 0);
        setRecentWorkouts(all.filter(w => new Date(w.date) >= cutoff));
      }
    } catch { /* silent */ }
  }, []);

  // Filter exercises by muscle group AND search query
  const filteredExercises = EXERCISES.filter(e => {
    const matchesGroup = selectedMuscleGroup === 'All' || e.muscleGroup === selectedMuscleGroup;
    const matchesSearch = !searchQuery.trim() ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.primaryMuscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGroup && matchesSearch;
  });

  // Active muscles for the 3D model
  const primaryMuscles = selectedExercise ? selectedExercise.primaryMuscles : [];
  const secondaryMuscles = selectedExercise ? selectedExercise.secondaryMuscles : [];

  // Determine which model view to show
  const backMuscles = ['lats', 'rhomboids', 'traps', 'lowerBack', 'hamstrings', 'glutes'];
  const shouldShowBack = selectedExercise &&
    selectedExercise.primaryMuscles.some(m => backMuscles.includes(m));

  const currentView = shouldShowBack ? 'back' : 'front';

  // Calculate total calories burned across all logged exercises (advanced formula)
  const totalCaloriesBurned = Object.entries(activeSets).reduce((total, [exerciseId, sets]) => {
    const exercise = EXERCISES.find(e => e.id === exerciseId);
    if (!exercise) return total;
    return total + calculateTotalCalories(exercise, userWeightKg, sets, userActivityLevel);
  }, 0);

  // Add exercise to active workout
  const addExercise = (exercise) => {
    setSelectedExercise(exercise);
    if (!activeSets[exercise.id]) {
      // Cardio sets track duration (minutes); strength sets track reps + weight
      const emptySet = exercise.type === 'cardio'
        ? { duration: '', completed: false }
        : { reps: '', weight: '', completed: false };
      setActiveSets(prev => ({ ...prev, [exercise.id]: [emptySet] }));
    }
  };

  // Add a new set / interval row
  const addSet = (exerciseId) => {
    const exercise = EXERCISES.find(e => e.id === exerciseId);
    const emptySet = exercise?.type === 'cardio'
      ? { duration: '', completed: false }
      : { reps: '', weight: '', completed: false };
    setActiveSets(prev => ({ ...prev, [exerciseId]: [...prev[exerciseId], emptySet] }));
  };

  // Update set values
  const updateSet = (exerciseId, index, field, value) => {
    setActiveSets(prev => {
      const updated = [...prev[exerciseId]];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [exerciseId]: updated };
    });
  };

  // Mark set as completed — validates different fields for cardio vs strength
  const completeSet = (exerciseId, index) => {
    const sets = activeSets[exerciseId];
    const set = sets[index];
    const exercise = EXERCISES.find(e => e.id === exerciseId);
    if (exercise?.type === 'cardio') {
      if (!set.duration || parseFloat(set.duration) <= 0) {
        Alert.alert('Missing Duration', 'Enter the duration in minutes before completing.');
        return;
      }
    } else {
      if (!set.reps || !set.weight) {
        Alert.alert('Incomplete Set', 'Please enter both reps and weight before completing.');
        return;
      }
    }
    updateSet(exerciseId, index, 'completed', true);
  };

  // Save workout to backend
  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Name Required', 'Please give your workout a name.');
      return;
    }
    const bwKg = parseFloat(bodyWeight);
    if (!bodyWeight || isNaN(bwKg) || bwKg <= 0 || bwKg > 300) {
      Alert.alert('Body Weight Required', 'Please enter your current body weight in kg before saving. This is used to calculate calories burned and track your weight progress.');
      return;
    }
    if (Object.keys(activeSets).length === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise before saving.');
      return;
    }

    setSaving(true);
    try {
      const token = await storage.getItem('userToken');
      const exercises = Object.entries(activeSets).map(([id, sets]) => {
        const exercise = EXERCISES.find(e => e.id === id);
        return {
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          sets: sets.filter(s => s.completed).map(s => ({
            reps: parseInt(s.reps),
            weight: parseFloat(s.weight)
          }))
        };
      });

      const response = await fetch(`${API_URL}/workouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: workoutName,
          exercises,
          totalCaloriesBurned: Math.round(totalCaloriesBurned),
          duration: timerSeconds,
          bodyWeight: bwKg,   // stored for weight history graph
        }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('✅ Workout Saved!', `"${workoutName}" logged with body weight ${bwKg} kg.`);
        setActiveSets({});
        setWorkoutName('');
        setBodyWeight('');
        setSelectedExercise(null);
        fetchRecentWorkouts();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (e) {
      Alert.alert('Network Error', 'Make sure your backend server is running.');
    } finally {
      setSaving(false);
    }
  };

  const loggedExerciseIds = Object.keys(activeSets);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#A1A1AA', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' }}>Today's Session</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 }}>Workout Logger</Text>
          </View>
          {/* Total Calorie Burn Badge */}
          <View style={{ backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#FF5722', paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' }}>
            <Text style={{ color: '#FF5722', fontSize: 18, fontWeight: '800' }}>🔥 {Math.round(totalCaloriesBurned)}</Text>
            <Text style={{ color: '#A1A1AA', fontSize: 10, marginTop: 1 }}>kcal burned</Text>
          </View>
        </View>

        {/* ── Workout Name + Body Weight Inputs ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16, gap: 10 }}>
          <TextInput
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Workout name (e.g. Push Day)"
            placeholderTextColor="#3F3F46"
            style={{
              backgroundColor: '#1A1A1A', color: '#fff',
              borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
              borderWidth: 1, borderColor: '#27272A', fontSize: 15,
            }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{
              flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12,
              borderWidth: 1, borderColor: bodyWeight ? '#FF5722' : '#27272A',
              paddingHorizontal: 16, paddingVertical: 12,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <Text style={{ fontSize: 16 }}>⚖️</Text>
              <TextInput
                value={bodyWeight}
                onChangeText={setBodyWeight}
                placeholder="Your weight today (kg) — required"
                placeholderTextColor="#3F3F46"
                keyboardType="decimal-pad"
                style={{ flex: 1, color: '#fff', fontSize: 14 }}
              />
              {bodyWeight ? <Text style={{ color: '#FF5722', fontSize: 12, fontWeight: '700' }}>kg</Text> : null}
            </View>
          </View>
          <Text style={{ color: '#52525B', fontSize: 11, paddingHorizontal: 4 }}>
            ⚠️ Body weight is required — it tracks your progress on the Dashboard
          </Text>
        </View>

        {/* ── 3D Muscle Model Card ── */}
        <View style={{
          marginHorizontal: 20, backgroundColor: '#1A1A1A',
          borderRadius: 20, borderWidth: 1,
          borderColor: selectedExercise ? '#FF5722' : '#27272A',
          padding: 20, marginBottom: 16, alignItems: 'center',
        }}>
          {selectedExercise ? (
            <>
              <Text style={{ color: '#FF5722', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
                Muscles Targeted
              </Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 2 }}>
                {selectedExercise.name}
              </Text>
              <Text style={{ color: '#A1A1AA', fontSize: 12, marginBottom: 16 }}>
                Primary: {selectedExercise.primaryMuscles.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}
                {selectedExercise.secondaryMuscles.length > 0
                  ? `  ·  Secondary: ${selectedExercise.secondaryMuscles.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}`
                  : ''}
              </Text>
            </>
          ) : (
            <Text style={{ color: '#A1A1AA', fontSize: 13, marginBottom: 16 }}>
              Select an exercise to see highlighted muscles
            </Text>
          )}

          <MuscleModelSVG
            primaryMuscles={primaryMuscles}
            secondaryMuscles={secondaryMuscles}
            view={currentView}
          />

          {/* Legend */}
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF5722' }} />
              <Text style={{ color: '#A1A1AA', fontSize: 11 }}>Primary</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF8A65' }} />
              <Text style={{ color: '#A1A1AA', fontSize: 11 }}>Secondary</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2a2a2a' }} />
              <Text style={{ color: '#A1A1AA', fontSize: 11 }}>Not targeted</Text>
            </View>
          </View>
        </View>

        {/* ── Active Set Logger (for selected exercise) ── */}
        {selectedExercise && activeSets[selectedExercise.id] && (
          <View style={{ marginHorizontal: 20, backgroundColor: '#1A1A1A', borderRadius: 18, borderWidth: 1, borderColor: '#27272A', padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{selectedExercise.name}</Text>
              <Text style={{ color: '#FF5722', fontWeight: '700', fontSize: 13 }}>
                ~{Math.round(calculateTotalCalories(selectedExercise, userWeightKg, activeSets[selectedExercise.id], userActivityLevel))} kcal
              </Text>
            </View>

            {/* Set Headers */}
            {selectedExercise.type === 'cardio' ? (
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ color: '#A1A1AA', fontSize: 11, width: 40, textAlign: 'center', textTransform: 'uppercase' }}>Set</Text>
                <Text style={{ color: '#A1A1AA', fontSize: 11, flex: 1, textAlign: 'center', textTransform: 'uppercase' }}>Duration (min)</Text>
                <View style={{ width: 36 }} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <Text style={{ color: '#A1A1AA', fontSize: 11, width: 40, textAlign: 'center', textTransform: 'uppercase' }}>Set</Text>
                <Text style={{ color: '#A1A1AA', fontSize: 11, flex: 1, textAlign: 'center', textTransform: 'uppercase' }}>Reps</Text>
                <Text style={{ color: '#A1A1AA', fontSize: 11, flex: 1, textAlign: 'center', textTransform: 'uppercase' }}>Weight (kg)</Text>
                <View style={{ width: 36 }} />
              </View>
            )}

            {/* Set Rows */}
            {activeSets[selectedExercise.id].map((set, index) => {
              const isCardio = selectedExercise.type === 'cardio';
              const cals = isCardio
                ? (set.duration ? calculateCaloriesPerSet(selectedExercise, userWeightKg, parseFloat(set.duration) || 0, 0, userActivityLevel) : 0)
                : (set.reps ? calculateCaloriesPerSet(selectedExercise, userWeightKg, parseInt(set.reps) || 0, parseFloat(set.weight) || 0, userActivityLevel) : 0);
              return (
                <View key={index} style={{
                  flexDirection: 'row', alignItems: 'center',
                  marginBottom: 10,
                  opacity: set.completed ? 0.6 : 1,
                }}>
                  {/* Set Badge */}
                  <View style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: set.completed ? '#FF5722' : '#2A2A2A',
                    alignItems: 'center', justifyContent: 'center', marginRight: 8
                  }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{index + 1}</Text>
                  </View>

                  {isCardio ? (
                    /* ── Cardio: Duration Only ── */
                    <TextInput
                      value={set.duration}
                      onChangeText={v => updateSet(selectedExercise.id, index, 'duration', v)}
                      placeholder="min"
                      placeholderTextColor="#3F3F46"
                      keyboardType="decimal-pad"
                      editable={!set.completed}
                      style={{
                        flex: 1, backgroundColor: '#121212',
                        borderRadius: 10, paddingVertical: 10,
                        textAlign: 'center', color: '#fff',
                        fontSize: 16, fontWeight: '700',
                        borderWidth: 1, borderColor: '#27272A', marginRight: 8,
                      }}
                    />
                  ) : (
                    /* ── Strength: Reps + Weight ── */
                    <>
                      <TextInput
                        value={set.reps}
                        onChangeText={v => updateSet(selectedExercise.id, index, 'reps', v)}
                        placeholder="—"
                        placeholderTextColor="#3F3F46"
                        keyboardType="numeric"
                        editable={!set.completed}
                        style={{
                          flex: 1, backgroundColor: '#121212',
                          borderRadius: 10, paddingVertical: 10,
                          textAlign: 'center', color: '#fff',
                          fontSize: 16, fontWeight: '700',
                          borderWidth: 1, borderColor: '#27272A', marginRight: 8,
                        }}
                      />
                      <TextInput
                        value={set.weight}
                        onChangeText={v => updateSet(selectedExercise.id, index, 'weight', v)}
                        placeholder="—"
                        placeholderTextColor="#3F3F46"
                        keyboardType="decimal-pad"
                        editable={!set.completed}
                        style={{
                          flex: 1, backgroundColor: '#121212',
                          borderRadius: 10, paddingVertical: 10,
                          textAlign: 'center', color: '#fff',
                          fontSize: 16, fontWeight: '700',
                          borderWidth: 1, borderColor: '#27272A', marginRight: 8,
                        }}
                      />
                    </>
                  )}

                  {/* Complete Set Button */}
                  <TouchableOpacity
                    onPress={() => completeSet(selectedExercise.id, index)}
                    disabled={set.completed}
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: set.completed ? '#166534' : '#FF5722',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{set.completed ? '✓' : '▶'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Add Set / Interval */}
            <TouchableOpacity
              onPress={() => addSet(selectedExercise.id)}
              style={{
                borderWidth: 1, borderColor: '#27272A', borderStyle: 'dashed',
                borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 4,
              }}
            >
              <Text style={{ color: '#A1A1AA', fontWeight: '600' }}>
                {selectedExercise.type === 'cardio' ? '+ Add Interval' : '+ Add Set'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Search Bar ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#1A1A1A', borderRadius: 12,
            borderWidth: 1, borderColor: '#27272A',
            paddingHorizontal: 14, paddingVertical: 10, gap: 10,
          }}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search 150+ exercises..."
              placeholderTextColor="#3F3F46"
              style={{ flex: 1, color: '#fff', fontSize: 14, fontWeight: '500' }}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ color: '#52525B', fontSize: 18, lineHeight: 20 }}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Muscle Group Filter Tabs ── */}
        <View style={{ paddingLeft: 20, marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {MUSCLE_GROUPS.map(group => (
              <MuscleGroupPill
                key={group}
                label={group}
                selected={selectedMuscleGroup === group}
                onPress={() => setSelectedMuscleGroup(group)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Past 3 Days ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text style={{
            color: '#FF5722', fontSize: 11, fontWeight: '700',
            letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10,
          }}>
            📅  Past 3 Days
          </Text>
          <RecentWorkoutsSection
            workouts={recentWorkouts}
            userWeightKg={userWeightKg}
            userActivityLevel={userActivityLevel}
            onRefresh={fetchRecentWorkouts}
          />
        </View>

        {/* ── Exercise List ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 80 }}>
          <Text style={{ color: '#A1A1AA', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
            {filteredExercises.length} Exercises
          </Text>
          {filteredExercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onPress={() => addExercise(exercise)}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── Sticky Save Button ── */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
        backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: '#27272A',
      }}>
        <TouchableOpacity
          onPress={saveWorkout}
          disabled={saving}
          style={{
            backgroundColor: saving ? '#7f2d12' : '#FF5722',
            borderRadius: 14, paddingVertical: 16,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
            {saving ? 'Saving...' : `💾  Save Workout  ·  🔥 ${Math.round(totalCaloriesBurned)} kcal`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
