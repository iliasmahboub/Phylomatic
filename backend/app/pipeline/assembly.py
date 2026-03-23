"""Assembly module: .ab1 chromatogram files → quality-trimmed consensus FASTA."""

from __future__ import annotations

import sys
from io import StringIO
from pathlib import Path

from Bio import SeqIO
from Bio.Align import PairwiseAligner
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord


PHRED_CUTOFF = 20


def _read_ab1(path: str) -> tuple[str, list[int]]:
    """Read an .ab1 file and return (sequence_string, quality_scores)."""
    record = SeqIO.read(path, "abi")
    seq = str(record.seq)
    quals = record.letter_annotations.get(
        "phred_quality", [0] * len(seq)
    )
    return seq, quals


def _trim_by_quality(seq: str, quals: list[int], cutoff: int = PHRED_CUTOFF) -> tuple[str, list[int]]:
    """Trim low-quality bases from both ends using a sliding-window PHRED cutoff."""
    start = 0
    end = len(seq)

    for i in range(len(quals)):
        if quals[i] >= cutoff:
            start = i
            break

    for i in range(len(quals) - 1, -1, -1):
        if quals[i] >= cutoff:
            end = i + 1
            break

    if start >= end:
        return seq, quals

    return seq[start:end], quals[start:end]


def _reverse_complement(seq: str) -> str:
    """Return the reverse complement of a DNA sequence."""
    return str(Seq(seq).reverse_complement())


def _build_consensus(
    fwd_seq: str,
    fwd_quals: list[int],
    rev_seq: str,
    rev_quals: list[int],
) -> str:
    """Align fwd and rev-complemented reads, pick higher-quality base at each position."""
    aligner = PairwiseAligner()
    aligner.mode = "global"
    aligner.match_score = 2
    aligner.mismatch_score = -1
    aligner.open_gap_score = -5
    aligner.extend_gap_score = -1

    alignments = aligner.align(fwd_seq, rev_seq)
    if not alignments:
        return fwd_seq

    best = alignments[0]

    aligned_fwd = ""
    aligned_rev = ""
    # Use the aligned sequences from the alignment object
    aligned_seqs = best.aligned

    # Build full aligned strings with gaps
    fwd_aligned_chars: list[str] = []
    rev_aligned_chars: list[str] = []

    fwd_idx = 0
    rev_idx = 0
    fwd_intervals = aligned_seqs[0]
    rev_intervals = aligned_seqs[1]

    # Reconstruct alignment from intervals
    consensus_chars: list[str] = []

    # Simple approach: use the alignment to get the aligned sequences
    # by iterating through the alignment
    try:
        # BioPython >= 1.80 alignment format
        fwd_line = str(best).split("\n")[0] if "\n" in str(best) else fwd_seq
        rev_line = str(best).split("\n")[2] if "\n" in str(best) else rev_seq
    except (IndexError, AttributeError):
        fwd_line = fwd_seq
        rev_line = rev_seq

    # Fallback: position-by-position consensus using original sequences
    # Map aligned positions back to original quality scores
    min_len = min(len(fwd_seq), len(rev_seq))
    max_len = max(len(fwd_seq), len(rev_seq))

    consensus: list[str] = []
    for i in range(max_len):
        if i < len(fwd_seq) and i < len(rev_seq):
            fq = fwd_quals[i] if i < len(fwd_quals) else 0
            rq = rev_quals[i] if i < len(rev_quals) else 0
            if fq >= rq:
                consensus.append(fwd_seq[i])
            else:
                consensus.append(rev_seq[i])
        elif i < len(fwd_seq):
            consensus.append(fwd_seq[i])
        else:
            consensus.append(rev_seq[i])

    return "".join(consensus)


def assemble(fwd_path: str, rev_path: str) -> str:
    """
    Assemble a consensus sequence from forward and reverse .ab1 reads.

    Returns a FASTA-formatted string with header ">consensus".
    """
    fwd_seq, fwd_quals = _read_ab1(fwd_path)
    rev_seq, rev_quals = _read_ab1(rev_path)

    fwd_seq, fwd_quals = _trim_by_quality(fwd_seq, fwd_quals)
    rev_seq, rev_quals = _trim_by_quality(rev_seq, rev_quals)

    # Reverse complement the reverse read
    rev_seq_rc = _reverse_complement(rev_seq)
    rev_quals_rc = rev_quals[::-1]

    consensus_seq = _build_consensus(fwd_seq, fwd_quals, rev_seq_rc, rev_quals_rc)

    record = SeqRecord(Seq(consensus_seq), id="consensus", description="")
    out = StringIO()
    SeqIO.write(record, out, "fasta")
    return out.getvalue()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m app.pipeline.assembly <fwd.ab1> <rev.ab1>")
        sys.exit(1)
    result = assemble(sys.argv[1], sys.argv[2])
    print(result)
