import { API_URL } from '../screens/LoginScreen';
import { getToken, loadSession } from './authStorage';

export type DocInfo = { id: string; filename: string; chunks: number };
export type Excerpt = { content: string; filename: string; score: number };

async function authHeaders(json = true): Promise<Record<string, string>> {
  await loadSession();
  const token = getToken();
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function uploadDocument(threadId: string, asset: any): Promise<DocInfo> {
  const form = new FormData();
  if (asset.file) {
    form.append('file', asset.file); 
  } else {
    form.append('file', {
      uri: asset.uri,
      name: asset.name || 'document',
      type: asset.mimeType || 'application/octet-stream',
    } as any); 
  }
  const res = await fetch(`${API_URL}/threads/${threadId}/documents`, {
    method: 'POST',
    headers: await authHeaders(false), 
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data;
}

export async function listDocuments(threadId: string): Promise<DocInfo[]> {
  const res = await fetch(`${API_URL}/threads/${threadId}/documents`, {
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/documents/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
}

export async function searchContext(threadId: string, query: string): Promise<Excerpt[]> {
  try {
    const res = await fetch(`${API_URL}/threads/${threadId}/search`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ query, k: 5 }),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    return [];
  }
}

export function buildRagPrompt(question: string, excerpts: Excerpt[]): string {
  const context = excerpts
    .map((e, i) => `[${i + 1}] (${e.filename})\n${e.content}`)
    .join('\n\n');
  return (
    `Answer the question using ONLY the document excerpts below. ` +
    `If the answer is not in the excerpts, say that you could not find it in the uploaded document.\n\n` +
    `Document excerpts:\n${context}\n\n` +
    `Question: ${question}`
  );
}