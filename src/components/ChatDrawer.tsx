import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, TextInput } from 'react-native';
import { useChatStore } from '../store/useChatStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ChatDrawer: React.FC<Props> = ({ visible, onClose }) => {
  const threads = useChatStore((s) => s.threads);
  const activeThreadId = useChatStore((s) => s.activeThreadId);
  const createThread = useChatStore((s) => s.createThread);
  const switchThread = useChatStore((s) => s.switchThread);
  const deleteThread = useChatStore((s) => s.deleteThread);
  const renameThread = useChatStore((s) => s.renameThread);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const handleNewChat = () => {
    createThread();
    onClose();
  };

  const handleSelectThread = (id: string) => {
    switchThread(id);
    onClose();
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameText(currentTitle);
  };

  const confirmRename = () => {
    if (renamingId) {
      renameThread(renamingId, renameText.trim() || 'New Chat');
    }
    setRenamingId(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.drawer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chats</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
            <Text style={styles.newChatIcon}>+</Text>
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>

          <FlatList
            data={threads}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.threadRow,
                  item.id === activeThreadId && styles.threadRowActive,
                ]}
              >
                {renamingId === item.id ? (
                  <TextInput
                    style={styles.renameInput}
                    value={renameText}
                    onChangeText={setRenameText}
                    onSubmitEditing={confirmRename}
                    onBlur={confirmRename}
                    autoFocus
                  />
                ) : (
                  <TouchableOpacity style={styles.threadTextButton} onPress={() => handleSelectThread(item.id)}>
                    <Text style={styles.threadTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => startRename(item.id, item.title)} style={styles.actionButton}>
                  <Text style={styles.actionText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteThread(item.id)} style={styles.actionButton}>
                  <Text style={styles.actionText}>🗑</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
  },
  drawer: {
    width: 280,
    height: '100%',
    backgroundColor: '#14161b',
    paddingTop: 50,
    paddingHorizontal: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: '#f5f3ef',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: { padding: 4 },
  closeIcon: { color: '#f5f3ef', fontSize: 16 },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3d8b8b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  newChatIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  newChatText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 2,
  },
  threadRowActive: {
    backgroundColor: '#2a2e37',
  },
  threadTextButton: { flex: 1 },
  threadTitle: {
    color: '#f5f3ef',
    fontSize: 14,
  },
  renameInput: {
    flex: 1,
    color: '#f5f3ef',
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3d8b8b',
    paddingVertical: 2,
  },
  actionButton: { padding: 6 },
  actionText: { fontSize: 13 },
});