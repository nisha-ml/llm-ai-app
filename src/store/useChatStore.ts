import { create } from 'zustand';
import { Message, ChatThread } from '../types/chat';
import { API_URL } from '../screens/LoginScreen';
import { getToken, loadSession } from '../utils/authStorage';

function createId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 6);
}

// Every backend call goes through here: it adds the logged-in user's token
// and throws if the server says no (so we never save "empty" threads).
async function api(path: string, options: RequestInit = {}) {
  await loadSession(); // make sure the saved token has been read
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} failed with status ${res.status}`);
  }
  return res.json();
}

const toThread = (t: any): ChatThread => ({
  id: t.id,
  title: t.title,
  createdAt: Number(t.created_at),
  updatedAt: Number(t.updated_at),
});

export interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  messages: Message[];
  isStreaming: boolean;
  isLoading: boolean;

  fetchThreads: () => Promise<void>;
  createThread: () => Promise<void>;
  switchThread: (id: string) => Promise<void>;
  deleteThread: (id: string) => Promise<void>;
  renameThread: (id: string, title: string) => Promise<void>;

  addMessage: (msg: Message) => Promise<void>;
  updateLastMessage: (chunk: string) => void;
  finalizeLastMessage: () => Promise<void>;
  setStreaming: (value: boolean) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  threads: [],
  activeThreadId: null,
  messages: [],
  isStreaming: false,
  isLoading: false,

  fetchThreads: async () => {
    set({ isLoading: true });
    try {
      const data = await api('/threads');
      const formattedThreads: ChatThread[] = data.map(toThread);

      if (formattedThreads.length > 0) {
        const firstThreadId = formattedThreads[0].id;
        set({ threads: formattedThreads, activeThreadId: firstThreadId });
        await get().switchThread(firstThreadId);
      } else {
        set({ threads: [], activeThreadId: null, messages: [] });
        await get().createThread();
      }
    } catch (err) {
      console.error('Failed to fetch threads:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createThread: async () => {
    const id = createId();
    try {
      // Only add the thread to the screen after the server has really saved it
      const t = await api('/threads', {
        method: 'POST',
        body: JSON.stringify({ id, title: 'New Chat' }),
      });
      set({
        threads: [toThread(t), ...get().threads],
        activeThreadId: t.id,
        messages: [],
      });
    } catch (err) {
      console.error('Failed to create thread:', err);
    }
  },

  switchThread: async (id: string) => {
    set({ activeThreadId: id, messages: [] });
    try {
      const data = await api(`/threads/${id}/messages`);
      const formattedMessages: Message[] = data.map((m: any) => ({
        id: m.id,
        text: m.text,
        sender: m.sender,
        timestamp: Number(m.timestamp),
        imageUri: m.image_uri || undefined,
      }));
      // ignore the result if the user already switched to another chat
      if (get().activeThreadId === id) set({ messages: formattedMessages });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  },

  deleteThread: async (id: string) => {
    try {
      await api(`/threads/${id}`, { method: 'DELETE' });

      const remaining = get().threads.filter((t: ChatThread) => t.id !== id);
      if (get().activeThreadId === id) {
        if (remaining.length > 0) {
          set({ threads: remaining });
          await get().switchThread(remaining[0].id);
        } else {
          set({ threads: [], messages: [], activeThreadId: null });
          await get().createThread();
        }
      } else {
        set({ threads: remaining });
      }
    } catch (err) {
      console.error('Failed to delete thread:', err);
    }
  },

  renameThread: async (id: string, title: string) => {
    try {
      await api(`/threads/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title }),
      });

      const updated = get().threads.map((t: ChatThread) =>
        t.id === id ? { ...t, title } : t
      );
      set({ threads: updated });
    } catch (err) {
      console.error('Failed to rename thread:', err);
    }
  },

  addMessage: async (msg: Message) => {
    const threadId = get().activeThreadId;
    if (!threadId) return;

    set({ messages: [...get().messages, msg] });

    try {
      await api(`/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          timestamp: msg.timestamp,
          imageUri: msg.imageUri || null,
        }),
      });

      // Name the chat after the first user message
      const currentThread = get().threads.find((t: ChatThread) => t.id === threadId);
      if (currentThread && currentThread.title === 'New Chat' && msg.sender === 'user') {
        const title = msg.text.slice(0, 30) || 'New Chat';
        await get().renameThread(threadId, title);
      }
    } catch (err) {
      console.error('Failed to persist message:', err);
    }
  },

  updateLastMessage: (chunk: string) => {
    const messages = [...get().messages];
    if (messages.length === 0) return;

    const lastIdx = messages.length - 1;
    messages[lastIdx] = {
      ...messages[lastIdx],
      text: messages[lastIdx].text + chunk,
    };
    set({ messages });
  },

  finalizeLastMessage: async () => {
    const messages = [...get().messages];
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    messages[messages.length - 1] = {
      ...lastMsg,
      isStreaming: false,
    };
    set({ messages, isStreaming: false });

    try {
      await api(`/messages/${lastMsg.id}`, {
        method: 'PUT',
        body: JSON.stringify({ text: lastMsg.text }),
      });
    } catch (err) {
      console.error('Failed to finalize message:', err);
    }
  },

  setStreaming: (value: boolean) => set({ isStreaming: value }),
}));