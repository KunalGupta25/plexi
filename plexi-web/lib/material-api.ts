"use client";

// ── Config ─────────────────────────────────────────────────────────────────────
export const MATERIAL_API =
  process.env.NEXT_PUBLIC_MATERIAL_API_URL || "https://plexi-material.mexus.tech";

export const OWNER_LOGIN = "KunalGupta25";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AuthUser {
  login: string;
  name: string;
  avatar_url: string;
}

export interface UploadedFile {
  name: string;
  downloadUrl: string;
}

export interface SubmitPayload {
  semester: string;
  subject: string;
  fileType: string;
  notes: string;
  uploadedFiles: UploadedFile[];
}

export interface ManifestFile {
  name: string;
  download_url: string;
}

export interface ManifestSubject {
  [fileType: string]: ManifestFile[];
}

export interface ManifestSemester {
  [subject: string]: ManifestSubject;
}

export interface ManifestData {
  [semester: string]: ManifestSemester;
}

export interface RenamePayload {
  semester: string;
  subject: string;
  type: string;
  oldName: string;
  newName: string;
}

export interface DeletePayload {
  semester: string;
  subject: string;
  type: string;
  name: string;
}

export interface MovePayload {
  semester: string;
  subject: string;
  type: string;
  name: string;
  targetSemester: string;
  targetSubject: string;
  targetType: string;
}

// ── Fetch helper (always sends cookies) ───────────────────────────────────────
async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${MATERIAL_API}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Auth ───────────────────────────────────────────────────────────────────────
/** Redirects the browser to GitHub OAuth. */
export function loginWithGitHub(): void {
  window.location.href = `${MATERIAL_API}/api/auth/github`;
}

/** Fetches the current user from the JWT cookie. Returns null if unauthenticated. */
export async function getMe(): Promise<AuthUser | null> {
  try {
    return await api<AuthUser>("/api/me");
  } catch {
    return null;
  }
}

/** Clears the auth cookie and signs the user out. */
export async function logout(): Promise<void> {
  await fetch(`${MATERIAL_API}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

// ── Upload ─────────────────────────────────────────────────────────────────────
/** Step 1 — Upload a single file to the staging release. Returns its download URL. */
export async function uploadFile(file: File): Promise<{ originalName: string; downloadUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${MATERIAL_API}/api/upload/file`, {
    method: "POST",
    credentials: "include",
    body: formData,
    // Do NOT set Content-Type manually with FormData
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Upload failed");
  }
  return res.json();
}

/** Step 2 — Submit metadata + staged file URLs; creates a GitHub issue. */
export async function submitMaterial(payload: SubmitPayload): Promise<{ issueNumber: number; issueUrl: string }> {
  return api("/api/upload/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Manage (owner-only) ────────────────────────────────────────────────────────
export async function getManageManifest(): Promise<ManifestData> {
  return api("/api/manage/materials");
}

export async function renameMaterial(payload: RenamePayload): Promise<{ ok: boolean; name: string }> {
  return api("/api/manage/material/rename", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMaterial(payload: DeletePayload): Promise<{ ok: boolean }> {
  return api("/api/manage/material", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

export async function moveMaterial(payload: MovePayload): Promise<{ ok: boolean; newDownloadUrl?: string }> {
  return api("/api/manage/material/move", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
