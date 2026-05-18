import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  StyleSheet, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

// ─── OTP Verification Screen ──────────────────────────────────────────────────
function OTPScreen({ email, onVerified, onCancel }: { email: string; onVerified: (token: string, session: any) => void; onCancel: () => void }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);

  // Countdown for resend
  React.useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code sent to your email.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });

      if (error) {
        Alert.alert('Verification Failed', error.message || 'Invalid or expired code. Try again.');
      } else if (data.session) {
        onVerified(data.session.access_token, data.session);
      } else {
        Alert.alert('Verification Failed', 'Failed to retrieve session.');
      }
    } catch (err) {
      Alert.alert('Network Error', 'Could not reach the server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      if (error) {
        Alert.alert('Error', error.message || 'Could not resend the code.');
      } else {
        Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
        setTimer(60); // Set a longer wait after first resend
      }
    } catch (err) {
      Alert.alert('Error', 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <TouchableOpacity style={styles.backBtn} onPress={onCancel}>
          <Text style={styles.backBtnText}>← Back to Sign in</Text>
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>📧</Text>
        </View>

        <Text style={styles.heading}>Verify your email</Text>
        <Text style={styles.sub}>
          We've sent a 6-digit verification code to{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="0 0 0 0 0 0"
          placeholderTextColor="#3F3F46"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          textAlign="center"
          autoFocus
        />

        <TouchableOpacity
          style={[styles.primaryBtn, (loading || otp.length < 6) && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading || otp.length < 6}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>Verify Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.resendBtn, timer > 0 && { opacity: 0.5 }]} 
          onPress={handleResend} 
          disabled={resending || timer > 0}
        >
          <Text style={[styles.resendText, timer === 0 && { color: '#FF5722' }]}>
            {resending ? 'Sending…' : timer > 0 ? `Resend code in ${timer}s` : 'Didn\'t get the code? Resend'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Didn't receive an email? Check your spam folder or try resending after the timer.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Main Auth Screen ─────────────────────────────────────────────────────────
export default function AuthScreen({ onLoginSuccess }: { onLoginSuccess: (token: string, session: any) => void }) {
  // step: 'auth' → 'verify' | 'forgotPassword'
  const [step, setStep] = useState<'auth' | 'verify' | 'forgotPassword'>('auth');
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          setError(error.message || 'Something went wrong. Please try again.');
        } else if (data.session) {
          onLoginSuccess(data.session.access_token, data.session);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });

        if (error) {
          setError(error.message || 'Registration failed. Please try again.');
        } else {
          // If signup requires verification, Supabase returns a user but no session
          if (data.user && !data.session) {
            setStep('verify');
          } else if (data.session) {
            onLoginSuccess(data.session.access_token, data.session);
          }
        }
      }
    } catch (err: any) {
      setError('Network Error: Could not reach the server.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setError(error.message || 'Could not send reset link. Try again.');
      } else {
        Alert.alert('Reset Link Sent', 'Check your email for the password reset link.');
        setStep('auth');
      }
    } catch (err) {
      setError('Network Error: Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  // OTP step — completely replaces the auth form, no back button
  if (step === 'verify') {
    return (
      <OTPScreen
        email={email}
        onVerified={onLoginSuccess}
        onCancel={() => setStep('auth')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        {step === 'forgotPassword' && (
          <TouchableOpacity style={styles.backBtn} onPress={() => { setStep('auth'); setError(''); }}>
            <Text style={styles.backBtnText}>← Back to Sign in</Text>
          </TouchableOpacity>
        )}

        {/* Branding */}
        <View style={styles.brandWrap}>
          <Text style={styles.brand}>Flex<Text style={styles.brandAccent}>AI</Text></Text>
          {step === 'forgotPassword' ? (
            <Text style={styles.tagline1}>Reset Password.</Text>
          ) : (
            <>
              <Text style={styles.tagline1}>Train smarter.</Text>
              <Text style={styles.tagline2}>Eat <Text style={styles.brandAccent}>better.</Text></Text>
              <Text style={styles.taglineSub}>AI-powered gym & nutrition tracking with real-time coaching.</Text>
            </>
          )}
        </View>

        {/* Toggle */}
        {step !== 'forgotPassword' && (
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
              onPress={() => { setIsLogin(true); setError(''); }}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
              onPress={() => { setIsLogin(false); setError(''); }}
            >
              <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Sign up</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Error Message */}
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Fields */}
        <View style={styles.fields}>
          {!isLogin && step !== 'forgotPassword' && (
            <>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Alex Fitness"
                placeholderTextColor="#3F3F46"
                value={name}
                onChangeText={setName}
              />
            </>
          )}
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#3F3F46"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {step !== 'forgotPassword' && (
            <>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#3F3F46"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </>
          )}
          
          {isLogin && step === 'auth' && (
             <TouchableOpacity style={styles.forgotBtn} onPress={() => { setStep('forgotPassword'); setError(''); }}>
               <Text style={styles.forgotText}>Forgot Password?</Text>
             </TouchableOpacity>
          )}
        </View>

        {/* Submit */}
        {step === 'forgotPassword' ? (
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Send Reset Link</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>
                  {isLogin ? 'Sign in' : 'Create Account →'}
                </Text>
            }
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => onLoginSuccess('demo-token', { user: { id: 'demo-user', email: 'guest@flexai.com' } })}
        >
          <Text style={styles.guestBtnText}>Explore as Guest (Demo Mode)</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>🔒 Secured with Supabase · Email verified</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0C0C' },
  inner:     { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },

  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : 20,
    left: 0,
    padding: 10,
    zIndex: 10,
  },
  backBtnText: { color: '#FF5722', fontSize: 14, fontWeight: '600' },

  // OTP Screen
  iconWrap:       { alignItems: 'center', marginBottom: 20 },
  iconText:       { fontSize: 64 },
  heading:        { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  sub:            { color: '#A1A1AA', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  emailHighlight: { color: '#FF5722', fontWeight: '700' },
  otpInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2, borderColor: '#FF5722', borderRadius: 18,
    paddingVertical: 20, paddingHorizontal: 16,
    color: '#fff', fontSize: 32, fontWeight: '800',
    letterSpacing: 12, marginBottom: 24,
  },
  resendBtn:  { marginTop: 16, alignItems: 'center' },
  resendText: { color: '#52525B', fontSize: 13 },
  hint:       { color: '#3F3F46', fontSize: 11, textAlign: 'center', marginTop: 32, lineHeight: 18 },

  // Auth Screen
  brandWrap:   { marginBottom: 36, marginTop: 40 },
  brand:       { color: '#fff', fontSize: 40, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
  brandAccent: { color: '#FF5722' },
  tagline1:    { color: '#fff', fontSize: 28, fontWeight: '800' },
  tagline2:    { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  taglineSub:  { color: '#71717A', fontSize: 13, lineHeight: 20 },

  toggle: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A',
    borderRadius: 99, padding: 4, marginBottom: 28,
  },
  toggleBtn:       { flex: 1, paddingVertical: 10, borderRadius: 99, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#27272A' },
  toggleText:      { color: '#52525B', fontWeight: '600', fontSize: 14 },
  toggleTextActive: { color: '#fff' },

  fields:  { marginBottom: 24 },
  label:   { color: '#52525B', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#27272A',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 15,
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotText: {
    color: '#FF5722',
    fontSize: 12,
    fontWeight: '600',
  },

  primaryBtn: {
    backgroundColor: '#FF5722', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled:     { opacity: 0.6 },
  primaryBtnText:  { color: '#fff', fontWeight: '800', fontSize: 16 },

  footnote: { color: '#3F3F46', fontSize: 11, textAlign: 'center', marginTop: 20 },
  
  guestBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 14,
    backgroundColor: '#161618',
  },
  guestBtnText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '700',
  },
  
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3F1212',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
