/**
 * src/api/client.ts
 * API client to communicate with the Cloudflare Worker middleman.
 */

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "";

export interface RetrieveParams {
  query: string;
  semester: string;
  subject: string;
  top_k?: number;
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatParams {
  endpoint: string;
  apiKey: string;
  model: string;
  messages: Message[];
  cacheKey?: string;
}

export const api = {
  async getManifest() {
    const res = await fetch(`${WORKER_URL}/api/manifest`);
    if (!res.ok) throw new Error("Failed to fetch manifest");
    return res.json();
  },

  async retrieve(params: RetrieveParams) {
    const res = await fetch(`${WORKER_URL}/api/retrieve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to retrieve context");
    return res.json();
  },

  async chat(params: ChatParams) {
    const res = await fetch(`${WORKER_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Chat request failed");
    }
    return res.json();
  },

  /**
   * Streaming chat: reads SSE tokens progressively.
   * Calls onToken(text) for each content chunk.
   * Returns { answer, cached } when stream completes.
   */
  async chatStream(
    params: ChatParams,
    onToken: (token: string) => void,
  ): Promise<{ answer: string; cached: boolean }> {
    const res = await fetch(`${WORKER_URL}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    // If the response isn't SSE, it's an error JSON response
    const contentType = res.headers.get("Content-Type") || "";
    if (!contentType.includes("text/event-stream")) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        (errorData as { error?: string }).error || "Chat stream request failed",
      );
    }

    if (!res.body) throw new Error("No response body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullAnswer = "";
    let cached = false;
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const payload = trimmed.slice(6);
        if (payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload);
          if (json.cached) cached = true;
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            fullAnswer += content;
            onToken(content);
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    return { answer: fullAnswer, cached };
  },

  async fetchFile(url: string, filename?: string) {
    const res = await fetch(this.fileUrl(url, filename));
    if (!res.ok) throw new Error("Failed to fetch file");
    return res.blob();
  },

  fileUrl(url: string, filename?: string) {
    const params = new URLSearchParams({ url });
    if (filename) params.set("filename", filename);

    // Microsoft Office Viewer absolutely requires the proxy URL to END with .pptx / .docx
    // So we append the filename to the URL path itself to trick the viewer.
    if (filename) {
      return `${WORKER_URL}/api/file/${encodeURIComponent(filename)}?${params.toString()}`;
    }

    return `${WORKER_URL}/api/file?${params.toString()}`;
  },
};
