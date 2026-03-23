"""Pydantic request/response schemas."""

from pydantic import BaseModel


class RunRequest(BaseModel):
    ncbi_email: str

    model_config = {
        "json_schema_extra": {"examples": [{"ncbi_email": "user@example.com"}]}
    }


class BlastHitSchema(BaseModel):
    accession: str
    description: str
    identity_pct: float
    coverage_pct: float
    e_value: float


class PipelineResult(BaseModel):
    job_id: str
    top_hit: BlastHitSchema
    all_hits: list[BlastHitSchema]
    consensus_fasta: str
    aligned_fasta: str
    newick: str
    svg: str
    elapsed_seconds: float
