import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { PlusIcon, MicIcon, ArrowUpIcon, CloseIcon } from './Icons';

interface Props {
  onSend: (text: string, imageUri?: string) => void;
  disabled?: boolean;
}

export const InputBar: React.FC<Props> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [attachedDocText, setAttachedDocText] = useState<string | undefined>();
  const [attachedDocName, setAttachedDocName] = useState<string | undefined>();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !imageUri && !attachedDocText) return;

    // If a text document was attached, fold its content into the prompt
    // as context, same truncation idea as the blueprint's RAG pattern.
    const fullText = attachedDocText
      ? `${trimmed}\n\n[Attached document: ${attachedDocName}]\n${attachedDocText}`
      : trimmed;

    onSend(fullText, imageUri);
    setText('');
    setImageUri(undefined);
    setAttachedDocText(undefined);
    setAttachedDocName(undefined);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'application/pdf'],
    });

    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];

    if (file.mimeType === 'text/plain') {
      const content = await FileSystem.readAsStringAsync(file.uri);
      setAttachedDocText(content.slice(0, 3000)); // truncate — context window limit
      setAttachedDocName(file.name);
    } else {
      // PDF text extraction needs a dedicated parsing library (pdfjs-dist on
      // web, or a native module on mobile) — out of scope here. The file is
      // still "attached" visually so the UI flow is complete end-to-end.
      setAttachedDocText(undefined);
      setAttachedDocName(`${file.name} (PDF text extraction not implemented)`);
    }
  };

  // Voice-to-text uses the browser's built-in Web Speech API — web only.
  // Native would need @react-native-voice/voice with a custom dev build.
  const toggleVoiceInput = () => {
    if (Platform.OS !== 'web') {
      alert('Voice input needs a custom native build (@react-native-voice/voice) — not available in Expo Go.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? prev + ' ' + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  return (
    <View style={styles.wrapper}>
      {imageUri && (
        <View style={styles.previewRow}>
          <Image source={{ uri: imageUri }} style={styles.previewThumb} />
          <TouchableOpacity onPress={() => setImageUri(undefined)} style={styles.removeButton}>
            <CloseIcon size={11} />
          </TouchableOpacity>
        </View>
      )}

      {attachedDocName && (
        <View style={styles.previewRow}>
          <Text style={styles.docPreviewText} numberOfLines={1}>
            📄 {attachedDocName}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setAttachedDocText(undefined);
              setAttachedDocName(undefined);
            }}
            style={styles.removeButton}
          >
            <CloseIcon size={11} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.container}>
        <TouchableOpacity style={styles.iconButton} onPress={pickImage} onLongPress={pickDocument}>
          <PlusIcon size={20} color="#4a4a4a" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message AI Assistant..."
          placeholderTextColor="#8e8ea0"
          multiline
          editable={!disabled}
        />

        <TouchableOpacity style={styles.iconButton} onPress={toggleVoiceInput}>
          <MicIcon size={18} color={isListening ? '#ef4444' : '#4a4a4a'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (disabled || (!text.trim() && !imageUri && !attachedDocText)) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={disabled || (!text.trim() && !imageUri && !attachedDocText)}
        >
          <ArrowUpIcon size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.disclaimer}>
        {isListening ? 'Listening...' : 'Tap + and hold to attach a document. AI can make mistakes.'}
      </Text>
    </View>
  );
};

const webReset =
  Platform.OS === 'web'
    ? ({
        outlineStyle: 'none',
        borderWidth: 0,
        resize: 'none',
        boxShadow: 'none',
        overflow: 'hidden',
      } as any)
    : {};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  previewRow: {
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  docPreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#4a4a4a',
  },
  removeButton: {
    marginLeft: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9d9e3',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minHeight: 44,
  },
  iconButton: { padding: 8, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 15,
    color: '#1a1a1a',
    ...webReset,
  },
  sendButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: { backgroundColor: '#d9d9e3' },
  disclaimer: { textAlign: 'center', fontSize: 11, color: '#8e8ea0', marginTop: 10 },
});