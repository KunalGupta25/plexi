// src/types.ts — Shared types for the Plexi Cloudflare Worker

export interface Env {
  // KV namespace for caching
  PLEXI_CACHE: KVNamespace;
  // HuggingFace FastAPI base URL
  HF_API_URL: string;
  // Cloudflare Pages frontend origin (for CORS)
  FRONTEND_ORIGIN: string;
}

// ── Retrieve ─────────────────────────────────────────────────────────────────

export interface RetrieveRequestBody {
  query: string;
  semester: string;
  subject: string;
  top_k?: number;
}

export interface Chunk {
  text: string;
  score: number | null;
  filename: string | null;
  subject: string | null;
}

export interface RetrieveResponse {
  chunks: Chunk[];
  query: string;
  semester: string;
  subject: string;
  rag_active: boolean;
  context_formatted: string;
  /** true = served from Cloudflare KV, not HuggingFace */
  cached: boolean;
}

// ── Chat ─────────────────────────────────────────────────────────────────────

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequestBody {
  /** Full OpenAI-compatible base URL, e.g. https://api.openai.com/v1 */
  endpoint: string;
  apiKey: string;
  model: string;
  messages: Message[];
  /** Optional deterministic key for L2 answer caching */
  cacheKey?: string;
}

export interface ChatResponse {
  answer: string;
  /** true = served from Cloudflare KV cache */
  cached: boolean;
}

// ── File proxy ───────────────────────────────────────────────────────────────

export interface FileProxyParams {
  /** Raw GitHub Release asset download URL */
  url: string;
}
