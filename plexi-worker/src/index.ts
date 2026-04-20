// src/index.ts — Plexi Cloudflare Worker entry point
// Routes all /api/* requests to the appropriate handler.

import { handleChat, handleChatStream } from "./handlers/chat";
import { handleFile } from "./handlers/file";
import { handleManifest } from "./handlers/manifest";
import { handleRetrieve } from "./handlers/retrieve";
import { Env } from "./types";

// ── CORS ──────────────────────────────────────────────────────────────────────

/** Build the allowed origins whitelist from the configured FRONTEND_ORIGIN. */
function getAllowedOrigins(env: Env): string[] {
  return [
    env.FRONTEND_ORIGIN || "https://plexi.lazygod.workers.dev",
    "https://plexi.lazygod.workers.dev",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
  ].filter(Boolean);
}

/** Validate the request Origin against the whitelist. Returns the origin if valid, null otherwise. */
function getValidatedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) return env.FRONTEND_ORIGIN || "https://plexi.lazygod.workers.dev"; // Same-origin or non-browser requests
  const allowed = getAllowedOrigins(env);
  return allowed.includes(origin) ? origin : null;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function handleOptions(request: Request, env: Env): Response {
  const origin = getValidatedOrigin(request, env);
  if (!origin) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

function withCors(response: Response, request: Request, env: Env): Response {
  const origin = getValidatedOrigin(request, env);
  if (!origin) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Pre-flight CORS
    if (request.method === "OPTIONS") {
      return handleOptions(request, env);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let response: Response;

    // ── Route table ──────────────────────────────────────────────────────────
    if (path === "/api/retrieve" && request.method === "POST") {
      response = await handleRetrieve(request, env);
    } else if (path === "/api/chat/stream" && request.method === "POST") {
      response = await handleChatStream(request, env, ctx);
    } else if (path === "/api/chat" && request.method === "POST") {
      response = await handleChat(request, env);
    } else if (path === "/api/manifest" && request.method === "GET") {
      response = await handleManifest(request, env);
    } else if (
      path.startsWith("/api/file") &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      response = await handleFile(request, env);
    } else if (path === "/api/health" && request.method === "GET") {
      response = new Response(
        JSON.stringify({ status: "ok", worker: true, ts: Date.now() }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } else {
      response = new Response(JSON.stringify({ error: "Not found", path }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return withCors(response, request, env);
  },
};
