import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useLLMStream } from '../hooks/useLLMStream';
import { useChatStore } from '../store/useChatStore';
import { MessageBubble } from '../components/MessageBubble';
import { ChatHeader } from '../components/ChatHeader';
import { ChatDrawer } from '../components/ChatDrawer';
import { ChatInputBox } from '../components/ChatInputBox';
import { NotepadPanel } from '../components/NotepadPanel';
import { buildRagPrompt, searchContext } from '../utils/ragApi';
import { Message } from '../types/chat';
import { formatDateLabel, isSameDay } from '../utils/dateTime';

type Props = {
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
};

export const ChatScreen: React.FC<Props> = ({ userName, userEmail, onLogout }) => {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const activeThreadId = useChatStore((s) => s.activeThreadId);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);
  const finalizeLastMessage = useChatStore((s) => s.finalizeLastMessage);
  const { streamResponse } = useLLMStream();
  const listRef = useRef<FlatList>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 900; // wide screen: notepad sits beside the chat; small screen: it slides over it

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

    // RAG: if this chat has uploaded documents, find the relevant excerpts and
    // send them to the LLM together with the question (the saved message stays unchanged)
    if (activeThreadId && text.trim()) {
      const excerpts = await searchContext(activeThreadId, text);
      if (excerpts.length > 0) {
        history[history.length - 1].content = buildRagPrompt(text, excerpts);
      }
    }

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
      <View style={styles.row}>
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
          renderItem={({ item, index }) => {
            const prev = messages[index - 1];
            const showDate = !prev || !isSameDay(prev.timestamp, item.timestamp);
            return (
              <>
                {showDate && (
                  <View style={styles.dateWrap}>
                    <Text style={styles.dateText}>{formatDateLabel(item.timestamp)}</Text>
                  </View>
                )}
                <MessageBubble message={item} />
              </>
            );
          }}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <ChatInputBox onSend={handleSend} disabled={isStreaming} threadId={activeThreadId} />

        {/* Notepad button, top right of the chat */}
        {!wide && !notepadOpen && (
          <TouchableOpacity style={styles.notepadBtn} onPress={() => setNotepadOpen(true)}>
            <Text style={styles.notepadBtnText}>📝 Notepad</Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>

      {/* Wide screen: the notepad is always open on the right, the chat stays usable */}
      {wide && <NotepadPanel docked visible />}
      </View>

      {/* Small screen: a button opens the notepad over the chat */}
      {!wide && (
        <NotepadPanel visible={notepadOpen} onClose={() => setNotepadOpen(false)} />
      )}

      <ChatDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        userName={userName}
        userEmail={userEmail}
        onLogout={onLogout}
      />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  notepadBtn: {
    position: 'absolute',
    top: 14,
    right: 44,
    backgroundColor: '#fffdf5',
    borderWidth: 1,
    borderColor: '#e7e0c8',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  notepadBtnText: { color: '#44403c', fontSize: 13, fontWeight: '600' },
  flex: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listContent: {
    paddingTop: 24,
    paddingBottom: 12,
  },
  dateWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
});