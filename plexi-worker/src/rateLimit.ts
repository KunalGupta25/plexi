// src/rateLimit.ts -> IP-based rate limiting using KV (windowed)

import { RATE_LIMIT_TTL } from "./cache";
import { Env } from "./types";

const MAX_REQUESTS_PER_WINDOW = 150;

export async function checkRateLimit(ip: string, env: Env): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / RATE_LIMIT_TTL) * RATE_LIMIT_TTL;
  const windowKey = `ratelimit:${ip}:${windowStart}`;

  const raw = await env.PLEXI_CACHE.get(windowKey);
  const count = raw ? parseInt(raw, 10) : 0;

  if (count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  // Windowed key prevents TTL race conditions; double TTL guards edge cases
  await env.PLEXI_CACHE.put(windowKey, String(count + 1), {
    expirationTtl: RATE_LIMIT_TTL * 2,
  });

  return true;
}
