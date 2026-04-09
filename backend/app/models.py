"""Pydantic request/response schemas."""

from pydantic import BaseModel


class RunRequest(BaseModel):
    """Input parameters for a new pipeline run."""

    ncbi_email: str

    model_config = {
        "json_schema_extra": {"examples": [{"ncbi_email": "user@example.com"}]}
    }


class BlastHitSchema(BaseModel):
    """Schema for a single BLAST hit returned to the frontend."""

    accession: str
    description: str
    identity_pct: float
    coverage_pct: float
    e_value: float


class ConfidenceSchema(BaseModel):
    """Confidence assessment for the species identification."""

    level: str  # HIGH, MODERATE, LOW
    identity_gap: float
    genus_consensus: float
    top_genus: str
    reason: str


class PipelineResult(BaseModel):
    """Complete pipeline output: hits, sequences, tree, and SVG."""

    job_id: str
    top_hit: BlastHitSchema
    all_hits: list[BlastHitSchema]
    confidence: ConfidenceSchema
    consensus_fasta: str
    aligned_fasta: str
    newick: str
    svg: str
    elapsed_seconds: float
