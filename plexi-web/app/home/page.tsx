"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Bot,
  Sparkles,
  Search,
  Clock,
  ChevronRight,
  Zap,
  LayoutGrid,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useManifest } from "@/lib/api";
import {
  getFileExtension,
  getMaterialHref,
  readRecentFiles,
  type RecentFile,
} from "@/lib/recent-files";
import { cn } from "@/lib/utils";

const MOBILE_BREAKPOINT = 768;

type MaterialFile = Omit<RecentFile, "viewedAt">;

function isInspectPreviewEnabled() {
  const params = new URLSearchParams(window.location.search);
  const inspect = params.get("inspect");

  return inspect === "1" || inspect === "true";
}

export default function MobileHomePage() {
  const router = useRouter();
  const { data: manifest, isLoading: manifestLoading } = useManifest();
  const [mounted, setMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [inspectPreview, setInspectPreview] = useState(false);
  const [query, setQuery] = useState("");
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    const previewEnabled = isInspectPreviewEnabled();

    setMounted(true);
    setInspectPreview(previewEnabled);

    // Small delay so the preview query can be evaluated before redirecting.
    const timer = setTimeout(() => {
      setIsChecking(false);
      if (!previewEnabled && window.innerWidth >= MOBILE_BREAKPOINT) {
        router.push("/");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    const refreshRecentFiles = () => setRecentFiles(readRecentFiles());

    refreshRecentFiles();
    window.addEventListener("storage", refreshRecentFiles);
    window.addEventListener("focus", refreshRecentFiles);

    return () => {
      window.removeEventListener("storage", refreshRecentFiles);
      window.removeEventListener("focus", refreshRecentFiles);
    };
  }, []);

  const materialFiles = useMemo<MaterialFile[]>(() => {
    if (!manifest) return [];

    return Object.entries(manifest).flatMap(([semester, semesterData]) =>
      Object.entries(semesterData).flatMap(([subject, subjectData]) =>
        Object.entries(subjectData).flatMap(([fileType, files]) =>
          files.map((file) => ({
            name: file.name,
            url: file.download_url,
            semester,
            subject,
            fileType,
          })),
        ),
      ),
    );
  }, [manifest]);

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    return materialFiles
      .filter((file) =>
        [file.name, file.semester, file.subject, file.fileType].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      )
      .slice(0, 5);
  }, [materialFiles, query]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      router.push("/materials");
      return;
    }

    const exactMatch = searchResults.find(
      (file) => file.name.toLowerCase() === normalizedQuery,
    );
    const file = exactMatch || searchResults[0];

    if (file) {
      router.push(getMaterialHref(file));
    }
  };

  if (!mounted || isChecking) return null;

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col bg-background pb-24 pt-6 px-4",
        inspectPreview
          ? "mx-auto w-full max-w-[430px] md:border-x"
          : "md:hidden",
      )}
    >
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hi, Student</h1>
          <p className="text-sm text-muted-foreground">Ready to study today?</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
      </header>

      <form className="relative mb-8" onSubmit={handleSearchSubmit}>
        <div className="flex h-12 items-center gap-3 rounded-2xl bg-secondary/50 px-4 text-muted-foreground transition-colors focus-within:bg-secondary">
          <Search className="h-5 w-5 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search your materials..."
            type="search"
          />
          <button
            type="submit"
            className="text-xs font-semibold text-primary disabled:text-muted-foreground"
            disabled={
              manifestLoading ||
              (query.trim() !== "" && searchResults.length === 0)
            }
          >
            Go
          </button>
        </div>
        {query.trim() && (
          <div className="absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            {searchResults.length > 0 ? (
              searchResults.map((file) => (
                <Link
                  key={`${file.semester}-${file.subject}-${file.fileType}-${file.name}`}
                  href={getMaterialHref(file)}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 active:bg-accent"
                >
                  <FileIcon fileName={file.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {file.subject} / {file.fileType}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                {manifestLoading ? "Loading materials..." : "No matching files"}
              </div>
            )}
          </div>
        )}
      </form>

      {/* Featured Card */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80">
            <Sparkles className="h-3 w-3" />
            AI Assistant
          </div>
          <h2 className="mb-2 text-xl font-bold">Plexi is ready to help</h2>
          <p className="mb-4 text-sm opacity-90">
            Ask anything about your notes or get a summary of recent lectures.
          </p>
          <Button asChild variant="secondary" className="rounded-xl h-10 px-6">
            <Link href="/ai">
              Ask Now
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
      </div>

      {/* Quick Actions */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <ActionCard
            href="/materials"
            icon={<BookOpen className="h-6 w-6" />}
            label="Materials"
            sub="Browse Notes"
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <ActionCard
            href="/ai"
            icon={<Bot className="h-6 w-6" />}
            label="AI Chat"
            sub="Get Help"
            color="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          />
          <ActionCard
            href="/integrations"
            icon={<Zap className="h-6 w-6" />}
            label="Integrations"
            sub="Sync Tools"
            color="bg-orange-500/10 text-orange-600 dark:text-orange-400"
          />
          <ActionCard
            href="/ai"
            icon={<Settings className="h-6 w-6" />}
            label="Setup AI"
            sub="Configure"
            color="bg-green-500/10 text-green-600 dark:text-green-400"
          />
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recently Viewed
          </h3>
          <Link href="/materials" className="text-xs font-medium text-primary">
            View All
          </Link>
        </div>
        {recentFiles.length > 0 ? (
          <div className="space-y-3">
            {recentFiles.map((file) => (
              <RecentItem
                key={`${file.semester}-${file.subject}-${file.fileType}-${file.name}`}
                file={file}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground">
            Open a material to see it here.
          </div>
        )}
      </section>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  label,
  sub,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-4 transition-all hover:bg-accent active:scale-95"
    >
      <div
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-xl",
          color,
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
        {sub}
      </span>
    </Link>
  );
}

function FileIcon({ fileName }: { fileName: string }) {
  const extension = getFileExtension(fileName);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
      <span className="text-[10px] font-bold text-muted-foreground">
        {extension.slice(0, 4)}
      </span>
    </div>
  );
}

function RecentItem({ file }: { file: RecentFile }) {
  return (
    <Link
      href={getMaterialHref(file)}
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors active:bg-accent"
    >
      <FileIcon fileName={file.name} />
      <div className="flex-1 overflow-hidden">
        <h4 className="truncate text-sm font-medium">{file.name}</h4>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-bold">{getFileExtension(file.name)}</span>
          <span>/</span>
          <span className="truncate">{file.subject}</span>
          <span>/</span>
          <span>{formatViewedAt(file.viewedAt)}</span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function formatViewedAt(viewedAt: number) {
  const diffMs = Date.now() - viewedAt;
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
