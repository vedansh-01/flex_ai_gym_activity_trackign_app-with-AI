import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as storage from '../utils/storage';
import { API_URL } from '../config/apiConfig';
import { supabase } from '../config/supabase';
import { usePostHog } from 'posthog-react-native';

const AI_API = `${API_URL}/ai`;
const CHAT_API = `${API_URL}/chat`;

export default function CoachScreen({ onBack }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSub, setCheckingSub] = useState(true);
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const posthog = usePostHog();
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Check if user is subscribed on mount
  const checkSubscriptionStatus = async () => {
    try {
      setCheckingSub(true);
      const token = await storage.getItem('userToken');
      
      const res = await fetch(`${AI_API}/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.active) {
          setIsSubscribed(true);
          setExpiryDate(data.expires_at);
          // Load chat history directly from Supabase (Phase 4 Database First)
          await loadHistoryDirect();
        } else {
          setIsSubscribed(false);
          posthog?.capture('ai_paywall_viewed');
        }
      } else {
        setIsSubscribed(false);
        posthog?.capture('ai_paywall_viewed');
      }
    } catch (e) {
      console.error('Subscription check failed:', e);
      setIsSubscribed(false);
      posthog?.capture('ai_paywall_viewed');
    } finally {
      setCheckingSub(false);
    }
  };

  // Load chat history from Supabase
  const loadHistoryDirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: recommendations, error } = await supabase
        .from('ai_recommendations')
        .select('prompt, response, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (recommendations) {
        const formattedMessages: any[] = [];
        recommendations.forEach((item, index) => {
          formattedMessages.push({
            _id: `p-${index}-${item.created_at}`,
            role: 'user',
            content: item.prompt
          });
          formattedMessages.push({
            _id: `r-${index}-${item.created_at}`,
            role: 'assistant',
            content: item.response
          });
        });
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching direct history:', error);
    }
  };

  // Handle code activation submission
  const handleActivateCode = async () => {
    if (!activationCode.trim()) {
      Alert.alert('Error', 'Please enter an activation code');
      return;
    }

    setActivating(true);
    try {
      const token = await storage.getItem('userToken');
      const res = await fetch(`${AI_API}/subscription/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: activationCode.trim() })
      });

      const data = await res.json().catch(() => ({ message: 'Invalid server response' }));

      if (res.ok) {
        Alert.alert('Success 🎉', data.message);
        setActivationCode('');
        setIsSubscribed(true);
        setExpiryDate(data.expires_at);
        posthog?.capture('ai_code_activated');
        await loadHistoryDirect();
      } else {
        Alert.alert('Activation Failed', data.message || 'Invalid code entered');
        posthog?.capture('ai_code_activation_failed', { reason: data.message });
      }
    } catch (error) {
      console.error('Activation error:', error);
      Alert.alert('Error', 'Server unreachable. Try again later.');
    } finally {
      setActivating(false);
    }
  };

  const sendText = async () => {
    if (!inputText.trim()) return;
    const userMsg = { _id: Date.now().toString(), role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    posthog?.capture('ai_message_sent');

    try {
      const token = await storage.getItem('userToken');
      const res = await fetch(`${CHAT_API}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: userMsg.content }) 
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data) {
          setMessages(prev => [...prev, { ...data, _id: Date.now().toString() }]);
        } else {
          Alert.alert('Error', 'Coach sent an invalid response format');
        }
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Coach failed to respond' }));
        if (res.status === 403 && errorData.code === 'SUBSCRIPTION_LOCKED') {
          setIsSubscribed(false);
          Alert.alert('Subscription Expired', 'Please enter a new activation code to continue.');
        } else {
          Alert.alert('Error', errorData.message || 'Coach failed to respond');
        }
      }
    } catch (e) {
      console.error("Fetch error:", e);
      Alert.alert('Error', 'Coach unreachable');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[s.msgBubble, isUser ? s.msgUser : s.msgCoach]}>
        {!isUser && <Text style={s.msgRole}>FlexAI</Text>}
        <Text style={[s.msgText, isUser ? s.txtUser : s.txtCoach]}>{item.content}</Text>
      </View>
    );
  };

  // ─── LOBBY / LOADING STATE ───
  if (checkingSub) {
    return (
      <SafeAreaView style={s.centerContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={{ color: '#A1A1AA', fontSize: 14, marginTop: 8 }}>Securing Premium AI Link...</Text>
      </SafeAreaView>
    );
  }

  // ─── PAYWALL LOCKED UI ───
  if (!isSubscribed) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.paywallHeader}>
          <TouchableOpacity onPress={() => onBack ? onBack() : null} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FF5722" />
          </TouchableOpacity>
          <Text style={s.paywallHeaderTitle}>Unlock FlexAI Premium</Text>
        </View>

        <ScrollView contentContainerStyle={s.paywallScroll}>
          {/* Main Visual Header */}
          <View style={s.visualSection}>
            <Text style={s.lockIcon}>🤖</Text>
            <Text style={s.visualTitle}>FlexAI Gym Personal Coach</Text>
            <Text style={s.visualSubtitle}>
              Activate your custom workouts, nutritional meal plans, and real-time elite personal coaching.
            </Text>
          </View>

          {/* Subscription Tiers */}
          <View style={s.tiersContainer}>
            <View style={[s.tierCard, { borderColor: '#B0BEC5' }]}>
              <View style={s.tierBadgeBronze}><Text style={s.badgeTxt}>BRONZE</Text></View>
              <Text style={s.tierTitle}>1 Month AI Access</Text>
              <Text style={s.tierCodeHint}>Enter 1 Month Activation Code</Text>
            </View>

            <View style={[s.tierCard, s.tierCardFeatured]}>
              <View style={s.tierBadgeSilver}><Text style={s.badgeTxtFeatured}>SILVER</Text></View>
              <Text style={s.tierTitleFeatured}>6 Months AI Access</Text>
              <Text style={s.tierCodeHintFeatured}>Best Value Choice</Text>
            </View>

            <View style={[s.tierCard, { borderColor: '#FFD700' }]}>
              <View style={s.tierBadgeGold}><Text style={s.badgeTxt}>GOLD</Text></View>
              <Text style={s.tierTitle}>12 Months AI Access</Text>
              <Text style={s.tierCodeHint}>Elite Annual Training Plan</Text>
            </View>
          </View>

          {/* Activation Form */}
          <View style={s.formContainer}>
            <Text style={s.inputLabel}>Enter Activation Code</Text>
            <TextInput
              style={s.activationInput}
              placeholder="e.g. Mirrorofgym1month@123"
              placeholderTextColor="#52525B"
              value={activationCode}
              onChangeText={setActivationCode}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity 
              style={[s.activateBtn, !activationCode.trim() && s.activateBtnDisabled]} 
              onPress={handleActivateCode}
              disabled={!activationCode.trim() || activating}
            >
              {activating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.activateBtnTxt}>Activate AI Coach →</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── ACTIVE CHAT COACH UI ───
  return (
    <SafeAreaView style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => onBack ? onBack() : null} style={s.backBtn}>
            <Ionicons name="arrow-back" size={28} color="#FF5722" />
          </TouchableOpacity>
          <Text style={s.headerEmoji}>🤖</Text>
          <View>
            <Text style={s.headerTitle}>AI Coach</Text>
            {expiryDate && (
              <Text style={s.expiryTxt}>
                Active until: {new Date(expiryDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        <Text style={s.poweredTxt}>Gemma-3 12B</Text>
      </View>

      {/* ── Chat Content Wrapped for Keyboard ── */}
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior="padding"
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderMessage}
            contentContainerStyle={s.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {isLoading && (
            <View style={s.loadingArea}>
              <ActivityIndicator color="#FF5722" size="small" />
              <Text style={s.loadingTxt}>Coach is thinking...</Text>
            </View>
          )}

          <View style={s.inputContainer}>
            <TextInput
              style={s.input}
              placeholder="Ask your coach..."
              placeholderTextColor="#52525B"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={300}
            />
            
            <TouchableOpacity 
              style={[s.sendBtn, !inputText.trim() && s.sendBtnDisabled]} 
              onPress={sendText}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderMessage}
            contentContainerStyle={s.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {isLoading && (
            <View style={s.loadingArea}>
              <ActivityIndicator color="#FF5722" size="small" />
              <Text style={s.loadingTxt}>Coach is thinking...</Text>
            </View>
          )}

          <View style={s.inputContainer}>
            <TextInput
              style={s.input}
              placeholder="Ask your coach..."
              placeholderTextColor="#52525B"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={300}
            />
            
            <TouchableOpacity 
              style={[s.sendBtn, !inputText.trim() && s.sendBtnDisabled]} 
              onPress={sendText}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  centerContainer: { flex: 1, backgroundColor: '#0E0E0E', justifyContent: 'center', alignItems: 'center', gap: 16 },
  container: { flex: 1, backgroundColor: '#0E0E0E' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 40 : 10, paddingBottom: 15,
    borderBottomWidth: 1, borderBottomColor: '#1F1F1F', backgroundColor: '#121212'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { marginRight: 8, padding: 6, backgroundColor: '#1A1A1A', borderRadius: 8 },
  headerEmoji: { fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  expiryTxt: { color: '#10B981', fontSize: 11, fontWeight: '600' },
  poweredTxt: { color: '#A1A1AA', fontSize: 10, fontStyle: 'italic' },
  
  chatList: { padding: 16, gap: 12, paddingBottom: 40 },
  
  msgBubble: { maxWidth: '85%', padding: 12, borderRadius: 16 },
  msgUser: { alignSelf: 'flex-end', backgroundColor: '#FF5722', borderBottomRightRadius: 4 },
  msgCoach: { alignSelf: 'flex-start', backgroundColor: '#1A1A1A', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#27272A' },
  
  msgRole: { color: '#FF5722', fontSize: 11, fontWeight: '800', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  msgText: { fontSize: 15, lineHeight: 22 },
  txtUser: { color: '#fff' },
  txtCoach: { color: '#E4E4E7' },

  loadingArea: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  loadingTxt: { color: '#FF5722', fontSize: 13, fontWeight: '600' },

  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: Platform.OS === 'ios' ? 20 : 12, backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: '#1F1F1F' },
  input: { flex: 1, backgroundColor: '#1A1A1A', color: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: '#27272A' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF5722', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  sendBtnDisabled: { backgroundColor: '#FF572250' },

  // Paywall CSS Styling
  paywallHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1F1F1F', backgroundColor: '#121212' },
  paywallHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginLeft: 8 },
  paywallScroll: { padding: 16, paddingBottom: 40 },
  visualSection: { alignItems: 'center', marginVertical: 20, paddingHorizontal: 16 },
  lockIcon: { fontSize: 60, marginBottom: 12 },
  visualTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  visualSubtitle: { color: '#A1A1AA', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  
  tiersContainer: { gap: 12, marginVertical: 24 },
  tierCard: { flexDirection: 'row', backgroundColor: '#121212', borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'space-between' },
  tierCardFeatured: { flexDirection: 'row', backgroundColor: '#1A110E', borderWidth: 2, borderColor: '#FF5722', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'space-between' },
  
  tierBadgeBronze: { backgroundColor: '#374151', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tierBadgeSilver: { backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tierBadgeGold: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
  badgeTxtFeatured: { color: '#FF5722', fontSize: 9, fontWeight: '900' },
  
  tierTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1, marginLeft: 12 },
  tierTitleFeatured: { color: '#FF5722', fontSize: 16, fontWeight: '800', flex: 1, marginLeft: 12 },
  tierCodeHint: { color: '#71717A', fontSize: 11, fontWeight: '600' },
  tierCodeHintFeatured: { color: '#FF5722', fontSize: 12, fontWeight: '700' },
  
  formContainer: { backgroundColor: '#121212', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1F1F1F' },
  inputLabel: { color: '#E4E4E7', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  activationInput: { backgroundColor: '#1A1A1A', color: '#fff', borderWidth: 1, borderColor: '#27272A', borderRadius: 8, padding: 14, fontSize: 15, marginBottom: 16 },
  activateBtn: { backgroundColor: '#FF5722', borderRadius: 8, padding: 15, alignItems: 'center', justifyContent: 'center' },
  activateBtnDisabled: { backgroundColor: '#FF572240' },
  activateBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' }
});
