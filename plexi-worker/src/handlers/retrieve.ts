// src/handlers/retrieve.ts
// Handles POST /api/retrieve
// Two-layer caching: KV (L1) -> HuggingFace FastAPI (on miss)

import { CHUNKS_TTL, retrieveCacheKey } from '../cache';
import { checkRateLimit } from '../rateLimit';
import { Env, RetrieveRequestBody, RetrieveResponse } from '../types';
import { jsonResponse, errorResponse } from '../utils';

export async function handleRetrieve(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const allowed = await checkRateLimit(ip, env);
  if (!allowed) {
    return errorResponse(429, 'Rate limit exceeded. Wait a minute and try again.');
  }

  let body: RetrieveRequestBody;
  try {
    body = await request.json() as RetrieveRequestBody;
  } catch {
    return errorResponse(400, 'Invalid JSON body.');
  }

  const { query, semester, subject, top_k = 5 } = body;

  if (!query?.trim() || !semester || !subject) {
    return errorResponse(400, 'query, semester, and subject are required.');
  }

  const cacheKey = await retrieveCacheKey(query, semester, subject);
  const cached = await env.PLEXI_CACHE.get<RetrieveResponse>(cacheKey, 'json');

  if (cached) {
    return jsonResponse({ ...cached, cached: true });
  }

  let hfData: RetrieveResponse;
  try {
    const hfRes = await fetch(`${env.HF_API_URL}/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, semester, subject, top_k }),
    });

    if (!hfRes.ok) {
      const text = await hfRes.text();
      return errorResponse(502, `HuggingFace API error (${hfRes.status}): ${text}`);
    }

    hfData = await hfRes.json() as RetrieveResponse;
  } catch (err) {
    return errorResponse(502, `Failed to reach HuggingFace API: ${String(err)}`);
  }

  await env.PLEXI_CACHE.put(cacheKey, JSON.stringify(hfData), {
    expirationTtl: CHUNKS_TTL,
  });

  return jsonResponse({ ...hfData, cached: false });
}


