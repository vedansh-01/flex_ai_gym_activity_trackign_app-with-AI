import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, SafeAreaView, StatusBar, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import { getMacroTargets } from '../utils/fitnessCalc';

import { API_URL } from '../apiConfig';
// Fallbacks used only before profile loads
const DEFAULT_CALORIE_GOAL = 2100;
const DEFAULT_MACRO_GOALS  = { protein: 160, carbs: 220, fat: 65 };

// ─── Calorie Ring ─────────────────────────────────────────────────────────────
function CalorieRing({ consumed, goal }) {
  const SIZE = 180, SW = 16;
  const R = (SIZE - SW) / 2;
  const C = 2 * Math.PI * R;
  const pct = Math.min(consumed / (goal || 1), 1);
  const over = consumed > goal;
  return (
    <View style={s.ringWrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={SIZE/2} cy={SIZE/2} r={R} stroke="#1F1F1F" strokeWidth={SW} fill="none"/>
        <Circle cx={SIZE/2} cy={SIZE/2} r={R}
          stroke={over ? '#EF4444' : '#FF5722'} strokeWidth={SW} fill="none"
          strokeDasharray={`${pct * C} ${C}`} strokeLinecap="round"
          rotation="-90" origin={`${SIZE/2},${SIZE/2}`}/>
      </Svg>
      <View style={s.ringCenter}>
        <Text style={s.ringCal}>{consumed.toFixed(1)}</Text>
        <Text style={s.ringLabel}>kcal eaten</Text>
        <View style={s.ringDivider}/>
        <Text style={[s.ringRemain, over && {color:'#EF4444'}]}>
          {over ? `${(consumed-goal).toFixed(1)} over` : `${(goal-consumed).toFixed(1)} left`}
        </Text>
      </View>
    </View>
  );
}

// ─── Macro Bar ────────────────────────────────────────────────────────────────
function MacroBar({ label, current, goal, color }) {
  const pct = Math.min(current / (goal || 1), 1);
  return (
    <View style={s.macroBar}>
      <View style={s.macroHeader}>
        <Text style={[s.macroLabel, {color}]}>{label}</Text>
        <Text style={s.macroValue}>{current.toFixed(1)}<Text style={s.macroGoal}>/{goal}g</Text></Text>
      </View>
      <View style={s.macroTrack}>
        <View style={[s.macroFill, {width:`${pct*100}%`, backgroundColor:color}]}/>
      </View>
    </View>
  );
}

// ─── Food Item Row ────────────────────────────────────────────────────────────
function FoodItem({ food, onDelete }) {
  return (
    <View style={s.foodRow}>
      <View style={{flex:1}}>
        <Text style={s.foodName}>{food.name}</Text>
        <Text style={s.foodServing}>{food.serving}</Text>
        <View style={s.foodMacroRow}>
          <Text style={[s.chip, {backgroundColor:'#22C55E22',color:'#22C55E'}]}>P {food.protein}g</Text>
          <Text style={[s.chip, {backgroundColor:'#3B82F622',color:'#3B82F6'}]}>C {food.carbs}g</Text>
          <Text style={[s.chip, {backgroundColor:'#EAB30822',color:'#EAB308'}]}>F {food.fat}g</Text>
        </View>
      </View>
      <View style={s.foodRight}>
        <Text style={s.foodCal}>{parseFloat(food.cal).toFixed(1)}</Text>
        <Text style={s.foodCalLabel}>kcal</Text>
        <TouchableOpacity onPress={onDelete} style={{marginTop:4}}>
          <Ionicons name="trash-outline" size={16} color="#3F3F46"/>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Meal Section Card ────────────────────────────────────────────────────────
function MealSection({ mealKey, meal, onAddFood, onDeleteFood }) {
  const [open, setOpen] = useState(true);
  const total = (meal?.foods || []).reduce((s, f) => s + (parseFloat(f.cal) || 0), 0);
  const color = meal?.color || '#FF5722';

  return (
    <View style={[s.mealCard, {borderColor: open ? color+'44' : '#27272A'}]}>
      <TouchableOpacity style={s.mealHeader} onPress={() => setOpen(!open)} activeOpacity={0.8}>
        <View style={[s.mealIcon, {backgroundColor: color+'22'}]}>
          <Text style={{fontSize:18}}>{meal?.emoji || '🍽️'}</Text>
        </View>
        <View style={{flex:1}}>
          <Text style={s.mealLabel}>{meal?.label || mealKey}</Text>
          <Text style={s.mealSub}>{meal?.foods?.length || 0} items · {total.toFixed(1)} kcal</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#52525B"/>
      </TouchableOpacity>

      {open && (
        <View style={s.mealBody}>
          {(meal?.foods || []).length === 0
            ? <Text style={s.emptyTxt}>Nothing logged yet — tap Add Food</Text>
            : meal.foods.map(f => <FoodItem key={f.id} food={f} onDelete={() => onDeleteFood(mealKey, f.id)}/>)
          }
          <TouchableOpacity style={[s.addBtn, {backgroundColor: color}]} onPress={() => onAddFood(mealKey)}>
            <Ionicons name="add" size={18} color="#fff"/>
            <Text style={s.addBtnTxt}>Add Food</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Add Food Modal ───────────────────────────────────────────────────────────
const EMPTY_FORM = { name:'', serving:'100', servingUnit:'g', cal:'', protein:'', carbs:'', fat:'' };

function AddFoodModal({ visible, mealLabel, mealColor, onClose, onSave, initialData }) {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [baseline, setBaseline] = useState(null);
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [busy, setBusy]         = useState(false);
  const [saving, setSaving]     = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setForm(initialData || EMPTY_FORM);
      setBaseline(null);
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length > 1) doSearch(query);
      else setResults([]);
    }, 500);
    return () => clearTimeout(t);
  }, [query]);

  const doSearch = async (q) => {
    setBusy(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_URL}/foods/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setResults(await res.json());
    } catch (e) { console.log('search err', e); } finally { setBusy(false); }
  };

  const selectFood = (food) => {
    setBaseline(food);
    const isPiece = food.servingUnit === 'piece' && food.gramsPerUnit > 0;
    const defaultQty = isPiece ? '1' : '100';
    const defaultUnit = isPiece ? 'piece' : 'g';
    // Compute initial macros for default quantity
    const scale = isPiece
      ? (1 * food.gramsPerUnit) / 100   // 1 piece × gramsPerUnit / 100
      : 1;                               // 100g baseline = 1×
    setForm({
      name:        food.name || '',
      serving:     defaultQty,
      servingUnit: defaultUnit,
      cal:     ((food.calories || 0) * scale).toFixed(1),
      protein: ((food.protein  || 0) * scale).toFixed(1),
      carbs:   ((food.carbs    || 0) * scale).toFixed(1),
      fat:     ((food.fats     || 0) * scale).toFixed(1),
    });
    setResults([]);
    setQuery('');
  };

  // Scale macros when quantity changes
  // Piece-based: scale = (pieces × gramsPerUnit) / 100
  // Gram-based:  scale = grams / 100
  const onServingChange = (val) => {
    const qty = parseFloat(val) || 0;
    setForm(prev => {
      const next = { ...prev, serving: val };
      if (baseline && qty > 0) {
        const isPiece = baseline.servingUnit === 'piece' && baseline.gramsPerUnit > 0;
        const scale = isPiece
          ? (qty * baseline.gramsPerUnit) / 100
          : qty / 100;
        next.cal     = ((baseline.calories || 0) * scale).toFixed(1);
        next.protein = ((baseline.protein  || 0) * scale).toFixed(1);
        next.carbs   = ((baseline.carbs    || 0) * scale).toFixed(1);
        next.fat     = ((baseline.fats     || 0) * scale).toFixed(1);
      }
      return next;
    });
  };

  const confirm = async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Please enter a food name.'); return; }
    if (!form.cal)         { Alert.alert('Required', 'Please enter calories.');     return; }
    setSaving(true);
    await onSave({
      name:       form.name.trim(),
      quantity:   parseFloat(form.serving) || 100,
      servingUnit: form.servingUnit,
      cal:     parseFloat(form.cal)     || 0,
      protein: parseFloat(form.protein) || 0,
      carbs:   parseFloat(form.carbs)   || 0,
      fat:     parseFloat(form.fat)     || 0,
    });
    setSaving(false);
  };

  const macros = [
    { l:'Calories', k:'cal',     c:'#FF5722' },
    { l:'Protein',  k:'protein', c:'#22C55E' },
    { l:'Carbs',    k:'carbs',   c:'#3B82F6' },
    { l:'Fat',      k:'fat',     c:'#EAB308' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}/>
        <View style={s.sheet}>
          <View style={s.sheetHandle}/>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Add to <Text style={{color:mealColor}}>{mealLabel}</Text></Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#A1A1AA"/></TouchableOpacity>
          </View>

          {/* Search */}
          <View style={s.searchBar}>
            <Ionicons name="search" size={16} color="#52525B"/>
            <TextInput
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search 1,000+ Indian dishes..."
              placeholderTextColor="#3F3F46"
              returnKeyType="search"
            />
            {busy
              ? <ActivityIndicator size="small" color="#FF5722"/>
              : query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
                  <Ionicons name="close-circle" size={16} color="#52525B"/>
                </TouchableOpacity>
              )
            }
          </View>

          {/* Search Results */}
          {results.length > 0 && (
            <View style={s.resultsList}>
              <ScrollView style={{maxHeight:200}} keyboardShouldPersistTaps="handled">
                {results.map(r => {
                  const isPiece = r.servingUnit === 'piece' && r.gramsPerUnit > 0;
                  const perPieceCal = isPiece
                    ? Math.round((r.calories * r.gramsPerUnit) / 100)
                    : null;
                  return (
                    <TouchableOpacity key={r._id} style={s.resultItem} onPress={() => selectFood(r)}>
                      <View style={{flex:1}}>
                        <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                          <Text style={s.resultName}>{r.name}</Text>
                          {isPiece && (
                            <View style={{backgroundColor:'#FF572222', paddingHorizontal:6, paddingVertical:2, borderRadius:6}}>
                              <Text style={{color:'#FF5722', fontSize:9, fontWeight:'800'}}>PER PIECE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.resultMeta}>
                          {isPiece
                            ? `${perPieceCal} kcal/piece (${r.gramsPerUnit}g) · P:${((r.protein*r.gramsPerUnit)/100).toFixed(1)}g`
                            : `${r.calories} kcal/100g · P:${r.protein}g · C:${r.carbs}g`}
                        </Text>
                      </View>
                      <Ionicons name="add-circle" size={22} color="#FF5722"/>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* OR divider only shown when no results */}
            {results.length === 0 && (
              <View style={s.orRow}>
                <View style={s.orLine}/><Text style={s.orTxt}>or enter manually</Text><View style={s.orLine}/>
              </View>
            )}

            {/* Name */}
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Food Name</Text>
              <TextInput
                style={s.input}
                value={form.name}
                onChangeText={v => setForm(prev => ({...prev, name:v}))}
                placeholder="e.g. Grilled Chicken"
                placeholderTextColor="#3F3F46"
              />
            </View>

            {/* Serving */}
            <View style={s.inputGroup}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginBottom:6}}>
                <Text style={s.inputLabel}>
                  {form.servingUnit === 'piece' ? 'How many pieces?' : 'Amount (grams)'}
                </Text>
                {baseline?.servingUnit === 'piece' && baseline?.gramsPerUnit > 0 && (
                  <Text style={{color:'#52525B', fontSize:11}}>
                    1 piece ≈ {baseline.gramsPerUnit}g
                  </Text>
                )}
              </View>
              <View style={{flexDirection:'row', gap:10}}>
                <TextInput
                  style={[s.input, {flex:1}]}
                  value={form.serving}
                  onChangeText={onServingChange}
                  keyboardType="decimal-pad"
                  placeholder={form.servingUnit === 'piece' ? '1' : '100'}
                  placeholderTextColor="#3F3F46"
                />
                <View style={[s.unitBadge, form.servingUnit === 'piece' && {borderColor:'#FF5722'}]}>
                  <Text style={[s.unitTxt, form.servingUnit === 'piece' && {color:'#FF5722'}]}>
                    {form.servingUnit === 'piece' ? 'pcs' : 'g'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Macros Grid */}
            <Text style={s.inputLabel}>Macros (auto-scales)</Text>
            <View style={s.macroGrid}>
              {macros.map(m => (
                <View key={m.k} style={[s.macroCell, {borderColor: m.c+'33'}]}>
                  <Text style={[s.macroCellLabel, {color:m.c}]}>{m.l}</Text>
                  <TextInput
                    style={s.macroCellInput}
                    value={form[m.k]}
                    onChangeText={v => setForm(prev => ({...prev, [m.k]:v}))}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#3F3F46"
                  />
                  <Text style={s.macroCellUnit}>{m.k === 'cal' ? 'kcal' : 'g'}</Text>
                </View>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[s.saveBtn, {backgroundColor: mealColor, opacity: saving ? 0.6 : 1}]}
              onPress={confirm}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small"/>
                : <><Ionicons name="checkmark-circle" size={20} color="#fff"/><Text style={s.saveBtnTxt}>Log Food</Text></>
              }
            </TouchableOpacity>
            <View style={{height:50}}/>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function NutritionScreen() {
  const [history,  setHistory]    = useState([]);
  const [modal,    setModal]      = useState(null);
  const [editing,  setEditing]    = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [profile,  setProfile]    = useState(null); // user profile for goal calculation
  const [waterLogs, setWaterLogs] = useState([]);
  const [waterTotal, setWaterTotal] = useState(0);

  // Derive calorie + macro goals from profile (same formula as Dashboard)
  const calorieGoal = profile?.targetCalories || profile?.tdee || DEFAULT_CALORIE_GOAL;
  const macroGoals  = profile?.weight && profile?.tdee
    ? getMacroTargets(profile.tdee, profile.goal || 'maintenance', profile.weight, profile.weeklyLossGoal)
    : DEFAULT_MACRO_GOALS;

  // Totals from today's logs
  const totals = useMemo(() => {
    const today = new Date().toDateString();
    return history
      .filter(m => new Date(m.date).toDateString() === today)
      .reduce((acc, m) => ({
        c:  acc.c  + (m.totalCalories    || 0),
        p:  acc.p  + (m.macros?.protein  || 0),
        ch: acc.ch + (m.macros?.carbs    || 0),
        f:  acc.f  + (m.macros?.fats     || 0),
      }), { c:0, p:0, ch:0, f:0 });
  }, [history]);

  useEffect(() => {
    loadProfile();
    loadHistory();
    loadWater();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        setProfile(user.profile || null);
      }
    } catch (e) { console.log('Profile load error:', e); }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_URL}/meals?days=3`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        console.log('Failed to load meals:', res.status);
      }
    } catch (e) { console.log('Load error:', e); }
    finally { setLoading(false); }
  };

  const openModal  = (cat) => { setModal(cat); setEditing(null); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSave = async (data) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const payload = {
        name: editing ? editing.cat : modal,
        foods: [{
          name:     data.name,
          quantity: data.quantity,
          unit:     data.servingUnit,
          calories: data.cal,
          protein:  data.protein,
          carbs:    data.carbs,
          fats:     data.fat,
        }],
      };

      const method = editing ? 'PUT' : 'POST';
      const url    = editing ? `${API_URL}/meals/${editing.id}` : `${API_URL}/meals`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadHistory();
        closeModal();
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Save Failed', err.message || `Status ${res.status}`);
      }
    } catch (e) {
      console.log('Save error:', e);
      Alert.alert('Network Error', 'Could not reach the server. Check your connection.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_URL}/meals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setHistory(h => h.filter(m => m._id !== id));
    } catch (e) { console.log('Delete error:', e); }
  };

  const startEdit = (m) => {
    if (!m?.foods?.length) return;
    const f = m.foods[0];
    setEditing({
      id: m._id, cat: m.name,
      foodData: {
        name: f.name || '', serving: String(f.quantity || 100),
        servingUnit: f.unit || 'g', cal: String(f.calories || 0),
        protein: String(f.protein || 0), carbs: String(f.carbs || 0),
        fat: String(f.fats || 0),
      }
    });
    setModal(m.name);
  };

  const loadWater = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_URL}/water/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const { logs, total } = await res.json();
        setWaterLogs(logs);
        setWaterTotal(total);
      }
    } catch (e) { console.log('Water load error:', e); }
  };

  const handleAddWater = async (amount) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_URL}/water`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) await loadWater();
    } catch (e) { console.log('Water add error:', e); }
  };

  const handleDeleteWater = async (id) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${API_URL}/water/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await loadWater();
    } catch (e) { console.log('Water delete error:', e); }
  };

  // Build a category view from today's history
  const CATS = {
    Breakfast: { emoji:'🌅', color:'#F59E0B' },
    Lunch:     { emoji:'☀️',  color:'#FF5722' },
    Dinner:    { emoji:'🌙', color:'#6366F1' },
    Snacks:    { emoji:'🍎', color:'#22C55E' },
  };

  const getCatMeal = (cat) => {
    const today   = new Date().toDateString();
    const records = history.filter(m =>
      m.name === cat &&
      new Date(m.date).toDateString() === today &&
      Array.isArray(m.foods) && m.foods.length > 0
    );
    return {
      label: cat,
      emoji: CATS[cat]?.emoji || '🍽️',
      color: CATS[cat]?.color || '#FF5722',
      foods: records.map(m => {
        const f = m.foods[0];
        return {
          id:      m._id,
          name:    f.name    || 'Unknown',
          serving: `${f.quantity || 0}${f.unit || 'g'}`,
          cal:     f.calories || 0,
          protein: f.protein  || 0,
          carbs:   f.carbs    || 0,
          fat:     f.fats     || 0,
        };
      }),
    };
  };

  const validHistory = history.filter(m => Array.isArray(m.foods) && m.foods.length > 0);

  return (
    <SafeAreaView style={s.screen}>
      <StatusBar barStyle="light-content"/>
      {loading ? (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
          <ActivityIndicator size="large" color="#FF5722"/>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.eyebrow}>Today's Intake</Text>
              <Text style={s.title}>Nutrition Logger</Text>
            </View>
            <View style={s.dateBadge}>
              <Ionicons name="calendar-outline" size={14} color="#FF5722"/>
              <Text style={s.dateTxt}>{new Date().toLocaleDateString('en-GB', {day:'numeric', month:'short'})}</Text>
            </View>
          </View>

          {/* Calorie Ring + Macro Bars */}
          <View style={s.summaryCard}>
            <CalorieRing consumed={totals.c} goal={calorieGoal}/>
            <View style={s.macroGroup}>
              <MacroBar label="Protein" current={totals.p}  goal={macroGoals.protein} color="#22C55E"/>
              <MacroBar label="Carbs"   current={totals.ch} goal={macroGoals.carbs}   color="#3B82F6"/>
              <MacroBar label="Fat"     current={totals.f}  goal={macroGoals.fat}      color="#EAB308"/>
            </View>
            {/* Mini stats */}
            <View style={s.statRow}>
              {[
                {label:'Protein', val:`${totals.p.toFixed(1)}g / ${macroGoals.protein}g`,  color:'#22C55E'},
                {label:'Carbs',   val:`${totals.ch.toFixed(1)}g / ${macroGoals.carbs}g`, color:'#3B82F6'},
                {label:'Fat',     val:`${totals.f.toFixed(1)}g / ${macroGoals.fat}g`,  color:'#EAB308'},
                {label:'Goal',    val:`${calorieGoal.toFixed(1)} kcal`,      color:'#FF5722'},
              ].map(st => (
                <View key={st.label} style={s.statCell}>
                  <Text style={[s.statVal, {color:st.color}]}>{st.val}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Today's Meals */}
          <View style={s.section}>
            <Text style={s.sectionHeader}>Meals</Text>
            {Object.keys(CATS).map(cat => (
              <MealSection
                key={cat}
                mealKey={cat}
                meal={getCatMeal(cat)}
                onAddFood={openModal}
                onDeleteFood={(_, id) => handleDelete(id)}
              />
            ))}
          </View>

          {/* Past 3 Days History */}
          <View style={s.section}>
            <Text style={s.sectionHeader}>📅 Past 3 Days</Text>
            {validHistory.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyCardTxt}>No logs in the past 3 days yet.</Text>
              </View>
            ) : (
              validHistory.map(m => (
                <TouchableOpacity key={m._id} style={s.historyCard} onPress={() => startEdit(m)}>
                  <View style={[s.historyDot, {backgroundColor: CATS[m.name]?.color || '#FF5722'}]}/>
                  <View style={{flex:1}}>
                    <Text style={s.historyCat}>
                      {m.name} · {new Date(m.date).toLocaleDateString(undefined, {day:'numeric', month:'short'})}
                    </Text>
                    <Text style={s.historyName}>{m.foods?.[0]?.name || 'Unknown'}</Text>
                    <Text style={s.historySub}>{m.totalCalories || 0} kcal · P: {m.macros?.protein || 0}g</Text>
                  </View>
                  <View style={{flexDirection:'row', gap:12, alignItems:'center'}}>
                    <TouchableOpacity onPress={() => startEdit(m)}>
                      <Ionicons name="create-outline" size={20} color="#FF5722"/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(m._id)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444"/>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Water Logger Section */}
          <View style={s.section}>
            <Text style={s.sectionHeader}>💧 Water Logger</Text>
            <View style={s.waterBox}>
              <View style={s.waterHeader}>
                <View>
                  <Text style={s.waterGoalTxt}>
                    <Text style={{color: '#60A5FA'}}>{waterTotal}</Text> / {profile?.waterGoal || 2500} ml
                  </Text>
                  <Text style={s.waterSub}>Personalized daily hydration target</Text>
                </View>
                <Ionicons name="water" size={24} color="#60A5FA" />
              </View>

              {/* Progress Bar */}
              <View style={s.waterTrack}>
                <View style={[s.waterFill, {width: `${Math.min((waterTotal / (profile?.waterGoal || 2500)) * 100, 100)}%`}]}/>
              </View>

              {/* Quick Add Buttons */}
              <View style={s.waterActions}>
                {[
                  { label: '+250ml', val: 250, icon: 'wine' },
                  { label: '+500ml', val: 500, icon: 'water' },
                  { label: '+1L',     val: 1000, icon: 'flask' },
                ].map(act => (
                  <TouchableOpacity key={act.label} style={s.waterBtn} onPress={() => handleAddWater(act.val)}>
                    <Ionicons name={act.icon} size={14} color="#60A5FA" />
                    <Text style={s.waterBtnTxt}>{act.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Logs List */}
              {waterLogs.length > 0 && (
                <View style={s.waterLogs}>
                  {waterLogs.map(log => (
                    <View key={log._id} style={s.waterLogRow}>
                      <Text style={s.waterLogAmt}>{log.amount} ml</Text>
                      <Text style={s.waterLogTime}>
                        {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                      <TouchableOpacity onPress={() => handleDeleteWater(log._id)}>
                        <Ionicons name="close-circle" size={16} color="#3F3F46" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Supplements Section */}
          <View style={s.section}>
            <Text style={s.sectionHeader}>💊 Daily Supplements</Text>
            <View style={s.suppBox}>
              {profile?.takesCreatine ? (
                <View style={s.suppRow}>
                  <View style={[s.suppIcon, {backgroundColor:'#A78BFA22'}]}>
                    <Text style={{fontSize:18}}>💪</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={s.suppName}>Creatine Monohydrate</Text>
                    <Text style={s.suppDose}>{profile?.creatineDose || 5}g serving</Text>
                  </View>
                  {/* For now, just a visual checkbox. Logic for persisting 'took today' can be added if requested */}
                  <TouchableOpacity style={s.suppCheck}>
                    <Ionicons name="checkmark-circle" size={24} color="#A78BFA" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[s.suppRow, {opacity: 0.6}]}>
                  <Text style={s.suppEmpty}>Creatine tracking is off. Enable it in Profile.</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{height:100}}/>
        </ScrollView>
      )}

      {modal && (
        <AddFoodModal
          visible={!!modal}
          mealLabel={modal}
          mealColor={CATS[modal]?.color || '#FF5722'}
          initialData={editing?.foodData || null}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:      { flex:1, backgroundColor:'#121212' },
  // Header
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, paddingTop:16, paddingBottom:8 },
  eyebrow:     { color:'#A1A1AA', fontSize:11, letterSpacing:1.5, textTransform:'uppercase' },
  title:       { color:'#fff', fontSize:24, fontWeight:'800', marginTop:2 },
  dateBadge:   { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#1A1A1A', borderRadius:10, paddingHorizontal:12, paddingVertical:8, borderWidth:1, borderColor:'#27272A' },
  dateTxt:     { color:'#FF5722', fontSize:13, fontWeight:'700' },
  // Summary
  summaryCard: { margin:16, backgroundColor:'#1A1A1A', borderRadius:24, padding:20, borderWidth:1, borderColor:'#27272A' },
  ringWrap:    { alignItems:'center', justifyContent:'center', marginBottom:20 },
  ringCenter:  { position:'absolute', alignItems:'center' },
  ringCal:     { color:'#fff', fontSize:32, fontWeight:'900' },
  ringLabel:   { color:'#52525B', fontSize:11, marginTop:2 },
  ringDivider: { width:30, height:1, backgroundColor:'#27272A', marginVertical:6 },
  ringRemain:  { color:'#FF5722', fontSize:12, fontWeight:'700' },
  macroGroup:  { gap:12, marginBottom:16 },
  macroBar:    {},
  macroHeader: { flexDirection:'row', justifyContent:'space-between', marginBottom:5 },
  macroLabel:  { fontSize:12, fontWeight:'700' },
  macroValue:  { color:'#fff', fontSize:12, fontWeight:'700' },
  macroGoal:   { color:'#52525B', fontWeight:'400' },
  macroTrack:  { height:6, backgroundColor:'#27272A', borderRadius:3, overflow:'hidden' },
  macroFill:   { height:6, borderRadius:3 },
  statRow:     { flexDirection:'row', marginTop:4 },
  statCell:    { flex:1, alignItems:'center' },
  statVal:     { fontSize:14, fontWeight:'800' },
  statLabel:   { color:'#52525B', fontSize:10, marginTop:2 },
  // Sections
  section:       { paddingHorizontal:16, marginTop:8 },
  sectionHeader: { color:'#A1A1AA', fontSize:11, fontWeight:'700', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 },
  // Meal cards
  mealCard:    { backgroundColor:'#1A1A1A', borderRadius:18, borderWidth:1, marginBottom:10, overflow:'hidden' },
  mealHeader:  { flexDirection:'row', alignItems:'center', padding:14, gap:12 },
  mealIcon:    { width:40, height:40, borderRadius:12, alignItems:'center', justifyContent:'center' },
  mealLabel:   { color:'#fff', fontSize:15, fontWeight:'700' },
  mealSub:     { color:'#52525B', fontSize:11, marginTop:2 },
  mealBody:    { paddingHorizontal:14, paddingBottom:14 },
  emptyTxt:    { color:'#3F3F46', fontSize:12, textAlign:'center', paddingVertical:12 },
  addBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10, borderRadius:12, marginTop:10 },
  addBtnTxt:   { color:'#fff', fontWeight:'800', fontSize:13 },
  // Food item
  foodRow:      { flexDirection:'row', alignItems:'flex-start', paddingVertical:10, borderTopWidth:1, borderTopColor:'#27272A' },
  foodName:     { color:'#fff', fontSize:14, fontWeight:'600' },
  foodServing:  { color:'#52525B', fontSize:11, marginTop:2 },
  foodMacroRow: { flexDirection:'row', gap:6, marginTop:5 },
  chip:         { fontSize:10, fontWeight:'700', paddingHorizontal:7, paddingVertical:3, borderRadius:6 },
  foodRight:    { alignItems:'flex-end', gap:4 },
  foodCal:      { color:'#fff', fontSize:16, fontWeight:'800' },
  foodCalLabel: { color:'#52525B', fontSize:10 },
  // History
  historyCard:  { backgroundColor:'#1A1A1A', borderRadius:18, borderWidth:1, borderColor:'#27272A', padding:14, marginBottom:10, flexDirection:'row', alignItems:'center', gap:12 },
  historyDot:   { width:10, height:10, borderRadius:5 },
  historyCat:   { color:'#FF5722', fontSize:10, fontWeight:'700', textTransform:'uppercase' },
  historyName:  { color:'#fff', fontSize:15, fontWeight:'700', marginVertical:2 },
  historySub:   { color:'#52525B', fontSize:11 },
  emptyCard:    { backgroundColor:'#1A1A1A', borderRadius:16, padding:20, alignItems:'center', borderWidth:1, borderColor:'#27272A' },
  emptyCardTxt: { color:'#3F3F46', fontSize:13 },
  // Water box
  waterBox:     { backgroundColor:'#1A1A1A', borderRadius:20, padding:18, borderWidth:1, borderColor:'#27272A', marginBottom:12 },
  waterHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  waterGoalTxt: { color:'#fff', fontSize:20, fontWeight:'800' },
  waterTrack:   { height:8, backgroundColor:'#27272A', borderRadius:4, overflow:'hidden', marginBottom:16 },
  waterFill:    { height:8, backgroundColor:'#60A5FA', borderRadius:4 },
  waterActions: { flexDirection:'row', gap:8, marginBottom:12 },
  waterBtn:     { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10, backgroundColor:'#60A5FA15', borderRadius:10, borderWidth:1, borderColor:'#60A5FA33' },
  waterBtnTxt:  { color:'#60A5FA', fontSize:12, fontWeight:'700' },
  waterLogs:    { borderTopWidth:1, borderTopColor:'#27272A', paddingTop:12 },
  waterLogRow:  { flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 },
  waterLogAmt:  { color:'#fff', fontSize:13, fontWeight:'600', flex:1 },
  waterLogTime: { color:'#52525B', fontSize:11 },
  // Supplements
  suppBox:      { backgroundColor:'#1A1A1A', borderRadius:20, padding:18, borderWidth:1, borderColor:'#27272A' },
  suppRow:      { flexDirection:'row', alignItems:'center', gap:12 },
  suppIcon:     { width:44, height:44, borderRadius:12, alignItems:'center', justifyContent:'center' },
  suppName:     { color:'#fff', fontSize:14, fontWeight:'700' },
  suppDose:     { color:'#52525B', fontSize:11, marginTop:2 },
  suppCheck:    { padding:4 },
  suppEmpty:    { color:'#3F3F46', fontSize:12, textAlign:'center', flex:1 },
  // Modal
  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.65)' },
  sheet:        { position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#1A1A1A', borderTopLeftRadius:28, borderTopRightRadius:28, padding:20, maxHeight:'92%' },
  sheetHandle:  { width:40, height:4, backgroundColor:'#27272A', borderRadius:2, alignSelf:'center', marginBottom:16 },
  sheetHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  sheetTitle:   { color:'#fff', fontSize:18, fontWeight:'800' },
  searchBar:    { flexDirection:'row', alignItems:'center', backgroundColor:'#121212', borderRadius:12, borderWidth:1, borderColor:'#27272A', paddingHorizontal:14, paddingVertical:11, gap:10, marginBottom:12 },
  searchInput:  { flex:1, color:'#fff', fontSize:14 },
  resultsList:  { backgroundColor:'#0E0E0E', borderRadius:14, borderWidth:1, borderColor:'#27272A', marginBottom:8, overflow:'hidden' },
  resultItem:   { flexDirection:'row', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#1A1A1A' },
  resultName:   { color:'#fff', fontSize:14, fontWeight:'600' },
  resultMeta:   { color:'#52525B', fontSize:11, marginTop:2 },
  orRow:        { flexDirection:'row', alignItems:'center', gap:10, marginVertical:12 },
  orLine:       { flex:1, height:1, backgroundColor:'#27272A' },
  orTxt:        { color:'#52525B', fontSize:11 },
  inputGroup:   { marginBottom:14 },
  inputLabel:   { color:'#A1A1AA', fontSize:12, fontWeight:'600', marginBottom:6 },
  input:        { backgroundColor:'#121212', color:'#fff', borderRadius:12, paddingHorizontal:14, paddingVertical:12, borderWidth:1, borderColor:'#27272A', fontSize:14 },
  unitBadge:    { backgroundColor:'#121212', borderRadius:12, paddingHorizontal:14, paddingVertical:12, borderWidth:1, borderColor:'#27272A', minWidth:55, alignItems:'center' },
  unitTxt:      { color:'#fff', fontWeight:'700' },
  macroGrid:    { flexDirection:'row', flexWrap:'wrap', gap:10, marginTop:8, marginBottom:20 },
  macroCell:    { width:'47%', backgroundColor:'#121212', borderRadius:14, borderWidth:1, padding:12, alignItems:'center' },
  macroCellLabel:{ fontSize:11, fontWeight:'700', marginBottom:6 },
  macroCellInput:{ color:'#fff', fontSize:22, fontWeight:'800', textAlign:'center', width:'100%' },
  macroCellUnit: { color:'#52525B', fontSize:11, marginTop:4 },
  saveBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:16, borderRadius:16 },
  saveBtnTxt:   { color:'#fff', fontSize:16, fontWeight:'800' },
});
