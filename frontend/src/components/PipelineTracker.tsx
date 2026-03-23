import type { PipelineStage } from "../types";

interface PipelineTrackerProps {
  currentStage: PipelineStage | null;
  message: string;
  progress: number;
}

const STAGES: { key: PipelineStage; label: string; desc: string }[] = [
  { key: "assembly", label: "Assembly", desc: "Building consensus from reads" },
  { key: "blast", label: "BLAST Search", desc: "Querying NCBI nucleotide database" },
  { key: "entrez", label: "Reference Fetch", desc: "Downloading reference sequences" },
  { key: "alignment", label: "Alignment", desc: "Multiple sequence alignment via Clustal Omega" },
  { key: "tree", label: "Tree Construction", desc: "Building neighbor-joining tree" },
  { key: "visualize", label: "Visualization", desc: "Rendering annotated SVG" },
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-gray-900">Running Pipeline</h3>
          <p className="text-sm text-gray-400 mt-0.5">This may take a few minutes</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-teal-600">{progress}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8 overflow-hidden">
        <div
          className="bg-gradient-to-r from-teal-400 to-teal-600 h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-1">
        {STAGES.map(({ key, label, desc }) => {
          const status = getStatus(key, currentStage);
          return (
            <div
              key={key}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                status === "running" ? "bg-teal-50/50" : ""
              }`}
            >
              {/* Status indicator */}
              <div className="flex-shrink-0">
                {status === "done" ? (
                  <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : status === "running" ? (
                  <div className="w-6 h-6 rounded-full bg-teal-400 animate-pulse-ring flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                ) : status === "error" ? (
                  <div className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    status === "done"
                      ? "text-teal-700"
                      : status === "running"
                        ? "text-teal-600"
                        : "text-gray-400"
                  }`}
                >
                  {label}
                </p>
                {status === "running" && (
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {message && (
        <div className="mt-6 px-4 py-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-500 font-mono">{message}</p>
        </div>
      )}
    </div>
  );
}
