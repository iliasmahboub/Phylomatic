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


async def fetch_sequences(
    accessions: list[str], max_retries: int = 3
) -> dict[str, str]:
    """Fetch FASTA sequences for a list of accessions from NCBI Entrez.

    Accessions are fetched in batches of ``BATCH_SIZE`` with a delay between
    batches to respect NCBI rate limits.  Each batch is retried up to
    ``max_retries`` times with exponential back-off.

    Parameters
    ----------
    accessions : list[str]
        NCBI nucleotide accession numbers.
    max_retries : int
        Maximum retry attempts per batch (default 3).

    Returns
    -------
    dict[str, str]
        Mapping of accession (without version suffix) to FASTA string.

    Raises
    ------
    ValueError
        If ``NCBI_EMAIL`` is not set.
    RuntimeError
        If a batch fails after all retries.
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

            for attempt in range(max_retries):
                try:
                    resp = await client.get(EFETCH_URL, params=params, timeout=30.0)
                    resp.raise_for_status()
                    break
                except httpx.HTTPError as exc:
                    if attempt == max_retries - 1:
                        raise RuntimeError(
                            f"Entrez fetch failed for {batch} after "
                            f"{max_retries} retries: {exc}"
                        ) from exc
                    await asyncio.sleep(2 ** (attempt + 1))

            # Parse multi-FASTA response
            fasta_io = StringIO(resp.text)
            for record in SeqIO.parse(fasta_io, "fasta"):
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
