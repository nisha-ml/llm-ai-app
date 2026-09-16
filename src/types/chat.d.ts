export type SenderRole = 'user' | 'assistant';

export interface Message {
  id: string;
  text: string;
  sender: SenderRole;
  timestamp: number;
  isStreaming?: boolean;
  imageUri?: string;
}

export interface ChatThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}