import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { DocInfo, deleteDocument, listDocuments, uploadDocument } from '../utils/ragApi';

type Props = { threadId: string | null };

export const DocumentBar: React.FC<Props> = ({ threadId }) => {
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
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

  // Reload the list whenever the chat changes
  useEffect(() => {
    setError('');
    load();
  }, [load]);

  const pick = async () => {
    if (!threadId || busy) return;
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/plain', 'text/markdown'],
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return;

    setBusy(true);
    setError('');
    try {
      await uploadDocument(threadId, res.assets[0]);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteDocument(id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
    }
  };

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <TouchableOpacity style={styles.addBtn} onPress={pick} disabled={busy}>
          {busy ? (
            <>
              <ActivityIndicator size="small" color="#3d8b8b" />
              <Text style={styles.addText}>Indexing document…</Text>
            </>
          ) : (
            <Text style={styles.addText}>📎 Add document</Text>
          )}
        </TouchableOpacity>

        {docs.map((d) => (
          <View key={d.id} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              📄 {d.filename}
            </Text>
            <TouchableOpacity onPress={() => remove(d.id)} style={styles.chipClose}>
              <Text style={styles.chipCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 6 },
  row: { alignItems: 'center', gap: 8 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  addText: { color: '#374151', fontSize: 13, fontWeight: '600' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 220,
    backgroundColor: '#eef6f6',
    borderRadius: 16,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
  },
  chipText: { color: '#1f2937', fontSize: 13, flexShrink: 1 },
  chipClose: { paddingHorizontal: 6 },
  chipCloseText: { color: '#6b7280', fontSize: 12 },
  error: { color: '#dc2626', fontSize: 12, marginTop: 4 },
});