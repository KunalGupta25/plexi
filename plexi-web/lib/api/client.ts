// Plexi Worker API Client

import type { 
  RetrieveRequest, 
  RetrieveResponse, 
  ChatRequest, 
  ChatResponse,
  Manifest 
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_WORKER_URL || 'https://plexi-worker.mexus.tech';

class PlexiAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'PlexiAPIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new PlexiAPIError(response.status, (error as { error?: string }).error || 'Unknown error');
  }
  return response.json();
}

export async function getManifest(): Promise<Manifest> {
  const response = await fetch(`${API_BASE}/api/manifest`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<Manifest>(response);
}

export async function retrieve(request: RetrieveRequest): Promise<RetrieveResponse> {
  const response = await fetch(`${API_BASE}/api/retrieve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<RetrieveResponse>(response);
}

export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<ChatResponse>(response);
}

export async function* chatStream(request: ChatRequest): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new PlexiAPIError(response.status, (error as { error?: string }).error || 'Unknown error');
  }

  if (!response.body) {
    throw new PlexiAPIError(500, 'No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Ignore parse errors
        }
      }
    }
  }
}

export function getFileUrl(url: string, filename?: string): string {
  const params = new URLSearchParams({ url });
  if (filename) params.set('filename', filename);
  return `${API_BASE}/api/file?${params.toString()}`;
}

export function checkHealth(): Promise<{ status: string; worker: boolean; ts: number }> {
  return fetch(`${API_BASE}/api/health`)
    .then(res => res.json());
}

export { PlexiAPIError };
