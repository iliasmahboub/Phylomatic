import { useState } from "react";

interface SequenceViewerProps {
  label: string;
  fasta: string;
}

const BASE_COLORS: Record<string, string> = {
  A: "text-emerald-500",
  T: "text-rose-500",
  C: "text-sky-500",
  G: "text-amber-500",
  N: "text-ink-faint",
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
        <p className="text-[14px] font-semibold text-ink">{label}</p>
        <span className="text-2xs text-ink-tertiary font-mono tabular-nums">{sequence.length} bp</span>
      </div>

      <p className="text-2xs text-ink-faint font-mono mb-2 truncate">{header}</p>

      <div className="bg-[#0d1117] rounded-lg p-4 overflow-x-auto">
        <div className="seq-viewer">
          {displaySeq.split("").map((base, i) => (
            <span key={i} className={BASE_COLORS[base] || "text-ink-faint"}>
              {base}
            </span>
          ))}
          {!expanded && sequence.length > 300 && (
            <span className="text-gray-600">...</span>
          )}
        </div>
      </div>

      {sequence.length > 300 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-2xs text-accent-600 hover:text-accent-700 font-medium"
        >
          {expanded ? "Collapse" : `Show all ${sequence.length} bases`}
        </button>
      )}
    </div>
  );
}
