import React, { useState } from 'react';
import { CopyIcon, CheckIcon, ShareIcon, SpeakerIcon } from './Icons';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Message } from '../types/chat';
import { FormattedMessage } from './FormattedMessage';

interface Props {
  message: Message;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleListen = () => {
    if (Platform.OS === 'web') {
      const utterance = new SpeechSynthesisUtterance(message.text);
      window.speechSynthesis.speak(utterance);
    } else {
      Speech.speak(message.text);
    }
  };

  if (isUser) {
    // User message: small rounded grey bubble, right-aligned
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          {message.imageUri && (
            <Image source={{ uri: message.imageUri }} style={styles.userImage} />
          )}
          {message.text ? <Text style={styles.userText}>{message.text}</Text> : null}
        </View>
      </View>
    );
  }

  // AI message: plain text (markdown-formatted), no background, left-aligned, icons below
  return (
    <View style={styles.aiRow}>
      <FormattedMessage text={message.text} />
      {message.isStreaming && <Text style={styles.cursor}> ▍</Text>}
      <View style={styles.iconRow}>
      <TouchableOpacity onPress={handleCopy} style={styles.iconButton}>
        {copied ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <ShareIcon size={15} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleListen} style={styles.iconButton}>
        <SpeakerIcon size={15} />
      </TouchableOpacity>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userRow: {
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  userBubble: {
    maxWidth: '75%',
    backgroundColor: '#f4f4f4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
  },
  userImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 6,
  },
  aiRow: {
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  aiText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1a1a1a',
  },
  cursor: {
    color: '#10a37f',
  },
  iconRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },
  iconButton: {
    padding: 2,
  },
  iconText: {
    fontSize: 15,
    color: '#8e8ea0',
  },
});