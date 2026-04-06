// src/cache.ts — KV cache helpers for the Plexi Worker

/**
 * Generate a deterministic cache key by hashing an arbitrary string.
 * Uses the Web Crypto API available in all Cloudflare Workers.
 */
export async function hashKey(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Build the cache key for a RAG retrieve request.
 * This is deliberately stable — same query + scope = same key.
 */
export async function retrieveCacheKey(
  query: string,
  semester: string,
  subject: string,
): Promise<string> {
  const normalized = `retrieve:${query.trim().toLowerCase()}:${semester}:${subject}`;
  return hashKey(normalized);
}

/**
 * Build the cache key for a full LLM answer.
 * Scoped to provider + model so changing the LLM invalidates the cache.
 */
export async function answerCacheKey(
  query: string,
  semester: string,
  subject: string,
  model: string,
): Promise<string> {
  const normalized = `answer:${query.trim().toLowerCase()}:${semester}:${subject}:${model}`;
  return hashKey(normalized);
}

// ── TTLs ─────────────────────────────────────────────────────────────────────

/** RAG chunk cache TTL — 1 hour */
export const CHUNKS_TTL = 3600;
/** Full answer cache TTL — 30 minutes */
export const ANSWER_TTL = 1800;
/** Manifest cache TTL — 5 minutes */
export const MANIFEST_TTL = 300;
/** Rate limit window — 1 minute */
export const RATE_LIMIT_TTL = 60;
