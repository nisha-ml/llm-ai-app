import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNote, saveNote } from '../utils/notesApi';
import { loadSession } from '../utils/authStorage';

type Props = {
  visible: boolean;
  onClose?: () => void; // only used when the panel slides over the chat (small screens)
  docked?: boolean; // true: always open beside the chat (wide screens)
};

const friendlyError = (e: any, action: string) =>
  String(e?.message || '').includes('(404)')
    ? 'The server has no notepad yet. Update the backend index.js and restart it.'
    : `Could not ${action}. Check that the backend is running.`;

// One private notepad per user. Ctrl+S saves it to the database.
// Your text is also kept on this device while you type, so nothing is lost if you close it.
export const NotepadPanel: React.FC<Props> = ({ visible, onClose, docked = false }) => {
  const [text, setText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const draftKey = useRef('notepad_draft:me');

  const dirty = text !== savedText;

  const say = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
  };

  // Load the note when the panel opens
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadFailed(false);
      say('Loading…');
      const session = await loadSession();
      draftKey.current = `notepad_draft:${session.user?.id ?? 'me'}`;
      let draft: string | null = null;
      try {
        draft = await AsyncStorage.getItem(draftKey.current);
      } catch (e) {}
      try {
        const server = await getNote();
        if (cancelled) return;
        setSavedText(server);
        if (draft !== null && draft !== server) {
          setText(draft); // text typed earlier but never saved
          say('Restored your unsaved text. Press Ctrl+S to save.');
        } else {
          setText(server);
          say('');
        }
      } catch (e: any) {
        if (cancelled) return;
        setLoadFailed(true);
        setSavedText('');
        if (draft !== null) setText(draft);
        say(friendlyError(e, 'load your note'), true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, reloadKey]);

  const save = async () => {
    if (loading || busy) return;
    if (loadFailed) {
      say('Cannot save until the server is reachable. Your text is kept on this device.', true);
      return;
    }
    if (!dirty) {
      say('Already saved');
      return;
    }
    setBusy(true);
    say('Saving…');
    try {
      await saveNote(text);
      setSavedText(text);
      try {
        await AsyncStorage.removeItem(draftKey.current);
      } catch (e) {}
      say('Saved ✓');
    } catch (e: any) {
      say(friendlyError(e, 'save'), true);
    } finally {
      setBusy(false);
    }
  };

  const onChange = (value: string) => {
    setText(value);
    if (message) say('');
    AsyncStorage.setItem(draftKey.current, value).catch(() => {}); // local backup
  };

  // Ctrl+S / Cmd+S while typing in the notepad saves the NOTE (never the browser's file dialog).
  // Outside the notepad, Ctrl+S keeps its normal browser behaviour.
  const saveRef = useRef(save);
  saveRef.current = save;
  const panelRef = useRef<any>(null);
  const focusedRef = useRef(false);
  useEffect(() => {
    const doc = (globalThis as any).document;
    if (Platform.OS !== 'web' || !visible || !doc) return;
    const onKey = (e: any) => {
      const isS = e.code === 'KeyS' || String(e.key).toLowerCase() === 's';
      if (!((e.ctrlKey || e.metaKey) && isS)) return;
      const node = panelRef.current;
      const inside =
        focusedRef.current ||
        (node && typeof node.contains === 'function' && node.contains(doc.activeElement));
      if (!inside) return;
      e.preventDefault();
      e.stopPropagation();
      saveRef.current();
    };
    doc.addEventListener('keydown', onKey, true);
    return () => doc.removeEventListener('keydown', onKey, true);
  }, [visible]);

  const statusText = message || (dirty ? 'Unsaved changes. Press Ctrl+S to save.' : '');

  const panel = (
    <View ref={panelRef} style={[styles.panel, docked ? styles.panelDocked : styles.panelOverlay]}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 Notepad</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.saveBtn, (loading || busy) && styles.saveBtnOff]}
            onPress={save}
            disabled={loading || busy}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
          {!docked && !!onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={[styles.status, isError && styles.statusError]} numberOfLines={2}>
          {statusText || 'Ctrl+S saves your note'}
        </Text>
        {loadFailed && (
          <TouchableOpacity onPress={() => setReloadKey((k) => k + 1)}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={onChange}
        editable={!loading}
        onFocus={() => {
          focusedRef.current = true;
        }}
        onBlur={() => {
          focusedRef.current = false;
        }}
        multiline
        placeholder={loading ? '' : 'Write your notes here…'}
        placeholderTextColor="#a8a29e"
        textAlignVertical="top"
      />
    </View>
  );

  // Docked: always open beside the chat (no dark overlay, the chat stays usable)
  if (docked) return panel;

  // Small screens: slides over the chat
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {panel}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#fffdf5',
    borderLeftWidth: 1,
    borderLeftColor: '#e7e5e4',
  },
  panelOverlay: {
    width: '100%',
    maxWidth: 460,
    height: '100%',
    paddingTop: 50,
  },
  panelDocked: {
    width: 400,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  title: { color: '#1c1917', fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtn: {
    backgroundColor: '#3d8b8b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  saveBtnOff: { opacity: 0.5 },
  saveText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  closeBtn: { padding: 6 },
  closeText: { color: '#57534e', fontSize: 18 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#efeadb',
  },
  status: { flex: 1, color: '#78716c', fontSize: 12 },
  statusError: { color: '#dc2626' },
  retry: { color: '#3d8b8b', fontSize: 12, fontWeight: '700', marginLeft: 10 },

  input: {
    flex: 1,
    color: '#1c1917',
    fontSize: 16,
    lineHeight: 24,
    padding: 18,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : {}),
  },
});