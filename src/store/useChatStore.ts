import { create } from 'zustand';
import { createMMKV } from 'react-native-mmkv';
import { Message, ChatThread } from '../types/chat';

export const storage = createMMKV({ id: 'chat-storage' });

const THREADS_KEY = 'chat.threads';
const messagesKey = (threadId: string) => `chat.messages.${threadId}`;

function loadThreads(): ChatThread[] {
  const raw = storage.getString(THREADS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ChatThread[];
  } catch {
    return [];
  }
}

function persistThreads(threads: ChatThread[]) {
  storage.set(THREADS_KEY, JSON.stringify(threads));
}

function loadMessages(threadId: string): Message[] {
  const raw = storage.getString(messagesKey(threadId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

function persistMessages(threadId: string, messages: Message[]) {
  storage.set(messagesKey(threadId), JSON.stringify(messages));
}

function createId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 6);
}

interface ChatState {
  threads: ChatThread[];
  activeThreadId: string | null;
  messages: Message[];
  isStreaming: boolean;

  createThread: () => void;
  switchThread: (id: string) => void;
  deleteThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;

  addMessage: (msg: Message) => void;
  updateLastMessage: (chunk: string) => void;
  finalizeLastMessage: () => void;
  setStreaming: (value: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  // On first load: restore threads, or create a first thread if none exist.
  let threads = loadThreads();
  let activeThreadId = threads[0]?.id ?? null;

  if (threads.length === 0) {
    const id = createId();
    const now = Date.now();
    threads = [{ id, title: 'New Chat', createdAt: now, updatedAt: now }];
    activeThreadId = id;
    persistThreads(threads);
  }

  return {
    threads,
    activeThreadId,
    messages: activeThreadId ? loadMessages(activeThreadId) : [],
    isStreaming: false,

    createThread: () => {
      const id = createId();
      const now = Date.now();
      const newThread: ChatThread = { id, title: 'New Chat', createdAt: now, updatedAt: now };
      const updatedThreads = [newThread, ...get().threads];
      persistThreads(updatedThreads);
      set({ threads: updatedThreads, activeThreadId: id, messages: [] });
    },

    switchThread: (id) => {
      const msgs = loadMessages(id);
      set({ activeThreadId: id, messages: msgs });
    },

    deleteThread: (id) => {
      const remaining = get().threads.filter((t) => t.id !== id);
      storage.remove(messagesKey(id));
      persistThreads(remaining);

      if (get().activeThreadId === id) {
        if (remaining.length > 0) {
          set({
            threads: remaining,
            activeThreadId: remaining[0].id,
            messages: loadMessages(remaining[0].id),
          });
        } else {
          const newId = createId();
          const now = Date.now();
          const fresh: ChatThread = { id: newId, title: 'New Chat', createdAt: now, updatedAt: now };
          persistThreads([fresh]);
          set({ threads: [fresh], activeThreadId: newId, messages: [] });
        }
      } else {
        set({ threads: remaining });
      }
    },

    renameThread: (id, title) => {
      const updated = get().threads.map((t) => (t.id === id ? { ...t, title } : t));
      persistThreads(updated);
      set({ threads: updated });
    },

    addMessage: (msg) => {
      const threadId = get().activeThreadId;
      if (!threadId) return;
      const updated = [...get().messages, msg];
      set({ messages: updated });
      persistMessages(threadId, updated);

      // Auto-title the thread from the first user message.
      const thread = get().threads.find((t) => t.id === threadId);
      if (thread && thread.title === 'New Chat' && msg.sender === 'user') {
        const title = msg.text.slice(0, 30) || 'New Chat';
        get().renameThread(threadId, title);
      }
    },

    updateLastMessage: (chunk) => {
      const threadId = get().activeThreadId;
      if (!threadId) return;
      const updated = [...get().messages];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: updated[updated.length - 1].text + chunk,
        };
      }
      set({ messages: updated });
      persistMessages(threadId, updated);
    },

    finalizeLastMessage: () => {
      const threadId = get().activeThreadId;
      if (!threadId) return;
      const updated = [...get().messages];
      if (updated.length > 0) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
      }
      set({ messages: updated });
      persistMessages(threadId, updated);
    },

    setStreaming: (value) => set({ isStreaming: value }),
  };
});