"use client";

import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";
import { Loader2 } from "lucide-react";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
  flowchart: {
    htmlLabels: true,
    useMaxWidth: true,
    curve: "basis",
    padding: 20,
  },
  themeVariables: {
    fontFamily: "Geist, sans-serif",
    fontSize: "14px",
    primaryColor: "#fff4dd",
    primaryTextColor: "#1a1a1a",
    primaryBorderColor: "#d4a017",
    lineColor: "#64748b",
    secondaryColor: "#f1f5f9",
    tertiaryColor: "#f8fafc",
    noteBkgColor: "#fff9c4",
    noteTextColor: "#333",
  },
});

export const Mermaid = memo(function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const sanitizedChart = useMemo(
    () =>
      chart
        .replace(/-->\|([^|]+)\|>/g, "-->|$1|")
        .replace(/--\|([^|]+)\|-->/g, "-->|$1|"),
    [chart],
  );

  useEffect(() => {
    let isMounted = true;

    // Force a small delay to ensure fonts are loaded
    const timer = setTimeout(() => {
      const renderChart = async () => {
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
          const { svg } = await mermaid.render(id, sanitizedChart);
          if (isMounted) {
            setSvg(svg);
            setError("");
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          if (isMounted) {
            setError(e?.message || "Failed to render Mermaid diagram");
          }
        }
      };

      void renderChart();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [sanitizedChart]);

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-xs text-destructive overflow-auto my-4 border border-destructive/20">
        <strong>Mermaid Simulation Error:</strong>
        <pre className="mt-2 whitespace-pre-wrap">{error}</pre>
        <pre className="mt-4 text-muted-foreground border-t border-destructive/20 pt-2 whitespace-pre-wrap">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground my-4 bg-muted/50 rounded-xl border border-border">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-xs">Rendering diagram...</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex justify-center my-4 p-4 bg-muted/30 rounded-xl border border-border overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});

Mermaid.displayName = "Mermaid";
