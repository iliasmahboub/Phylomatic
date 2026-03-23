import { useState, useCallback } from "react";
import { usePipeline } from "./hooks/usePipeline";
import DropZone from "./components/DropZone";
import PipelineTracker from "./components/PipelineTracker";
import BlastResults from "./components/BlastResults";
import PhyloTree from "./components/PhyloTree";
import ExportPanel from "./components/ExportPanel";
import SequenceViewer from "./components/SequenceViewer";

function App() {
  const [email, setEmail] = useState("");
  const [files, setFiles] = useState<{ fwd: File; rev: File } | null>(null);
  const pipeline = usePipeline();

  const onFilesReady = useCallback((fwd: File, rev: File) => {
    setFiles({ fwd, rev });
  }, []);

  const handleRun = () => {
    if (!files || !email) return;
    pipeline.run(files.fwd, files.rev, email);
  };

  const handleReset = () => {
    pipeline.reset();
    setFiles(null);
  };

  const isRunning = pipeline.status === "running";
  const isComplete = pipeline.status === "complete";
  const hasError = pipeline.status === "error";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shadow-teal-500/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v6M12 16v6M6 8l4 4-4 4M18 8l-4 4 4 4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Phylomatic</h1>
              <p className="text-[11px] text-gray-400 -mt-0.5 tracking-wide uppercase">Phylogenetic Inference Engine</p>
            </div>
          </div>
          {isComplete && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              New Analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Upload + Config */}
        {!isRunning && !isComplete && !hasError && (
          <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Identify your species
              </h2>
              <p className="text-gray-500 mt-2 text-lg">
                Drop your Sanger sequencing files and get a publication-ready phylogenetic tree.
              </p>
            </div>

            <div className="glass rounded-2xl p-8 space-y-6">
              <DropZone onFilesReady={onFilesReady} disabled={isRunning} />

              <div className="pt-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  NCBI Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Required by NCBI for API access — no signup needed.
                </p>
              </div>

              <button
                onClick={handleRun}
                disabled={!files || !email}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/25 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
              >
                Run Pipeline
              </button>
            </div>

            <div className="flex items-center justify-center gap-8 text-xs text-gray-400 pt-4">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                NCBI BLASTn
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                Clustal Omega
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                NJ Tree
              </span>
            </div>
          </div>
        )}

        {/* Pipeline Progress */}
        {isRunning && (
          <div className="animate-fade-in max-w-xl mx-auto">
            <div className="glass rounded-2xl p-8">
              <PipelineTracker
                currentStage={pipeline.stage}
                message={pipeline.message}
                progress={pipeline.progress}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {hasError && (
          <div className="animate-fade-in max-w-xl mx-auto">
            <div className="bg-red-50/80 backdrop-blur border border-red-200/50 rounded-2xl p-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-500 text-sm font-bold">!</span>
                </div>
                <div>
                  <p className="text-red-800 font-semibold">Pipeline Error</p>
                  <p className="text-red-600 text-sm mt-1 leading-relaxed">{pipeline.error}</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="mt-6 w-full py-2.5 text-sm font-medium bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all text-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {isComplete && pipeline.results && (
          <div className="space-y-8 animate-fade-in">
            {/* Top hit hero */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl shadow-teal-500/20">
              <p className="text-teal-100 text-sm font-medium uppercase tracking-wider">Top Match</p>
              <p className="text-2xl font-bold mt-2 leading-tight">
                {pipeline.results.top_hit.description}
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-sm">
                <div>
                  <span className="text-teal-200">Identity</span>
                  <span className="ml-2 font-semibold">{pipeline.results.top_hit.identity_pct}%</span>
                </div>
                <div>
                  <span className="text-teal-200">Coverage</span>
                  <span className="ml-2 font-semibold">{pipeline.results.top_hit.coverage_pct}%</span>
                </div>
                <div>
                  <span className="text-teal-200">E-value</span>
                  <span className="ml-2 font-semibold font-mono">
                    {pipeline.results.top_hit.e_value === 0
                      ? "0.0"
                      : pipeline.results.top_hit.e_value.toExponential(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: tree + sequence */}
              <div className="lg:col-span-2 space-y-6">
                <div className="glass rounded-2xl p-6">
                  <PhyloTree svg={pipeline.results.svg} />
                </div>

                <div className="glass rounded-2xl p-6">
                  <SequenceViewer
                    label="Consensus Sequence"
                    fasta={pipeline.results.consensus_fasta}
                  />
                </div>
              </div>

              {/* Right column: hits + export */}
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <ExportPanel
                    newick={pipeline.results.newick}
                    svg={pipeline.results.svg}
                  />
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Run Info</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium text-gray-700">{pipeline.results.elapsed_seconds}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hits</span>
                      <span className="font-medium text-gray-700">{pipeline.results.all_hits.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Job ID</span>
                      <span className="font-mono text-xs text-gray-400">{pipeline.results.job_id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width BLAST table */}
            <div className="glass rounded-2xl p-6">
              <BlastResults hits={pipeline.results.all_hits} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-6 text-center text-xs text-gray-300">
        Phylomatic &mdash; Automated phylogenetic inference from Sanger sequencing
      </footer>
    </div>
  );
}

export default App;
