// src/index.ts — Plexi Cloudflare Worker entry point
// Routes all /api/* requests to the appropriate handler.

import { handleChat } from "./handlers/chat";
import { handleFile } from "./handlers/file";
import { handleManifest } from "./handlers/manifest";
import { handleRetrieve } from "./handlers/retrieve";
import { Env } from "./types";

// ── CORS ──────────────────────────────────────────────────────────────────────

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get("Origin") ?? env.FRONTEND_ORIGIN;
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

function withCors(response: Response, request: Request, env: Env): Response {
  const origin = request.headers.get("Origin") ?? env.FRONTEND_ORIGIN;
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
    _ctx: ExecutionContext,
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
    } else if (path === "/api/chat" && request.method === "POST") {
      response = await handleChat(request, env);
    } else if (path === "/api/manifest" && request.method === "GET") {
      response = await handleManifest(request, env);
    } else if (
      path === "/api/file" &&
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
