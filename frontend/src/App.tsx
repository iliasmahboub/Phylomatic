import { useState, useCallback } from "react";
import { usePipeline } from "./hooks/usePipeline";
import DropZone from "./components/DropZone";
import PipelineTracker from "./components/PipelineTracker";
import BlastResults from "./components/BlastResults";
import PhyloTree from "./components/PhyloTree";
import ExportPanel from "./components/ExportPanel";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧬</span>
            <h1 className="text-xl font-bold text-gray-800">Phylomatic</h1>
          </div>
          <p className="text-sm text-gray-400">
            Automated phylogenetic inference from Sanger sequencing
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Upload + Config */}
        {!isRunning && !isComplete && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <DropZone onFilesReady={onFilesReady} disabled={isRunning} />

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                NCBI Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 focus:border-teal"
              />
              <p className="text-xs text-gray-400 mt-1">
                Required by NCBI for API access. No signup needed.
              </p>
            </div>

            <button
              onClick={handleRun}
              disabled={!files || !email}
              className="w-full py-3 bg-teal text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Run Pipeline
            </button>
          </div>
        )}

        {/* Pipeline Progress */}
        {isRunning && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <PipelineTracker
              currentStage={pipeline.stage}
              message={pipeline.message}
              progress={pipeline.progress}
            />
          </div>
        )}

        {/* Error */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <p className="text-red-700 font-medium">Pipeline Error</p>
            <p className="text-red-600 text-sm mt-1">{pipeline.error}</p>
            <button
              onClick={handleReset}
              className="mt-4 px-4 py-2 text-sm bg-white border border-red-300 rounded-lg hover:bg-red-50"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results */}
        {isComplete && pipeline.results && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Results</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                New Analysis
              </button>
            </div>

            {/* Top hit summary */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <p className="text-sm text-emerald-700 font-medium">Top Match</p>
              <p className="text-lg text-emerald-900 font-bold mt-1">
                {pipeline.results.top_hit.description}
              </p>
              <div className="flex gap-6 mt-2 text-sm text-emerald-700">
                <span>Identity: {pipeline.results.top_hit.identity_pct}%</span>
                <span>Coverage: {pipeline.results.top_hit.coverage_pct}%</span>
                <span>
                  E-value: {pipeline.results.top_hit.e_value.toExponential(1)}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <PhyloTree svg={pipeline.results.svg} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <BlastResults hits={pipeline.results.all_hits} />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <ExportPanel
                newick={pipeline.results.newick}
                svg={pipeline.results.svg}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
