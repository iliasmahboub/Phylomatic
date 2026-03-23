"""BLAST module: submit consensus FASTA to NCBI BLASTn URL API, poll, parse hits."""

from __future__ import annotations

import asyncio
import os
import sys
import xml.etree.ElementTree as ET
from dataclasses import dataclass

import httpx

BLAST_URL = "https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi"
DEFAULT_HITLIST_SIZE = 10
POLL_INTERVAL_S = 10
MAX_RETRIES = 3


@dataclass
class BlastHit:
    accession: str
    description: str
    identity_pct: float
    coverage_pct: float
    e_value: float
    length: int


async def _submit_blast(client: httpx.AsyncClient, fasta: str, email: str) -> str:
    """Submit a BLASTn job and return the RID."""
    params = {
        "CMD": "Put",
        "PROGRAM": "blastn",
        "DATABASE": "nt",
        "QUERY": fasta,
        "FORMAT_TYPE": "XML",
        "HITLIST_SIZE": str(DEFAULT_HITLIST_SIZE),
        "email": email,
    }

    for attempt in range(MAX_RETRIES):
        try:
            resp = await client.post(BLAST_URL, data=params, timeout=60.0)
            resp.raise_for_status()
            text = resp.text
            # Extract RID from response
            for line in text.split("\n"):
                if line.strip().startswith("RID"):
                    rid = line.split("=")[1].strip()
                    return rid
            raise ValueError("RID not found in BLAST submission response")
        except (httpx.HTTPError, ValueError) as exc:
            if attempt == MAX_RETRIES - 1:
                raise RuntimeError(
                    f"BLAST submission failed after {MAX_RETRIES} retries: {exc}"
                ) from exc
            wait = 2 ** (attempt + 1)
            await asyncio.sleep(wait)

    raise RuntimeError("BLAST submission failed")


async def _poll_blast(client: httpx.AsyncClient, rid: str, email: str) -> str:
    """Poll for BLAST results until ready, return XML string."""
    params = {
        "CMD": "Get",
        "FORMAT_TYPE": "XML",
        "RID": rid,
        "email": email,
    }

    while True:
        await asyncio.sleep(POLL_INTERVAL_S)
        resp = await client.get(BLAST_URL, params=params, timeout=60.0)
        resp.raise_for_status()
        text = resp.text

        if "Status=WAITING" in text:
            continue
        if "Status=FAILED" in text:
            raise RuntimeError(f"BLAST job {rid} failed")
        if "Status=UNKNOWN" in text:
            raise RuntimeError(f"BLAST job {rid} expired or unknown")
        if "BlastOutput" in text:
            return text


def _parse_blast_xml(xml_text: str, query_length: int) -> list[BlastHit]:
    """Parse BLAST XML output into BlastHit objects."""
    root = ET.fromstring(xml_text)
    hits: list[BlastHit] = []

    iterations = root.findall(".//Iteration")
    if not iterations:
        return hits

    for hit_elem in iterations[0].findall(".//Hit"):
        accession = hit_elem.findtext("Hit_accession", "")
        description = hit_elem.findtext("Hit_def", "")

        # Take the best HSP
        hsp = hit_elem.find(".//Hsp")
        if hsp is None:
            continue

        identity = int(hsp.findtext("Hsp_identity", "0"))
        align_len = int(hsp.findtext("Hsp_align-len", "1"))
        e_value = float(hsp.findtext("Hsp_evalue", "0"))
        query_from = int(hsp.findtext("Hsp_query-from", "1"))
        query_to = int(hsp.findtext("Hsp_query-to", "1"))

        identity_pct = round((identity / align_len) * 100, 2) if align_len else 0.0
        coverage_pct = (
            round(((query_to - query_from + 1) / query_length) * 100, 2)
            if query_length
            else 0.0
        )

        hits.append(
            BlastHit(
                accession=accession,
                description=description,
                identity_pct=identity_pct,
                coverage_pct=coverage_pct,
                e_value=e_value,
                length=align_len,
            )
        )

    return hits


async def blast_search(
    fasta: str, hitlist_size: int = DEFAULT_HITLIST_SIZE
) -> list[BlastHit]:
    """Run a full BLASTn search: submit, poll, parse."""
    email = os.environ.get("NCBI_EMAIL", "")
    if not email:
        raise ValueError("NCBI_EMAIL environment variable must be set")

    # Extract query length from FASTA
    lines = fasta.strip().split("\n")
    seq_lines = [line for line in lines if not line.startswith(">")]
    query_length = len("".join(seq_lines))

    async with httpx.AsyncClient() as client:
        rid = await _submit_blast(client, fasta, email)
        xml_text = await _poll_blast(client, rid, email)
        hits = _parse_blast_xml(xml_text, query_length)

    return hits[:hitlist_size]


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m app.pipeline.blast <consensus.fasta>")
        sys.exit(1)

    from pathlib import Path

    fasta_content = Path(sys.argv[1]).read_text()

    hits = asyncio.run(blast_search(fasta_content))
    for i, h in enumerate(hits, 1):
        print(
            f"{i}. {h.accession} | {h.description[:60]} | "
            f"Identity: {h.identity_pct}% | Coverage: {h.coverage_pct}% | "
            f"E-value: {h.e_value}"
        )
