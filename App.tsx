import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useChatStore } from './src/store/useChatStore';
import { ChatScreen } from './src/screens/ChatScreen';
import LoginScreen, { API_URL } from './src/screens/LoginScreen';
import {
  AuthUser,
  clearSession,
  installAuthFetch,
  loadSession,
  saveSession,
  setUnauthorizedHandler,
} from './src/utils/authStorage';

// Every request to our backend now carries the logged-in user's token
installAuthFetch(API_URL);

export default function App() {
  const fetchThreads = useChatStore((state) => state.fetchThreads);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Clear the previous user's chats from memory
  const resetStore = () => {
    useChatStore.setState({ threads: [], activeThreadId: null, messages: [], isStreaming: false } as any);
  };

  const logout = async () => {
    await clearSession();
    resetStore();
    setToken(null);
    setUser(null);
  };

  // On start / page reload: restore the saved login
  useEffect(() => {
    setUnauthorizedHandler(logout);
    loadSession().then((s) => {
      setToken(s.token);
      setUser(s.user);
      setReady(true);
    });
  }, []);

  // Load only this user's chats
  useEffect(() => {
    if (token) fetchThreads();
  }, [token]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator color="#10A37F" />
      </View>
    );
  }

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar style="light" />
        {token ? (
          // key={user id} -> a fresh ChatScreen for every user
          <ChatScreen
            key={user?.id ?? 'user'}
            userName={displayName}
            userEmail={user?.email}
            onLogout={logout}
          />
        ) : (
          <LoginScreen
            onLoggedIn={async (t, u) => {
              await saveSession(t, u);
              setUser(u);
              setToken(t);
            }}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}