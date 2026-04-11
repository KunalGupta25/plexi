import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import * as pdfjs from "pdfjs-dist";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocViewerComponentProps {
  document: string;
  filename: string;
}

const DocViewerComponent: React.FC<DocViewerComponentProps> = ({ document: documentUrl }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const baseWidthRef = useRef(0); // unscaled page-1 width

  // Annotation state
  const [activeTool, setActiveTool] = useState<"none" | "marker" | "highlighter">("none");
  const [annotations, setAnnotations] = useState<Record<number, any[]>>({});

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const doc = await pdfjs.getDocument(documentUrl).promise;
        if (cancelled) return;
        setPdfDoc(doc);

        const page = await doc.getPage(1);
        const vp = page.getViewport({ scale: 1.0 });
        if (cancelled) return;
        baseWidthRef.current = vp.width;

        // Fit-to-width: fill the preview panel width so text is readable
        if (containerWidth > 0) {
          setScale(Math.max((containerWidth - 32) / vp.width, 0.3));
        }
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF.");
        setLoading(false);
      }
    };
    if (documentUrl) load();
    return () => { cancelled = true; };
  }, [documentUrl]);

  // Observe container width
  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (Math.abs(w - containerWidth) > 5) setContainerWidth(w);
    });
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, [containerWidth]);

  // Re-fit to width when container resizes
  useEffect(() => {
    if (!pdfDoc || containerWidth <= 0 || !baseWidthRef.current) return;
    setScale(Math.max((containerWidth - 32) / baseWidthRef.current, 0.3));
  }, [pdfDoc, containerWidth]);

  // Track visible page via IntersectionObserver
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  useEffect(() => {
    if (!pdfDoc) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const num = Number((entry.target as HTMLElement).dataset.pageNumber);
            if (num) setPageNum(num);
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    pageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pdfDoc, loading]);

  const changePage = (offset: number) => {
    if (!pdfDoc) return;
    const next = Math.min(Math.max(pageNum + offset, 1), pdfDoc.numPages);
    setPageNum(next);
    const el = pageRefs.current.get(next);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const adjustZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(prev + delta, 0.3), 4));
  };

  const undoLastAnnotation = () => {
    setAnnotations((prev) => {
      const current = prev[pageNum] || [];
      if (current.length === 0) return prev;
      return { ...prev, [pageNum]: current.slice(0, -1) };
    });
  };

  const registerPageRef = useCallback((num: number, el: HTMLDivElement | null) => {
    if (el) pageRefs.current.set(num, el);
    else pageRefs.current.delete(num);
  }, []);

  return (
    <div ref={scrollRef} className="w-full bg-surface-container-low relative">
      {/* PDF pages render inline — container grows to match content */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">PDF Kit Initializing...</span>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-error p-8 text-center">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <span className="text-sm font-bold max-w-xs">{error}</span>
        </div>
      )}

      {!loading && pdfDoc && (
        <div className={cn("flex flex-col items-center gap-6 px-2 py-4", activeTool !== "none" && "cursor-crosshair")}>
          {Array.from({ length: pdfDoc.numPages }, (_, i) => (
            <PdfPage
              key={`${documentUrl}-${i}`}
              ref={(el) => registerPageRef(i + 1, el)}
              pdfDoc={pdfDoc}
              number={i + 1}
              scale={scale}
              activeTool={activeTool}
              annotations={annotations[i + 1] || []}
              setAnnotations={(annos) => setAnnotations((prev) => ({ ...prev, [i + 1]: annos }))}
            />
          ))}
        </div>
      )}

      {/* Right-side vertical floating toolbar — portaled to body so fixed works */}
      {createPortal(
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 px-1.5 py-2 bg-surface-container-lowest/90 dark:bg-surface-container-highest/90 backdrop-blur-xl border border-outline-variant/30 rounded-2xl shadow-xl text-on-surface">
        {/* Page navigation */}
        <button onClick={() => changePage(-1)} disabled={pageNum <= 1} className="p-1.5 hover:bg-surface-container-high rounded-lg disabled:opacity-20 transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">expand_less</span>
        </button>
        <div className="flex flex-col items-center select-none py-0.5">
          <span className="text-[11px] font-black font-headline text-primary leading-none">{pageNum}</span>
          <span className="text-[7px] text-outline leading-none">of</span>
          <span className="text-[9px] font-bold text-on-surface-variant leading-none">{pdfDoc?.numPages || "-"}</span>
        </div>
        <button onClick={() => changePage(1)} disabled={!pdfDoc || pageNum >= pdfDoc.numPages} className="p-1.5 hover:bg-surface-container-high rounded-lg disabled:opacity-20 transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">expand_more</span>
        </button>

        <div className="h-px w-5 bg-outline-variant/30 my-0.5" />

        {/* Zoom */}
        <button onClick={() => adjustZoom(0.2)} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">zoom_in</span>
        </button>
        <button onClick={() => { if (!baseWidthRef.current || containerWidth <= 0) return; setScale((containerWidth - 32) / baseWidthRef.current); }} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant" title="Fit to width">
          <span className="material-symbols-outlined text-[18px]">fit_width</span>
        </button>
        <button onClick={() => adjustZoom(-0.2)} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">zoom_out</span>
        </button>

        <div className="h-px w-5 bg-outline-variant/30 my-0.5" />

        {/* Annotation tools */}
        <button onClick={() => setActiveTool(activeTool === "highlighter" ? "none" : "highlighter")} className={cn("p-1.5 rounded-lg transition-all", activeTool === "highlighter" ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-primary")}>
          <span className="material-symbols-outlined text-[18px]">stylus_note</span>
        </button>
        <button onClick={() => setActiveTool(activeTool === "marker" ? "none" : "marker")} className={cn("p-1.5 rounded-lg transition-all", activeTool === "marker" ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-primary")}>
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button onClick={undoLastAnnotation} className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all" title="Undo last annotation">
          <span className="material-symbols-outlined text-[18px]">ink_eraser</span>
        </button>
      </div>,
        document.body
      )}
    </div>
  );
};

/* ─── Individual PDF Page ─── */

interface PdfPageProps {
  pdfDoc: pdfjs.PDFDocumentProxy;
  number: number;
  scale: number;
  activeTool: string;
  annotations: any[];
  setAnnotations: (annos: any[]) => void;
}

const PdfPage = React.forwardRef<HTMLDivElement, PdfPageProps>(
  ({ pdfDoc, number, scale, activeTool, annotations, setAnnotations }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

    // Render PDF page to canvas
    useEffect(() => {
      let renderTask: pdfjs.RenderTask | null = null;
      let cancelled = false;

      const render = async () => {
        if (!canvasRef.current) return;
        try {
          const page = await pdfDoc.getPage(number);
          const viewport = page.getViewport({ scale, rotation: page.rotate });
          if (cancelled) return;

          setDims({ w: viewport.width, h: viewport.height });

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (drawingCanvasRef.current) {
            drawingCanvasRef.current.width = viewport.width;
            drawingCanvasRef.current.height = viewport.height;
          }

          renderTask = page.render({ canvasContext: ctx, viewport });
          await renderTask.promise;
        } catch (err: any) {
          if (err?.name === "RenderingCancelledException") return;
          console.error(`Error rendering page ${number}:`, err);
        }
      };

      render();
      return () => {
        cancelled = true;
        renderTask?.cancel();
      };
    }, [pdfDoc, number, scale]);

    // Redraw annotations overlay
    const redrawAnnotations = useCallback(() => {
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
    }, [annotations]);

    useEffect(() => {
      redrawAnnotations();
    }, [redrawAnnotations]);

    const getCoords = (e: React.MouseEvent) => {
      const dc = drawingCanvasRef.current;
      if (!dc) return null;
      const rect = dc.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (dc.width / rect.width),
        y: (e.clientY - rect.top) * (dc.height / rect.height),
      };
    };

    const startDrawing = (e: React.MouseEvent) => {
      if (activeTool === "none") return;
      setIsDrawing(true);
      const pt = getCoords(e);
      if (!pt) return;
      setAnnotations([
        ...annotations,
        {
          tool: activeTool,
          color: activeTool === "marker" ? "#6366F1" : "#FDE047",
          width: activeTool === "marker" ? 3 : 20,
          opacity: activeTool === "marker" ? 1.0 : 0.4,
          points: [pt],
        },
      ]);
    };

    const draw = (e: React.MouseEvent) => {
      if (!isDrawing || activeTool === "none") return;
      const pt = getCoords(e);
      if (!pt) return;
      const updated = [...annotations];
      const last = { ...updated[updated.length - 1] };
      last.points = [...last.points, pt];
      updated[updated.length - 1] = last;
      setAnnotations(updated);
    };

    const style = dims
      ? { width: `${dims.w}px`, height: `${dims.h}px` }
      : { width: "100%", minHeight: "400px" };

    return (
      <div ref={ref} data-page-number={number} className="relative bg-white shadow-lg shrink-0" style={style}>
        <canvas ref={canvasRef} className="block" />
        <canvas
          ref={drawingCanvasRef}
          className="absolute inset-0 pointer-events-auto touch-none"
          style={{ width: "100%", height: "100%" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
        />
      </div>
    );
  },
);

PdfPage.displayName = "PdfPage";

export default DocViewerComponent;
