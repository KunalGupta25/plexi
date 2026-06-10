"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Github,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  LogOut,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { uploadFile, submitMaterial } from "@/lib/material-api";
import { useManifest, useSemesters, useSubjects } from "@/lib/api";
import { cn } from "@/lib/utils";

const FILE_TYPES = ["Notes", "Previous Year Papers", "Assignments", "Presentations", "Lab Manual", "Other"];
const MAX_FILE_SIZE_MB = 25;
const ALLOWED_EXTENSIONS = [".pdf", ".pptx", ".ppt", ".docx", ".doc", ".xlsx", ".xls", ".txt", ".zip"];

interface SelectedFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  downloadUrl?: string;
  error?: string;
}

function ContributeContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const { data: manifest } = useManifest();

  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [fileType, setFileType] = useState(FILE_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ issueNumber: number; issueUrl: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const semesters = useSemesters(manifest);
  const subjects = useSubjects(manifest, semester);

  // Handle auth callback from GitHub OAuth
  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (authParam === "success") {
      // Auth succeeded — user state will be refreshed by useAuth
      window.history.replaceState({}, "", "/contribute");
    } else if (authParam === "error") {
      window.history.replaceState({}, "", "/contribute");
    }
  }, [searchParams]);

  function validateFile(file: File): string | null {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File exceeds ${MAX_FILE_SIZE_MB} MB limit`;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `File type not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    return null;
  }

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const next: SelectedFile[] = incoming.map((f) => {
      const err = validateFile(f);
      return { file: f, status: err ? "error" : "pending", error: err ?? undefined };
    });
    setSelectedFiles((prev) => [...prev, ...next]);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!semester || !subject || !fileType) return;

    const validFiles = selectedFiles.filter((f) => f.status === "pending" || f.status === "done");
    if (validFiles.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // Step 1: Upload all pending files
    const updatedFiles = [...selectedFiles];
    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status !== "pending") continue;

      updatedFiles[i] = { ...updatedFiles[i], status: "uploading" };
      setSelectedFiles([...updatedFiles]);

      try {
        const result = await uploadFile(updatedFiles[i].file);
        updatedFiles[i] = { ...updatedFiles[i], status: "done", downloadUrl: result.downloadUrl };
      } catch (err) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        };
      }
      setSelectedFiles([...updatedFiles]);
    }

    const uploadedFiles = updatedFiles
      .filter((f) => f.status === "done" && f.downloadUrl)
      .map((f) => ({ name: f.file.name, downloadUrl: f.downloadUrl! }));

    if (uploadedFiles.length === 0) {
      setSubmitError("All files failed to upload. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Step 2: Submit metadata
    try {
      const result = await submitMaterial({ semester, subject, fileType, notes, uploadedFiles });
      setSubmitResult(result);
      // Reset form
      setSemester("");
      setSubject("");
      setFileType(FILE_TYPES[0]);
      setNotes("");
      setSelectedFiles([]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    !!user &&
    !!semester &&
    !!subject &&
    !!fileType &&
    selectedFiles.some((f) => f.status === "pending" || f.status === "done") &&
    !isSubmitting;

  // ── Auth loading state ─────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitResult) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">Submission Received!</h2>
        <p className="mb-1 text-muted-foreground">
          Your materials have been submitted for review as{" "}
          <span className="font-medium text-foreground">Issue #{submitResult.issueNumber}</span>.
        </p>
        <p className="mb-8 text-sm text-muted-foreground">
          The owner will review and add them to the live material hub.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild variant="outline" className="rounded-xl">
            <a href={submitResult.issueUrl} target="_blank" rel="noopener noreferrer">
              View on GitHub
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button className="rounded-xl" onClick={() => setSubmitResult(null)}>
            Submit More
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span>Contribute</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
            Share Your Materials
          </h1>
          <p className="text-muted-foreground">
            Upload notes, papers, or assignments to help fellow students. All contributions are reviewed before going live.
          </p>
        </div>

        {/* Auth card */}
        {!user ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Github className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Sign in to Contribute</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              GitHub sign-in is required so we can credit your contribution and keep the community safe.
            </p>
            <Button onClick={login} className="rounded-xl px-8" size="lg">
              <Github className="mr-2 h-5 w-5" />
              Continue with GitHub
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Signed-in user badge */}
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-9 w-9 rounded-full ring-2 ring-border"
                />
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">@{user.login}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-lg text-muted-foreground"
                onClick={logout}
              >
                <LogOut className="mr-1.5 h-4 w-4" />
                Sign out
              </Button>
            </div>

            {/* Metadata */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
              <h2 className="font-semibold text-base">Material Details</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Semester <span className="text-destructive">*</span></label>
                  <Select value={semester} onValueChange={(v) => { setSemester(v); setSubject(""); }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject <span className="text-destructive">*</span></label>
                  <Select value={subject} onValueChange={setSubject} disabled={!semester}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={semester ? "Select subject" : "Select semester first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                      <SelectItem value="__other__">Other (type below)</SelectItem>
                    </SelectContent>
                  </Select>
                  {subject === "__other__" && (
                    <Input
                      placeholder="Enter subject name"
                      className="rounded-xl mt-2"
                      onChange={(e) => setSubject(e.target.value || "__other__")}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Material Type <span className="text-destructive">*</span></label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any extra context for the reviewer (e.g. unit numbers, exam year)..."
                  className="rounded-xl resize-none h-24"
                />
              </div>
            </div>

            {/* File drop zone */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-base">Files</h2>

              <div
                role="button"
                tabIndex={0}
                aria-label="Upload files"
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer select-none",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                )}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drop files here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, PPTX, DOCX, XLSX, TXT, ZIP · Max {MAX_FILE_SIZE_MB} MB each
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept={ALLOWED_EXTENSIONS.join(",")}
                onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
              />

              {selectedFiles.length > 0 && (
                <ul className="space-y-2">
                  {selectedFiles.map((sf, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                        sf.status === "error"
                          ? "border-destructive/30 bg-destructive/5"
                          : sf.status === "done"
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border bg-secondary/30"
                      )}
                    >
                      <FileText className={cn(
                        "h-4 w-4 shrink-0",
                        sf.status === "error" ? "text-destructive" :
                        sf.status === "done" ? "text-emerald-500" : "text-muted-foreground"
                      )} />
                      <span className="flex-1 truncate font-medium">{sf.file.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {(sf.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      {sf.status === "uploading" && (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      )}
                      {sf.status === "done" && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                      {sf.status === "error" && (
                        <span className="shrink-0 text-xs text-destructive">{sf.error}</span>
                      )}
                      {sf.status !== "uploading" && (
                        <button
                          type="button"
                          aria-label="Remove file"
                          onClick={() => removeFile(i)}
                          className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Error banner */}
            {submitError && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {submitError}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-12 rounded-xl text-base font-semibold"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Uploading & Submitting…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Submit for Review
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Submissions create a GitHub issue for owner review before going live.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ContributeContent />
    </Suspense>
  );
}
