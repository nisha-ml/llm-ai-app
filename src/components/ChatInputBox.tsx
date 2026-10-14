import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { DocInfo, deleteDocument, listDocuments, uploadDocument } from '../utils/ragApi';

type Props = {
  onSend: (text: string, imageUri?: string) => void;
  disabled?: boolean;
  threadId: string | null;
};

type Pending = { key: string; name: string };

const MENU_HEIGHT = 112;

const fileType = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return { label: 'PDF', sub: 'PDF document', color: '#e5484d' };
  if (ext === 'md') return { label: 'MD', sub: 'Markdown document', color: '#7c5cdb' };
  return { label: 'TXT', sub: 'Text document', color: '#3b82f6' };
};

const FileCard: React.FC<{ name: string; busy?: boolean; onRemove?: () => void }> = ({
  name,
  busy,
  onRemove,
}) => {
  const t = fileType(name);
  return (
    <View style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: t.color }]}>
        {busy ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.cardIconText}>{t.label}</Text>
        )}
      </View>
      <View style={styles.cardTextWrap}>
        <Text style={styles.cardName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.cardSub}>{busy ? 'Indexing…' : t.sub}</Text>
      </View>
      {!busy && !!onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.cardRemove} hitSlop={8}>
          <Text style={styles.cardRemoveText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export const ChatInputBox: React.FC<Props> = ({ onSend, disabled, threadId }) => {
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(24);
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState('');

  // "+" menu
  const plusRef = useRef<View>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 12, y: 300 });

  const loadDocs = useCallback(async () => {
    if (!threadId) {
      setDocs([]);
      return;
    }
    try {
      setDocs(await listDocuments(threadId));
    } catch (e) {
      setDocs([]);
    }
  }, [threadId]);

  // Show the documents of whichever chat is open
  useEffect(() => {
    setError('');
    setPending([]);
    loadDocs();
  }, [loadDocs]);

  const openMenu = () => {
    plusRef.current?.measureInWindow((x, y) => {
      setMenuPos({ x, y });
      setMenuOpen(true);
    });
  };

  const pickImage = async () => {
    setMenuOpen(false);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      quality: 0.8,
    });
    if (res.canceled || !res.assets?.[0]) return;
    setError('');
    setImage(res.assets[0].uri);
  };

  const pickDocument = async () => {
    setMenuOpen(false);
    if (!threadId) return;
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/plain', 'text/markdown'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return;

    const asset = res.assets[0];
    const key = `${Date.now()}`;
    setError('');
    setPending((p) => [...p, { key, name: asset.name }]);
    try {
      await uploadDocument(threadId, asset);
      await loadDocs();
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setPending((p) => p.filter((x) => x.key !== key));
    }
  };

  const removeDoc = async (id: string) => {
    try {
      await deleteDocument(id);
      await loadDocs();
    } catch (e: any) {
      setError(e?.message || 'Could not remove the document');
    }
  };

  const canSend =
    (text.trim().length > 0 || !!image) && !disabled && pending.length === 0;

  const send = () => {
    if (!canSend) return;
    onSend(text.trim(), image ?? undefined);
    setText('');
    setImage(null);
    setInputHeight(24);
  };

  // Web: Enter sends, Shift+Enter makes a new line
  const onKeyPress = (e: any) => {
    if (Platform.OS !== 'web') return;
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault?.();
      send();
    }
  };

  const hasAttachments = docs.length > 0 || pending.length > 0 || !!image;

  return (
    <View style={styles.outer}>
      <View style={styles.box}>
        {/* Attachments, inside the input box (like ChatGPT / Claude) */}
        {hasAttachments && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {!!image && (
              <View style={styles.thumbWrap}>
                <Image source={{ uri: image }} style={styles.thumb} />
                <TouchableOpacity
                  style={styles.thumbRemove}
                  onPress={() => setImage(null)}
                  hitSlop={8}
                >
                  <Text style={styles.thumbRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {docs.map((d) => (
              <FileCard key={d.id} name={d.filename} onRemove={() => removeDoc(d.id)} />
            ))}
            {pending.map((p) => (
              <FileCard key={p.key} name={p.name} busy />
            ))}
          </ScrollView>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.inputRow}>
          <View ref={plusRef} collapsable={false}>
            <TouchableOpacity
              style={styles.plusBtn}
              onPress={openMenu}
              accessibilityLabel="Add image or document"
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { height: Math.min(Math.max(inputHeight, 24), 160) }]}
            value={text}
            onChangeText={setText}
            placeholder={docs.length ? 'Ask about your document…' : 'Message AI Assistant…'}
            placeholderTextColor="#9ca3af"
            multiline
            onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
            onKeyPress={onKeyPress}
          />

          <TouchableOpacity
            style={[styles.sendBtn, canSend ? styles.sendBtnOn : styles.sendBtnOff]}
            onPress={send}
            disabled={!canSend}
            accessibilityLabel="Send"
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.hint}>AI can make mistakes.</Text>

      {/* "+" popup menu: Upload image / Upload document */}
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
        <View
          style={[
            styles.menu,
            { left: Math.max(8, menuPos.x), top: Math.max(8, menuPos.y - MENU_HEIGHT - 8) },
          ]}
        >
          <TouchableOpacity style={styles.menuItem} onPress={pickImage}>
            <Text style={styles.menuIcon}>🖼️</Text>
            <Text style={styles.menuLabel}>Upload image</Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity
            style={[styles.menuItem, !threadId && styles.menuItemOff]}
            onPress={pickDocument}
            disabled={!threadId}
          >
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuLabel}>Upload document</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: { paddingHorizontal: 12, paddingBottom: 8, backgroundColor: '#ffffff' },
  box: {
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  // attachments
  cardsRow: { gap: 8, paddingHorizontal: 4, paddingTop: 4, paddingBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 240,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 8,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  cardTextWrap: { flex: 1, marginLeft: 10 },
  cardName: { color: '#111827', fontSize: 13, fontWeight: '600' },
  cardSub: { color: '#6b7280', fontSize: 12, marginTop: 1 },
  cardRemove: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  cardRemoveText: { color: '#4b5563', fontSize: 11 },

  thumbWrap: { width: 64, height: 64 },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#f3f4f6' },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: { color: '#ffffff', fontSize: 10 },

  error: { color: '#dc2626', fontSize: 12, paddingHorizontal: 8, paddingBottom: 6 },

  // text row
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { color: '#374151', fontSize: 26, lineHeight: 28 },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
    marginBottom: 3,
    ...(Platform.OS === 'web' ? ({ outlineWidth: 0 } as any) : {}),
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOn: { backgroundColor: '#111827' },
  sendBtnOff: { backgroundColor: '#e5e7eb' },
  sendIcon: { color: '#ffffff', fontSize: 18, fontWeight: '700' },

  hint: { textAlign: 'center', color: '#9ca3af', fontSize: 11, marginTop: 6 },

  // popup menu
  menu: {
    position: 'absolute',
    width: 230,
    height: MENU_HEIGHT,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
  },
  menuItemOff: { opacity: 0.4 },
  menuIcon: { fontSize: 18, width: 30 },
  menuLabel: { color: '#111827', fontSize: 15 },
  menuDivider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 12 },
});