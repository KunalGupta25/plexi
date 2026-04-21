"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  Pencil,
  Eraser,
  Type,
  Highlighter,
  Undo2,
  Redo2,
  Trash2,
  Palette,
  Rows3,
  FileText,
  Share2,
  Check,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isAppModeEnabled } from "@/lib/app-mode";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PDFViewerProps {
  url: string;
  filename?: string;
  className?: string;
  isMobile?: boolean;
  shareData?: {
    semester: string;
    subject: string;
    fileType: string;
    fileName: string;
  };
}

type Tool = "none" | "pen" | "highlighter" | "text" | "eraser";
type ViewMode = "single" | "scroll";

interface Annotation {
  id: string;
  type: "pen" | "highlighter" | "text";
  page: number;
  points?: { x: number; y: number }[];
  text?: string;
  position?: { x: number; y: number };
  color: string;
  strokeWidth: number;
}

const COLORS = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export function PDFViewer({
  url,
  filename = "Document",
  className,
  isMobile = false,
  shareData,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const pageCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const annotationCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(
    new Map(),
  );
  const pdfDocRef = useRef<any>(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(isMobile ? 0.8 : 1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(
    isMobile ? "scroll" : "single",
  );
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const [containerWidth, setContainerWidth] = useState(0);

  // Annotation state
  const [currentTool, setCurrentTool] = useState<Tool>("none");
  const [currentColor, setCurrentColor] = useState("#000000");
  const [annotations, setAnnotations] = useState<Map<number, Annotation[]>>(
    new Map(),
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>(
    [],
  );
  const [undoStack, setUndoStack] = useState<Map<number, Annotation[][]>>(
    new Map(),
  );
  const [redoStack, setRedoStack] = useState<Map<number, Annotation[][]>>(
    new Map(),
  );
  const [showCopied, setShowCopied] = useState(false);

  // Handle share button click
  const handleShare = async () => {
    if (!shareData) return;

    const params = new URLSearchParams({
      semester: shareData.semester,
      subject: shareData.subject,
      type: shareData.fileType,
      file: shareData.fileName,
    });

    const shareUrl = `${window.location.origin}/materials?${params.toString()}`;

    try {
      // Try native share first (mobile)
      if (navigator.share && isMobile) {
        await navigator.share({
          title: `${shareData.fileName} - Plexi`,
          text: `Check out this study material: ${shareData.fileName}`,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    } catch (err) {
      // Fallback to clipboard if share fails
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch {
        console.error("Failed to share:", err);
      }
    }
  };

  // Measure container width for fit-to-width on mobile
  useEffect(() => {
    const container = scrollContainerRef.current || containerRef.current;
    if (container) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      observer.observe(container);
      return () => observer.disconnect();
    }
  }, []);

  // Load PDF.js dynamically
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const pdfjsLib = await import("pdfjs-dist");
        const appMode = isAppModeEnabled();

        if (!appMode) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        }

        const loadingTask = pdfjsLib.getDocument({
          url: url,
          withCredentials: false,
          disableWorker: appMode,
        });

        const pdf = await loadingTask.promise;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to load PDF:", err);
        if (err?.message?.includes("CORS") || err?.message?.includes("fetch")) {
          setError(
            "PDF blocked by browser security. Try opening in a new tab.",
          );
        } else {
          setError("Failed to load PDF. The file may be unavailable.");
        }
        setLoading(false);
      }
    };

    loadPDF();
  }, [url]);

  // Auto-scale for mobile to fit width
  useEffect(() => {
    if (isMobile && pdfDocRef.current && containerWidth > 0 && !loading) {
      const calculateFitScale = async () => {
        try {
          const page = await pdfDocRef.current.getPage(1);
          const viewport = page.getViewport({ scale: 1, rotation });
          const padding = 16; // 8px on each side
          const fitScale = (containerWidth - padding) / viewport.width;
          setScale(Math.min(fitScale, 1.5)); // Cap at 1.5x
        } catch (err) {
          console.error("Error calculating fit scale:", err);
        }
      };
      calculateFitScale();
    }
  }, [isMobile, containerWidth, loading, rotation]);

  // Render single page mode
  const renderPage = useCallback(async () => {
    if (!pdfDocRef.current || !canvasRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) return;

      const viewport = page.getViewport({ scale, rotation });

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (annotationCanvasRef.current) {
        annotationCanvasRef.current.height = viewport.height;
        annotationCanvasRef.current.width = viewport.width;
        redrawAnnotations(currentPage, annotationCanvasRef.current);
      }

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
    } catch (err) {
      console.error("Failed to render page:", err);
    }
  }, [currentPage, scale, rotation]);

  useEffect(() => {
    if (!loading && pdfDocRef.current && viewMode === "single") {
      renderPage();
    }
  }, [loading, renderPage, viewMode]);

  // Render page for scroll mode
  const renderPageToCanvas = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement) => {
      if (!pdfDocRef.current) return;

      try {
        const page = await pdfDocRef.current.getPage(pageNum);
        const context = canvas.getContext("2d");

        if (!context) return;

        const viewport = page.getViewport({ scale, rotation });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Also setup annotation canvas for this page
        const annotCanvas = annotationCanvasRefs.current.get(pageNum);
        if (annotCanvas) {
          annotCanvas.height = viewport.height;
          annotCanvas.width = viewport.width;
          redrawAnnotations(pageNum, annotCanvas);
        }

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        setRenderedPages((prev) => new Set(prev).add(pageNum));
      } catch (err) {
        console.error(`Failed to render page ${pageNum}:`, err);
      }
    },
    [scale, rotation],
  );

  // Render all pages in scroll mode
  useEffect(() => {
    if (!loading && pdfDocRef.current && viewMode === "scroll") {
      setRenderedPages(new Set());
      for (let i = 1; i <= numPages; i++) {
        const canvas = pageCanvasRefs.current.get(i);
        if (canvas) {
          renderPageToCanvas(i, canvas);
        }
      }
    }
  }, [loading, viewMode, numPages, scale, rotation, renderPageToCanvas]);

  // Redraw annotations on a specific canvas
  const redrawAnnotations = useCallback(
    (pageNum: number, canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pageAnnotations = annotations.get(pageNum) || [];

      pageAnnotations.forEach((annotation) => {
        if (annotation.type === "pen" && annotation.points) {
          ctx.strokeStyle = annotation.color;
          ctx.lineWidth = annotation.strokeWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          annotation.points.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        } else if (annotation.type === "highlighter" && annotation.points) {
          ctx.strokeStyle = annotation.color;
          ctx.lineWidth = 20;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          annotation.points.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (
          annotation.type === "text" &&
          annotation.text &&
          annotation.position
        ) {
          ctx.font = "16px sans-serif";
          ctx.fillStyle = annotation.color;
          ctx.fillText(
            annotation.text,
            annotation.position.x,
            annotation.position.y,
          );
        }
      });
    },
    [annotations],
  );

  // Redraw annotations when they change
  useEffect(() => {
    if (viewMode === "single" && annotationCanvasRef.current) {
      redrawAnnotations(currentPage, annotationCanvasRef.current);
    } else if (viewMode === "scroll") {
      annotations.forEach((_, pageNum) => {
        const canvas = annotationCanvasRefs.current.get(pageNum);
        if (canvas) {
          redrawAnnotations(pageNum, canvas);
        }
      });
    }
  }, [annotations, currentPage, viewMode, redrawAnnotations]);

  // Get canvas coordinates for drawing
  const getCanvasCoordinates = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (
    e: React.MouseEvent | React.TouchEvent,
    pageNum: number = currentPage,
  ) => {
    if (currentTool === "none" || isMobile) return;

    const canvas =
      viewMode === "single"
        ? annotationCanvasRef.current
        : annotationCanvasRefs.current.get(pageNum);

    if (!canvas) return;

    const coords = getCanvasCoordinates(e, canvas);

    if (currentTool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: "text",
          page: pageNum,
          text,
          position: coords,
          color: currentColor,
          strokeWidth: 2,
        };
        saveAnnotation(newAnnotation, pageNum);
      }
      return;
    }

    if (currentTool === "eraser") {
      eraseAtPoint(coords, pageNum);
      return;
    }

    setIsDrawing(true);
    setCurrentPath([coords]);
    setCurrentPage(pageNum);
  };

  const handlePointerMove = (
    e: React.MouseEvent | React.TouchEvent,
    pageNum: number = currentPage,
  ) => {
    if (
      !isDrawing ||
      currentTool === "none" ||
      currentTool === "text" ||
      isMobile
    )
      return;

    const canvas =
      viewMode === "single"
        ? annotationCanvasRef.current
        : annotationCanvasRefs.current.get(pageNum);

    if (!canvas) return;

    const coords = getCanvasCoordinates(e, canvas);
    setCurrentPath((prev) => [...prev, coords]);

    const ctx = canvas.getContext("2d");
    if (!ctx || currentPath.length === 0) return;

    const lastPoint = currentPath[currentPath.length - 1];

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentTool === "highlighter" ? 20 : 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (currentTool === "highlighter") ctx.globalAlpha = 0.3;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    if (currentTool === "highlighter") ctx.globalAlpha = 1;
  };

  const handlePointerUp = (pageNum: number = currentPage) => {
    if (!isDrawing || currentPath.length === 0 || isMobile) {
      setIsDrawing(false);
      return;
    }

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: currentTool === "highlighter" ? "highlighter" : "pen",
      page: pageNum,
      points: currentPath,
      color: currentColor,
      strokeWidth: currentTool === "highlighter" ? 20 : 2,
    };

    saveAnnotation(newAnnotation, pageNum);
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const saveAnnotation = (annotation: Annotation, pageNum: number) => {
    const currentAnnotations = annotations.get(pageNum) || [];

    // Update undo stack
    setUndoStack((prev) => {
      const newMap = new Map(prev);
      const pageStack = newMap.get(pageNum) || [];
      newMap.set(pageNum, [...pageStack, [...currentAnnotations]]);
      return newMap;
    });

    // Clear redo stack for this page
    setRedoStack((prev) => {
      const newMap = new Map(prev);
      newMap.set(pageNum, []);
      return newMap;
    });

    setAnnotations((prev) => {
      const newMap = new Map(prev);
      newMap.set(pageNum, [...currentAnnotations, annotation]);
      return newMap;
    });
  };

  const eraseAtPoint = (point: { x: number; y: number }, pageNum: number) => {
    const currentAnnotations = annotations.get(pageNum) || [];
    const threshold = 20;

    const filteredAnnotations = currentAnnotations.filter((annotation) => {
      if (annotation.points) {
        return !annotation.points.some(
          (p) =>
            Math.abs(p.x - point.x) < threshold &&
            Math.abs(p.y - point.y) < threshold,
        );
      }
      if (annotation.position) {
        return !(
          Math.abs(annotation.position.x - point.x) < threshold &&
          Math.abs(annotation.position.y - point.y) < threshold
        );
      }
      return true;
    });

    if (filteredAnnotations.length !== currentAnnotations.length) {
      setUndoStack((prev) => {
        const newMap = new Map(prev);
        const pageStack = newMap.get(pageNum) || [];
        newMap.set(pageNum, [...pageStack, [...currentAnnotations]]);
        return newMap;
      });
      setRedoStack((prev) => {
        const newMap = new Map(prev);
        newMap.set(pageNum, []);
        return newMap;
      });
      setAnnotations((prev) => {
        const newMap = new Map(prev);
        newMap.set(pageNum, filteredAnnotations);
        return newMap;
      });
    }
  };

  const handleUndo = () => {
    const pageStack = undoStack.get(currentPage) || [];
    if (pageStack.length === 0) return;

    const currentAnnotations = annotations.get(currentPage) || [];
    const previousState = pageStack[pageStack.length - 1];

    setRedoStack((prev) => {
      const newMap = new Map(prev);
      const redoPageStack = newMap.get(currentPage) || [];
      newMap.set(currentPage, [...redoPageStack, [...currentAnnotations]]);
      return newMap;
    });
    setUndoStack((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentPage, pageStack.slice(0, -1));
      return newMap;
    });
    setAnnotations((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentPage, previousState);
      return newMap;
    });
  };

  const handleRedo = () => {
    const pageRedoStack = redoStack.get(currentPage) || [];
    if (pageRedoStack.length === 0) return;

    const currentAnnotations = annotations.get(currentPage) || [];
    const nextState = pageRedoStack[pageRedoStack.length - 1];

    setUndoStack((prev) => {
      const newMap = new Map(prev);
      const undoPageStack = newMap.get(currentPage) || [];
      newMap.set(currentPage, [...undoPageStack, [...currentAnnotations]]);
      return newMap;
    });
    setRedoStack((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentPage, pageRedoStack.slice(0, -1));
      return newMap;
    });
    setAnnotations((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentPage, nextState);
      return newMap;
    });
  };

  const handleClearPage = () => {
    const currentAnnotations = annotations.get(currentPage) || [];
    if (currentAnnotations.length === 0) return;

    setUndoStack((prev) => {
      const newMap = new Map(prev);
      const pageStack = newMap.get(currentPage) || [];
      newMap.set(currentPage, [...pageStack, [...currentAnnotations]]);
      return newMap;
    });
    setRedoStack((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentPage, []);
      return newMap;
    });
    setAnnotations((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentPage, []);
      return newMap;
    });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation: Arrow keys to change pages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input, textarea, or select
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowLeft") {
        if (viewMode === "single") {
          e.preventDefault();
          setCurrentPage((p) => Math.max(1, p - 1));
        }
      } else if (e.key === "ArrowRight") {
        if (viewMode === "single") {
          e.preventDefault();
          setCurrentPage((p) => Math.min(numPages, p + 1));
        }
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setScale((s) => Math.min(3, s + 0.25));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setScale((s) => Math.max(0.5, s - 0.25));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, numPages]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full bg-muted/30",
          className,
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full bg-muted/30 p-4",
          className,
        )}
      >
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-muted-foreground text-center mb-4">
          {error}
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(url, "_blank")}
          >
            Open in New Tab
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const undoStackForPage = undoStack.get(currentPage) || [];
  const redoStackForPage = redoStack.get(currentPage) || [];

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col h-full bg-muted/30", className)}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-card border-b border-border shrink-0">
        {/* Left: Page info / Navigation */}
        {isMobile ? (
          <span className="text-sm text-muted-foreground">
            {numPages} pages
          </span>
        ) : viewMode === "single" ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm min-w-[60px] text-center">
              {currentPage} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              disabled={currentPage >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {numPages} pages
          </span>
        )}

        {/* Center: Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm min-w-[45px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Share Button */}
        {isMobile && shareData && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleShare}
            title="Share link"
          >
            {showCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Right: Desktop Controls */}
        {!isMobile && (
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "scroll" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setViewMode(viewMode === "single" ? "scroll" : "single");
                setRenderedPages(new Set());
              }}
              title={
                viewMode === "single"
                  ? "Switch to vertical scroll"
                  : "Switch to single page"
              }
            >
              {viewMode === "single" ? (
                <Rows3 className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            {shareData && (
              <>
                <div className="w-px h-6 bg-border mx-1" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="end">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-xs h-9 px-2"
                        onClick={handleShare}
                      >
                        {showCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-2 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3.5 w-3.5 mr-2" />
                            Copy shareable link
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-xs h-9 px-2"
                        onClick={() => {
                          const prompt = encodeURIComponent(
                            `help me study ${shareData.fileName} from ${shareData.subject} in ${shareData.semester}`,
                          );
                          window.open(
                            `https://chatgpt.com/g/g-69caa671910481919ce71d19952e34e5-plexi?prompt=${prompt}`,
                            "_blank",
                          );
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        Share with ChatGPT
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-xs h-9 px-2"
                        onClick={() => {
                          const params = new URLSearchParams({
                            prompt: `help me study ${shareData.fileName} from ${shareData.subject} in ${shareData.semester}`,
                            semester: shareData.semester,
                            subject: shareData.subject,
                          });
                          window.open(`/ai?${params.toString()}`, "_blank");
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5 mr-2" />
                        Ask to Plexi AI
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>
        )}
      </div>

      {/* Annotation Tools - Desktop Only */}
      {!isMobile && (
        <div className="flex items-center gap-1 px-3 py-2 bg-card border-b border-border shrink-0">
          <Button
            variant={currentTool === "pen" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setCurrentTool(currentTool === "pen" ? "none" : "pen")
            }
            title="Pen"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool === "highlighter" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setCurrentTool(
                currentTool === "highlighter" ? "none" : "highlighter",
              )
            }
            title="Highlighter"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool === "text" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setCurrentTool(currentTool === "text" ? "none" : "text")
            }
            title="Text"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant={currentTool === "eraser" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setCurrentTool(currentTool === "eraser" ? "none" : "eraser")
            }
            title="Eraser"
          >
            <Eraser className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Color"
              >
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: currentColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex gap-1 flex-wrap max-w-[140px]">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                      currentColor === color
                        ? "border-foreground"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleUndo}
            disabled={undoStackForPage.length === 0}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRedo}
            disabled={redoStackForPage.length === 0}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClearPage}
            title="Clear page annotations"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* PDF Content */}
      {viewMode === "single" ? (
        /* Single Page Mode */
        <div className="flex-1 overflow-auto flex items-start justify-center p-2 md:p-4">
          <div className="relative inline-block shadow-lg">
            <canvas
              ref={canvasRef}
              className="block bg-white max-w-full h-auto"
            />
            {!isMobile && (
              <canvas
                ref={annotationCanvasRef}
                className={cn(
                  "absolute top-0 left-0 max-w-full h-auto",
                  currentTool !== "none" && "cursor-crosshair",
                )}
                onMouseDown={(e) => handlePointerDown(e)}
                onMouseMove={(e) => handlePointerMove(e)}
                onMouseUp={() => handlePointerUp()}
                onMouseLeave={() => handlePointerUp()}
              />
            )}
          </div>
        </div>
      ) : (
        /* Vertical Scroll Mode */
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-4"
        >
          <div className="flex flex-col items-center gap-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <div key={pageNum} className="relative shadow-lg w-fit">
                  <canvas
                    ref={(el) => {
                      if (el) pageCanvasRefs.current.set(pageNum, el);
                    }}
                    className="block bg-white max-w-full h-auto"
                  />
                  {!isMobile && (
                    <canvas
                      ref={(el) => {
                        if (el) annotationCanvasRefs.current.set(pageNum, el);
                      }}
                      className={cn(
                        "absolute top-0 left-0 max-w-full h-auto",
                        currentTool !== "none" && "cursor-crosshair",
                      )}
                      onMouseDown={(e) => handlePointerDown(e, pageNum)}
                      onMouseMove={(e) => handlePointerMove(e, pageNum)}
                      onMouseUp={() => handlePointerUp(pageNum)}
                      onMouseLeave={() => handlePointerUp(pageNum)}
                    />
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {pageNum} / {numPages}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
