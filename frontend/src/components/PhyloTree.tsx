import { useRef, useEffect, useState, useCallback } from "react";
import type PhylocanvasGL from "@phylocanvas/phylocanvas.gl";
import { Maximize2 } from "lucide-react";

interface PhyloTreeProps {
  newick: string;
}

const LAYOUTS = [
  { key: "rc", label: "Rectangular" },
  { key: "cr", label: "Circular" },
  { key: "rd", label: "Radial" },
  { key: "dg", label: "Diagonal" },
] as const;

type LayoutKey = (typeof LAYOUTS)[number]["key"];

export default function PhyloTree({ newick }: PhyloTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<PhylocanvasGL | null>(null);
  const [layout, setLayout] = useState<LayoutKey>("rc");

  useEffect(() => {
    if (!containerRef.current || !newick) return;

    let destroyed = false;
    let instance: PhylocanvasGL | null = null;

    import("@phylocanvas/phylocanvas.gl").then(({ default: Phylocanvas }) => {
      if (destroyed || !containerRef.current) return;
      instance = new Phylocanvas(containerRef.current, {
      source: newick,
      type: layout,
      interactive: true,
      showLabels: true,
      showLeafLabels: true,
      showInternalLabels: false,
      alignLabels: true,
      padding: 24,
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: 13,
      fontColour: "oklch(0.65 0.008 280)",
      strokeColour: "oklch(0.35 0.008 280)",
      fillColour: "oklch(0.35 0.008 280)",
      strokeWidth: 1.5,
      lineWidth: 1.5,
      highlightColour: "oklch(0.72 0.12 175)",
      nodeSize: 8,
      nodeShape: "circle",
      styles: {
        Query: {
          fillColour: "#1D9E75",
          strokeColour: "#1D9E75",
          shape: "diamond",
          label: { colour: "#1D9E75", fontWeight: "bold" },
        },
      },
      });
      treeRef.current = instance;
    });

    return () => {
      destroyed = true;
      instance?.destroy();
    };
  }, [newick, layout]);

  const fitView = useCallback(() => {
    treeRef.current?.fitInPanel();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] font-semibold text-ink">Phylogenetic Tree</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-2xs text-ink-tertiary font-medium mr-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-accent shadow-glow rotate-45" />
              Query
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ink-tertiary" />
              Reference
            </span>
          </div>
          <button
            onClick={fitView}
            title="Fit to view"
            className="w-7 h-7 flex items-center justify-center text-ink-tertiary hover:text-ink hover:bg-surface-elevated rounded-md transition-colors"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Layout tabs */}
      <div className="flex gap-1 mb-3">
        {LAYOUTS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLayout(key)}
            className={`px-3 py-1.5 text-2xs font-medium rounded-md transition-all ${
              layout === key
                ? "bg-accent-dim text-accent"
                : "text-ink-tertiary hover:text-ink-secondary hover:bg-surface-elevated"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border border-ghost rounded-xl overflow-hidden bg-surface-base">
        <div ref={containerRef} style={{ width: "100%", height: 480 }} />
      </div>

      <p className="text-2xs text-ink-faint mt-2 text-center">
        Scroll to zoom &middot; Drag to pan &middot; Click a node to highlight
      </p>
    </div>
  );
}
