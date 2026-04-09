"""Assembly module: .ab1 chromatogram files → quality-trimmed consensus FASTA."""

from __future__ import annotations

import math
import sys
from dataclasses import dataclass
from io import StringIO

from Bio import SeqIO
from Bio.Align import PairwiseAligner
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord

PHRED_CUTOFF = 20
AMBIGUITY_QUALITY_DIFF = 10  # max PHRED diff to call N when bases disagree


@dataclass
class AssemblyStats:
    """Quality metrics from the consensus assembly."""

    fwd_trimmed_len: int
    rev_trimmed_len: int
    overlap_len: int
    consensus_len: int
    ambiguous_bases: int
    ambiguous_pct: float


def _read_ab1(path: str) -> tuple[str, list[int]]:
    """Read an .ab1 file and return (sequence_string, quality_scores)."""
    record = SeqIO.read(path, "abi")
    seq = str(record.seq)
    quals = record.letter_annotations.get("phred_quality", [0] * len(seq))
    return seq, quals


def _trim_by_quality(
    seq: str, quals: list[int], cutoff: int = PHRED_CUTOFF
) -> tuple[str, list[int]]:
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


def _find_overlap(fwd_seq: str, rev_seq: str) -> tuple[int, int]:
    """Find the alignment offset between forward and reverse-complemented reads.

    Uses BioPython's PairwiseAligner to locate the overlap region.

    Returns
    -------
    tuple[int, int]
        (fwd_offset, rev_offset) — the start positions in each read
        where the overlap begins.
    """
    aligner = PairwiseAligner()
    aligner.mode = "local"
    aligner.match_score = 2
    aligner.mismatch_score = -1
    aligner.open_gap_score = -3
    aligner.extend_gap_score = -0.5

    alignments = aligner.align(fwd_seq, rev_seq)
    if not alignments:
        return 0, 0

    best = alignments[0]
    # aligned is a list of (start, end) tuples for each sequence
    fwd_start = best.aligned[0][0][0]
    rev_start = best.aligned[1][0][0]
    return fwd_start, rev_start


def _weighted_consensus_base(
    fwd_base: str, fwd_qual: int, rev_base: str, rev_qual: int
) -> str:
    """Pick the consensus base using PHRED quality as log-probability weights.

    If bases agree, return the shared base.
    If bases disagree and quality difference is small, return N.
    Otherwise return the higher-quality base.
    """
    if fwd_base == rev_base:
        return fwd_base

    qual_diff = abs(fwd_qual - rev_qual)
    if qual_diff <= AMBIGUITY_QUALITY_DIFF:
        return "N"

    return fwd_base if fwd_qual > rev_qual else rev_base


def _build_consensus(
    fwd_seq: str,
    fwd_quals: list[int],
    rev_seq: str,
    rev_quals: list[int],
) -> tuple[str, AssemblyStats]:
    """Build consensus using overlap alignment and weighted base calling.

    1. Find the overlap region with PairwiseAligner
    2. Use single-read sequence outside the overlap
    3. Use weighted consensus within the overlap
    """
    fwd_offset, rev_offset = _find_overlap(fwd_seq, rev_seq)

    # Compute the global coordinate mapping
    # fwd[fwd_offset] aligns with rev[rev_offset]
    # global position 0 = leftmost of either read
    fwd_global_start = 0
    rev_global_start = fwd_offset - rev_offset

    if rev_global_start < 0:
        fwd_global_start = -rev_global_start
        rev_global_start = 0

    fwd_global_end = fwd_global_start + len(fwd_seq)
    rev_global_end = rev_global_start + len(rev_seq)

    total_len = max(fwd_global_end, rev_global_end)

    # Overlap region in global coordinates
    overlap_start = max(fwd_global_start, rev_global_start)
    overlap_end = min(fwd_global_end, rev_global_end)
    overlap_len = max(0, overlap_end - overlap_start)

    consensus: list[str] = []
    ambiguous = 0

    for g in range(total_len):
        in_fwd = fwd_global_start <= g < fwd_global_end
        in_rev = rev_global_start <= g < rev_global_end

        if in_fwd and in_rev:
            fi = g - fwd_global_start
            ri = g - rev_global_start
            base = _weighted_consensus_base(
                fwd_seq[fi],
                fwd_quals[fi] if fi < len(fwd_quals) else 0,
                rev_seq[ri],
                rev_quals[ri] if ri < len(rev_quals) else 0,
            )
            if base == "N":
                ambiguous += 1
            consensus.append(base)
        elif in_fwd:
            fi = g - fwd_global_start
            consensus.append(fwd_seq[fi])
        else:
            ri = g - rev_global_start
            consensus.append(rev_seq[ri])

    consensus_seq = "".join(consensus)
    consensus_len = len(consensus_seq)

    stats = AssemblyStats(
        fwd_trimmed_len=len(fwd_seq),
        rev_trimmed_len=len(rev_seq),
        overlap_len=overlap_len,
        consensus_len=consensus_len,
        ambiguous_bases=ambiguous,
        ambiguous_pct=round(
            (ambiguous / consensus_len * 100) if consensus_len else 0, 2
        ),
    )

    return consensus_seq, stats


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

    consensus_seq, _stats = _build_consensus(
        fwd_seq, fwd_quals, rev_seq_rc, rev_quals_rc
    )

    record = SeqRecord(Seq(consensus_seq), id="consensus", description="")
    out = StringIO()
    SeqIO.write(record, out, "fasta")
    return out.getvalue()


def assemble_with_stats(fwd_path: str, rev_path: str) -> tuple[str, AssemblyStats]:
    """Assemble consensus and return both FASTA and quality statistics."""
    fwd_seq, fwd_quals = _read_ab1(fwd_path)
    rev_seq, rev_quals = _read_ab1(rev_path)

    fwd_seq, fwd_quals = _trim_by_quality(fwd_seq, fwd_quals)
    rev_seq, rev_quals = _trim_by_quality(rev_seq, rev_quals)

    rev_seq_rc = _reverse_complement(rev_seq)
    rev_quals_rc = rev_quals[::-1]

    consensus_seq, stats = _build_consensus(
        fwd_seq, fwd_quals, rev_seq_rc, rev_quals_rc
    )

    record = SeqRecord(Seq(consensus_seq), id="consensus", description="")
    out = StringIO()
    SeqIO.write(record, out, "fasta")
    return out.getvalue(), stats


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m app.pipeline.assembly <fwd.ab1> <rev.ab1>")
        sys.exit(1)
    result = assemble(sys.argv[1], sys.argv[2])
    print(result)
