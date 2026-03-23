import type { PipelineStage } from "../types";

interface PipelineTrackerProps {
  currentStage: PipelineStage | null;
  message: string;
  progress: number;
}

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: "assembly", label: "Assembly" },
  { key: "blast", label: "BLAST Search" },
  { key: "entrez", label: "Reference Fetch" },
  { key: "alignment", label: "Alignment" },
  { key: "tree", label: "Tree Construction" },
  { key: "visualize", label: "Visualization" },
];

const STAGE_ORDER = STAGES.map((s) => s.key);

function getStageStatus(
  stageKey: PipelineStage,
  currentStage: PipelineStage | null
): "waiting" | "running" | "done" | "error" {
  if (!currentStage) return "waiting";
  if (currentStage === "error") {
    const currentIdx = STAGE_ORDER.indexOf(stageKey);
    const errorIdx = STAGE_ORDER.indexOf(currentStage);
    if (currentIdx < errorIdx) return "done";
    return "error";
  }
  if (currentStage === "complete") return "done";

  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const stageIdx = STAGE_ORDER.indexOf(stageKey);

  if (stageIdx < currentIdx) return "done";
  if (stageIdx === currentIdx) return "running";
  return "waiting";
}

export default function PipelineTracker({
  currentStage,
  message,
  progress,
}: PipelineTrackerProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Pipeline Progress</h3>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-teal h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {STAGES.map(({ key, label }) => {
          const status = getStageStatus(key, currentStage);
          return (
            <div key={key} className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  status === "done"
                    ? "bg-teal"
                    : status === "running"
                      ? "bg-amber-400 animate-pulse"
                      : status === "error"
                        ? "bg-red-500"
                        : "bg-gray-300"
                }`}
              />
              <span
                className={`text-sm ${
                  status === "done"
                    ? "text-teal font-medium"
                    : status === "running"
                      ? "text-amber-600 font-medium"
                      : status === "error"
                        ? "text-red-500"
                        : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {message && (
        <p className="mt-4 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          {message}
        </p>
      )}
    </div>
  );
}
