import { useState } from 'react';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface UseLLMStreamReturn {
  isStreaming: boolean;
  streamResponse: (
    history: Message[],
    onChunk: (text: string) => void
  ) => Promise<void>;
}

export const useLLMStream = (): UseLLMStreamReturn => {
  const [isStreaming, setIsStreaming] = useState(false);

  const streamResponse = async (
    history: Message[],
    onChunk: (text: string) => void
  ) => {
    setIsStreaming(true);
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b',
            messages: history,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Groq API ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') return;

          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) onChunk(delta);
          } catch {
       
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
      throw err;
    } finally {
      setIsStreaming(false);
    }
  };

  return { streamResponse, isStreaming };
};
