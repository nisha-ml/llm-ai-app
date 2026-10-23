import { API_URL } from '../screens/LoginScreen';
import { getToken, loadSession } from './authStorage';

async function request(path: string, options: RequestInit = {}) {
  await loadSession();
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} failed (${res.status})`);
  return res.json();
}

// The logged-in user's note ('' if none saved yet)
export async function getNote(): Promise<string> {
  const data = await request('/notepad');
  return data.content ?? '';
}

export async function saveNote(content: string): Promise<void> {
  await request('/notepad', { method: 'PUT', body: JSON.stringify({ content }) });
}