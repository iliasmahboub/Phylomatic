"""Translate consensus DNA → protein and predict 3D structure via ESMFold."""

from __future__ import annotations

from Bio.Seq import Seq
import httpx


def _find_longest_orf(dna: str) -> str:
    """Find the longest open reading frame across all six reading frames.

    Each strand is translated in three frames; the longest segment between
    stop codons is returned as an amino-acid string.
    """
    seq = Seq(dna)
    best = ""

    for strand in (seq, seq.reverse_complement()):
        for frame in range(3):
            protein = str(strand[frame:].translate(to_stop=False))
            # Split on stop codons and find longest segment
            for segment in protein.split("*"):
                if len(segment) > len(best):
                    best = segment

    return best


async def predict_structure(consensus_fasta: str) -> dict[str, str]:
    """
    Translate consensus DNA to protein, then predict 3D structure via ESMFold.

    Returns dict with keys:
      - protein_sequence: amino acid sequence used
      - pdb: PDB format string with pLDDT in B-factor column
    """
    lines = consensus_fasta.strip().split("\n")
    dna = "".join(line for line in lines if not line.startswith(">"))

    protein = _find_longest_orf(dna)
    if len(protein) < 20:
        raise ValueError(
            f"No ORF longer than 20 residues found (best: {len(protein)} aa)"
        )

    # ESMFold has a practical limit around 400 residues for the public API
    if len(protein) > 400:
        protein = protein[:400]

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://api.esmatlas.com/foldSequence/v1/pdb/",
            content=protein,
            headers={"Content-Type": "text/plain"},
        )
        resp.raise_for_status()

    return {
        "protein_sequence": protein,
        "pdb": resp.text,
    }
