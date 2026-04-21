"use client";

const RECENT_FILES_KEY = "plexi_recent_files";
const MAX_RECENT_FILES = 5;

export interface RecentFile {
  name: string;
  url: string;
  semester: string;
  subject: string;
  fileType: string;
  viewedAt: number;
}

function isRecentFile(value: unknown): value is RecentFile {
  if (!value || typeof value !== "object") return false;

  const file = value as Partial<RecentFile>;
  return (
    typeof file.name === "string" &&
    typeof file.url === "string" &&
    typeof file.semester === "string" &&
    typeof file.subject === "string" &&
    typeof file.fileType === "string" &&
    typeof file.viewedAt === "number"
  );
}

export function readRecentFiles(): RecentFile[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(RECENT_FILES_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isRecentFile).slice(0, MAX_RECENT_FILES);
  } catch {
    return [];
  }
}

export function saveRecentFile(file: Omit<RecentFile, "viewedAt">) {
  if (typeof window === "undefined") return;

  const nextFile: RecentFile = {
    ...file,
    viewedAt: Date.now(),
  };
  const nextFiles = [
    nextFile,
    ...readRecentFiles().filter(
      (recent) =>
        !(
          recent.semester === file.semester &&
          recent.subject === file.subject &&
          recent.fileType === file.fileType &&
          recent.name === file.name
        ),
    ),
  ].slice(0, MAX_RECENT_FILES);

  window.localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(nextFiles));
}

export function getMaterialHref(file: Pick<RecentFile, "semester" | "subject" | "fileType" | "name">) {
  const params = new URLSearchParams({
    semester: file.semester,
    subject: file.subject,
    type: file.fileType,
    file: file.name,
  });

  return `/materials?${params.toString()}`;
}

export function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();
  return extension ? extension.toUpperCase() : "FILE";
}

