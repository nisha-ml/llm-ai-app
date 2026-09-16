import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  toolName: string;
  status: string;
}

export const ToolStatusCard: React.FC<Props> = ({ toolName, status }) => (
  <View style={styles.card}>
    <ActivityIndicator size="small" color="#0284c7" />
    <Text style={styles.text}>
      Executed Tool: <Text style={styles.toolName}>{toolName}</Text> ({status})
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
    gap: 8,
  },
  text: { fontSize: 13, color: '#334155' },
  toolName: { fontWeight: '700' },
});