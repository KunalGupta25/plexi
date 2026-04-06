import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useManifest, FileInfo } from "../hooks/useManifest";
import { api } from "../api/client";

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
  const selectedFileUrl = selectedFile?.download_url ?? selectedFile?.url ?? "";

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
        fileToSelect = files[0];
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
    <div className="w-full flex flex-col gap-8 md:gap-12">
      {/* Hero Context */}
      <section className="mb-2">
        <h1 className="text-display-lg text-4xl md:text-5xl lg:text-6xl font-black font-headline tracking-tight text-primary mb-4">
          The Digital Curator
        </h1>
        <p className="text-secondary max-w-2xl text-lg font-light leading-relaxed">
          Access the university's collective intelligence. Seamlessly traverse
          semesters, subjects, and specific study materials with precision.
        </p>
      </section>

      {/* Inline Selector Sequence */}
      <section className="mb-2">
        <div className="bg-surface-container-low rounded-3xl md:rounded-[2rem] p-6 md:p-8 shadow-inner border border-outline-variant/20">
          <div className="flex flex-col space-y-6 md:space-y-8">
            {/* Step 1: Semester Selection */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-32 shrink-0">
                <span className="text-xs font-bold uppercase tracking-widest text-secondary font-label">
                  Semester
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {semesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => handleSemesterChange(sem)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                      semester === sem
                        ? "bg-primary-fixed text-on-primary-fixed shadow-sm"
                        : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                    }`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Subject Selection */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-32 shrink-0">
                <span
                  className={`text-xs font-bold uppercase tracking-widest font-label ${semester ? "text-secondary" : "text-outline/50"}`}
                >
                  Subject
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {!semester && (
                  <span className="text-sm text-outline italic">
                    Select a semester first
                  </span>
                )}
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => handleSubjectChange(sub)}
                    className={`px-6 py-2 rounded-lg text-sm transition-all ${
                      subject === sub
                        ? "bg-primary-container border-b-2 border-primary font-bold text-primary shadow-sm"
                        : "text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Material Type */}
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-32 shrink-0">
                <span
                  className={`text-xs font-bold uppercase tracking-widest font-label ${subject ? "text-secondary" : "text-outline/50"}`}
                >
                  Format
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {!subject && (
                  <span className="text-sm text-outline italic">
                    Select a subject first
                  </span>
                )}
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTypeChange(t)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                      type === t
                        ? "bg-primary-fixed text-on-primary-fixed font-bold shadow-sm ring-1 ring-primary/30"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
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

      {/* Main Workspace: File List & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 md:gap-8 items-start">
        {/* Left Column: File List */}
        <section className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm p-5 md:p-6 flex flex-col gap-4 md:gap-6 sticky top-24 lg:max-h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold text-lg text-on-surface">
              Available Files
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed text-on-primary-fixed">
              {files.length} found
            </span>
          </div>

          <div className="h-px bg-outline-variant/30 w-full"></div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-4 opacity-50">
              <span className="material-symbols-outlined text-5xl">
                folder_off
              </span>
              <p className="text-sm">
                No files to display. Please refine your selection.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar pr-2 pb-4">
              {files.map((file) => (
                <button
                  key={file.name}
                  onClick={() => handleFileSelect(file)}
                  className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all border ${
                    selectedFile?.name === file.name
                      ? "bg-primary-fixed/40 border-primary-fixed text-primary shadow-sm"
                      : "bg-surface-container-lowest border-transparent hover:bg-surface-container-low hover:border-outline-variant/50 text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0 text-primary/70">
                    draft
                  </span>
                  <span
                    className="text-sm font-medium truncate flex-1"
                    title={formatFileName(file.name)}
                  >
                    {formatFileName(file.name)}
                  </span>
                  {selectedFile?.name === file.name && (
                    <span className="material-symbols-outlined text-[18px] shrink-0">
                      chevron_right
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Preview Surface */}
        <div
          className={`lg:block ${selectedFile ? "fixed inset-0 z-50 p-4 bg-surface/80 backdrop-blur-sm lg:static lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:z-auto" : "hidden"}`}
        >
          <section className="bg-surface-container-lowest rounded-xl lg:rounded-3xl border border-outline-variant/30 shadow-2xl lg:shadow-sm p-2 lg:p-8 flex flex-col gap-2 lg:gap-6 h-full lg:h-auto lg:min-h-[600px] relative">
            {selectedFile ? (
              <>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="lg:hidden absolute top-2 right-2 z-50 bg-surface-container-high hover:bg-surface-container-highest text-on-surface p-2 rounded-full transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    close
                  </span>
                </button>
                {/* File Header */}
                <div className="hidden lg:flex flex-col sm:flex-row sm:items-start justify-between gap-4 pr-10 lg:pr-0">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary font-label">
                      <span className="material-symbols-outlined text-[16px]">
                        visibility
                      </span>
                      Preview Surface
                    </div>
                    <h3 className="text-2xl font-bold font-headline text-on-surface break-words">
                      {formatFileName(selectedFile.name)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2.5 py-1 rounded text-xs font-medium bg-surface-container text-on-surface-variant">
                        {semester}
                      </span>
                      <span className="px-2.5 py-1 rounded text-xs font-medium bg-surface-container text-on-surface-variant">
                        {subject}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={selectedFileUrl}
                      download
                      className="p-3 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors flex items-center justify-center group"
                      title="Download File"
                    >
                      <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 transition-transform">
                        download
                      </span>
                    </a>
                    <a
                      href={selectedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 rounded-xl text-sm font-bold bg-primary text-on-primary shadow-md shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                      Open Tab
                      <span className="material-symbols-outlined text-[18px]">
                        open_in_new
                      </span>
                    </a>
                  </div>
                </div>

                <div className="hidden lg:block h-px bg-outline-variant/30 w-full"></div>

                {/* Preview Content */}
                <div className="flex-1 bg-surface-container-low rounded-md lg:rounded-2xl border border-outline-variant/20 overflow-hidden relative h-[calc(100dvh-6.5rem)] lg:h-auto min-h-0 lg:min-h-[500px] flex flex-col">
                  {preview.kind === "loading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm z-10 gap-4">
                      <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                        progress_activity
                      </span>
                      <p className="text-sm font-medium text-secondary">
                        Generating preview...
                      </p>
                    </div>
                  )}

                  {preview.kind === "doc" && (
                    <div className="flex-1 w-full relative h-full min-h-0 lg:min-h-[600px] bg-white">
                      <Suspense
                        fallback={
                          <div className="flex flex-col items-center justify-center h-full gap-4">
                            <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                              progress_activity
                            </span>
                            <p className="text-sm font-medium text-secondary">
                              Loading viewer...
                            </p>
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
                    <div className="flex-1 flex flex-col w-full relative h-full min-h-0 lg:min-h-[600px] bg-white overflow-hidden">
                      <div className="hidden lg:flex bg-surface-container-high p-2 text-center text-xs text-on-surface-variant shrink-0 border-b border-outline-variant/20 flex-col sm:flex-row items-center justify-center gap-3">
                        <span>
                          If the preview is blocked, try switching the viewer or
                          use the <strong>Download</strong> button above.
                        </span>
                        <div className="flex items-center bg-surface-container rounded-lg p-0.5 border border-outline-variant/30">
                          <button
                            onClick={() => setOfficeViewer("microsoft")}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${officeViewer === "microsoft" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-highest"}`}
                          >
                            Microsoft
                          </button>
                          <button
                            onClick={() => setOfficeViewer("google")}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${officeViewer === "google" ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-highest"}`}
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
                    <div className="flex-1 flex items-center justify-center p-3 lg:p-8 bg-surface-container-lowest">
                      <img
                        src={preview.url}
                        alt={selectedFile.name}
                        className="max-w-full max-h-[700px] object-contain rounded-xl shadow-sm border border-outline-variant/20"
                      />
                    </div>
                  )}

                  {preview.kind === "text" && (
                    <div className="flex-1 p-3 lg:p-6 overflow-y-auto bg-surface-container-lowest font-mono text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words">
                      {preview.content}
                    </div>
                  )}

                  {preview.kind === "unsupported" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 text-center gap-4">
                      <span className="material-symbols-outlined text-5xl text-outline/40 mb-2">
                        unknown_document
                      </span>
                      <p className="text-on-surface-variant max-w-sm text-sm leading-relaxed">
                        Preview is not available for this format yet. You can
                        still open or download the file directly using the
                        actions above.
                      </p>
                    </div>
                  )}

                  {preview.kind === "error" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 text-center gap-4 bg-error-container/20">
                      <span className="material-symbols-outlined text-4xl text-error mb-2">
                        warning
                      </span>
                      <p className="text-on-surface-variant text-sm font-medium">
                        {preview.message}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6 h-full min-h-[500px]">
                <div className="w-32 h-32 rounded-full bg-surface-container-high flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-6xl text-outline/50">
                    find_in_page
                  </span>
                </div>
                <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight">
                  Inspection Workspace
                </h2>
                <p className="text-on-surface-variant max-w-md text-base leading-relaxed">
                  Select a document from the list on the left to render a live
                  preview here. Your place is saved as you browse.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Hub;
