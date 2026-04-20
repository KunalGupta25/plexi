// src/handlers/chat.ts
// Handles POST /api/chat
// Proxies the student's LLM request with optional L2 answer caching.
// The API key travels in-transit only and is never stored.

import { ANSWER_TTL, answerCacheKey } from '../cache';
import { checkRateLimit } from '../rateLimit';
import { ChatRequestBody, ChatResponse, Env, Message } from '../types';
import { jsonResponse, errorResponse } from '../utils';

export async function handleChat(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const allowed = await checkRateLimit(ip, env);
  if (!allowed) {
    return errorResponse(429, 'Rate limit exceeded. Wait a minute and try again.');
  }

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

// ── Streaming chat handler ──────────────────────────────────────────────────

export async function handleChatStream(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const allowed = await checkRateLimit(ip, env);
  if (!allowed) {
    return errorResponse(429, 'Rate limit exceeded. Wait a minute and try again.');
  }

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

  const userMsg = [...messages].reverse().find((m: Message) => m.role === 'user');
  const queryText = userMsg?.content ?? '';
  const systemMsg = messages.find((m: Message) => m.role === 'system');
  const contextText = systemMsg?.content ?? '';

  // Check cache first
  let kvKey: string | null = null;
  if (clientCacheKey) {
    kvKey = await answerCacheKey(queryText, clientCacheKey, contextText, model);
    const cached = await env.PLEXI_CACHE.get(kvKey);
    if (cached) {
      // Return cached answer as a single SSE event
      const sseBody = `data: ${JSON.stringify({ choices: [{ delta: { content: cached } }], cached: true })}\n\ndata: [DONE]\n\n`;
      return new Response(sseBody, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Content-Encoding': 'identity',
        },
      });
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    reqHeaders.Authorization = `Bearer ${apiKey}`;
  }

  const normalizedEndpoint = endpoint.replace(/\/$/, '');

  let llmRes: Response;
  try {
    llmRes = await fetch(`${normalizedEndpoint}/chat/completions`, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        stream: true,
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
    return errorResponse(413, "PAYLOAD_TOO_LARGE: The study materials exceed this model's context window.");
  }
  if (!llmRes.ok) {
    const text = await llmRes.text();
    return errorResponse(502, `LLM provider error (${llmRes.status}): ${text}`);
  }

  if (!llmRes.body) {
    return errorResponse(502, 'LLM provider returned no body.');
  }

  // Pipe the SSE stream through, collecting tokens for caching
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullAnswer = '';
  const saveKey = kvKey; // capture for the readable stream closure

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const reader = llmRes.body.getReader();

  // Register the background pipe with waitUntil so CF doesn't kill the worker
  // before the SSE pipe and post-stream cache write are complete.
  ctx.waitUntil(
    (async () => {
      try {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Forward the line as-is to the client
            await writer.write(encoder.encode(trimmed + '\n\n'));

            // Extract content for caching
            if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) fullAnswer += content;
              } catch {
                // ignore parse errors on individual chunks
              }
            }
          }
        }

        // Flush remaining buffer
        if (buffer.trim()) {
          await writer.write(encoder.encode(buffer.trim() + '\n\n'));
        }
      } catch (err) {
        console.error('Stream processing error:', err);
      } finally {
        await writer.close();

        // Cache the full answer after stream completes
        if (saveKey && fullAnswer) {
          await env.PLEXI_CACHE.put(saveKey, fullAnswer, { expirationTtl: ANSWER_TTL }).catch(() => {});
        }
      }
    })()
  );

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Content-Encoding': 'identity',
    },
  });
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json() as { error?: { message?: string } };
    return data.error?.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
