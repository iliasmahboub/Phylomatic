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
        <span className="text-[22px] font-semibold text-ink tabular-nums">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-surface-2 rounded-full h-1 mb-6 overflow-hidden">
        <div
          className="bg-accent-500 h-full rounded-full transition-all duration-700 ease-out relative"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-0.5">
        {STAGES.map(({ key, label, desc }) => {
          const status = getStatus(key, currentStage);
          return (
            <div
              key={key}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                status === "running" ? "bg-accent-50/50" : ""
              }`}
            >
              <div className="flex-shrink-0">
                {status === "done" ? (
                  <div className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : status === "running" ? (
                  <div className="w-5 h-5 rounded-full border-2 border-accent-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse-dot" />
                  </div>
                ) : status === "error" ? (
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-surface-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-medium ${
                  status === "done" ? "text-ink" :
                  status === "running" ? "text-accent-700" :
                  "text-ink-faint"
                }`}>
                  {label}
                </p>
                {status === "running" && (
                  <p className="text-2xs text-ink-tertiary mt-0.5">{desc}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div className="mt-5 px-3 py-2.5 bg-surface-2/60 rounded-lg">
          <p className="text-2xs text-ink-tertiary font-mono">{message}</p>
        </div>
      )}
    </div>
  );
}
