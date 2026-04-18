// Types for Plexi Cloudflare Worker API

export interface Chunk {
  text: string;
  score: number | null;
  filename: string | null;
  subject: string | null;
}

export interface RetrieveRequest {
  query: string;
  semester: string;
  subject: string;
  top_k?: number;
}

export interface RetrieveResponse {
  chunks: Chunk[];
  query: string;
  semester: string;
  subject: string;
  rag_active: boolean;
  context_formatted: string;
  cached: boolean;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: Message[];
  cacheKey?: string;
}

export interface ChatResponse {
  answer: string;
  cached: boolean;
}

export interface FileItem {
  name: string;
  download_url: string;
}

export interface SubjectData {
  [fileType: string]: FileItem[];
}

export interface SemesterData {
  [subject: string]: SubjectData;
}

export interface Manifest {
  [semester: string]: SemesterData;
}

export interface AIConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface Scope {
  semester: string;
  subject: string;
}
