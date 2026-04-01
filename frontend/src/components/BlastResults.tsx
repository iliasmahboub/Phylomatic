import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { BlastHit } from "../types";

interface BlastResultsProps {
  hits: BlastHit[];
}

type SortKey = "identity_pct" | "coverage_pct" | "e_value";

export default function BlastResults({ hits }: BlastResultsProps) {
  const [sortBy, setSortBy] = useState<SortKey>("identity_pct");
  const [ascending, setAscending] = useState(false);

  const sorted = [...hits].sort((a, b) => {
    const diff = a[sortBy] - b[sortBy];
    return ascending ? diff : -diff;
  });

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setAscending(!ascending);
    } else {
      setSortBy(key);
      setAscending(key === "e_value");
    }
  };

  const maxIdentity = Math.max(...hits.map((h) => h.identity_pct));

  const SortHeader = ({ label, sortKey, align }: { label: string; sortKey: SortKey; align?: string }) => {
    const active = sortBy === sortKey;
    const Icon = ascending ? ChevronUp : ChevronDown;
    return (
      <th
        className={`px-4 py-2.5 text-2xs font-semibold text-ink-tertiary uppercase tracking-wider cursor-pointer hover:text-ink-secondary transition-colors select-none ${align === "right" ? "text-right" : "text-left"}`}
        onClick={() => toggleSort(sortKey)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && <Icon size={12} className="text-accent" />}
        </span>
      </th>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[14px] font-semibold text-ink">BLAST Hits</p>
        <span className="text-2xs text-ink-tertiary font-medium">{hits.length} results</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ghost">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-base border-b border-ghost">
              <th className="px-4 py-2.5 text-left text-2xs font-semibold text-ink-tertiary uppercase tracking-wider">
                Species
              </th>
              <th className="px-4 py-2.5 text-left text-2xs font-semibold text-ink-tertiary uppercase tracking-wider">
                Accession
              </th>
              <SortHeader label="Identity" sortKey="identity_pct" />
              <SortHeader label="Coverage" sortKey="coverage_pct" />
              <SortHeader label="E-value" sortKey="e_value" align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((hit) => {
              const isTop = hit.identity_pct === maxIdentity;
              return (
                <tr
                  key={hit.accession}
                  className={`border-b border-ghost last:border-0 transition-colors hover:bg-surface-base/60 ${
                    isTop ? "bg-accent-subtle" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isTop && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                      )}
                      <span className={`text-[13px] ${isTop ? "text-ink font-medium" : "text-ink-secondary"}`}>
                        {hit.description.length > 60
                          ? hit.description.slice(0, 60) + "\u2026"
                          : hit.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-2xs text-ink-tertiary bg-surface-elevated px-1.5 py-0.5 rounded font-mono">
                      {hit.accession}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[13px] font-mono tabular-nums w-14 ${isTop ? "text-accent font-semibold" : "text-ink-secondary"}`}>
                        {hit.identity_pct}%
                      </span>
                      <div className="flex-1 bg-surface-elevated rounded-full h-1 max-w-[48px]">
                        <div
                          className={`h-full rounded-full ${isTop ? "bg-accent shadow-glow" : "bg-ink-faint"}`}
                          style={{ width: `${hit.identity_pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-ink-secondary tabular-nums">{hit.coverage_pct}%</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[12px] text-ink-tertiary font-mono tabular-nums">
                      {hit.e_value === 0 ? "0.0" : hit.e_value.toExponential(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
