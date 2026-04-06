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

  const nextValue = String(current + 1);
  if (current === 0) {
    await env.PLEXI_CACHE.put(key, nextValue, {
      expirationTtl: RATE_LIMIT_TTL,
    });
  } else {
    await env.PLEXI_CACHE.put(key, nextValue);
  }

  return true;
}
