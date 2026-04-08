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


def create_job(
    fwd_path: str, rev_path: str, ncbi_email: str, blast_db: str = "16S_ribosomal_RNA"
) -> JobState:
    """Create a new pipeline job and register it in the global store."""
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
    """Set the current stage, progress percentage, and status message."""
    job.stage = stage
    job.progress = progress
    job.message = message


def _filter_hits(hits: list) -> list:
    """Remove uncultured/environmental sequences for cleaner trees.

    Falls back to the original list when filtering would leave no hits.
    """
    skip_terms = ["uncultured", "environmental", "unidentified", "bacterium strain"]
    filtered = [
        h for h in hits if not any(term in h.description.lower() for term in skip_terms)
    ]
    return filtered if filtered else hits


def _build_species_labels(hits: list) -> dict[str, str]:
    """Map accession numbers to readable genus-species labels.

    When two hits share the same binomial, the second is disambiguated
    by appending its accession number.
    """
    acc_to_species: dict[str, str] = {}
    for h in hits:
        parts = h.description.strip().split()
        species_name = (
            f"{parts[0]}_{parts[1]}" if len(parts) >= 2 else parts[0].replace(" ", "_")
        )
        label = species_name
        if label in acc_to_species.values():
            label = f"{species_name}_{h.accession.replace('.', '_')}"
        acc_to_species[h.accession] = label
    return acc_to_species


def _build_sequence_dict(
    consensus_fasta: str,
    ref_fastas: dict[str, str],
    acc_to_species: dict[str, str],
) -> dict[str, str]:
    """Assemble a {label: sequence} dict for alignment input.

    The consensus is placed under the key ``"Query"``.  Reference sequences
    are truncated to twice the query length (minimum 2000 bp) to stay within
    the EBI 4 MB input limit.
    """
    sequences: dict[str, str] = {}
    query_len = 0
    for rec in SeqIO.parse(StringIO(consensus_fasta), "fasta"):
        sequences["Query"] = str(rec.seq)
        query_len = len(rec.seq)
        break

    max_ref_len = max(query_len * 2, 2000)
    for acc, fasta_str in ref_fastas.items():
        for rec in SeqIO.parse(StringIO(fasta_str), "fasta"):
            label = acc_to_species.get(acc, acc.replace(".", "_"))
            sequences[label] = str(rec.seq)[:max_ref_len]
            break

    return sequences


def _build_result(job: JobState, **kwargs: object) -> dict[str, object]:
    """Serialize pipeline outputs into the result dict stored on the job."""
    elapsed = round(time.time() - job.start_time, 1)
    return {"job_id": job.job_id, "elapsed_seconds": elapsed, **kwargs}


async def run_pipeline(job: JobState) -> None:
    """Execute the full pipeline, updating job state at each stage.

    Each stage is self-contained: assembly, BLAST search, Entrez reference
    fetch, multiple-sequence alignment, tree construction, and SVG rendering.
    Progress is pushed to connected WebSocket clients via the shared
    ``JobState`` object.
    """
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

        filtered_hits = _filter_hits(hits)

        # 3. Entrez fetch
        _update(job, PipelineStage.ENTREZ, 50, "Fetching reference sequences...")
        top_hits = filtered_hits[:10]
        accessions = [h.accession for h in top_hits]
        ref_fastas = await fetch_sequences(accessions)
        _update(job, PipelineStage.ENTREZ, 60, f"Fetched {len(ref_fastas)} references")

        # 4. Alignment
        _update(job, PipelineStage.ALIGNMENT, 65, "Submitting alignment...")
        acc_to_species = _build_species_labels(hits)
        sequences = _build_sequence_dict(consensus_fasta, ref_fastas, acc_to_species)
        aligned_fasta = await align_sequences(sequences)
        _update(job, PipelineStage.ALIGNMENT, 75, "Alignment complete")

        # 5. Tree
        _update(job, PipelineStage.TREE, 80, "Building phylogenetic tree...")
        newick = build_tree(aligned_fasta)
        _update(job, PipelineStage.TREE, 88, "Tree construction complete")

        # 6. Visualize
        _update(job, PipelineStage.VISUALIZE, 90, "Rendering tree SVG...")
        top_hit = max(hits, key=lambda h: h.identity_pct)
        svg = render_tree(newick, top_hit)
        _update(job, PipelineStage.VISUALIZE, 98, "Visualization complete")

        # Store result
        job.result = _build_result(
            job,
            top_hit={
                "accession": top_hit.accession,
                "description": top_hit.description,
                "identity_pct": top_hit.identity_pct,
                "coverage_pct": top_hit.coverage_pct,
                "e_value": top_hit.e_value,
            },
            all_hits=[
                {
                    "accession": h.accession,
                    "description": h.description,
                    "identity_pct": h.identity_pct,
                    "coverage_pct": h.coverage_pct,
                    "e_value": h.e_value,
                }
                for h in hits
            ],
            consensus_fasta=consensus_fasta,
            aligned_fasta=aligned_fasta,
            newick=newick,
            svg=svg,
        )

        _update(job, PipelineStage.COMPLETE, 100, "Pipeline complete")

    except Exception as exc:
        job.stage = PipelineStage.ERROR
        job.error = str(exc)
        job.message = f"Error: {exc}"
