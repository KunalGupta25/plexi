/**
 * src/api/client.ts
 * API client to communicate with the Cloudflare Worker middleman.
 */

const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';

export interface RetrieveParams {
  query: string;
  semester: string;
  subject: string;
  top_k?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatParams {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: Message[];
  cacheKey?: string;
}

export const api = {
  async getManifest() {
    const res = await fetch(`${WORKER_URL}/api/manifest`);
    if (!res.ok) throw new Error('Failed to fetch manifest');
    return res.json();
  },

  async retrieve(params: RetrieveParams) {
    const res = await fetch(`${WORKER_URL}/api/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to retrieve context');
    return res.json();
  },

  async chat(params: ChatParams) {
    const res = await fetch(`${WORKER_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Chat request failed');
    }
    return res.json();
  },

  async fetchFile(url: string, filename?: string) {
    const res = await fetch(this.fileUrl(url, filename));
    if (!res.ok) throw new Error('Failed to fetch file');
    return res.blob();
  },

  fileUrl(url: string, filename?: string) {
    const params = new URLSearchParams({ url });
    if (filename) params.set('filename', filename);
    return `${WORKER_URL}/api/file?${params.toString()}`;
  }
};
