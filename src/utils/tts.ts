import * as Speech from 'expo-speech';


const GUJARATI = /[\u0A80-\u0AFF]/;
const DEVANAGARI = /[\u0900-\u097F]/; 

export function cleanForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' code block. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' link ')
    .replace(/^\s*[-•*]\s+/gm, '')
    .replace(/[*_#>~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}


export function detectLanguage(text: string): string {
  if (GUJARATI.test(text)) return 'gu-IN';
  if (DEVANAGARI.test(text)) return 'hi-IN';
  return 'en-US';
}

function splitIntoChunks(text: string, max = 220): string[] {
  const sentences = text.match(/[^.!?।]+[.!?।]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };
  for (const sentence of sentences) {
    if (sentence.length > max) {
      push();
      let piece = '';
      for (const word of sentence.split(' ')) {
        if ((piece + ' ' + word).length > max) {
          chunks.push(piece.trim());
          piece = '';
        }
        piece += ' ' + word;
      }
      if (piece.trim()) chunks.push(piece.trim());
    } else {
      if ((current + sentence).length > max) push();
      current += sentence;
    }
  }
  push();
  return chunks;
}

let token = 0; 
let currentOnState: ((speaking: boolean) => void) | null = null;

export function stopSpeaking() {
  token++;
  Speech.stop();
  currentOnState?.(false);
  currentOnState = null;
}

export function speak(
  text: string,
  options: { onState?: (speaking: boolean) => void; rate?: number; pitch?: number } = {}
) {
  stopSpeaking();
  const clean = cleanForSpeech(text);
  const chunks = splitIntoChunks(clean);
  if (chunks.length === 0) return;

  const mine = ++token;
  const language = detectLanguage(clean);
  currentOnState = options.onState ?? null;
  options.onState?.(true);

  const finish = () => {
    if (mine !== token) return;
    currentOnState?.(false);
    currentOnState = null;
  };

  const next = (i: number) => {
    if (mine !== token) return; 
    if (i >= chunks.length) return finish();
    Speech.speak(chunks[i], {
      language,
      rate: options.rate ?? 1.0,
      pitch: options.pitch ?? 1.0,
      onDone: () => next(i + 1),
      onError: finish,
    });
  };
  next(0);
}

export const isSpeaking = () => Speech.isSpeakingAsync();