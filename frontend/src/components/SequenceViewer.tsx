import { useState } from "react";

interface SequenceViewerProps {
  label: string;
  fasta: string;
}

const BASE_COLORS: Record<string, string> = {
  A: "text-green-600",
  T: "text-red-500",
  C: "text-blue-500",
  G: "text-amber-600",
  N: "text-gray-400",
};

export default function SequenceViewer({ label, fasta }: SequenceViewerProps) {
  const [expanded, setExpanded] = useState(false);

  const lines = fasta.trim().split("\n");
  const header = lines[0];
  const sequence = lines.slice(1).join("");
  const displaySeq = expanded ? sequence : sequence.slice(0, 300);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
        <span className="text-xs text-gray-400 font-mono">{sequence.length} bp</span>
      </div>

      <div className="text-xs text-gray-400 font-mono mb-2">{header}</div>

      <div className="bg-gray-950 rounded-xl p-4 overflow-x-auto">
        <div className="seq-viewer">
          {displaySeq.split("").map((base, i) => (
            <span key={i} className={BASE_COLORS[base] || "text-gray-400"}>
              {base}
            </span>
          ))}
          {!expanded && sequence.length > 300 && (
            <span className="text-gray-500">...</span>
          )}
        </div>
      </div>

      {sequence.length > 300 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          {expanded ? "Show less" : `Show all ${sequence.length} bases`}
        </button>
      )}
    </div>
  );
}
