import { useState } from "react";
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

  const SortHeader = ({
    label,
    sortKey,
    className = "",
  }: {
    label: string;
    sortKey: SortKey;
    className?: string;
  }) => (
    <th
      className={`px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 transition-colors select-none ${className}`}
      onClick={() => toggleSort(sortKey)}
    >
      {label}
      <span className="ml-1 text-gray-300">
        {sortBy === sortKey ? (ascending ? "\u2191" : "\u2193") : ""}
      </span>
    </th>
  );

  const maxIdentity = Math.max(...hits.map((h) => h.identity_pct));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">BLAST Results</h3>
        <span className="text-xs text-gray-400">{hits.length} hits</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Species
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Accession
              </th>
              <SortHeader label="Identity" sortKey="identity_pct" />
              <SortHeader label="Coverage" sortKey="coverage_pct" />
              <SortHeader label="E-value" sortKey="e_value" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((hit) => {
              const isTop = hit.identity_pct === maxIdentity;
              return (
                <tr
                  key={hit.accession}
                  className={`transition-colors hover:bg-gray-50/80 ${
                    isTop ? "bg-teal-50/30" : ""
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {isTop && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${isTop ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                        {hit.description.length > 55
                          ? hit.description.slice(0, 55) + "..."
                          : hit.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <code className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                      {hit.accession}
                    </code>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-mono w-16 ${isTop ? "text-teal-700 font-semibold" : "text-gray-600"}`}>
                        {hit.identity_pct}%
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1 max-w-[60px]">
                        <div
                          className={`h-full rounded-full ${isTop ? "bg-teal-500" : "bg-gray-300"}`}
                          style={{ width: `${hit.identity_pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-500">{hit.coverage_pct}%</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-400 font-mono">
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
