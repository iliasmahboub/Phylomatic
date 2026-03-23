export interface BlastHit {
  accession: string;
  description: string;
  identity_pct: number;
  coverage_pct: number;
  e_value: number;
}

export interface PipelineResult {
  job_id: string;
  top_hit: BlastHit;
  all_hits: BlastHit[];
  consensus_fasta: string;
  aligned_fasta: string;
  newick: string;
  svg: string;
  elapsed_seconds: number;
}

export type PipelineStage =
  | "assembly"
  | "blast"
  | "entrez"
  | "alignment"
  | "tree"
  | "visualize"
  | "complete"
  | "error";

export type StageStatus = "idle" | "running" | "complete" | "error";

export interface StageEvent {
  stage: PipelineStage;
  status: string;
  message: string;
  progress: number;
  elapsed_seconds: number;
}
