import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Backend address.
// - Web / emulator: 'http://localhost:3001'
// - Real phone: 'http://<your-PC-IP>:3001' (same Wi-Fi), e.g. 'http://192.168.1.5:3001'
// Keep the port the same as your backend (node index.js) port.
export const API_URL = 'http://localhost:3001';

export type User = { id: number; name: string; email: string };

type Props = {
  onLoggedIn: (token: string, user: User) => void;
};

export default function LoginScreen({ onLoggedIn }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        onLoggedIn(data.token, data.user);
      }
    } catch (e) {
      setError('Cannot connect to the server. Check API_URL and the backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'login' ? 'Login' : 'Create account'}</Text>

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={submit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{mode === 'login' ? 'Login' : 'Register'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setError('');
            setMode(mode === 'login' ? 'register' : 'login');
          }}
        >
          <Text style={styles.switchText}>
            {mode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1A1D23',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0F172A',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  error: { color: '#F87171', marginBottom: 12 },
  button: {
    backgroundColor: '#10A37F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText: { color: '#94A3B8', textAlign: 'center', marginTop: 16 },
});