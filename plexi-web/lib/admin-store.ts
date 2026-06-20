"use client";

export interface Blog {
  _id?: string;
  id: string;
  title: string;
  description: string;
  tag: "Blog" | "Wiki" | "Guide" | string;
  source: string;
  url?: string; // For external
  content?: string; // For internal (markdown)
  isInternal: boolean;
  publishedAt: number;
}

export interface ReleaseNote {
  _id?: string;
  content: string;
  publishedAt: number;
  buttonText?: string;
  buttonUrl?: string;
}

const SEEN_RELEASE_NOTE_KEY = "plexi_seen_release_note";

// ── Auth token helpers ─────────────────────────────────────────────────────────
/** Returns headers including the admin token stored after login. */
function getAdminHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = sessionStorage.getItem("plexi_admin_token") ?? "";
  return { "Content-Type": "application/json", "X-Admin-Token": token };
}

export async function getAdminBlogs(): Promise<Blog[]> {
  try {
    const res = await fetch("/api/blogs");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveAdminBlog(blog: Blog) {
  // BUG-4 fix: use _id (MongoDB ObjectId) OR id (string) for the URL so
  // existing blogs that only have `id` are PATCHed, not duplicated via POST.
  const blogId = blog._id || blog.id;
  const url = blogId ? `/api/blogs/${blogId}` : "/api/blogs";
  const method = blogId ? "PATCH" : "POST";

  const res = await fetch(url, {
    method,
    headers: getAdminHeaders(),
    body: JSON.stringify(blog),
  });

  if (!res.ok) throw new Error("Failed to save blog");
  return await res.json();
}

export async function deleteAdminBlog(id: string) {
  const res = await fetch(`/api/blogs/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete blog");
}

export async function getLatestReleaseNote(): Promise<ReleaseNote | null> {
  try {
    const res = await fetch("/api/release-notes");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function publishReleaseNote(content: string, buttonText?: string, buttonUrl?: string) {
  const res = await fetch("/api/release-notes", {
    method: "POST",
    headers: getAdminHeaders(),
    body: JSON.stringify({ content, buttonText, buttonUrl }),
  });
  if (!res.ok) throw new Error("Failed to publish release note");
  return await res.json();
}

export function markReleaseNoteAsSeen(id: string) {
  localStorage.setItem(SEEN_RELEASE_NOTE_KEY, id);
}

export function hasSeenReleaseNote(id: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SEEN_RELEASE_NOTE_KEY) === id;
}
