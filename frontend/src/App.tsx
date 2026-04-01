import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dna, RotateCcw } from "lucide-react";
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

const ease = [0.16, 1, 0.3, 1] as const;

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease },
};

function stagger(i: number) {
  return { ...fade, transition: { duration: 0.4, ease, delay: i * 0.06 } };
}

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
    <div className="min-h-screen bg-surface-void grain">
      <header className="sticky top-0 z-50 bg-surface-void/80 backdrop-blur-xl border-b border-ghost">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow">
              <Dna size={16} className="text-surface-void" strokeWidth={2.5} />
            </div>
            <span className="text-[15px] font-semibold text-ink tracking-tight">
              phylomatic
            </span>
          </div>
          {(isComplete || hasError) && (
            <button
              onClick={handleReset}
              className="h-8 px-3.5 text-[13px] font-medium text-ink-secondary bg-surface-raised border border-ghost rounded-lg hover:text-ink hover:bg-surface-elevated transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              New analysis
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-10 pb-24">
        <AnimatePresence mode="wait">
          {/* Upload */}
          {!isRunning && !isComplete && !hasError && (
            <motion.div key="upload" {...fade} className="max-w-lg mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-ink tracking-tight">
                  Phylogenetic analysis
                </h2>
                <p className="text-ink-secondary text-[15px] mt-2">
                  Upload Sanger sequencing reads to identify species and build a tree.
                </p>
              </div>

              <div className="bg-surface-raised rounded-2xl border border-ghost shadow-inset-ring p-6 space-y-5">
                <DropZone onFilesReady={onFilesReady} disabled={isRunning} />

                <div className="h-px bg-ghost" />

                <div>
                  <label htmlFor="email" className="block text-[13px] font-medium text-ink-secondary mb-1.5">
                    NCBI Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full h-10 px-3.5 bg-surface-base border border-ghost rounded-lg text-[14px] text-ink placeholder:text-ink-faint focus-ring transition-all"
                  />
                  <p className="text-2xs text-ink-tertiary mt-1">
                    Required by NCBI for API access. No signup needed.
                  </p>
                </div>

                <div>
                  <label htmlFor="blast-db" className="block text-[13px] font-medium text-ink-secondary mb-1.5">
                    BLAST Database
                  </label>
                  <select
                    id="blast-db"
                    value={blastDb}
                    onChange={(e) => setBlastDb(e.target.value)}
                    className="w-full h-10 px-3.5 bg-surface-base border border-ghost rounded-lg text-[14px] text-ink focus-ring transition-all appearance-none"
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
                  className="w-full h-11 bg-accent text-surface-void text-[14px] font-semibold rounded-lg hover:bg-accent-bright active:scale-[0.98] transition-all shadow-glow disabled:bg-surface-elevated disabled:text-ink-faint disabled:shadow-none disabled:cursor-not-allowed"
                >
                  Run pipeline
                </button>
              </div>

              <div className="flex items-center justify-center gap-6 text-2xs text-ink-faint mt-6 font-medium tracking-wide">
                <span>NCBI BLASTn</span>
                <span className="w-1 h-1 rounded-full bg-ink-faint" />
                <span>Clustal Omega</span>
                <span className="w-1 h-1 rounded-full bg-ink-faint" />
                <span>Neighbor-Joining</span>
              </div>
            </motion.div>
          )}

          {/* Running */}
          {isRunning && (
            <motion.div key="running" {...fade} className="max-w-lg mx-auto">
              <div className="bg-surface-raised rounded-2xl border border-ghost shadow-inset-ring p-6">
                <PipelineTracker
                  currentStage={pipeline.stage}
                  message={pipeline.message}
                  progress={pipeline.progress}
                />
              </div>
            </motion.div>
          )}

          {/* Error */}
          {hasError && (
            <motion.div key="error" {...fade} className="max-w-lg mx-auto">
              <div className="bg-surface-raised rounded-2xl border border-danger-dim p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-danger-dim flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="oklch(0.63 0.2 25)" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-danger">Pipeline failed</p>
                    <p className="text-[13px] text-danger-muted mt-1 leading-relaxed break-words">
                      {pipeline.error}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-5 w-full h-10 text-[13px] font-medium bg-surface-base border border-danger-dim rounded-lg hover:bg-danger-dim transition-colors text-danger"
                >
                  Try again
                </button>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {isComplete && pipeline.results && (
            <motion.div key="results" {...fade}>
              <div className="space-y-6">
                {/* Top match banner */}
                <motion.div {...stagger(0)} className="bg-surface-raised rounded-2xl border border-ghost overflow-hidden">
                  <div className="px-6 pt-5 pb-4 border-b border-ghost">
                    <p className="text-2xs font-semibold text-accent uppercase tracking-[0.12em]">
                      Top Match
                    </p>
                    <p className="text-lg font-semibold text-ink mt-1 tracking-tight leading-snug">
                      {pipeline.results.top_hit.description}
                    </p>
                  </div>
                  <div className="px-6 py-3 flex flex-wrap gap-x-8 gap-y-1 text-[13px]">
                    <Stat label="Identity" value={`${pipeline.results.top_hit.identity_pct}%`} />
                    <Stat label="Coverage" value={`${pipeline.results.top_hit.coverage_pct}%`} />
                    <Stat
                      label="E-value"
                      value={pipeline.results.top_hit.e_value === 0 ? "0.0" : pipeline.results.top_hit.e_value.toExponential(1)}
                      mono
                    />
                    <div className="ml-auto">
                      <Stat label="Duration" value={`${pipeline.results.elapsed_seconds}s`} />
                    </div>
                  </div>
                </motion.div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8 space-y-6">
                    <motion.div {...stagger(1)} className="bg-surface-raised rounded-2xl border border-ghost p-5">
                      <PhyloTree svg={pipeline.results.svg} />
                    </motion.div>
                    <motion.div {...stagger(2)} className="bg-surface-raised rounded-2xl border border-ghost p-5">
                      <SequenceViewer
                        label="Consensus Sequence"
                        fasta={pipeline.results.consensus_fasta}
                      />
                    </motion.div>
                  </div>

                  <div className="lg:col-span-4 space-y-6">
                    <motion.div {...stagger(1)} className="bg-surface-raised rounded-2xl border border-ghost p-5">
                      <ExportPanel
                        newick={pipeline.results.newick}
                        svg={pipeline.results.svg}
                      />
                    </motion.div>
                    <motion.div {...stagger(2)} className="bg-surface-raised rounded-2xl border border-ghost p-5">
                      <p className="text-2xs font-semibold text-ink-tertiary uppercase tracking-[0.12em] mb-3">
                        Run Details
                      </p>
                      <div className="space-y-2.5 text-[13px]">
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">BLAST hits</span>
                          <span className="font-medium text-ink">{pipeline.results.all_hits.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">Job ID</span>
                          <span className="font-mono text-2xs text-ink-tertiary">{pipeline.results.job_id}</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* BLAST table */}
                <motion.div {...stagger(3)} className="bg-surface-raised rounded-2xl border border-ghost p-5">
                  <BlastResults hits={pipeline.results.all_hits} />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink-tertiary">{label}</span>
      <span className={`font-semibold text-ink ${mono ? "font-mono text-[12px]" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export default App;
