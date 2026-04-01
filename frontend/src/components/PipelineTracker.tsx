import { motion } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import type { PipelineStage } from "../types";

interface PipelineTrackerProps {
  currentStage: PipelineStage | null;
  message: string;
  progress: number;
}

const STAGES: { key: PipelineStage; label: string; desc: string }[] = [
  { key: "assembly", label: "Assembly", desc: "Building consensus from reads" },
  { key: "blast", label: "BLAST Search", desc: "Querying NCBI database" },
  { key: "entrez", label: "Reference Fetch", desc: "Downloading reference sequences" },
  { key: "alignment", label: "Alignment", desc: "Multiple sequence alignment" },
  { key: "tree", label: "Tree Construction", desc: "Building neighbor-joining tree" },
  { key: "visualize", label: "Visualization", desc: "Rendering annotated tree" },
];

const STAGE_ORDER = STAGES.map((s) => s.key);

function getStatus(
  stageKey: PipelineStage,
  currentStage: PipelineStage | null
): "waiting" | "running" | "done" | "error" {
  if (!currentStage) return "waiting";
  if (currentStage === "error") return "error";
  if (currentStage === "complete") return "done";
  const ci = STAGE_ORDER.indexOf(currentStage);
  const si = STAGE_ORDER.indexOf(stageKey);
  if (si < ci) return "done";
  if (si === ci) return "running";
  return "waiting";
}

function StageIcon({ status }: { status: ReturnType<typeof getStatus> }) {
  if (status === "done") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-5 h-5 rounded-full bg-accent flex items-center justify-center"
      >
        <Check size={11} className="text-surface-void" strokeWidth={3} />
      </motion.div>
    );
  }
  if (status === "running") {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-accent flex items-center justify-center">
        <Loader2 size={11} className="text-accent animate-spin" />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="w-5 h-5 rounded-full bg-danger flex items-center justify-center">
        <X size={11} className="text-surface-void" strokeWidth={3} />
      </div>
    );
  }
  return <div className="w-5 h-5 rounded-full border border-ink-faint/40" />;
}

export default function PipelineTracker({
  currentStage,
  message,
  progress,
}: PipelineTrackerProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[15px] font-semibold text-ink">Running pipeline</p>
          <p className="text-[13px] text-ink-tertiary mt-0.5">This may take a few minutes</p>
        </div>
        <span className="text-2xl font-semibold text-ink tabular-nums">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-elevated rounded-full h-1 mb-6 overflow-hidden">
        <motion.div
          className="bg-accent h-full rounded-full shadow-glow"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-0.5">
        {STAGES.map(({ key, label, desc }) => {
          const status = getStatus(key, currentStage);
          return (
            <div
              key={key}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                status === "running" ? "bg-accent-subtle" : ""
              }`}
            >
              <StageIcon status={status} />
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium transition-colors ${
                  status === "done" ? "text-ink" :
                  status === "running" ? "text-accent" :
                  "text-ink-faint"
                }`}>
                  {label}
                </p>
                {status === "running" && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-2xs text-ink-tertiary mt-0.5"
                  >
                    {desc}
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div className="mt-5 px-3 py-2.5 bg-surface-base rounded-lg border border-ghost">
          <p className="text-2xs text-ink-tertiary font-mono">{message}</p>
        </div>
      )}
    </div>
  );
}
