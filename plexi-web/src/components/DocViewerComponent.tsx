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

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ page: number; matchIndex: number }[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlightedTextItems, setHighlightedTextItems] = useState<Map<number, { text: string; transform: number[] }[]>>(new Map());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pinch-to-zoom state
  const pinchRef = useRef<{
    initialDistance: number;
    initialScale: number;
    centerX: number;
    centerY: number;
  } | null>(null);

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

  // Pinch-to-zoom handler on the scroll container
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const getTouchDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2 && activeTool === "none") {
        e.preventDefault();
        const dist = getTouchDistance(e.touches);
        pinchRef.current = {
          initialDistance: dist,
          initialScale: scale,
          centerX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          centerY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const dist = getTouchDistance(e.touches);
        const ratio = dist / pinchRef.current.initialDistance;
        const newScale = Math.min(Math.max(pinchRef.current.initialScale * ratio, 0.3), 4);
        setScale(newScale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchRef.current = null;
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeTool, scale]);

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

  // ─── Search logic ───
  const performSearch = useCallback(async () => {
    if (!pdfDoc || !searchQuery.trim()) {
      setSearchResults([]);
      setHighlightedTextItems(new Map());
      setCurrentSearchIndex(0);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const results: { page: number; matchIndex: number }[] = [];
    const textItemsMap = new Map<number, { text: string; transform: number[] }[]>();

    for (let p = 1; p <= pdfDoc.numPages; p++) {
      const page = await pdfDoc.getPage(p);
      const textContent = await page.getTextContent();
      const items: { text: string; transform: number[] }[] = [];
      let matchIndex = 0;

      for (const item of textContent.items) {
        if ("str" in item) {
          const str = item.str;
          items.push({ text: str, transform: (item as any).transform || [] });
          if (str.toLowerCase().includes(query)) {
            results.push({ page: p, matchIndex });
            matchIndex++;
          }
        }
      }
      if (matchIndex > 0) {
        textItemsMap.set(p, items);
      }
    }

    setSearchResults(results);
    setHighlightedTextItems(textItemsMap);
    setCurrentSearchIndex(0);

    // Navigate to first result
    if (results.length > 0) {
      navigateToSearchResult(results[0]);
    }
  }, [pdfDoc, searchQuery]);

  const navigateToSearchResult = (result: { page: number; matchIndex: number }) => {
    const el = pageRefs.current.get(result.page);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setPageNum(result.page);
    }
  };

  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    const next = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(next);
    navigateToSearchResult(searchResults[next]);
  };

  const prevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prev = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prev);
    navigateToSearchResult(searchResults[prev]);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedTextItems(new Map());
    setCurrentSearchIndex(0);
  };

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <div ref={scrollRef} className="w-full bg-surface-container-low relative overflow-auto touch-pan-x touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
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
              searchQuery={searchOpen ? searchQuery : ""}
              highlightedTextItems={highlightedTextItems.get(i + 1) || []}
              isActiveSearchPage={searchResults.length > 0 && searchResults[currentSearchIndex]?.page === i + 1}
            />
          ))}
        </div>
      )}

      {/* Search bar — portaled to body so it stays on top */}
      {searchOpen && createPortal(
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-3 py-2 bg-surface-container-lowest/95 dark:bg-surface-container-highest/95 backdrop-blur-xl border border-outline-variant/30 rounded-2xl shadow-2xl text-on-surface w-[min(90vw,420px)] animate-fade-in-up">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">search</span>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) prevSearchResult();
                else if (searchResults.length > 0 && searchQuery === searchQuery) nextSearchResult();
                else performSearch();
              }
              if (e.key === "Escape") closeSearch();
            }}
            placeholder="Search in PDF..."
            className="flex-1 bg-transparent outline-none text-sm font-medium text-on-surface placeholder:text-outline min-w-0"
          />
          {searchResults.length > 0 && (
            <span className="text-[10px] font-bold text-on-surface-variant whitespace-nowrap">
              {currentSearchIndex + 1}/{searchResults.length}
            </span>
          )}
          <button
            onClick={performSearch}
            className="p-1 rounded-lg hover:bg-surface-container-high transition-colors text-primary shrink-0"
            title="Search"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
          <button
            onClick={prevSearchResult}
            disabled={searchResults.length === 0}
            className="p-1 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-20 text-on-surface-variant shrink-0"
            title="Previous result"
          >
            <span className="material-symbols-outlined text-[16px]">expand_less</span>
          </button>
          <button
            onClick={nextSearchResult}
            disabled={searchResults.length === 0}
            className="p-1 rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-20 text-on-surface-variant shrink-0"
            title="Next result"
          >
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
          <button
            onClick={closeSearch}
            className="p-1 rounded-lg hover:bg-error/10 transition-colors text-on-surface-variant hover:text-error shrink-0"
            title="Close search"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>,
        document.body
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

        {/* Search */}
        <button
          onClick={() => { setSearchOpen(!searchOpen); }}
          className={cn("p-1.5 rounded-lg transition-all", searchOpen ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-high")}
          title="Search in PDF (Ctrl+F)"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
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
  searchQuery: string;
  highlightedTextItems: { text: string; transform: number[] }[];
  isActiveSearchPage: boolean;
}

const PdfPage = React.forwardRef<HTMLDivElement, PdfPageProps>(
  ({ pdfDoc, number, scale, activeTool, annotations, setAnnotations, searchQuery, highlightedTextItems: _highlightedTextItems, isActiveSearchPage }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
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

          // Render text layer for search highlights
          if (textLayerRef.current && searchQuery) {
            const textContent = await page.getTextContent();
            const textLayerDiv = textLayerRef.current;
            textLayerDiv.innerHTML = "";
            textLayerDiv.style.width = `${viewport.width}px`;
            textLayerDiv.style.height = `${viewport.height}px`;

            const query = searchQuery.toLowerCase();

            for (const item of textContent.items) {
              if (!("str" in item) || !item.str) continue;
              const str = item.str;
              const matchesSearch = str.toLowerCase().includes(query);
              if (!matchesSearch) continue;

              const tx = (item as any).transform;
              if (!tx || tx.length < 6) continue;

              // Convert PDF coordinates to viewport coordinates
              const [a, b, , , e, f] = tx;

              // Approximate width/height
              const fontSize = Math.sqrt(a * a + b * b) * viewport.scale;
              const width = (item as any).width ? (item as any).width * viewport.scale : str.length * fontSize * 0.6;

              const span = document.createElement("span");
              span.style.position = "absolute";
              span.style.left = `${e * viewport.scale}px`;
              span.style.top = `${viewport.height - f * viewport.scale - fontSize}px`;
              span.style.width = `${width}px`;
              span.style.height = `${fontSize * 1.2}px`;
              span.style.backgroundColor = isActiveSearchPage ? "rgba(255, 200, 0, 0.45)" : "rgba(255, 200, 0, 0.25)";
              span.style.borderRadius = "2px";
              span.style.pointerEvents = "none";
              span.style.mixBlendMode = "multiply";

              textLayerDiv.appendChild(span);
            }
          } else if (textLayerRef.current) {
            textLayerRef.current.innerHTML = "";
          }
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
    }, [pdfDoc, number, scale, searchQuery, isActiveSearchPage]);

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

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
      const dc = drawingCanvasRef.current;
      if (!dc) return null;
      const rect = dc.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ("touches" in e) {
        if (e.touches.length !== 1) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * (dc.width / rect.width),
        y: (clientY - rect.top) * (dc.height / rect.height),
      };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if (activeTool === "none") return;
      e.preventDefault();
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

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || activeTool === "none") return;
      e.preventDefault();
      const pt = getCoords(e);
      if (!pt) return;
      const updated = [...annotations];
      const last = { ...updated[updated.length - 1] };
      last.points = [...last.points, pt];
      updated[updated.length - 1] = last;
      setAnnotations(updated);
    };

    const stopDrawing = () => setIsDrawing(false);

    const style = dims
      ? { width: `${dims.w}px`, height: `${dims.h}px` }
      : { width: "100%", minHeight: "400px" };

    // When activeTool is "none", allow touch events to pass through for native scrolling.
    // When an annotation tool is active, intercept touches for drawing.
    const drawingCanvasClasses = cn(
      "absolute inset-0",
      activeTool !== "none" ? "pointer-events-auto touch-none" : "pointer-events-none"
    );

    return (
      <div ref={ref} data-page-number={number} className="relative bg-white shadow-lg shrink-0" style={style}>
        <canvas ref={canvasRef} className="block" />
        {/* Text highlight layer for search */}
        <div ref={textLayerRef} className="absolute top-0 left-0 pointer-events-none" />
        <canvas
          ref={drawingCanvasRef}
          className={drawingCanvasClasses}
          style={{ width: "100%", height: "100%" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
    );
  },
);

PdfPage.displayName = "PdfPage";

export default DocViewerComponent;
