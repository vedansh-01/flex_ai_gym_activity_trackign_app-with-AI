import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl, StatusBar, Dimensions
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { WeightLineChart, WorkoutIntensityBarChart, CalorieRing } from '../components/Charts';
import { getMacroTargets } from '../utils/fitnessCalc';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { API_URL } from '../apiConfig';

// ─── Helper components ────────────────────────────────────────────────────────

const StatCard = ({ label, value, unit, color = '#A1A1AA', icon }) => (
  <View style={{
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#27272A',
  }}>
    <Text style={{ fontSize: 20, marginBottom: 6 }}>{icon}</Text>
    <Text style={{ color: color, fontSize: 22, fontWeight: '800' }}>{value}</Text>
    <Text style={{ color: '#A1A1AA', fontSize: 11, marginTop: 2 }}>{unit}</Text>
    <Text style={{ color: '#52525B', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
  </View>
);

const SectionHeader = ({ title, subtitle }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>{title}</Text>
    {subtitle && <Text style={{ color: '#A1A1AA', fontSize: 12, marginTop: 2 }}>{subtitle}</Text>}
  </View>
);

const MacroBar = ({ label, current, goal, color }) => {
  const pct = Math.min((current / goal) * 100, 100);
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
        <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{current}g <Text style={{ color: '#52525B' }}>/ {goal}g</Text></Text>
      </View>
      <View style={{ height: 5, backgroundColor: '#27272A', borderRadius: 3 }}>
        <View style={{ height: 5, width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
};

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

export default function DashboardScreen({ onOpenProfile }) {
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Athlete');
  const [userProfile, setUserProfile] = useState(null); // full profile from backend

  const [stats, setStats] = useState({
    caloriesBurned: 0,
    caloriesConsumed: 0,
    protein: 0, carbs: 0, fat: 0,
    totalVolumeToday: 0,
  });

  const [weeklyVolume, setWeeklyVolume] = useState(null);
  const [currentWeight, setCurrentWeight] = useState(null);
  const [weightHistory, setWeightHistory] = useState([]);

  const loadDashboard = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (!token) return;

      // Fetch user profile
      const pRes = await fetch(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pRes.ok) {
        const user = await pRes.json();
        setUserName(user.name?.split(' ')[0] || 'Athlete');
        setUserProfile(user.profile);
        if (user.profile?.weight) setCurrentWeight(user.profile.weight);
      }

      // Fetch workouts — build weekly volume chart from real data
      const wRes = await fetch(`${API_URL}/workouts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (wRes.ok) {
        const workouts = await wRes.json();
        const today = new Date().toDateString();
        const todayW = workouts.filter(w => new Date(w.date).toDateString() === today);
        const burned = todayW.reduce((s, w) => s + (w.totalCaloriesBurned || 0), 0);
        const volume = todayW.reduce((s, w) => s + (w.totalVolume || 0), 0);
        setStats(prev => ({ ...prev, caloriesBurned: burned, totalVolumeToday: volume }));

        // Weight history — from workouts that recorded bodyWeight
        const weightPoints = workouts
          .filter(w => w.bodyWeight && w.bodyWeight > 0)
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(-10) // last 10 entries
          .map(w => ({
            value: w.bodyWeight,
            label: new Date(w.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          }));
        setWeightHistory(weightPoints);

        // Weekly volume chart
        const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayMap = {};
        DAYS.forEach(d => { dayMap[d] = 0; });
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
        startOfWeek.setHours(0, 0, 0, 0);

        workouts.forEach(w => {
          const d = new Date(w.date);
          if (d >= startOfWeek) {
            const dayIdx = (d.getDay() + 6) % 7; // 0=Mon … 6=Sun
            dayMap[DAYS[dayIdx]] += (w.totalVolume || 0);
          }
        });
        setWeeklyVolume(DAYS.map(d => ({ day: d, volume: dayMap[d] })));
      }

      // Fetch meals
      const mRes = await fetch(`${API_URL}/meals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mRes.ok) {
        const meals = await mRes.json();
        const today = new Date().toDateString();
        const todayM = meals.filter(m => new Date(m.date).toDateString() === today);
        const consumed = todayM.reduce((s, m) => s + (m.totalCalories || 0), 0);
        const protein = todayM.reduce((s, m) => s + (m.macros?.protein || 0), 0);
        const carbs = todayM.reduce((s, m) => s + (m.macros?.carbs || 0), 0);
        const fat = todayM.reduce((s, m) => s + (m.macros?.fats || 0), 0); // fixed: fats not fat
        setStats(prev => ({ ...prev, caloriesConsumed: consumed, protein, carbs, fat }));
      }
    } catch (e) {
      console.log('Dashboard fetch error:', e.message);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  useEffect(() => {
    loadDashboard();
  }, []);

  // Use targetCalories from profile (goal-adjusted), fallback to TDEE, then 2000
  const calorieGoal = userProfile?.targetCalories || userProfile?.tdee || 2000;
  // Macro targets from profile data
  const macroGoals = userProfile?.weight && userProfile?.tdee
    ? getMacroTargets(userProfile.tdee, userProfile.goal || 'maintenance', userProfile.weight, userProfile.weeklyLossGoal)
    : { protein: 160, carbs: 220, fat: 65, calories: calorieGoal };

  const caloriesRemaining = Math.max(calorieGoal - stats.caloriesConsumed + stats.caloriesBurned, 0);
  const chartWidth = SCREEN_WIDTH - 56;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF5722"
            colors={['#FF5722']}
          />
        }
      >
        {/* ── Header ── */}
        <View style={{
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <View>
            <Text style={{ color: '#A1A1AA', fontSize: 13 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 2 }}>
              Good {getGreeting()}, <Text style={{ color: '#FF5722' }}>{userName}</Text> 👋
            </Text>
          </View>
          <TouchableOpacity onPress={onOpenProfile} style={{
            width: 42, height: 42, borderRadius: 21,
            backgroundColor: '#FF5722',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── CALORIE RING + STATS ── */}
        <View style={{
          marginHorizontal: 20, backgroundColor: '#1A1A1A',
          borderRadius: 20, borderWidth: 1, borderColor: '#27272A',
          padding: 20, marginBottom: 16,
          flexDirection: 'row', alignItems: 'center',
        }}>
          {/* Ring */}
          <CalorieRing consumed={stats.caloriesConsumed} goal={calorieGoal} size={130} />

          {/* Right side breakdown */}
          <View style={{ flex: 1, marginLeft: 20 }}>
            <Text style={{ color: '#A1A1AA', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Today's Calories
            </Text>
            <View style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#A1A1AA', fontSize: 13 }}>🍽 Consumed</Text>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{stats.caloriesConsumed.toFixed(1)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#A1A1AA', fontSize: 13 }}>🔥 Burned</Text>
                <Text style={{ color: '#FF5722', fontWeight: '700' }}>{stats.caloriesBurned.toFixed(1)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#A1A1AA', fontSize: 13 }}>🎯 Goal</Text>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{calorieGoal}</Text>
              </View>
            </View>
            <View style={{ height: 1, backgroundColor: '#27272A', marginBottom: 10 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#A1A1AA', fontSize: 12 }}>Remaining</Text>
              <Text style={{ color: caloriesRemaining > 0 ? '#4ADE80' : '#EF4444', fontWeight: '800', fontSize: 15 }}>
                {caloriesRemaining.toFixed(1)} kcal
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2x2 STAT GRID ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <StatCard
              icon="🔥"
              value={stats.caloriesBurned.toFixed(1)}
              unit="kcal burned"
              label="Today's Burn"
              color="#FF5722"
            />
            <StatCard
              icon="🍽"
              value={stats.caloriesConsumed.toFixed(1)}
              unit="kcal eaten"
              label="Consumed"
              color="#60A5FA"
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard
              icon="⚡"
              value={stats.totalVolumeToday > 0 ? `${(stats.totalVolumeToday / 1000).toFixed(1)}k` : '0'}
              unit="kg lifted"
              label="Volume Today"
              color="#A78BFA"
            />
            <StatCard
              icon="🎯"
              value={caloriesRemaining.toFixed(1)}
              unit="kcal left"
              label="Cal Remaining"
              color="#4ADE80"
            />
          </View>
        </View>

        {/* ── MACRO TRACKERS ── */}
        <View style={{
          marginHorizontal: 20, backgroundColor: '#1A1A1A',
          borderRadius: 20, borderWidth: 1, borderColor: '#27272A',
          padding: 20, marginBottom: 16,
        }}>
          <SectionHeader title="Macronutrients" subtitle={`Daily targets for your goal`} />
          <MacroBar label="Protein" current={Math.round(stats.protein)} goal={macroGoals.protein} color="#FF5722" />
          <MacroBar label="Carbohydrates" current={Math.round(stats.carbs)} goal={macroGoals.carbs} color="#60A5FA" />
          <MacroBar label="Fat" current={Math.round(stats.fat)} goal={macroGoals.fat} color="#FBBF24" />
        </View>

        {/* ── WEIGHT HISTORY CHART ── */}
        <View style={{
          marginHorizontal: 20, backgroundColor: '#1A1A1A',
          borderRadius: 20, borderWidth: 1, borderColor: '#27272A',
          padding: 20, marginBottom: 16,
        }}>
          <SectionHeader
            title="⚖️ Weight History"
            subtitle={weightHistory.length > 0
              ? `Latest: ${weightHistory[weightHistory.length - 1]?.value} kg`
              : currentWeight ? `Current: ${currentWeight} kg (from profile)` : 'Log workouts with weight to track'}
          />
          {weightHistory.length >= 2 ? (
            <WeightLineChart data={weightHistory} width={chartWidth} height={150} />
          ) : weightHistory.length === 1 ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ color: '#FF5722', fontSize: 40, fontWeight: '900' }}>{weightHistory[0].value}</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 14 }}>kg — log another workout to see a graph</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Text style={{ fontSize: 36 }}>⚖️</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 13, marginTop: 8, textAlign: 'center' }}>
                Enter your weight when logging a workout{`\n`}to track your progress here
              </Text>
            </View>
          )}
        </View>

        {/* ── WORKOUT INTENSITY CHART ── */}
        <View style={{
          marginHorizontal: 20, backgroundColor: '#1A1A1A',
          borderRadius: 20, borderWidth: 1, borderColor: '#27272A',
          padding: 20, marginBottom: 16,
        }}>
          <SectionHeader
            title="Workout Intensity"
            subtitle="Weekly volume (kg lifted per day)"
          />
          {weeklyVolume && weeklyVolume.some(d => d.volume > 0) ? (
            <>
              <WorkoutIntensityBarChart data={weeklyVolume} width={chartWidth} height={150} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                    {weeklyVolume.filter(d => d.volume > 0).length}
                  </Text>
                  <Text style={{ color: '#A1A1AA', fontSize: 11 }}>Active days</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#FF5722', fontSize: 16, fontWeight: '800' }}>
                    {(weeklyVolume.reduce((s, d) => s + d.volume, 0) / 1000).toFixed(1)}k
                  </Text>
                  <Text style={{ color: '#A1A1AA', fontSize: 11 }}>Total kg/wk</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#A78BFA', fontSize: 16, fontWeight: '800' }}>
                    {(Math.max(...weeklyVolume.map(d => d.volume)) / 1000).toFixed(1)}k
                  </Text>
                  <Text style={{ color: '#A1A1AA', fontSize: 11 }}>Best day</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 28 }}>
              <Text style={{ fontSize: 36 }}>🏋️</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 13, marginTop: 8 }}>No workouts logged this week</Text>
              <Text style={{ color: '#52525B', fontSize: 12, marginTop: 4 }}>Head to the Workout tab to get started</Text>
            </View>
          )}
        </View>

        {/* ── QUICK TIPS ── */}
        <View style={{
          marginHorizontal: 20, backgroundColor: '#1A1A1A',
          borderRadius: 20, borderWidth: 1, borderColor: '#27272A',
          padding: 20, marginBottom: 16,
          borderLeftWidth: 4, borderLeftColor: '#FF5722',
        }}>
          <Text style={{ color: '#FF5722', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            💡 Today's Insight
          </Text>
          <Text style={{ color: '#fff', fontSize: 14, lineHeight: 21 }}>
            You're {caloriesRemaining > 0 ? `${caloriesRemaining.toFixed(1)} kcal under your goal` : 'over your calorie goal today'}.
            {stats.caloriesBurned > 300
              ? ' Great workout! Make sure to hit your protein target for recovery.'
              : ' Add a workout to boost your remaining calories.'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}
