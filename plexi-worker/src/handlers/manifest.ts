// src/handlers/manifest.ts
// Handles GET /api/manifest
// Proxies and caches the study materials manifest.json from GitHub via HF API.

import { MANIFEST_TTL } from '../cache';
import { Env } from '../types';

const MANIFEST_KV_KEY = 'manifest:v1';

export async function handleManifest(_request: Request, env: Env): Promise<Response> {
  // ── KV cache ───────────────────────────────────────────────────────────────
  const cached = await env.PLEXI_CACHE.get(MANIFEST_KV_KEY);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/json',
        'X-Plexi-Cache': 'HIT',
        'X-Plexi-Source': 'worker-kv',
      },
    });
  }

  // ── Fetch from HuggingFace API (which itself caches from GitHub) ───────────
  let manifest: string;
  try {
    const hfRes = await fetch(`${env.HF_API_URL}/manifest`);
    if (!hfRes.ok) {
      return new Response(
        JSON.stringify({ error: `HuggingFace manifest fetch failed: ${hfRes.status}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }
    manifest = await hfRes.text(); // keep as raw string for KV storage
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Failed to reach HuggingFace API: ${String(err)}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // ── Store in KV (TTL: 5 minutes) ──────────────────────────────────────────
  await env.PLEXI_CACHE.put(MANIFEST_KV_KEY, manifest, {
    expirationTtl: MANIFEST_TTL,
  });

  return new Response(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'X-Plexi-Cache': 'MISS',
      'X-Plexi-Source': 'worker-hf',
    },
  });
}
