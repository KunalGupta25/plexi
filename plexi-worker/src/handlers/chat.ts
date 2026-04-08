// src/handlers/chat.ts
// Handles POST /api/chat
// Proxies the student's LLM request with optional L2 answer caching.
// The API key travels in-transit only and is never stored.

import { ANSWER_TTL, answerCacheKey } from '../cache';
import { ChatRequestBody, ChatResponse, Env, Message } from '../types';

export async function handleChat(request: Request, env: Env): Promise<Response> {
  let body: ChatRequestBody;
  try {
    body = await request.json() as ChatRequestBody;
  } catch {
    return errorResponse(400, 'Invalid JSON body.');
  }

  const { endpoint, apiKey, model, messages, cacheKey: clientCacheKey } = body;

  if (!endpoint || !model || !messages?.length) {
    return errorResponse(400, 'endpoint, model, and messages are required.');
  }

  const userMsg = [...messages].reverse().find((message: Message) => message.role === 'user');
  const queryText = userMsg?.content ?? '';

  const systemMsg = messages.find((m: Message) => m.role === 'system');
  const contextText = systemMsg?.content ?? '';

  let kvKey: string | null = null;
  if (clientCacheKey) {
    kvKey = await answerCacheKey(queryText, clientCacheKey, contextText, model);
    const cached = await env.PLEXI_CACHE.get(kvKey);
    if (cached) {
      const response: ChatResponse = { answer: cached, cached: true };
      return jsonResponse(response);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const normalizedEndpoint = endpoint.replace(/\/$/, '');

  let llmRes: Response;
  try {
    llmRes = await fetch(`${normalizedEndpoint}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        stream: false,
      }),
    });
  } catch (err) {
    return errorResponse(502, `Failed to reach LLM provider: ${String(err)}`);
  }

  if (llmRes.status === 429) {
    const detail = await extractErrorMessage(llmRes);
    return errorResponse(429, `RATE_LIMITED: ${detail}`);
  }
  if (llmRes.status === 401) {
    return errorResponse(401, 'AUTH_ERROR: Invalid API key. Please check your key and try again.');
  }
  if (llmRes.status === 413) {
    return errorResponse(413, "PAYLOAD_TOO_LARGE: The study materials exceed this model's context window. Ask a more specific question or switch to a model with larger context.");
  }
  if (!llmRes.ok) {
    const text = await llmRes.text();
    return errorResponse(502, `LLM provider error (${llmRes.status}): ${text}`);
  }

  let answer: string;
  try {
    const llmData = await llmRes.json() as { choices: Array<{ message: { content: string } }> };
    answer = llmData.choices[0]?.message?.content ?? '';
  } catch (err) {
    return errorResponse(502, `Failed to parse LLM response: ${String(err)}`);
  }

  if (kvKey) {
    await env.PLEXI_CACHE.put(kvKey, answer, { expirationTtl: ANSWER_TTL });
  }

  const response: ChatResponse = { answer, cached: false };
  return jsonResponse(response);
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json() as { error?: { message?: string } };
    return data.error?.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Plexi-Source': 'worker' },
  });
}

function errorResponse(status: number, message: string): Response {
  return jsonResponse({ error: message }, status);
}
