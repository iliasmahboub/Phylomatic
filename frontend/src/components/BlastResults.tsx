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

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
      onClick={() => toggleSort(sortKey)}
    >
      {label} {sortBy === sortKey ? (ascending ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="w-full">
      <h3 className="font-semibold text-gray-800 mb-4">BLAST Results</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Species
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Accession
              </th>
              <SortHeader label="Identity" sortKey="identity_pct" />
              <SortHeader label="Coverage" sortKey="coverage_pct" />
              <SortHeader label="E-value" sortKey="e_value" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((hit, i) => (
              <tr
                key={hit.accession}
                className={`hover:bg-gray-50 ${
                  i === 0 && sortBy === "identity_pct" && !ascending
                    ? "border-l-4 border-l-teal"
                    : ""
                }`}
              >
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-800">
                    {hit.description.length > 60
                      ? hit.description.slice(0, 60) + "..."
                      : hit.description}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs text-gray-500">{hit.accession}</code>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-14">
                      {hit.identity_pct}%
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                      <div
                        className="bg-teal h-1.5 rounded-full"
                        style={{ width: `${hit.identity_pct}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {hit.coverage_pct}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 font-mono">
                    {hit.e_value.toExponential(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
