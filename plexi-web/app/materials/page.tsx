"use client"

import { useState, useEffect, useRef, Suspense, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { 
  FileText,
  ChevronUp,
  X,
  Eye,
  Loader2,
  AlertCircle,
  Search,
  GraduationCap,
  BookOpen,
  FolderOpen,
  Info,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import dynamic from "next/dynamic";
const PDFViewer = dynamic(() => import("@/components/pdf-viewer").then(mod => mod.PDFViewer), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted/30">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
});
import { saveRecentFile } from "@/lib/recent-files"
import { 
  useManifest, 
  useSemesters, 
  useSubjects, 
  useFileTypes, 
  useFiles,
  getFileUrl 
} from "@/lib/api"

// ── DocumentViewer lifted outside MaterialsContent (BUG-7 fix) ───────────────
// Keeping it inside caused PDF to re-mount on every parent state change.
interface DocumentViewerProps {
  isPDF: boolean;
  documentUrl: string | null;
  selectedFile: { name: string; url: string } | null;
  subject: string;
  fileType: string;
  semester: string;
  shareData?: { semester: string; subject: string; fileType: string; fileName: string };
  className?: string;
  isMobile?: boolean;
}

function DocumentViewer({
  isPDF, documentUrl, selectedFile, subject, fileType, semester, shareData, className = "", isMobile = false
}: DocumentViewerProps) {
  if (isPDF && documentUrl) {
    return (
      <PDFViewer 
        url={documentUrl} 
        filename={selectedFile?.name} 
        className={className}
        isMobile={isMobile}
        shareData={shareData}
      />
    )
  }
  return (
    <div className={`flex flex-1 items-center justify-center p-4 bg-muted/30 ${className}`}>
      <div className="flex aspect-[8.5/11] w-full max-w-3xl flex-col rounded-xl border border-border bg-card shadow-lg">
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-center text-xl font-semibold">{selectedFile?.name}</h3>
          <p className="mb-1 text-center text-sm text-muted-foreground">{subject} - {fileType}</p>
          <p className="text-center text-sm text-muted-foreground">{semester}</p>
          <div className="mt-8">
            <Button
              variant="outline"
              onClick={() => { if (documentUrl) window.open(documentUrl, '_blank') }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Open File
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MaterialsContent() {
  const searchParams = useSearchParams()
  const { data: manifest, isLoading, error } = useManifest()

  const [semester, setSemester] = useState("")
  const [subject, setSubject] = useState("")
  const [fileType, setFileType] = useState("")
  const [selectedFile, setSelectedFile] = useState<{ name: string; url: string } | null>(null)
  const [mobileViewerOpen, setMobileViewerOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // ── Global search state ────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<
    { semester: string; subject: string; fileType: string; name: string; url: string }[]
  >([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const semesters = useSemesters(manifest)
  const subjects = useSubjects(manifest, semester)
  const fileTypes = useFileTypes(manifest, semester, subject)
  const files = useFiles(manifest, semester, subject, fileType)

  // ── Global search logic (debounced 250ms) ─────────────────────────────────
  const runSearch = useCallback(
    (query: string) => {
      if (!manifest || query.trim().length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      const q = query.toLowerCase();
      const results: typeof searchResults = [];
      for (const [sem, subjects] of Object.entries(manifest)) {
        for (const [sub, types] of Object.entries(subjects as Record<string, Record<string, { name: string; download_url: string }[]>>)) {
          for (const [ft, fileList] of Object.entries(types)) {
            for (const f of fileList) {
              if (f.name.toLowerCase().includes(q)) {
                results.push({ semester: sem, subject: sub, fileType: ft, name: f.name, url: f.download_url });
                if (results.length >= 20) break;
              }
            }
            if (results.length >= 20) break;
          }
          if (results.length >= 20) break;
        }
        if (results.length >= 20) break;
      }
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    },
    [manifest]
  );

  // Debounce the search
  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery, runSearch]);

  // Close search results when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Apply a search result: fill all selectors and open the file
  const applySearchResult = (r: typeof searchResults[number]) => {
    setSemester(r.semester);
    setSubject(r.subject);
    setFileType(r.fileType);
    setSelectedFile({ name: r.name, url: r.url });
    setSearchQuery("");
    setShowSearchResults(false);
    if (window.innerWidth < 768) setMobileViewerOpen(true);
  };

  // Handle URL params for direct file links
  useEffect(() => {
    if (manifest && !initialized) {
      const urlSemester = searchParams.get("semester")
      const urlSubject = searchParams.get("subject")
      const urlType = searchParams.get("type")
      const urlFile = searchParams.get("file")
      
      if (urlSemester && urlSubject && urlType && urlFile) {
        // Verify the params are valid
        if (manifest[urlSemester]?.[urlSubject]?.[urlType]) {
          setSemester(urlSemester)
          setSubject(urlSubject)
          setFileType(urlType)
          
          // Find the file
          const fileList = manifest[urlSemester][urlSubject][urlType]
          const file = fileList.find((f: { name: string; download_url: string }) => f.name === urlFile)
          if (file) {
            setSelectedFile({ name: file.name, url: file.download_url })
            // Auto-open viewer on mobile
            if (window.innerWidth < 768) {
              setMobileViewerOpen(true)
            }
          }
        }
      } else {
        const storedSemester = localStorage.getItem("plexi-user-semester");
        if (storedSemester && manifest[storedSemester]) {
          setSemester(storedSemester);
        }
      }
      setInitialized(true)
    }
  }, [manifest, searchParams, initialized])

  // Reset dependent selections when parent changes
  const handleSemesterChange = (value: string) => {
    setSemester(value)
    setSubject("")
    setFileType("")
    setSelectedFile(null)
  }

  const handleSubjectChange = (value: string) => {
    setSubject(value)
    setFileType("")
    setSelectedFile(null)
  }

  const handleFileTypeChange = (value: string) => {
    setFileType(value)
    setSelectedFile(null)
  }

  const handleFileChange = (fileName: string) => {
    const file = files.find(f => f.name === fileName)
    if (file) {
      setSelectedFile(file)
    }
  }

  const canViewDocument = semester && subject && fileType && selectedFile

  // Get proxied file URL
  const documentUrl = selectedFile ? getFileUrl(selectedFile.url, selectedFile.name) : null

  // Check if file is PDF
  const isPDF = selectedFile?.name.toLowerCase().endsWith('.pdf')

  useEffect(() => {
    if (!semester || !subject || !fileType || !selectedFile) return

    saveRecentFile({
      name: selectedFile.name,
      url: selectedFile.url,
      semester,
      subject,
      fileType,
    })
  }, [semester, subject, fileType, selectedFile])

  // Document viewer props (passed to lifted DocumentViewer component)
  const shareData = semester && subject && fileType && selectedFile ? {
    semester, subject, fileType, fileName: selectedFile.name,
  } : undefined

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pb-20 pt-14 md:min-h-screen md:pb-0 md:pt-0">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading materials...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pb-20 pt-14 md:min-h-screen md:pb-0 md:pt-0">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Failed to Load Materials</h2>
        <p className="mt-2 text-muted-foreground">Please check your connection and try again.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col pb-20 pt-14 md:min-h-screen md:pb-0 md:pt-0">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="border-b border-border bg-background px-4 md:px-6 py-4 md:py-5">

          {/* Greeting row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Welcome back! 👋</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Select your materials to get started</p>
            </div>
            <Link href="/contribute">
              <Button variant="outline" className="shrink-0 gap-2 rounded-xl h-9 text-sm">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload Document</span>
              </Button>
            </Link>
          </div>

          {/* ── Search bar ──────────────────────────────────────────────── */}
          <div ref={searchRef} className="relative mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Quick search across all subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
                className="pl-9 h-10 rounded-xl text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setShowSearchResults(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {showSearchResults && (
              <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                <ul className="max-h-72 overflow-y-auto divide-y divide-border">
                  {searchResults.map((r, i) => (
                    <li key={i}>
                      <button
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                        onClick={() => applySearchResult(r)}
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.semester} · {r.subject} · {r.fileType}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Selector Card ───────────────────────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
            <p className="text-sm font-semibold mb-4">Select Your Material</p>

            {/* Desktop: single row with 4 columns + View Document button */}
            <div className="hidden md:flex items-end gap-3 min-w-0">

              {/* 1. Semester */}
              <div className="flex-1 min-w-0 overflow-hidden space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-500/10">
                    <GraduationCap className="h-3 w-3 text-blue-500" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">1. Semester</span>
                </div>
                <Select value={semester} onValueChange={handleSemesterChange}>
                  <SelectTrigger className="h-10 rounded-xl text-sm [&>span]:truncate [&>span]:block">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-border shrink-0" />

              {/* 2. Subject */}
              <div className="flex-1 min-w-0 overflow-hidden space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-green-500/10">
                    <BookOpen className="h-3 w-3 text-green-500" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">2. Subject</span>
                </div>
                <Select value={subject} onValueChange={handleSubjectChange} disabled={!semester}>
                  <SelectTrigger className="h-10 rounded-xl text-sm [&>span]:truncate [&>span]:block">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-border shrink-0" />

              {/* 3. Type */}
              <div className="flex-1 min-w-0 overflow-hidden space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-500/10">
                    <FolderOpen className="h-3 w-3 text-orange-500" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">3. Type</span>
                </div>
                <Select value={fileType} onValueChange={handleFileTypeChange} disabled={!subject}>
                  <SelectTrigger className="h-10 rounded-xl text-sm [&>span]:truncate [&>span]:block">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Divider */}
              <div className="h-10 w-px bg-border shrink-0" />

              {/* 4. File */}
              <div className="flex-1 min-w-0 overflow-hidden space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-500/10">
                    <FileText className="h-3 w-3 text-purple-500" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">4. File</span>
                </div>
                <Select value={selectedFile?.name || ""} onValueChange={handleFileChange} disabled={!fileType}>
                  <SelectTrigger className="h-10 rounded-xl text-sm [&>span]:truncate [&>span]:block">
                    <SelectValue placeholder="Select file or document" />
                  </SelectTrigger>
                  <SelectContent>
                    {files.map((f) => (
                      <SelectItem key={f.name} value={f.name} className="truncate">{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mobile: 2×2 grid of selects */}
            <div className="grid grid-cols-2 gap-2 md:hidden">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3 text-blue-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Semester</span>
                </div>
                <Select value={semester} onValueChange={handleSemesterChange}>
                  <SelectTrigger className="h-10 rounded-xl text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{semesters.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subject</span>
                </div>
                <Select value={subject} onValueChange={handleSubjectChange} disabled={!semester}>
                  <SelectTrigger className="h-10 rounded-xl text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <FolderOpen className="h-3 w-3 text-orange-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</span>
                </div>
                <Select value={fileType} onValueChange={handleFileTypeChange} disabled={!subject}>
                  <SelectTrigger className="h-10 rounded-xl text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{fileTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-purple-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">File</span>
                </div>
                <Select value={selectedFile?.name || ""} onValueChange={handleFileChange} disabled={!fileType}>
                  <SelectTrigger className="h-10 rounded-xl text-sm truncate"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{files.map((f) => <SelectItem key={f.name} value={f.name} className="truncate">{f.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* How it works strip — amber warning style */}
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-3 py-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                <span className="font-semibold">How it works:</span>{" "}
                Choose your semester → Select subject → Pick type → Select file → View your document
              </p>
            </div>
          </div>  {/* end selector card */}
      </div>        {/* end border-b header */}



      {/* ── Document Viewer Area ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {canViewDocument ? (
          <>
            {/* Desktop: Inline Viewer */}
            <div className="hidden md:flex md:flex-1 md:flex-col">
              <DocumentViewer
                isPDF={!!isPDF}
                documentUrl={documentUrl}
                selectedFile={selectedFile}
                subject={subject}
                fileType={fileType}
                semester={semester}
                shareData={shareData}
                className="flex-1"
              />
            </div>

            {/* Mobile: File Selected Card with View Button */}
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 md:hidden">
              <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
                <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-secondary">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-center text-lg font-semibold">{selectedFile?.name}</h3>
                <p className="mb-1 text-center text-sm text-muted-foreground">{subject} - {fileType}</p>
                <p className="mb-6 text-center text-sm text-muted-foreground">{semester}</p>
                <Button 
                  className="w-full h-12 rounded-xl gap-2"
                  onClick={() => setMobileViewerOpen(true)}
                >
                  <Eye className="h-5 w-5" />
                  View Document
                </Button>
              </div>
            </div>

            {/* Mobile PDF Viewer Modal */}
            <Dialog open={mobileViewerOpen} onOpenChange={setMobileViewerOpen}>
              <DialogContent className="h-[95dvh] max-h-[95dvh] w-[100vw] max-w-[100vw] rounded-t-2xl rounded-b-none p-0 overflow-hidden flex flex-col fixed bottom-0 top-auto translate-y-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom [&>button]:hidden">
                <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-3 shrink-0 bg-card">
                  <DialogTitle className="text-sm font-semibold truncate flex-1 pr-4">
                    {selectedFile?.name}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 shrink-0 rounded-lg"
                    onClick={() => setMobileViewerOpen(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Close
                  </Button>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  <DocumentViewer
                    isPDF={!!isPDF}
                    documentUrl={documentUrl}
                    selectedFile={selectedFile}
                    subject={subject}
                    fileType={fileType}
                    semester={semester}
                    shareData={shareData}
                    className="h-full"
                    isMobile={true}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold">Select a Document</h2>
            <p className="mb-6 max-w-md text-muted-foreground">
              Use the selectors above to navigate to your study materials.
              Pick a semester, subject, type, and file to view it here.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronUp className="h-4 w-4 animate-bounce" />
              <span>Start by selecting a semester above</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MaterialsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    }>
      <MaterialsContent />
    </Suspense>
  )
}
