import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useManifest, FileInfo } from "../hooks/useManifest";
import { api } from "../api/client";
import { SEO } from "../components/SEO";

const formatFileName = (name: string) => {
  const extIndex = name.lastIndexOf(".");
  const baseName = extIndex !== -1 ? name.substring(0, extIndex) : name;
  return baseName.replace(/[._]/g, " ");
};

const DocViewerComponent = lazy(
  () => import("../components/DocViewerComponent"),
);

const TEXT_EXTENSIONS = [
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
];

type PreviewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "doc"; url: string; filename: string }
  | { kind: "office"; url: string }
  | { kind: "image"; url: string }
  | { kind: "text"; content: string }
  | { kind: "unsupported" }
  | { kind: "error"; message: string };

const Hub: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = useMemo(() => {
    return location.pathname.split("/").map(decodeURIComponent).slice(2);
  }, [location.pathname]);

  const { loading, error, semesters, getSubjects, getMaterialTypes, getFiles } =
    useManifest();
  const [semester, setSemester] = useState(pathParts[0] || "");
  const [subject, setSubject] = useState(pathParts[1] || "");
  const [type, setType] = useState(pathParts[2] || "");
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ kind: "idle" });
  const [officeViewer, setOfficeViewer] = useState<"microsoft" | "google">(
    "microsoft",
  );

  // Sync state when URL changes (e.g. back button)
  useEffect(() => {
    const [urlSem, urlSub, urlType] = pathParts;
    if (urlSem !== undefined && urlSem !== semester) setSemester(urlSem);
    if (urlSub !== undefined && urlSub !== subject) setSubject(urlSub);
    if (urlType !== undefined && urlType !== type) setType(urlType);
  }, [pathParts, semester, subject, type]);

  const subjects = useMemo(
    () => getSubjects(semester),
    [semester, getSubjects],
  );
  const types = useMemo(
    () => getMaterialTypes(semester, subject),
    [semester, subject, getMaterialTypes],
  );
  const files = useMemo(
    () => getFiles(semester, subject, type),
    [semester, subject, type, getFiles],
  );

  useEffect(() => {
    if (files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const urlFile = pathParts[3];

    setSelectedFile((current) => {
      let fileToSelect = null;
      if (urlFile) {
        fileToSelect = files.find((f) => f.name === urlFile) || null;
      }

      if (
        !fileToSelect &&
        current &&
        files.some((f) => f.name === current.name)
      ) {
        fileToSelect = current;
      }

      if (!fileToSelect) {
        fileToSelect = null;
      }

      if (fileToSelect && fileToSelect.name !== urlFile) {
        setTimeout(() => {
          navigate(
            `/hub/${encodeURIComponent(semester)}/${encodeURIComponent(subject)}/${encodeURIComponent(type)}/${encodeURIComponent(fileToSelect!.name)}`,
            { replace: true },
          );
        }, 0);
      }

      return fileToSelect;
    });
  }, [files, pathParts, navigate, semester, subject, type]);

  useEffect(() => {
    async function loadPreview(file: FileInfo) {
      const fileUrl = file.download_url ?? file.url;
      if (!fileUrl) {
        setPreview({
          kind: "error",
          message: "This file entry is missing a download URL.",
        });
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      setPreview({ kind: "loading" });

      try {
        if (ext === "pdf") {
          setPreview({
            kind: "doc",
            url: api.fileUrl(fileUrl, file.name),
            filename: file.name,
          });
          return;
        }

        if (["ppt", "pptx", "doc", "docx"].includes(ext)) {
          setPreview({
            kind: "office",
            url: api.fileUrl(fileUrl, file.name),
          });
          return;
        }

        if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
          setPreview({ kind: "image", url: api.fileUrl(fileUrl, file.name) });
          return;
        }

        if (TEXT_EXTENSIONS.includes(ext)) {
          const blob = await api.fetchFile(fileUrl, file.name);
          const content = await blob.text();
          setPreview({ kind: "text", content });
          return;
        }

        setPreview({ kind: "unsupported" });
      } catch (previewError) {
        setPreview({
          kind: "error",
          message:
            previewError instanceof Error
              ? previewError.message
              : "Failed to load preview.",
        });
      }
    }

    if (selectedFile) {
      void loadPreview(selectedFile);
    } else {
      setPreview({ kind: "idle" });
    }
  }, [selectedFile]);

  const handleSemesterChange = (value: string) => {
    setSemester(value);
    setSubject("");
    setType("");
    setSelectedFile(null);
    navigate(`/hub/${encodeURIComponent(value)}`);
  };

  const handleSubjectChange = (value: string) => {
    setSubject(value);
    setType("");
    setSelectedFile(null);
    navigate(
      `/hub/${encodeURIComponent(semester)}/${encodeURIComponent(value)}`,
    );
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    setSelectedFile(null);
    navigate(
      `/hub/${encodeURIComponent(semester)}/${encodeURIComponent(subject)}/${encodeURIComponent(value)}`,
    );
  };

  const handleFileSelect = (file: FileInfo) => {
    setSelectedFile(file);
    navigate(
      `/hub/${encodeURIComponent(semester)}/${encodeURIComponent(subject)}/${encodeURIComponent(type)}/${encodeURIComponent(file.name)}`,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-secondary">
          <span className="material-symbols-outlined text-4xl animate-spin">
            progress_activity
          </span>
          <p className="font-label tracking-widest uppercase text-sm font-bold">
            Loading materials...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-error-container text-on-error-container rounded-2xl flex items-center gap-4 max-w-3xl mx-auto mt-12">
        <span className="material-symbols-outlined text-3xl">error</span>
        <p className="font-medium text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8 pb-20 md:pb-0">
      <SEO
        title="Material Hub | Plexi"
        description="Browse and preview study materials, notes, and previous year papers."
      />

      {/* App-Style Header (Mobile Only) */}
      <div
        className={`lg:hidden flex flex-col gap-2 animate-fade-in-up ${selectedFile ? "hidden" : "flex"}`}
      >
        <h1 className="text-4xl font-black font-headline text-on-surface tracking-tighter">
          The Digital <span className="text-primary">Curator</span>
        </h1>

        {/* Scrolling Filters */}
        <div className="flex flex-col gap-4 -mx-4 px-4 mt-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {semesters.map((sem) => (
              <button
                key={sem}
                onClick={() => handleSemesterChange(sem)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${semester === sem
                    ? "bg-primary border-primary text-on-primary shadow-lg shadow-primary/20"
                    : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant"
                  }`}
              >
                {sem}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {subjects.length === 0 ? (
              <span className="text-xs text-text-muted/50 italic px-2">
                Select semester...
              </span>
            ) : (
              subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => handleSubjectChange(sub)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${subject === sub
                      ? "bg-on-surface border-on-surface text-background shadow-md"
                      : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant"
                    }`}
                >
                  {sub}
                </button>
              ))
            )}
          </div>

          {subject && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {types.map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${type === t
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-transparent border-outline-variant/30 text-text-muted"
                    }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {t.toLowerCase().includes("pdf")
                      ? "picture_as_pdf"
                      : "description"}
                  </span>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Digital Curator (Desktop Only) */}
      <section className="hidden lg:flex flex-col gap-8 p-10 bg-surface-container-lowest rounded-[40px] border border-outline-variant/30 shadow-sm relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary/20"></div>
        <div className="flex flex-col gap-2 relative">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary/60 font-label">
            <span className="material-symbols-outlined text-[18px]">
              filter_list
            </span>
            Discovery Engine
          </div>
          <h1 className="text-5xl font-black font-headline text-on-surface tracking-tight">
            The Digital <span className="text-primary">Curator</span>
          </h1>
        </div>

        <div className="flex flex-col gap-10">
          <div className="grid gap-8">
            {/* Semester */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-32 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                  Semester
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {semesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => handleSemesterChange(sem)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${semester === sem
                        ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105"
                        : "bg-surface-container-highest/40 text-on-surface hover:bg-surface-container-highest/80"
                      }`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="w-32 shrink-0 mt-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ${semester ? "text-text-muted" : "text-text-muted/30"}`}
                >
                  Subject
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {!semester && (
                  <span className="text-sm text-text-muted/50 italic py-2">
                    Pick a semester to unlock subjects
                  </span>
                )}
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => handleSubjectChange(sub)}
                    className={`px-5 py-3 md:py-2.5 rounded-xl text-sm md:text-xs font-medium transition-all max-w-[240px] truncate ${subject === sub
                        ? "bg-primary/10 border border-primary/30 text-primary font-bold"
                        : "text-text-muted hover:text-on-surface hover:bg-surface-container-highest/40"
                      }`}
                    title={sub}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-32 shrink-0">
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ${subject ? "text-text-muted" : "text-text-muted/30"}`}
                >
                  Format
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {!subject && (
                  <span className="text-sm text-text-muted/50 italic">
                    Select a subject first
                  </span>
                )}
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${type === t
                        ? "bg-on-surface text-background border-on-surface shadow-md"
                        : "bg-surface-container-highest/40 border-transparent text-text-muted hover:border-border/50 hover:text-on-surface"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {t.toLowerCase().includes("pdf")
                        ? "picture_as_pdf"
                        : t.toLowerCase().includes("video")
                          ? "play_circle"
                          : "description"}
                    </span>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 md:gap-8 min-w-0">
        {/* File List */}
        <section
          className={`bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 shadow-card p-6 flex flex-col gap-6 sticky top-24 lg:max-h-[calc(100vh-8rem)] min-h-0 min-w-0 animate-fade-in-up delay-200 ${selectedFile ? "hidden lg:flex" : "flex"}`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-lg text-on-surface">
              Available Files
            </h2>
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-primary-fixed text-on-primary-fixed uppercase tracking-wider">
              {files.length} found
            </span>
          </div>

          <div className="h-px bg-outline-variant/30 w-full"></div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-30">
              <span className="material-symbols-outlined text-6xl">
                folder_open
              </span>
              <p className="text-sm font-medium">
                Select filters to <br /> view materials
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-2 pb-4">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => handleFileSelect(file)}
                  className={`group flex items-center gap-4 p-4 rounded-2xl text-left transition-all border ${selectedFile?.name === file.name
                      ? "bg-primary/5 border-primary/20 text-primary shadow-sm"
                      : "bg-transparent border-transparent hover:bg-surface-container-low hover:border-outline-variant/30 text-on-surface"
                    }`}
                >
                  <div
                    className={`p-2.5 rounded-xl transition-colors ${selectedFile?.name === file.name ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary"}`}
                  >
                    <span className="material-symbols-outlined text-[22px] block">
                      {file.name.endsWith(".pdf")
                        ? "picture_as_pdf"
                        : "description"}
                    </span>
                  </div>
                  <span
                    className="text-sm font-bold truncate flex-1"
                    title={formatFileName(file.name)}
                  >
                    {formatFileName(file.name)}
                  </span>
                  <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity lg:block hidden">
                    arrow_forward_ios
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Preview Surface */}
        <div
          className={`lg:block min-w-0 ${selectedFile ? "block" : "hidden"}`}
        >
          <section
            className={`
              bg-surface-container-lowest lg:rounded-[2rem] lg:border border-outline-variant/30 shadow-card-lg lg:shadow-card-lg flex flex-col gap-0 lg:gap-3 relative min-w-0 z-40
              ${selectedFile ? "fixed inset-0 lg:static lg:px-6 lg:pt-5 lg:pb-2 animate-slide-up lg:animate-none" : "p-0 lg:p-8 lg:min-h-[600px] flex items-center justify-center"}
            `}
          >
            {selectedFile ? (
              <>
                {/* Mobile Back Button & Header */}
                <div className="flex items-center gap-4 p-4 lg:p-0 bg-surface-container-lowest lg:bg-transparent border-b lg:border-0 border-outline-variant/20 shrink-0">
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="lg:hidden p-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[24px] block">
                      arrow_back
                    </span>
                  </button>
                  <div className="flex flex-col min-w-0">
                    <div className="lg:hidden flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                      Material Preview
                    </div>
                    <h3 className="text-lg lg:text-xl font-black font-headline text-on-surface truncate leading-tight">
                      {formatFileName(selectedFile.name)}
                    </h3>
                  </div>
                </div>

                {/* Desktop Metadata */}
                <div className="hidden lg:flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary font-label">
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    Preview Surface
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-surface-container text-on-surface-variant uppercase tracking-wider">
                      {semester}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-surface-container text-on-surface-variant uppercase tracking-wider">
                      {subject}
                    </span>
                  </div>
                </div>


                {/* Preview Frame */}
                <div className="flex-1 lg:bg-surface-container-low lg:rounded-2xl lg:border border-outline-variant/20 overflow-hidden relative min-h-0 flex flex-col bg-white">
                  {preview.kind === "loading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm z-10 gap-4">
                      <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                        progress_activity
                      </span>
                      <p className="text-sm font-bold tracking-widest uppercase text-secondary">
                        Preparing...
                      </p>
                    </div>
                  )}

                  {preview.kind === "doc" && (
                    <div className="w-full h-full flex flex-col relative bg-white overflow-hidden flex-1 min-h-0">
                      <Suspense
                        fallback={
                          <div className="flex flex-col items-center justify-center h-full gap-4">
                            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                              progress_activity
                            </span>
                          </div>
                        }
                      >
                        <DocViewerComponent
                          document={preview.url}
                          filename={preview.filename}
                        />
                      </Suspense>
                    </div>
                  )}

                  {preview.kind === "office" && (
                    <div className="flex-1 flex flex-col w-full relative min-h-0 bg-white overflow-hidden">
                      <div className="bg-surface-container-high p-2 text-center text-[10px] font-bold text-on-surface-variant shrink-0 border-b border-outline-variant/20 flex items-center justify-center gap-4">
                        <span className="hidden sm:block">
                          Office Preview Mode
                        </span>
                        <div className="flex items-center bg-surface-container rounded-lg p-0.5 border border-outline-variant/30">
                          <button
                            onClick={() => setOfficeViewer("microsoft")}
                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-colors ${officeViewer === "microsoft" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
                          >
                            MS View
                          </button>
                          <button
                            onClick={() => setOfficeViewer("google")}
                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter transition-colors ${officeViewer === "google" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant"}`}
                          >
                            Google
                          </button>
                        </div>
                      </div>
                      <iframe
                        src={
                          officeViewer === "microsoft"
                            ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(preview.url)}`
                            : `https://docs.google.com/gview?url=${encodeURIComponent(preview.url)}&embedded=true`
                        }
                        className="w-full flex-1"
                        frameBorder="0"
                        title={selectedFile.name}
                      />
                    </div>
                  )}

                  {preview.kind === "image" && (
                    <div className="flex-1 flex items-center justify-center p-4 bg-surface-container-lowest overflow-auto">
                      <img
                        src={preview.url}
                        alt={selectedFile.name}
                        className="max-w-full rounded-2xl shadow-2xl border border-outline-variant/20"
                      />
                    </div>
                  )}

                  {preview.kind === "text" && (
                    <div className="flex-1 p-6 overflow-y-auto bg-surface-container-lowest font-mono text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words">
                      {preview.content}
                    </div>
                  )}

                  {preview.kind === "unsupported" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                      <span className="material-symbols-outlined text-6xl text-outline/20">
                        quick_reference_all
                      </span>
                      <p className="text-on-surface-variant font-bold text-sm">
                        Preview Unavailable
                      </p>
                    </div>
                  )}

                  {preview.kind === "error" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                      <span className="material-symbols-outlined text-5xl text-error/40">
                        warning
                      </span>
                      <p className="text-error font-bold text-sm">
                        {preview.message}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden lg:flex flex-col items-center text-center gap-6 max-w-md animate-fade-in-up">
                <div className="w-24 h-24 bg-primary/5 border border-primary/10 rounded-3xl flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-5xl text-primary/40">
                    quick_reference_all
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-black font-headline text-on-surface tracking-tight">
                    Inspection Workspace
                  </h3>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed px-4">
                    Select a document from the list on the left to render a live
                    preview here. Your place is saved as you browse.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Hub;
