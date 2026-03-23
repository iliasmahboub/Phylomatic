"""Entrez module: fetch reference FASTA sequences by accession from NCBI."""

from __future__ import annotations

import asyncio
import os
import sys

import httpx
from Bio import SeqIO
from io import StringIO

EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
BATCH_SIZE = 5
BATCH_DELAY_S = 1.0


async def fetch_sequences(accessions: list[str]) -> dict[str, str]:
    """
    Fetch FASTA sequences for a list of accessions from NCBI Entrez.

    Returns a dict mapping accession → FASTA sequence string.
    """
    email = os.environ.get("NCBI_EMAIL", "")
    if not email:
        raise ValueError("NCBI_EMAIL environment variable must be set")

    results: dict[str, str] = {}

    async with httpx.AsyncClient() as client:
        for i in range(0, len(accessions), BATCH_SIZE):
            batch = accessions[i : i + BATCH_SIZE]

            params = {
                "db": "nucleotide",
                "id": ",".join(batch),
                "rettype": "fasta",
                "retmode": "text",
                "tool": "phylomatic",
                "email": email,
            }

            resp = await client.get(EFETCH_URL, params=params, timeout=30.0)
            resp.raise_for_status()

            # Parse multi-FASTA response
            fasta_io = StringIO(resp.text)
            for record in SeqIO.parse(fasta_io, "fasta"):
                # Match accession from the record id
                acc = record.id.split(".")[0]
                out = StringIO()
                SeqIO.write(record, out, "fasta")
                results[acc] = out.getvalue()

            if i + BATCH_SIZE < len(accessions):
                await asyncio.sleep(BATCH_DELAY_S)

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m app.pipeline.entrez ACC1 ACC2 ACC3 ...")
        sys.exit(1)

    accessions = sys.argv[1:]
    result = asyncio.run(fetch_sequences(accessions))
    for acc, fasta in result.items():
        print(f"--- {acc} ---")
        print(fasta)
