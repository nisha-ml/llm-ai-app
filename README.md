# LLM Chat App

A React Native (Expo) chat app with **login, private chat history for every user, and questions about your own documents**. It works on web and on phones.

## Features

- **Login and register** with name, email and password. The login is remembered after a reload.
- **Private chat history.** Each user sees only their own chats. Chats can be renamed and deleted.
- **Document Q&A (RAG).** Press **+**, choose **Upload document**, and pick a PDF or TXT file. Ask questions about it and the answer comes from the document.
- **Image upload** from the same **+** menu.
- **Streaming answers** from the LLM.
- **User profile** with name and **Log out** at the bottom of the sidebar.

## Tech stack

- React Native with Expo and TypeScript
- Zustand for state
- AsyncStorage to remember the login
- expo-document-picker and expo-image-picker for file upload
- Backend: see the `llm-chat-backend` repository (Node.js, Neon PostgreSQL, pgvector)

## Setup

1. Start the backend first (see its README).
2. Install packages:
   ```bash
   npm install
   npx expo install expo-document-picker expo-image-picker @react-native-async-storage/async-storage
   ```
3. Set the backend address in `src/screens/LoginScreen.tsx`:
   ```ts
   export const API_URL = 'http://localhost:3001';
   ```
   On a real phone, use your computer's IP address instead, for example `http://192.168.1.7:3001` (same Wi-Fi).
4. Add your LLM API key where `src/hooks/useLLMStream.ts` expects it. Keep keys in a `.env` file and never commit them.
5. Run the app:
   ```bash
   npx expo start
   ```
   Press `w` to open it in the browser.

## Project structure

```
App.tsx                       login check, loads chats
src/
  screens/
    LoginScreen.tsx           login and register
    ChatScreen.tsx            chat screen, RAG question flow
  components/
    ChatInputBox.tsx          input box, + menu, file cards
    ChatDrawer.tsx            chat list and user profile
  store/useChatStore.ts       chats and messages (talks to the backend)
  utils/
    authStorage.ts            saves the login token
    ragApi.ts                 upload, list, delete and search documents
```

## How a document question works

1. You upload a file. The backend splits it into chunks and stores their embeddings.
2. You ask a question. The app asks the backend for the 5 most relevant chunks.
3. The app sends those chunks and your question to the LLM, which answers from the document.