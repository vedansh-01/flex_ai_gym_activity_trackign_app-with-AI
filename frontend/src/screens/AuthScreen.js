import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL as BASE_URL } from '../apiConfig';

const API_URL = `${BASE_URL}/auth`;

export default function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/login' : '/register';
      const body = isLogin ? { email, password } : { name, email, password };
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        await SecureStore.setItemAsync('userToken', data.token);
        if (onLoginSuccess) onLoginSuccess(data.token);
      } else {
        Alert.alert('Authentication Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Ensure your backend is running and API_URL matches your computers local IP address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 justify-center"
      >
        {/* Header Section */}
        <View className="mb-12">
          <Text className="text-4xl font-extrabold text-white mb-6">
            Flex<Text className="text-primary">AI</Text>
          </Text>
          <Text className="text-3xl font-bold text-white">
            Train smarter.
          </Text>
          <Text className="text-3xl font-bold text-white mt-1">
            Eat <Text className="text-primary">better.</Text>
          </Text>
          <Text className="text-textSecondary mt-4 text-base">
            AI-powered gym & nutrition tracking with real-time coaching.
          </Text>
        </View>

        {/* Toggle Sign In / Sign Up */}
        <View className="flex-row border border-borderLight rounded-full p-1 mb-8">
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-full items-center ${isLogin ? 'bg-[#27272A]' : ''}`}
            onPress={() => setIsLogin(true)}
          >
            <Text className={`font-semibold ${isLogin ? 'text-white' : 'text-textSecondary'}`}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-3 rounded-full items-center ${!isLogin ? 'bg-[#27272A]' : ''}`}
            onPress={() => setIsLogin(false)}
          >
            <Text className={`font-semibold ${!isLogin ? 'text-white' : 'text-textSecondary'}`}>Sign up</Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields */}
        <View className="space-y-4 mb-6">
          {!isLogin && (
            <View>
              <Text className="text-textSecondary text-xs uppercase tracking-wider mb-2 ml-1">Full Name</Text>
              <TextInput
                className="bg-surface text-white border border-borderLight rounded-xl px-4 py-4 focus:border-primary"
                placeholder="Alex Fitness"
                placeholderTextColor="#A1A1AA"
                value={name}
                onChangeText={setName}
              />
            </View>
          )}
          <View className={!isLogin ? 'mt-4' : ''}>
            <Text className="text-textSecondary text-xs uppercase tracking-wider mb-2 ml-1">Email</Text>
            <TextInput
              className="bg-surface text-white border border-borderLight rounded-xl px-4 py-4 focus:border-primary"
              placeholder="you@example.com"
              placeholderTextColor="#A1A1AA"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View className="mt-4">
            <Text className="text-textSecondary text-xs uppercase tracking-wider mb-2 ml-1">Password</Text>
            <TextInput
              className="bg-surface text-white border border-borderLight rounded-xl px-4 py-4 focus:border-primary"
              placeholder="••••••••"
              placeholderTextColor="#A1A1AA"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* Primary Action Button */}
        {/* Primary Action Button */}
        <TouchableOpacity 
          className="bg-surface border border-borderLight py-4 rounded-xl items-center mt-2 flex-row justify-center"
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FF5722" />
          ) : (
            <Text className="text-white font-semibold text-lg">
              {isLogin ? 'Sign in' : 'Create Account'}
            </Text>
          )}
        </TouchableOpacity>
        <Text className="text-textSecondary text-center mt-6 text-sm">
          Uses free built-in JWT Authentication
        </Text>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
