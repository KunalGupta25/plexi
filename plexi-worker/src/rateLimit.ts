// src/rateLimit.ts -> IP-based rate limiting using KV

import { RATE_LIMIT_TTL } from "./cache";
import { Env } from "./types";

const MAX_REQUESTS_PER_WINDOW = 150;

export async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const raw = await env.PLEXI_CACHE.get(key);
  const current = raw ? parseInt(raw, 10) : 0;

  if (current >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  // Always set TTL to prevent immortal keys
  await env.PLEXI_CACHE.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_TTL,
  });

  return true;
}
