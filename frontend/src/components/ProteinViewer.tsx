import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Box, Loader2, AlertCircle } from "lucide-react";
import { predictStructure } from "../api/pipeline";

interface ProteinViewerProps {
  jobId: string;
}

type ViewerState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; pdb: string; sequence: string }
  | { status: "error"; message: string };

const VIEWER_SCRIPT = "https://3Dmol.org/build/3Dmol-min.js";

function load3Dmol(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).$3Dmol) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${VIEWER_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = VIEWER_SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load 3Dmol.js"));
    document.head.appendChild(script);
  });
}

// pLDDT → color (ESMFold convention)
function plddt_color_scheme() {
  return {
    prop: "b",
    gradient: "linear",
    min: 0,
    max: 100,
    colors: ["#FF4444", "#FF9944", "#44CC88", "#1D9E75"],
  };
}

export default function ProteinViewer({ jobId }: ProteinViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ViewerState>({ status: "idle" });

  const predict = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const { pdb, protein_sequence } = await predictStructure(jobId);
      setState({ status: "ready", pdb, sequence: protein_sequence });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Prediction failed",
      });
    }
  }, [jobId]);

  useEffect(() => {
    if (state.status !== "ready" || !containerRef.current) return;

    let viewer: unknown = null;

    load3Dmol().then(() => {
      if (!containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const $3Dmol = (window as any).$3Dmol;
      viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: "oklch(0.13 0.008 280)",
        antialias: true,
      });
      (viewer as any).addModel(state.pdb, "pdb");
      (viewer as any).setStyle({}, { cartoon: { colorfunc: null, color: "spectrum" } });
      (viewer as any).setStyle({}, { cartoon: plddt_color_scheme() });
      (viewer as any).zoomTo();
      (viewer as any).render();
    });

    return () => {
      if (viewer) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (viewer as any).clear?.();
      }
    };
  }, [state]);

  if (state.status === "idle") {
    return (
      <div>
        <p className="text-2xs font-semibold text-ink-tertiary uppercase tracking-[0.12em] mb-3">
          3D Structure
        </p>
        <button
          onClick={predict}
          className="w-full flex items-center gap-3 px-3.5 py-3 bg-surface-base border border-ghost rounded-lg hover:border-accent/30 hover:bg-accent-subtle transition-all group text-left"
        >
          <div className="w-8 h-8 rounded-md bg-surface-elevated group-hover:bg-accent-dim flex items-center justify-center transition-colors">
            <Box size={14} className="text-ink-tertiary group-hover:text-accent transition-colors" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-ink group-hover:text-accent transition-colors">
              Predict protein structure
            </p>
            <p className="text-2xs text-ink-tertiary">ESMFold — translates consensus and folds</p>
          </div>
        </button>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div>
        <p className="text-2xs font-semibold text-ink-tertiary uppercase tracking-[0.12em] mb-3">
          3D Structure
        </p>
        <div className="flex items-center gap-3 px-3.5 py-4 bg-surface-base border border-ghost rounded-lg">
          <Loader2 size={16} className="text-accent animate-spin" />
          <div>
            <p className="text-[13px] font-medium text-ink">Folding protein...</p>
            <p className="text-2xs text-ink-tertiary">This may take up to a minute</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div>
        <p className="text-2xs font-semibold text-ink-tertiary uppercase tracking-[0.12em] mb-3">
          3D Structure
        </p>
        <div className="flex items-center gap-3 px-3.5 py-3 bg-danger-dim border border-danger-dim rounded-lg">
          <AlertCircle size={16} className="text-danger flex-shrink-0" />
          <p className="text-[13px] text-danger-muted">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-2xs font-semibold text-ink-tertiary uppercase tracking-[0.12em]">
          3D Structure
        </p>
        <span className="text-2xs text-ink-tertiary font-mono tabular-nums">
          {state.sequence.length} aa
        </span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border border-ghost rounded-xl overflow-hidden"
      >
        <div ref={containerRef} style={{ width: "100%", height: 320 }} />
      </motion.div>
      <div className="flex items-center gap-3 mt-2 text-2xs text-ink-faint">
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 rounded bg-[#1D9E75]" /> High confidence
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 rounded bg-[#44CC88]" /> Good
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 rounded bg-[#FF9944]" /> Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 rounded bg-[#FF4444]" /> Very low
        </span>
      </div>
    </div>
  );
}
