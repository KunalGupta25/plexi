import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ── Simple IP-based rate limiting (module-level, resets on cold start) ────────
// Limits login attempts to MAX_ATTEMPTS per WINDOW_MS per IP.
const loginAttempts = new Map<string, { count: number; windowStart: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) return false;

  entry.count++;
  return true;
}

function clearLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Extract IP (works on Vercel / Cloudflare Pages)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("cf-connecting-ip") ??
    "unknown";

  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();

    const masterPassword = process.env.ADMIN_PASSWORD;

    if (!masterPassword) {
      console.error("ADMIN_PASSWORD environment variable is not set!");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (password === masterPassword) {
      // Clear attempt counter on success
      clearLoginAttempts(ip);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
