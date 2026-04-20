import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../apiConfig';

const CHAT_API = `${API_URL}/chat`;

export default function CoachScreen({ onBack }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${CHAT_API}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(m => ({ ...m, _id: m._id || Math.random().toString() }));
        setMessages(formatted.filter(m => m.role !== 'system')); // hide system prompts
      }
    } catch (e) {
      console.log('Error loading history:', e);
    }
  };

  const sendText = async () => {
    if (!inputText.trim()) return;
    const userMsg = { _id: Date.now().toString(), role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const token = await SecureStore.getItemAsync('userToken');
      const res = await fetch(`${CHAT_API}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        // We removed generateAudio flag since TTS is dropped.
        body: JSON.stringify({ text: userMsg.content }) 
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { ...data, _id: Date.now().toString() }]);
      } else {
        const errorData = await res.json();
        Alert.alert('Error', errorData.message || 'Coach failed to respond (Quota Limit?)');
      }
    } catch (e) {
      console.log("Fetch error:", e);
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

  return (
    <SafeAreaView style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => onBack ? onBack() : null} style={s.backBtn}>
            <Ionicons name="arrow-back" size={28} color="#FF5722" />
          </TouchableOpacity>
          <Text style={s.headerEmoji}>🤖</Text>
          <Text style={s.headerTitle}>AI Coach</Text>
        </View>
        <Text style={s.poweredTxt}>Powered by Llama-3</Text>
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
  container: { flex: 1, backgroundColor: '#0E0E0E' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 40 : 10, paddingBottom: 15,
    borderBottomWidth: 1, borderBottomColor: '#1F1F1F', backgroundColor: '#121212'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { marginRight: 8, padding: 6, backgroundColor: '#1A1A1A', borderRadius: 8 },
  headerEmoji: { fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
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
  sendBtnDisabled: { backgroundColor: '#FF572250' }
});
