import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, TextInput } from 'react-native';
import { useChatStore } from '../store/useChatStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export const ChatDrawer: React.FC<Props> = ({ visible, onClose, userName, userEmail, onLogout }) => {
  const threads = useChatStore((s) => s.threads);
  const activeThreadId = useChatStore((s) => s.activeThreadId);
  const createThread = useChatStore((s) => s.createThread);
  const switchThread = useChatStore((s) => s.switchThread);
  const deleteThread = useChatStore((s) => s.deleteThread);
  const renameThread = useChatStore((s) => s.renameThread);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = (userName || userEmail || 'U').trim().charAt(0).toUpperCase();

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

  const handleClose = () => {
    setMenuOpen(false);
    onClose();
  };

  const handleLogout = () => {
    setMenuOpen(false);
    onClose();
    onLogout?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.drawer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chats</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
            <Text style={styles.newChatIcon}>+</Text>
            <Text style={styles.newChatText}>New Chat</Text>
          </TouchableOpacity>

          <FlatList
            style={styles.list}
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

          {/* User profile at the bottom-left (like Claude) */}
          <View style={styles.footer}>
            {menuOpen && (
              <View style={styles.menu}>
                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <Text style={styles.menuLogout}>Log out</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={styles.profileRow}
              activeOpacity={0.7}
              onPress={() => setMenuOpen((v) => !v)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.profileTextWrap}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {userName || 'User'}
                </Text>
                {!!userEmail && (
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {userEmail}
                  </Text>
                )}
              </View>
              <Text style={styles.chevron}>{menuOpen ? '▾' : '▴'}</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 12,
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
  list: { flex: 1 },
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

  // ----- user profile footer -----
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#2a2e37',
    paddingTop: 10,
  },
  menu: {
    backgroundColor: '#1f232b',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2e37',
  },
  menuItem: { paddingVertical: 12, paddingHorizontal: 14 },
  menuLogout: { color: '#f87171', fontSize: 14, fontWeight: '600' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3d8b8b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#ffffff', fontWeight: '700', fontSize: 16 },
  profileTextWrap: { flex: 1 },
  profileName: { color: '#f5f3ef', fontSize: 14, fontWeight: '600' },
  profileEmail: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
  chevron: { color: '#9ca3af', fontSize: 12, marginLeft: 6 },
});