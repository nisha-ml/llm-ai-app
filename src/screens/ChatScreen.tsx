import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLLMStream } from '../hooks/useLLMStream';
import { useChatStore } from '../store/useChatStore';
import { MessageBubble } from '../components/MessageBubble';
import { InputBar } from '../components/InputBar';
import { ChatHeader } from '../components/ChatHeader';
import { ChatDrawer } from '../components/ChatDrawer';
import { Message } from '../types/chat';


export const ChatScreen: React.FC = () => {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);
  const finalizeLastMessage = useChatStore((s) => s.finalizeLastMessage);
  const { streamResponse } = useLLMStream();
  const listRef = useRef<FlatList>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleSend = async (text: string, imageUri?: string) => {
  const userMessage: Message = {
  id: Date.now().toString(),
  text,
  sender: 'user',
  timestamp: Date.now(),
  imageUri,
};
  addMessage(userMessage);

  addMessage({
    id: (Date.now() + 1).toString(),
    text: '',
    sender: 'assistant',
    timestamp: Date.now(),
    isStreaming: true,
  });

  const history = [...messages, userMessage].slice(-10).map((m) => ({
    role: m.sender as 'user' | 'assistant',
    content: m.text,
  }));

  let buffer = '';
let lastFlush = Date.now();

const flushBuffer = () => {
  if (buffer) {
    updateLastMessage(buffer);
    buffer = '';
  }
};

try {
  await streamResponse(history, (chunk) => {
    buffer += chunk;
    const now = Date.now();
    if (now - lastFlush >= 50) {
      flushBuffer();
      lastFlush = now;
    }
  });
  flushBuffer(); 
  finalizeLastMessage();
} catch (err) {
  flushBuffer();
  updateLastMessage('\n\n⚠️ Connection error. Please try again.');
  finalizeLastMessage();
}
  };
    return (
    <>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ChatHeader isOnline={true} onMenuPress={() => setDrawerVisible(true)} />

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <InputBar onSend={handleSend} disabled={isStreaming} />
      </KeyboardAvoidingView>

      <ChatDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContent: {
    paddingTop: 24,
    paddingBottom: 12,
  },
});