import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export type AuthUser = { id: number; name?: string; email: string };
type Session = { token: string | null; user: AuthUser | null };

let currentToken: string | null = null;
export const getToken = () => currentToken;

let sessionPromise: Promise<Session> | null = null;

async function readSession(): Promise<Session> {
  try {
    currentToken = await AsyncStorage.getItem(TOKEN_KEY);
    const raw = await AsyncStorage.getItem(USER_KEY);
    return { token: currentToken, user: raw ? JSON.parse(raw) : null };
  } catch (e) {
    currentToken = null;
    return { token: null, user: null };
  }
}

export function loadSession(): Promise<Session> {
  if (!sessionPromise) sessionPromise = readSession();
  return sessionPromise;
}

export async function saveSession(token: string, user: AuthUser) {
  currentToken = token;
  sessionPromise = Promise.resolve({ token, user });
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {}
}

export async function clearSession() {
  currentToken = null;
  sessionPromise = Promise.resolve({ token: null, user: null });
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch (e) {}
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

let installed = false;
export function installAuthFetch(apiUrl: string) {
  if (installed) return;
  installed = true;
  loadSession(); 
  const original = globalThis.fetch.bind(globalThis);

  (globalThis as any).fetch = async (input: any, init: any = {}) => {
    const url: string = typeof input === 'string' ? input : input?.url ?? String(input);
    const isOurApi = url.startsWith(apiUrl);
    const isAuthRoute = url.startsWith(`${apiUrl}/auth/`);
    if (!isOurApi || isAuthRoute) return original(input, init);

    await loadSession();

    const headers = { ...(init.headers || {}) } as Record<string, string>;
    const sentToken = !!currentToken;
    if (currentToken) headers.Authorization = `Bearer ${currentToken}`;

    const res = await original(input, { ...init, headers });
 
    if (res.status === 401 && sentToken) onUnauthorized?.();
    return res;
  };
}