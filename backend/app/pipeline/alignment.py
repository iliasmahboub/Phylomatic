"""Alignment module: multiple sequence alignment via EBI Clustal Omega REST API."""

from __future__ import annotations

import asyncio
import os
import sys

import httpx

CLUSTALO_RUN_URL = "https://www.ebi.ac.uk/Tools/services/rest/clustalo/run"
CLUSTALO_STATUS_URL = "https://www.ebi.ac.uk/Tools/services/rest/clustalo/status"
CLUSTALO_RESULT_URL = "https://www.ebi.ac.uk/Tools/services/rest/clustalo/result"
POLL_INTERVAL_S = 5
MAX_POLL_ATTEMPTS = 60  # 5 minutes max


async def _submit_alignment(
    client: httpx.AsyncClient, multi_fasta: str, email: str
) -> str:
    """Submit a Clustal Omega job, return job ID."""
    data = {
        "email": email,
        "sequence": multi_fasta,
        "outfmt": "fa",
        "stype": "dna",
    }

    resp = await client.post(CLUSTALO_RUN_URL, data=data, timeout=60.0)
    if resp.status_code != 200:
        raise RuntimeError(
            f"Clustal Omega submission failed ({resp.status_code}): {resp.text}"
        )
    job_id = resp.text.strip()
    return job_id


async def _poll_status(client: httpx.AsyncClient, job_id: str) -> None:
    """Poll until job finishes or errors."""
    for _ in range(MAX_POLL_ATTEMPTS):
        await asyncio.sleep(POLL_INTERVAL_S)
        try:
            resp = await client.get(f"{CLUSTALO_STATUS_URL}/{job_id}", timeout=60.0)
            resp.raise_for_status()
            status = resp.text.strip()
        except httpx.ReadTimeout:
            continue

        if status == "FINISHED":
            return
        if status in ("ERROR", "FAILURE", "NOT_FOUND"):
            raise RuntimeError(
                f"Clustal Omega job {job_id} failed with status: {status}"
            )

    raise RuntimeError(f"Clustal Omega job {job_id} timed out after polling")


async def _fetch_result(client: httpx.AsyncClient, job_id: str) -> str:
    """Fetch aligned FASTA result."""
    resp = await client.get(
        f"{CLUSTALO_RESULT_URL}/{job_id}/aln-fasta",
        timeout=60.0,
    )
    resp.raise_for_status()
    return resp.text


async def align_sequences(sequences: dict[str, str]) -> str:
    """
    Align multiple sequences using EBI Clustal Omega REST API.

    Input: dict of {label: sequence_string} (raw sequences, not FASTA)
    The consensus/Query sequence should be included and will be placed first.

    Returns: aligned FASTA string.
    """
    email = os.environ.get("NCBI_EMAIL", "")
    if not email:
        raise ValueError("NCBI_EMAIL environment variable must be set")

    # Build multi-FASTA with Query first
    parts: list[str] = []
    if "Query" in sequences:
        parts.append(f">Query\n{sequences['Query']}")
    for label, seq in sequences.items():
        if label != "Query":
            parts.append(f">{label}\n{seq}")

    multi_fasta = "\n".join(parts) + "\n"

    if len(sequences) < 2:
        raise ValueError("Need at least 2 sequences for alignment")

    async with httpx.AsyncClient() as client:
        job_id = await _submit_alignment(client, multi_fasta, email)
        await _poll_status(client, job_id)
        aligned_fasta = await _fetch_result(client, job_id)

    # Validate consensus is in output
    if "Query" not in aligned_fasta and ">consensus" not in aligned_fasta:
        raise RuntimeError("Consensus sequence missing from alignment output")

    return aligned_fasta


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m app.pipeline.alignment <refs.fasta>")
        sys.exit(1)

    from pathlib import Path
    from Bio import SeqIO
    from io import StringIO

    fasta_text = Path(sys.argv[1]).read_text()
    seqs: dict[str, str] = {}
    for record in SeqIO.parse(StringIO(fasta_text), "fasta"):
        seqs[record.id] = str(record.seq)

    result = asyncio.run(align_sequences(seqs))
    print(result)
