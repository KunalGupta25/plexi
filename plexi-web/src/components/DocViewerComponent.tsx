import React, { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocViewerComponentProps {
  document: string;
  filename: string;
}

/**
 * Custom "PDF Kit" Viewer with Annotations
 * Built using PDF.js (pdfjs-dist) for high-performance rendering.
 * Includes Marker and Highlighter functionality via an overlay canvas.
 */
/**
 * Custom "PDF Kit" Viewer with Annotations
 * Built using PDF.js (pdfjs-dist) for high-performance rendering.
 * Includes Marker and Highlighter functionality via an overlay canvas.
 */
const DocViewerComponent: React.FC<DocViewerComponentProps> = ({
  document,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastDimensions = useRef({ width: 0, height: 0 });

  // Annotation State
  const [activeTool, setActiveTool] = useState<
    "none" | "marker" | "highlighter"
  >("none");
  const [annotations, setAnnotations] = useState<Record<number, any[]>>({}); // pageNum -> strokes

  const handleFitWidth = async () => {
    if (!pdfDoc || !containerRef.current) return;
    try {
      const page = await pdfDoc.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      const availableWidth = containerRef.current.clientWidth;
      const newScale = availableWidth / viewport.width;
      setScale(Math.max(newScale, 0.4));
    } catch (err) {
      console.error("Error fitting width:", err);
    }
  };

  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        const loadingTask = pdfjs.getDocument(document);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setPageNum(1);
        setLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to initialize PDF Kit engine.");
        setLoading(false);
      }
    };

    if (document) {
      loadPdf();
    }
  }, [document]);

  // Handle Resize and Initial Fit
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width } = entry.contentRect;
      if (Math.abs(width - lastDimensions.current.width) < 2) return;
      lastDimensions.current.width = width;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleFitWidth();
      }, 150);
    });

    observer.observe(containerRef.current);
    const initialFit = setTimeout(() => {
      handleFitWidth();
    }, 300);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
      clearTimeout(initialFit);
    };
  }, [pdfDoc]);

  const scrollToPage = (targetPage: number) => {
    const pageEl = containerRef.current?.querySelector(
      `[data-page-number="${targetPage}"]`,
    );
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const changePage = (offset: number) => {
    if (!pdfDoc) return;
    const next = Math.min(Math.max(pageNum + offset, 1), pdfDoc.numPages);
    scrollToPage(next);
  };

  const adjustZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(prev + delta, 0.3), 4));
  };

  const clearAnnotations = () => {
    setAnnotations((prev) => ({ ...prev, [pageNum]: [] }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative overflow-hidden animate-fade-in-up">
      {/* PDF Kit Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-full shadow-xl transition-all hover:border-primary/30 scale-90 sm:scale-100 text-slate-900">
        <div className="flex items-center gap-1">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNum <= 1}
            className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-colors text-slate-700"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
          </button>
          <div className="flex items-center gap-1 select-none">
            <span className="text-[10px] font-black font-headline text-primary w-4 text-center">
              {pageNum}
            </span>
            <span className="text-[8px] text-slate-400">/</span>
            <span className="text-[8px] font-bold text-slate-500">
              {pdfDoc?.numPages || "-"}
            </span>
          </div>
          <button
            onClick={() => changePage(1)}
            disabled={!pdfDoc || pageNum >= pdfDoc.numPages}
            className="p-1 hover:bg-slate-100 rounded-lg disabled:opacity-20 transition-colors text-slate-700"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </button>
        </div>
        <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => adjustZoom(-0.2)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
          >
            <span className="material-symbols-outlined text-[18px]">
              zoom_out
            </span>
          </button>
          <button
            onClick={handleFitWidth}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
          >
            <span className="material-symbols-outlined text-[18px]">
              fit_width
            </span>
          </button>
          <button
            onClick={() => adjustZoom(0.2)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
          >
            <span className="material-symbols-outlined text-[18px]">
              zoom_in
            </span>
          </button>
        </div>
        <div className="w-px h-3 bg-slate-200 mx-0.5"></div>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setActiveTool(
                activeTool === "highlighter" ? "none" : "highlighter",
              )
            }
            className={cn(
              "p-1 rounded-lg transition-all",
              activeTool === "highlighter"
                ? "bg-primary/20 text-primary"
                : "text-slate-500 hover:text-primary",
            )}
          >
            <span className="material-symbols-outlined text-[18px]">
              stylus_note
            </span>
          </button>
          <button
            onClick={() =>
              setActiveTool(activeTool === "marker" ? "none" : "marker")
            }
            className={cn(
              "p-1 rounded-lg transition-all",
              activeTool === "marker"
                ? "bg-primary/20 text-primary"
                : "text-slate-500 hover:text-primary",
            )}
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={clearAnnotations}
            className="p-1 text-slate-500 hover:text-error hover:bg-error/10 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              ink_eraser
            </span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-auto flex flex-col items-center justify-start no-scrollbar scroll-smooth relative bg-slate-100 p-4 pt-16 gap-6",
          activeTool !== "none" && "cursor-crosshair",
        )}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              PDF Kit Initializing...
            </span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-20 text-error p-8 text-center">
            <span className="material-symbols-outlined text-4xl mb-2">
              error
            </span>
            <span className="text-sm font-bold max-w-xs">{error}</span>
          </div>
        )}

        {!loading &&
          pdfDoc &&
          Array.from({ length: pdfDoc.numPages }).map((_, i) => (
            <PdfPage
              key={i + 1}
              pdfDoc={pdfDoc}
              number={i + 1}
              scale={scale}
              activeTool={activeTool}
              annotations={annotations[i + 1] || []}
              setAnnotations={(newAnnos) =>
                setAnnotations((prev) => ({ ...prev, [i + 1]: newAnnos }))
              }
              onVisible={() => setPageNum(i + 1)}
            />
          ))}
      </div>
    </div>
  );
};

interface PdfPageProps {
  pdfDoc: pdfjs.PDFDocumentProxy;
  number: number;
  scale: number;
  activeTool: string;
  annotations: any[];
  setAnnotations: (annos: any[]) => void;
  onVisible: () => void;
}

const PdfPage: React.FC<PdfPageProps> = ({
  pdfDoc,
  number,
  scale,
  activeTool,
  annotations,
  setAnnotations,
  onVisible,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisible();
          if (!isRendered) renderPage();
        }
      },
      { threshold: 0.3 },
    );

    if (pageRef.current) observer.observe(pageRef.current);
    return () => observer.disconnect();
  }, [scale, isRendered]);

  const renderPage = async () => {
    if (!canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(number);
      // Explicitly use the page's internal rotation metadata
      const viewport = page.getViewport({ scale, rotation: page.rotate });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (drawingCanvasRef.current) {
        drawingCanvasRef.current.width = canvas.width;
        drawingCanvasRef.current.height = canvas.height;
        redrawAnnotations();
      }

      await page.render({ canvasContext: context, viewport }).promise;
      setIsRendered(true);
    } catch (err) {
      console.error(`Error rendering page ${number}:`, err);
    }
  };

  useEffect(() => {
    if (isRendered) renderPage();
  }, [scale]);

  useEffect(() => {
    if (isRendered) redrawAnnotations();
  }, [annotations]);

  const redrawAnnotations = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    annotations.forEach((stroke) => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = stroke.opacity;
      stroke.points.forEach((p: any, i: number) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });
    ctx.globalAlpha = 1.0;
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (activeTool === "none") return;
    setIsDrawing(true);
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x =
      (e.clientX - rect.left) * (drawingCanvasRef.current!.width / rect.width);
    const y =
      (e.clientY - rect.top) * (drawingCanvasRef.current!.height / rect.height);
    const newStroke = {
      tool: activeTool,
      color: activeTool === "marker" ? "#6366F1" : "#FDE047",
      width: activeTool === "marker" ? 3 : 20,
      opacity: activeTool === "marker" ? 1.0 : 0.4,
      points: [{ x, y }],
    };
    setAnnotations([...annotations, newStroke]);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || activeTool === "none") return;
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x =
      (e.clientX - rect.left) * (drawingCanvasRef.current!.width / rect.width);
    const y =
      (e.clientY - rect.top) * (drawingCanvasRef.current!.height / rect.height);
    const pageAnnos = [...annotations];
    const currentStroke = { ...pageAnnos[pageAnnos.length - 1] };
    currentStroke.points = [...currentStroke.points, { x, y }];
    pageAnnos[pageAnnos.length - 1] = currentStroke;
    setAnnotations(pageAnnos);
  };

  return (
    <div
      ref={pageRef}
      data-page-number={number}
      className="relative bg-white shadow-lg mx-auto shrink-0"
      style={{
        width: canvasRef.current?.width
          ? `${canvasRef.current.width}px`
          : "100%",
        minHeight: "400px",
      }}
    >
      <canvas ref={canvasRef} />
      <canvas
        ref={drawingCanvasRef}
        className="absolute inset-0 pointer-events-auto touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
      />
    </div>
  );
};

export default DocViewerComponent;
