"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { 
  FileText,
  ChevronDown,
  X,
  Eye,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
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

function MaterialsContent() {
  const searchParams = useSearchParams()
  const { data: manifest, isLoading, error } = useManifest()
  
  const [semester, setSemester] = useState("")
  const [subject, setSubject] = useState("")
  const [fileType, setFileType] = useState("")
  const [selectedFile, setSelectedFile] = useState<{ name: string; url: string } | null>(null)
  const [mobileViewerOpen, setMobileViewerOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const semesters = useSemesters(manifest)
  const subjects = useSubjects(manifest, semester)
  const fileTypes = useFileTypes(manifest, semester, subject)
  const files = useFiles(manifest, semester, subject, fileType)

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

  // Document viewer component
  const DocumentViewer = ({ className = "", isMobile = false }: { className?: string; isMobile?: boolean }) => {
    if (isPDF && documentUrl) {
      return (
        <PDFViewer 
          url={documentUrl} 
          filename={selectedFile?.name} 
          className={className}
          isMobile={isMobile}
          shareData={semester && subject && fileType && selectedFile ? {
            semester,
            subject,
            fileType,
            fileName: selectedFile.name,
          } : undefined}
        />
      )
    }
    
    // Non-PDF file viewer
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
                onClick={() => {
                  if (documentUrl) {
                    window.open(documentUrl, '_blank')
                  }
                }}
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
      {/* Selector Bar */}
      <div className="border-b border-border bg-card px-4 py-4 overflow-x-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-2 md:gap-3 grid-cols-2 lg:grid-cols-4">
            <Select value={semester} onValueChange={handleSemesterChange}>
              <SelectTrigger className="h-10 md:h-11 rounded-xl text-sm">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem} value={sem}>
                    {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={subject} onValueChange={handleSubjectChange} disabled={!semester}>
              <SelectTrigger className="h-10 md:h-11 rounded-xl text-sm truncate">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={fileType} onValueChange={handleFileTypeChange} disabled={!subject}>
              <SelectTrigger className="h-10 md:h-11 rounded-xl text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {fileTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedFile?.name || ""} onValueChange={handleFileChange} disabled={!fileType}>
              <SelectTrigger className="h-10 md:h-11 rounded-xl text-sm truncate">
                <SelectValue placeholder="File" />
              </SelectTrigger>
              <SelectContent>
                {files.map((f) => (
                  <SelectItem key={f.name} value={f.name} className="truncate">
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Document Viewer Area */}
      <div className="flex flex-1 flex-col">
        {canViewDocument ? (
          <>
            {/* Desktop: Inline Viewer */}
            <div className="hidden md:flex md:flex-1 md:flex-col">
              <DocumentViewer className="flex-1" />
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
                  <DocumentViewer className="h-full" isMobile={true} />
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
              Use the dropdowns above to navigate to your study materials. 
              Select a semester, subject, type, and file to view.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ChevronDown className="h-4 w-4 animate-bounce" />
              <span>Start by selecting a semester</span>
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
