import { useState, useCallback } from "react";
import { usePipeline } from "./hooks/usePipeline";
import DropZone from "./components/DropZone";
import PipelineTracker from "./components/PipelineTracker";
import BlastResults from "./components/BlastResults";
import PhyloTree from "./components/PhyloTree";
import ExportPanel from "./components/ExportPanel";
import SequenceViewer from "./components/SequenceViewer";

const DB_OPTIONS = [
  { value: "16S_ribosomal_RNA", label: "16S Ribosomal RNA", hint: "Bacterial species identification" },
  { value: "nt", label: "Nucleotide (nt)", hint: "Full NCBI nucleotide collection" },
  { value: "refseq_rna", label: "RefSeq RNA", hint: "Curated reference sequences" },
  { value: "ITS_RefSeq_Fungi", label: "ITS RefSeq", hint: "Fungal identification" },
];

function App() {
  const [email, setEmail] = useState("");
  const [blastDb, setBlastDb] = useState("16S_ribosomal_RNA");
  const [files, setFiles] = useState<{ fwd: File; rev: File } | null>(null);
  const pipeline = usePipeline();

  const onFilesReady = useCallback((fwd: File, rev: File) => {
    setFiles({ fwd, rev });
  }, []);

  const handleRun = () => {
    if (!files || !email) return;
    pipeline.run(files.fwd, files.rev, email, blastDb);
  };

  const handleReset = () => {
    pipeline.reset();
    setFiles(null);
  };

  const isRunning = pipeline.status === "running";
  const isComplete = pipeline.status === "complete";
  const hasError = pipeline.status === "error";
  const canRun = files && email.includes("@");

  return (
    <div className="min-h-screen bg-surface-1">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-0/80 backdrop-blur-lg border-b border-surface-3/60">
        <div className="max-w-[1140px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v6M12 16v6M6 8l4 4-4 4M18 8l-4 4 4 4" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-ink tracking-[-0.01em]">Phylomatic</span>
          </div>
          {(isComplete || hasError) && (
            <button
              onClick={handleReset}
              className="h-8 px-3.5 text-[13px] font-medium text-ink-secondary bg-surface-0 border border-surface-3 rounded-lg hover:bg-surface-1 hover:border-surface-4 transition-all"
            >
              New analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[1140px] mx-auto px-6 pt-10 pb-20">
        {/* ==================== UPLOAD STATE ==================== */}
        {!isRunning && !isComplete && !hasError && (
          <div className="animate-fade-up max-w-[520px] mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-[22px] font-semibold text-ink tracking-[-0.02em]">
                Phylogenetic analysis
              </h2>
              <p className="text-ink-secondary text-[15px] mt-1.5">
                Upload Sanger sequencing reads to identify species and build a tree.
              </p>
            </div>

            <div className="bg-surface-0 rounded-2xl border border-surface-3/80 shadow-card p-6 space-y-5">
              <DropZone onFilesReady={onFilesReady} disabled={isRunning} />

              <div className="h-px bg-surface-3/60" />

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[13px] font-medium text-ink mb-1.5">
                  NCBI Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full h-10 px-3.5 bg-surface-0 border border-surface-3 rounded-lg text-[14px] text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all"
                />
                <p className="text-2xs text-ink-tertiary mt-1">
                  Required by NCBI for API access. No signup needed.
                </p>
              </div>

              {/* Database */}
              <div>
                <label htmlFor="blast-db" className="block text-[13px] font-medium text-ink mb-1.5">
                  BLAST Database
                </label>
                <select
                  id="blast-db"
                  value={blastDb}
                  onChange={(e) => setBlastDb(e.target.value)}
                  className="w-full h-10 px-3.5 bg-surface-0 border border-surface-3 rounded-lg text-[14px] text-ink focus:outline-none focus:ring-2 focus:ring-accent-200 focus:border-accent-400 transition-all appearance-none"
                >
                  {DB_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.hint}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRun}
                disabled={!canRun}
                className="w-full h-11 bg-accent-500 text-white text-[14px] font-semibold rounded-lg hover:bg-accent-600 active:bg-accent-700 transition-colors disabled:bg-surface-3 disabled:text-ink-faint disabled:cursor-not-allowed"
              >
                Run pipeline
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 text-2xs text-ink-faint mt-6 font-medium">
              <span>NCBI BLASTn</span>
              <span className="w-1 h-1 rounded-full bg-surface-4" />
              <span>Clustal Omega</span>
              <span className="w-1 h-1 rounded-full bg-surface-4" />
              <span>Neighbor-Joining</span>
            </div>
          </div>
        )}

        {/* ==================== RUNNING STATE ==================== */}
        {isRunning && (
          <div className="animate-fade-up max-w-[480px] mx-auto">
            <div className="bg-surface-0 rounded-2xl border border-surface-3/80 shadow-card p-6">
              <PipelineTracker
                currentStage={pipeline.stage}
                message={pipeline.message}
                progress={pipeline.progress}
              />
            </div>
          </div>
        )}

        {/* ==================== ERROR STATE ==================== */}
        {hasError && (
          <div className="animate-fade-up max-w-[480px] mx-auto">
            <div className="bg-surface-0 rounded-2xl border border-red-200 shadow-card p-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-red-900">Pipeline failed</p>
                  <p className="text-[13px] text-red-700/80 mt-1 leading-relaxed break-words">{pipeline.error}</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="mt-5 w-full h-10 text-[13px] font-medium bg-surface-0 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-700"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ==================== RESULTS STATE ==================== */}
        {isComplete && pipeline.results && (
          <div className="space-y-6">
            {/* Top match banner */}
            <div className="animate-fade-up bg-surface-0 rounded-2xl border border-surface-3/80 shadow-card overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-surface-3/60">
                <p className="text-2xs font-semibold text-accent-500 uppercase tracking-widest">Top Match</p>
                <p className="text-[18px] font-semibold text-ink mt-1 tracking-[-0.01em] leading-snug">
                  {pipeline.results.top_hit.description}
                </p>
              </div>
              <div className="px-6 py-3 flex flex-wrap gap-x-8 gap-y-1 text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="text-ink-tertiary">Identity</span>
                  <span className="font-semibold text-ink">{pipeline.results.top_hit.identity_pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ink-tertiary">Coverage</span>
                  <span className="font-semibold text-ink">{pipeline.results.top_hit.coverage_pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ink-tertiary">E-value</span>
                  <span className="font-mono font-medium text-ink text-[12px]">
                    {pipeline.results.top_hit.e_value === 0
                      ? "0.0"
                      : pipeline.results.top_hit.e_value.toExponential(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-ink-tertiary">Duration</span>
                  <span className="font-semibold text-ink">{pipeline.results.elapsed_seconds}s</span>
                </div>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Tree + Sequence */}
              <div className="lg:col-span-8 space-y-6">
                <div className="animate-fade-up-d1 bg-surface-0 rounded-2xl border border-surface-3/80 shadow-card p-5">
                  <PhyloTree svg={pipeline.results.svg} />
                </div>

                <div className="animate-fade-up-d2 bg-surface-0 rounded-2xl border border-surface-3/80 shadow-card p-5">
                  <SequenceViewer
                    label="Consensus Sequence"
                    fasta={pipeline.results.consensus_fasta}
                  />
                </div>
              </div>

              {/* Right: Export + Info */}
              <div className="lg:col-span-4 space-y-6">
                <div className="animate-fade-up-d1 bg-surface-0 rounded-2xl border border-surface-3/80 shadow-card p-5">
                  <ExportPanel
                    newick={pipeline.results.newick}
                    svg={pipeline.results.svg}
                  />
                </div>

                <div className="animate-fade-up-d2 bg-surface-0 rounded-2xl border border-surface-3/80 shadow-card p-5">
                  <p className="text-2xs font-semibold text-ink-tertiary uppercase tracking-widest mb-3">Run Details</p>
                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-ink-secondary">BLAST hits</span>
                      <span className="font-medium text-ink">{pipeline.results.all_hits.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-secondary">Job ID</span>
                      <span className="font-mono text-[11px] text-ink-tertiary">{pipeline.results.job_id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-width BLAST table */}
            <div className="animate-fade-up-d3 bg-surface-0 rounded-2xl border border-surface-3/80 shadow-card p-5">
              <BlastResults hits={pipeline.results.all_hits} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
