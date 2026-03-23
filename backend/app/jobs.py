"""Async job queue and stage state machine."""

from __future__ import annotations

import os
import time
import uuid
from dataclasses import dataclass, field
from enum import StrEnum
from io import StringIO
from typing import Any

from Bio import SeqIO

from app.pipeline.assembly import assemble
from app.pipeline.blast import blast_search
from app.pipeline.entrez import fetch_sequences
from app.pipeline.alignment import align_sequences
from app.pipeline.tree import build_tree
from app.pipeline.visualize import render_tree


class PipelineStage(StrEnum):
    ASSEMBLY = "assembly"
    BLAST = "blast"
    ENTREZ = "entrez"
    ALIGNMENT = "alignment"
    TREE = "tree"
    VISUALIZE = "visualize"
    COMPLETE = "complete"
    ERROR = "error"


@dataclass
class JobState:
    job_id: str
    stage: PipelineStage = PipelineStage.ASSEMBLY
    progress: int = 0
    message: str = ""
    error: str | None = None
    result: dict[str, Any] = field(default_factory=dict)
    start_time: float = field(default_factory=time.time)
    fwd_path: str = ""
    rev_path: str = ""
    ncbi_email: str = ""
    blast_db: str = "16S_ribosomal_RNA"


# In-memory job storage
jobs: dict[str, JobState] = {}


def create_job(fwd_path: str, rev_path: str, ncbi_email: str, blast_db: str = "16S_ribosomal_RNA") -> JobState:
    job_id = uuid.uuid4().hex[:12]
    job = JobState(
        job_id=job_id,
        fwd_path=fwd_path,
        rev_path=rev_path,
        ncbi_email=ncbi_email,
        blast_db=blast_db,
    )
    jobs[job_id] = job
    return job


def _update(job: JobState, stage: PipelineStage, progress: int, message: str) -> None:
    job.stage = stage
    job.progress = progress
    job.message = message


async def run_pipeline(job: JobState) -> None:
    """Execute the full pipeline, updating job state at each stage."""
    try:
        os.environ["NCBI_EMAIL"] = job.ncbi_email

        # 1. Assembly
        _update(
            job, PipelineStage.ASSEMBLY, 5, "Assembling consensus from .ab1 reads..."
        )
        consensus_fasta = assemble(job.fwd_path, job.rev_path)
        _update(job, PipelineStage.ASSEMBLY, 15, "Assembly complete")

        # 2. BLAST
        _update(job, PipelineStage.BLAST, 20, "Submitting BLAST search...")
        hits = await blast_search(consensus_fasta, database=job.blast_db)
        _update(
            job, PipelineStage.BLAST, 45, f"BLAST complete — {len(hits)} hits found"
        )

        if not hits:
            raise RuntimeError("No BLAST hits returned")

        # Filter out uncultured/environmental sequences for cleaner tree
        skip_terms = ["uncultured", "environmental", "unidentified", "bacterium strain"]
        filtered_hits = [
            h for h in hits
            if not any(term in h.description.lower() for term in skip_terms)
        ]
        # Fall back to all hits if filtering removes everything
        if not filtered_hits:
            filtered_hits = hits

        # 3. Entrez fetch (top 10 for alignment — more species diversity)
        _update(job, PipelineStage.ENTREZ, 50, "Fetching reference sequences...")
        top_hits = filtered_hits[:10]
        accessions = [h.accession for h in top_hits]
        ref_fastas = await fetch_sequences(accessions)
        _update(job, PipelineStage.ENTREZ, 60, f"Fetched {len(ref_fastas)} references")

        # 4. Alignment — build sequence dict with Query first
        _update(job, PipelineStage.ALIGNMENT, 65, "Submitting alignment...")
        sequences: dict[str, str] = {}
        # Parse consensus sequence string from FASTA
        query_len = 0
        for rec in SeqIO.parse(StringIO(consensus_fasta), "fasta"):
            sequences["Query"] = str(rec.seq)
            query_len = len(rec.seq)
            break
        # Build accession → species name mapping from BLAST hits
        acc_to_species: dict[str, str] = {}
        for h in hits:
            desc = h.description.strip()
            # Extract genus + species (first two words of description)
            parts = desc.split()
            if len(parts) >= 2:
                species_name = f"{parts[0]}_{parts[1]}"
            else:
                species_name = desc.replace(" ", "_")
            # Deduplicate: append accession suffix if species name already used
            label = species_name
            if label in acc_to_species.values():
                label = f"{species_name}_{h.accession.replace('.', '_')}"
            acc_to_species[h.accession] = label

        # Parse each reference FASTA — truncate to 2x query length to stay under 4MB
        max_ref_len = max(query_len * 2, 2000)
        for acc, fasta_str in ref_fastas.items():
            for rec in SeqIO.parse(StringIO(fasta_str), "fasta"):
                label = acc_to_species.get(acc, acc.replace(".", "_"))
                sequences[label] = str(rec.seq)[:max_ref_len]
                break

        aligned_fasta = await align_sequences(sequences)
        _update(job, PipelineStage.ALIGNMENT, 75, "Alignment complete")

        # 5. Tree
        _update(job, PipelineStage.TREE, 80, "Building phylogenetic tree...")
        newick = build_tree(aligned_fasta)
        _update(job, PipelineStage.TREE, 88, "Tree construction complete")

        # 6. Visualize
        _update(job, PipelineStage.VISUALIZE, 90, "Rendering tree SVG...")
        # Top hit by identity, not BLAST return order
        top_hit = max(hits, key=lambda h: h.identity_pct)
        svg = render_tree(newick, top_hit)
        _update(job, PipelineStage.VISUALIZE, 98, "Visualization complete")

        # Build result
        elapsed = round(time.time() - job.start_time, 1)
        job.result = {
            "job_id": job.job_id,
            "top_hit": {
                "accession": top_hit.accession,
                "description": top_hit.description,
                "identity_pct": top_hit.identity_pct,
                "coverage_pct": top_hit.coverage_pct,
                "e_value": top_hit.e_value,
            },
            "all_hits": [
                {
                    "accession": h.accession,
                    "description": h.description,
                    "identity_pct": h.identity_pct,
                    "coverage_pct": h.coverage_pct,
                    "e_value": h.e_value,
                }
                for h in hits
            ],
            "consensus_fasta": consensus_fasta,
            "aligned_fasta": aligned_fasta,
            "newick": newick,
            "svg": svg,
            "elapsed_seconds": elapsed,
        }

        _update(job, PipelineStage.COMPLETE, 100, "Pipeline complete")

    except Exception as exc:
        job.stage = PipelineStage.ERROR
        job.error = str(exc)
        job.message = f"Error: {exc}"
