import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';

const MODELS = ['Custom PyTorch Cloud', 'Llama 3 Local', 'GPT-4o'];

interface Props {
  isOnline: boolean;
  onMenuPress: () => void;
}

export const ChatHeader: React.FC<Props> = ({ isOnline, onMenuPress }) => {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
        <Text style={styles.menuIcon}>☰</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.modelSelector}
        onPress={() => setPickerVisible(true)}
      >
        <Text style={styles.modelText}>{selectedModel}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>

      <View style={styles.statusBadge}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isOnline ? '#10a37f' : '#ef4444' },
          ]}
        />
      </View>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.dropdown}>
            <FlatList
              data={MODELS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedModel(item);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                  {item === selectedModel && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  menuButton: {
    padding: 4,
    marginRight: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: '#1a1a1a',
  },
  modelSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modelText: {
    color: '#1a1a1a',
    fontSize: 17,
    fontWeight: '600',
  },
  chevron: {
    color: '#8e8ea0',
    fontSize: 14,
    marginLeft: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dropdown: {
    marginTop: 60,
    marginHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  checkmark: {
    color: '#10a37f',
    fontSize: 16,
    fontWeight: '600',
  },
});