"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Pencil,
  MoveRight,
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Check,
  X,
  Github,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import {
  getManageManifest,
  renameMaterial,
  deleteMaterial,
  moveMaterial,
  type ManifestData,
  type ManifestFile,
} from "@/lib/material-api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────────
interface FileLocation {
  semester: string;
  subject: string;
  type: string;
  name: string;
}

type ModalState =
  | { kind: "none" }
  | { kind: "rename"; loc: FileLocation }
  | { kind: "delete"; loc: FileLocation }
  | { kind: "move"; loc: FileLocation };

// ── Manage content ─────────────────────────────────────────────────────────────
function ManageContent() {
  const router = useRouter();
  const { user, isOwner, isLoading: authLoading, login } = useAuth();

  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);

  // Expand/collapse state: `semester/subject/type` keys
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Modal state
  const [modal, setModal] = useState<ModalState>({ kind: "none" });
  const [actionLoading, setActionLoading] = useState(false);

  // Rename state
  const [newName, setNewName] = useState("");

  // Move state
  const [moveSemester, setMoveSemester] = useState("");
  const [moveSubject, setMoveSubject] = useState("");
  const [moveType, setMoveType] = useState("");

  const loadManifest = useCallback(async () => {
    setManifestLoading(true);
    setManifestError(null);
    try {
      const data = await getManageManifest();
      setManifest(data);
    } catch (err) {
      setManifestError(err instanceof Error ? err.message : "Failed to load manifest");
    } finally {
      setManifestLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOwner) loadManifest();
  }, [isOwner, loadManifest]);

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function openRename(loc: FileLocation) {
    setNewName(loc.name);
    setModal({ kind: "rename", loc });
  }

  function openDelete(loc: FileLocation) {
    setModal({ kind: "delete", loc });
  }

  function openMove(loc: FileLocation) {
    setMoveSemester(loc.semester);
    setMoveSubject(loc.subject);
    setMoveType(loc.type);
    setModal({ kind: "move", loc });
  }

  function closeModal() {
    setModal({ kind: "none" });
    setNewName("");
    setMoveSemester("");
    setMoveSubject("");
    setMoveType("");
  }

  async function handleRename() {
    if (modal.kind !== "rename") return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === modal.loc.name) return;

    setActionLoading(true);
    try {
      await renameMaterial({
        semester: modal.loc.semester,
        subject: modal.loc.subject,
        type: modal.loc.type,
        oldName: modal.loc.name,
        newName: trimmed,
      });
      toast.success(`Renamed to "${trimmed}"`);
      closeModal();
      await loadManifest();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (modal.kind !== "delete") return;
    setActionLoading(true);
    try {
      await deleteMaterial({
        semester: modal.loc.semester,
        subject: modal.loc.subject,
        type: modal.loc.type,
        name: modal.loc.name,
      });
      toast.success(`Deleted "${modal.loc.name}"`);
      closeModal();
      await loadManifest();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMove() {
    if (modal.kind !== "move") return;
    if (!moveSemester || !moveSubject || !moveType) return;

    setActionLoading(true);
    try {
      await moveMaterial({
        semester: modal.loc.semester,
        subject: modal.loc.subject,
        type: modal.loc.type,
        name: modal.loc.name,
        targetSemester: moveSemester,
        targetSubject: moveSubject,
        targetType: moveType,
      });
      toast.success(`Moved "${modal.loc.name}" to ${moveSemester} / ${moveSubject} / ${moveType}`);
      closeModal();
      await loadManifest();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Move failed");
    } finally {
      setActionLoading(false);
    }
  }

  // ── Auth loading ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Not signed in ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <Github className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Sign in Required</h2>
        <p className="mb-6 text-sm text-muted-foreground max-w-sm">
          This page is restricted to the repository owner. Sign in with GitHub to continue.
        </p>
        <Button onClick={login} className="rounded-xl px-8">
          <Github className="mr-2 h-5 w-5" />
          Continue with GitHub
        </Button>
      </div>
    );
  }

  // ── Not owner ────────────────────────────────────────────────────────────
  if (!isOwner) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <Shield className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">Access Denied</h2>
        <p className="mb-6 text-sm text-muted-foreground max-w-sm">
          Only the repository owner can access this page.
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  // ── Manifest loading ─────────────────────────────────────────────────────
  if (manifestLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading manifest…</p>
      </div>
    );
  }

  if (manifestError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-destructive">{manifestError}</p>
        <Button onClick={loadManifest} variant="outline" className="rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const semesters = manifest ? Object.keys(manifest).sort() : [];

  // Subject and type lists for the Move modal
  const moveSubjects = moveSemester && manifest?.[moveSemester]
    ? Object.keys(manifest[moveSemester]).sort()
    : [];
  const moveTypes = moveSemester && moveSubject && manifest?.[moveSemester]?.[moveSubject]
    ? Object.keys(manifest[moveSemester][moveSubject]).sort()
    : [];

  return (
    <div className="min-h-screen px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <header className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 shrink-0 rounded-full bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Manage Materials</h1>
            <p className="text-sm text-muted-foreground">Rename, move, or delete files from the live manifest</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl shrink-0"
            onClick={loadManifest}
            disabled={manifestLoading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", manifestLoading && "animate-spin")} />
            Refresh
          </Button>
        </header>

        {/* Owner badge */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar_url}
            alt={user.name}
            className="h-9 w-9 rounded-full ring-2 ring-border"
          />
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">@{user.login} · Owner</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Shield className="h-3 w-3" />
            Owner Access
          </div>
        </div>

        {/* Manifest tree */}
        {semesters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No materials found in the manifest.
          </div>
        ) : (
          <div className="space-y-3">
            {semesters.map((sem) => {
              const semKey = sem;
              const semOpen = expanded.has(semKey);
              const subjects = Object.keys(manifest![sem]).sort();

              return (
                <div key={sem} className="overflow-hidden rounded-2xl border border-border bg-card">
                  {/* Semester row */}
                  <button
                    onClick={() => toggle(semKey)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
                  >
                    {semOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-semibold">{sem}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
                    </span>
                  </button>

                  {semOpen && (
                    <div className="border-t border-border">
                      {subjects.map((sub) => {
                        const subKey = `${sem}/${sub}`;
                        const subOpen = expanded.has(subKey);
                        const types = Object.keys(manifest![sem][sub]).sort();

                        return (
                          <div key={sub} className="border-b border-border last:border-b-0">
                            {/* Subject row */}
                            <button
                              onClick={() => toggle(subKey)}
                              className="flex w-full items-center gap-3 px-8 py-3 text-left hover:bg-accent/50 transition-colors"
                            >
                              {subOpen ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium">{sub}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {types.length} type{types.length !== 1 ? "s" : ""}
                              </span>
                            </button>

                            {subOpen && (
                              <div>
                                {types.map((type) => {
                                  const typeKey = `${sem}/${sub}/${type}`;
                                  const typeOpen = expanded.has(typeKey);
                                  const files: ManifestFile[] = manifest![sem][sub][type];

                                  return (
                                    <div key={type} className="border-t border-border/50">
                                      {/* Type row */}
                                      <button
                                        onClick={() => toggle(typeKey)}
                                        className="flex w-full items-center gap-3 px-12 py-2.5 text-left hover:bg-accent/50 transition-colors"
                                      >
                                        {typeOpen ? (
                                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        )}
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                          {type}
                                        </span>
                                        <span className="ml-auto text-xs text-muted-foreground">
                                          {files.length} file{files.length !== 1 ? "s" : ""}
                                        </span>
                                      </button>

                                      {typeOpen && (
                                        <ul className="border-t border-border/50">
                                          {files.map((file) => (
                                            <li
                                              key={file.name}
                                              className="group flex items-center gap-3 border-b border-border/30 px-16 py-2.5 last:border-b-0 hover:bg-accent/30 transition-colors"
                                            >
                                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                              <span className="flex-1 truncate text-sm">{file.name}</span>

                                              {/* Action buttons — visible on hover */}
                                              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 rounded-lg"
                                                  title="Rename"
                                                  onClick={() =>
                                                    openRename({ semester: sem, subject: sub, type, name: file.name })
                                                  }
                                                >
                                                  <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 rounded-lg"
                                                  title="Move"
                                                  onClick={() =>
                                                    openMove({ semester: sem, subject: sub, type, name: file.name })
                                                  }
                                                >
                                                  <MoveRight className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                  title="Delete"
                                                  onClick={() =>
                                                    openDelete({ semester: sem, subject: sub, type, name: file.name })
                                                  }
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Rename Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={modal.kind === "rename"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Rename File
            </DialogTitle>
            <DialogDescription>
              Updates the display name in the manifest. The underlying asset is not moved.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl"
              placeholder="New file name"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleRename}
              disabled={actionLoading || !newName.trim() || (modal.kind === "rename" && newName.trim() === modal.loc.name)}
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={modal.kind === "delete"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Delete File
            </DialogTitle>
            <DialogDescription>
              This permanently removes the file from the manifest and deletes the release asset. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {modal.kind === "delete" && (
            <div className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm">
              <p className="font-medium truncate">{modal.loc.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {modal.loc.semester} / {modal.loc.subject} / {modal.loc.type}
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Move Modal ───────────────────────────────────────────────────────── */}
      <Dialog open={modal.kind === "move"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MoveRight className="h-4 w-4" /> Move File
            </DialogTitle>
            <DialogDescription>
              Downloads the asset, re-uploads to the target release, updates the manifest, and deletes the old asset.
            </DialogDescription>
          </DialogHeader>

          {modal.kind === "move" && (
            <div className="space-y-4 py-2">
              {/* Source label */}
              <div className="rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Moving</p>
                <p className="font-medium truncate">{modal.loc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {modal.loc.semester} / {modal.loc.subject} / {modal.loc.type}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <MoveRight className="h-3.5 w-3.5 shrink-0" />
                <span>Move to</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Target selectors */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target Semester</label>
                  <Select value={moveSemester} onValueChange={(v) => { setMoveSemester(v); setMoveSubject(""); setMoveType(""); }}>
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

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target Subject</label>
                  <Select value={moveSubject} onValueChange={(v) => { setMoveSubject(v); setMoveType(""); }} disabled={!moveSemester}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {moveSubjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Target Type</label>
                  <Select value={moveType} onValueChange={setMoveType} disabled={!moveSubject}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {moveTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={closeModal} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleMove}
              disabled={actionLoading || !moveSemester || !moveSubject || !moveType}
            >
              {actionLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Moving…</>
              ) : (
                <><MoveRight className="mr-2 h-4 w-4" />Move File</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ManagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ManageContent />
    </Suspense>
  );
}
