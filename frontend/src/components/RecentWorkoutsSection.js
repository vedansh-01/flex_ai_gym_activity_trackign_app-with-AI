/**
 * RecentWorkoutsSection
 * Shows the last 3 days of logged workouts. Each card can be expanded,
 * edited (reps/weight per set), or deleted.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as storage from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { calcCaloriesAdvanced } from '../utils/fitnessCalc';
import { EXERCISES } from '../data/exercises';

import { API_URL } from '../apiConfig';

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  const d     = new Date(iso);
  const today = new Date();
  const diff  = Math.floor((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
};

const isWithin3Days = (iso) => {
  const d     = new Date(iso);
  const limit = new Date();
  limit.setDate(limit.getDate() - 3);
  limit.setHours(0, 0, 0, 0);
  return d >= limit;
};

/** Recalculate total kcal from edited exercises using the same advanced formula */
const recalcCalories = (exercises, userWeightKg, userActivityLevel) => {
  let total = 0;
  exercises.forEach(ex => {
    const dbEx = EXERCISES.find(e => e.name === ex.name) || { met: 5.0 };
    (ex.sets || []).forEach(set => {
      const reps   = parseInt(set.reps)    || 0;
      const lifted = parseFloat(set.weight) || 0;
      total += calcCaloriesAdvanced(dbEx, userWeightKg, reps, lifted, userActivityLevel);
    });
  });
  return Math.round(total);
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const SetRow = ({ setIndex, set, editing, onChange }) => (
  <View style={s.setRow}>
    <Text style={s.setNum}>Set {setIndex + 1}</Text>
    {editing ? (
      <>
        <TextInput
          style={s.setInput}
          value={String(set.reps)}
          onChangeText={v => onChange('reps', v)}
          keyboardType="numeric"
          placeholder="Reps"
          placeholderTextColor="#3F3F46"
        />
        <Text style={s.setDivider}>×</Text>
        <TextInput
          style={s.setInput}
          value={String(set.weight)}
          onChangeText={v => onChange('weight', v)}
          keyboardType="decimal-pad"
          placeholder="kg"
          placeholderTextColor="#3F3F46"
        />
        <Text style={s.setUnit}>kg</Text>
      </>
    ) : (
      <Text style={s.setStats}>{set.reps} reps × {set.weight} kg</Text>
    )}
  </View>
);

// ─── Main exported component ─────────────────────────────────────────────────
export default function RecentWorkoutsSection({
  workouts,           // array of workout objects from parent
  userWeightKg,
  userActivityLevel,
  onRefresh,          // callback to reload workouts in parent after edit/delete
}) {
  const [expandedId, setExpandedId]   = useState(null);
  const [editingId, setEditingId]     = useState(null);
  const [editData, setEditData]       = useState(null);   // deep copy of workout being edited
  const [saving, setSaving]           = useState(false);
  const [deleting, setDeleting]       = useState(null);   // id being deleted

  const recent = (workouts || []).filter(w => isWithin3Days(w.date));

  // ── start editing ──────────────────────────────────────────────────────────
  const startEdit = (workout) => {
    setEditingId(workout._id);
    setExpandedId(workout._id);
    // Deep copy so edits don't mutate the original array
    setEditData({
      name:      workout.name,
      exercises: workout.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => ({ ...s })),
      })),
    });
  };

  // ── update a field inside editData ────────────────────────────────────────
  const updateSet = (exIdx, setIdx, field, val) => {
    setEditData(prev => {
      const exs = prev.exercises.map((ex, ei) => {
        if (ei !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, si) =>
            si === setIdx ? { ...s, [field]: val } : s
          ),
        };
      });
      return { ...prev, exercises: exs };
    });
  };

  const updateName = (val) => setEditData(prev => ({ ...prev, name: val }));

  // ── save edits ────────────────────────────────────────────────────────────
  const saveEdit = useCallback(async (workoutId) => {
    setSaving(true);
    try {
      const token = await storage.getItem('userToken');

      // Convert string inputs back to numbers
      const exercises = editData.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => ({
          reps:   parseInt(s.reps)    || 0,
          weight: parseFloat(s.weight) || 0,
        })),
      }));

      const totalCaloriesBurned = recalcCalories(exercises, userWeightKg, userActivityLevel);

      const res = await fetch(`${API_URL}/workouts/${workoutId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name: editData.name, exercises, totalCaloriesBurned }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditData(null);
        onRefresh();
      } else {
        const err = await res.json();
        Alert.alert('Error', err.message || 'Failed to save.');
      }
    } catch (e) {
      Alert.alert('Network Error', 'Could not reach the server.');
    } finally {
      setSaving(false);
    }
  }, [editData, userWeightKg, userActivityLevel, onRefresh]);

  // ── delete ────────────────────────────────────────────────────────────────
  const confirmDelete = (workout) => {
    Alert.alert(
      'Delete Workout',
      `Delete "${workout.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => deleteWorkout(workout._id),
        },
      ]
    );
  };

  const deleteWorkout = async (id) => {
    setDeleting(id);
    try {
      const token = await storage.getItem('userToken');
      const res   = await fetch(`${API_URL}/workouts/${id}`, {
        method:  'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (editingId === id) { setEditingId(null); setEditData(null); }
        onRefresh();
      } else {
        Alert.alert('Error', 'Failed to delete workout.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not reach the server.');
    } finally {
      setDeleting(null);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  if (!recent.length) {
    return (
      <View style={s.emptyBox}>
        <Text style={s.emptyIcon}>📂</Text>
        <Text style={s.emptyTitle}>No workouts in the last 3 days</Text>
        <Text style={s.emptySubtitle}>Log one above to see it here</Text>
      </View>
    );
  }

  return (
    <View>
      {recent.map(workout => {
        const isExpanded = expandedId === workout._id;
        const isEditing  = editingId  === workout._id;
        const data       = isEditing ? editData : workout;

        return (
          <View key={workout._id} style={[s.card, isEditing && s.cardEditing]}>

            {/* ── Card Header ── */}
            <TouchableOpacity
              style={s.cardHeader}
              onPress={() => setExpandedId(isExpanded ? null : workout._id)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                {isEditing ? (
                  <TextInput
                    style={s.nameInput}
                    value={data.name}
                    onChangeText={updateName}
                    placeholder="Workout name"
                    placeholderTextColor="#3F3F46"
                  />
                ) : (
                  <Text style={s.cardName}>{workout.name}</Text>
                )}
                <Text style={s.cardMeta}>
                  {formatDate(workout.date)}
                  {'  ·  '}
                  {workout.exercises?.length ?? 0} exercises
                  {'  ·  '}🔥 {Math.round(workout.totalCaloriesBurned ?? 0)} kcal
                </Text>
              </View>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18} color="#52525B"
              />
            </TouchableOpacity>

            {/* ── Expanded Body ── */}
            {isExpanded && (
              <View style={s.cardBody}>
                {(data.exercises || []).map((ex, exIdx) => (
                  <View key={exIdx} style={s.exerciseBlock}>
                    <Text style={s.exName}>{ex.name}</Text>
                    {(ex.sets || []).map((set, setIdx) => (
                      <SetRow
                        key={setIdx}
                        setIndex={setIdx}
                        set={set}
                        editing={isEditing}
                        onChange={(field, val) => updateSet(exIdx, setIdx, field, val)}
                      />
                    ))}
                  </View>
                ))}

                {/* ── Action Buttons ── */}
                <View style={s.actionRow}>
                  {isEditing ? (
                    <>
                      <TouchableOpacity
                        style={[s.btn, s.btnSave, saving && { opacity: 0.6 }]}
                        onPress={() => saveEdit(workout._id)}
                        disabled={saving}
                      >
                        {saving
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={s.btnTxt}>💾  Save Changes</Text>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.btn, s.btnCancel]}
                        onPress={() => { setEditingId(null); setEditData(null); }}
                      >
                        <Text style={s.btnTxtGrey}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[s.btn, s.btnEdit]}
                        onPress={() => startEdit(workout)}
                      >
                        <Text style={s.btnTxt}>✏️  Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.btn, s.btnDelete, deleting === workout._id && { opacity: 0.5 }]}
                        onPress={() => confirmDelete(workout)}
                        disabled={deleting === workout._id}
                      >
                        {deleting === workout._id
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={s.btnTxt}>🗑️  Delete</Text>
                        }
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  emptyBox:      { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyIcon:     { fontSize: 32 },
  emptyTitle:    { color: '#A1A1AA', fontSize: 14, fontWeight: '600' },
  emptySubtitle: { color: '#52525B', fontSize: 12 },

  card: {
    backgroundColor: '#1A1A1A', borderRadius: 16,
    borderWidth: 1, borderColor: '#27272A',
    marginBottom: 10, overflow: 'hidden',
  },
  cardEditing: { borderColor: '#FF5722' },

  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 10,
  },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cardMeta: { color: '#52525B', fontSize: 11, marginTop: 3 },

  nameInput: {
    backgroundColor: '#121212', color: '#fff',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    fontSize: 15, fontWeight: '700', borderWidth: 1, borderColor: '#FF5722',
    marginBottom: 2,
  },

  cardBody:      { paddingHorizontal: 14, paddingBottom: 14 },
  exerciseBlock: { marginBottom: 12 },
  exName:        { color: '#FF5722', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },

  setRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 6 },
  setNum:    { color: '#52525B', fontSize: 12, width: 40 },
  setStats:  { color: '#A1A1AA', fontSize: 13, fontWeight: '600' },
  setInput:  {
    backgroundColor: '#121212', color: '#fff',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    fontSize: 14, fontWeight: '600', borderWidth: 1, borderColor: '#27272A',
    width: 60, textAlign: 'center',
  },
  setDivider: { color: '#52525B', fontSize: 14 },
  setUnit:    { color: '#52525B', fontSize: 12 },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn:       { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  btnEdit:   { backgroundColor: '#FF5722' },
  btnSave:   { backgroundColor: '#22C55E' },
  btnCancel: { backgroundColor: '#27272A' },
  btnDelete: { backgroundColor: '#EF4444' },
  btnTxt:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnTxtGrey:{ color: '#A1A1AA', fontWeight: '700', fontSize: 13 },
});
