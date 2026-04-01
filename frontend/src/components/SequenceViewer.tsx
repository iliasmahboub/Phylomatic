import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SequenceViewerProps {
  label: string;
  fasta: string;
}

const BASE_COLORS: Record<string, string> = {
  A: "text-nucleotide-A",
  T: "text-nucleotide-T",
  C: "text-nucleotide-C",
  G: "text-nucleotide-G",
};

const BASES_PER_LINE = 60;
const BLOCK_SIZE = 10;
const COLLAPSED_LINES = 5;

export default function SequenceViewer({ label, fasta }: SequenceViewerProps) {
  const [expanded, setExpanded] = useState(false);

  const { header, sequence } = useMemo(() => {
    const lines = fasta.trim().split("\n");
    return {
      header: lines[0],
      sequence: lines.slice(1).join(""),
    };
  }, [fasta]);

  const lines = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < sequence.length; i += BASES_PER_LINE) {
      result.push(sequence.slice(i, i + BASES_PER_LINE));
    }
    return result;
  }, [sequence]);

  const visibleLines = expanded ? lines : lines.slice(0, COLLAPSED_LINES);
  const canExpand = lines.length > COLLAPSED_LINES;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[14px] font-semibold text-ink">{label}</p>
        <span className="text-2xs text-ink-tertiary font-mono tabular-nums">
          {sequence.length} bp
        </span>
      </div>

      <p className="text-2xs text-ink-faint font-mono mb-2 truncate">{header}</p>

      <div className="bg-surface-void rounded-lg p-4 overflow-x-auto border border-ghost">
        <div className="seq-viewer">
          {visibleLines.map((line, lineIdx) => {
            const pos = lineIdx * BASES_PER_LINE + 1;
            return (
              <div key={lineIdx} className="flex">
                <span className="line-num">{pos}</span>
                <span>
                  {line.split("").map((base, i) => (
                    <span key={i}>
                      {i > 0 && i % BLOCK_SIZE === 0 && (
                        <span className="text-ink-faint/20">{" "}</span>
                      )}
                      <span className={BASE_COLORS[base] || "text-ink-faint"}>
                        {base}
                      </span>
                    </span>
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {canExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-2xs text-accent hover:text-accent-bright font-medium flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>Collapse <ChevronUp size={12} /></>
          ) : (
            <>Show all {sequence.length} bases <ChevronDown size={12} /></>
          )}
        </button>
      )}
    </div>
  );
}
