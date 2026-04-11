// src/handlers/file.ts
// Handles GET /api/file?url=<encoded_github_url>
// Proxies raw GitHub asset downloads so the frontend can preview supported
// formats inline instead of navigating through redirect chains.

import { Env } from "../types";
import { errorResponse } from "../utils";

const ALLOWED_HOSTS = [
  "raw.githubusercontent.com",
  "github.com",
  "objects.githubusercontent.com",
];
const INLINE_EXTENSIONS = new Set([
  "pdf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "txt",
  "md",
  "csv",
  "json",
  "py",
  "js",
  "ts",
  "tsx",
  "html",
  "css",
  "xml",
  "yaml",
  "yml",
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
  py: "text/plain; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  ts: "text/plain; charset=utf-8",
  tsx: "text/plain; charset=utf-8",
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  yaml: "text/plain; charset=utf-8",
  yml: "text/plain; charset=utf-8",
};

export async function handleFile(
  request: Request,
  _env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get("url");
  const requestedFilename = url.searchParams.get("filename");

  if (!targetUrl) {
    return errorResponse(400, "Missing required query parameter: url");
  }

  let targetParsed: URL;
  try {
    targetParsed = new URL(targetUrl);
  } catch {
    return errorResponse(400, "Invalid URL supplied.");
  }

  if (!ALLOWED_HOSTS.includes(targetParsed.hostname)) {
    return errorResponse(403, `Host not allowed: ${targetParsed.hostname}`);
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: {
        "User-Agent": "Plexi-Worker/1.0",
        Accept: "*/*",
      },
    });

    const responseHeaders = new Headers();
    const filename =
      requestedFilename ?? targetParsed.pathname.split("/").pop() ?? "file";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const upstreamType = upstream.headers.get("Content-Type");
    const contentType =
      MIME_BY_EXTENSION[ext] ?? upstreamType ?? "application/octet-stream";
    const cl = upstream.headers.get("Content-Length");

    responseHeaders.set("Content-Type", contentType);
    if (cl) responseHeaders.set("Content-Length", cl);
    responseHeaders.set(
      "Content-Disposition",
      `${INLINE_EXTENSIONS.has(ext) ? "inline" : "attachment"}; filename="${filename}"`,
    );
    responseHeaders.set("X-Content-Type-Options", "nosniff");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("X-Plexi-Source", "worker-proxy");

    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    return errorResponse(502, `Failed to fetch file: ${String(err)}`);
  }
}


