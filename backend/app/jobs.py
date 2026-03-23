"""Async job queue and stage state machine."""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


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


# In-memory job storage
jobs: dict[str, JobState] = {}


def create_job(fwd_path: str, rev_path: str, ncbi_email: str) -> JobState:
    job_id = uuid.uuid4().hex[:12]
    job = JobState(
        job_id=job_id,
        fwd_path=fwd_path,
        rev_path=rev_path,
        ncbi_email=ncbi_email,
    )
    jobs[job_id] = job
    return job
