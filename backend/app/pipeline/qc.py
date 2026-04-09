"""Quality control checks for chromatogram reads before pipeline execution.

Catches bad samples early: mixed peaks, short reads, high N content.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from Bio import SeqIO

MIN_CONSENSUS_LENGTH = 200
MAX_N_FRACTION = 0.05
MIXED_PEAK_THRESHOLD = 0.50  # secondary peak > 50% of primary
MAX_MIXED_PEAK_FRACTION = 0.10  # flag if > 10% of positions have mixed peaks


@dataclass
class QCWarning:
    code: str  # "short_read", "high_n_content", "mixed_peaks"
    severity: str  # "warning", "error"
    message: str


@dataclass
class QCResult:
    passed: bool
    warnings: list[QCWarning] = field(default_factory=list)
    consensus_length: int = 0
    n_fraction: float = 0.0
    mixed_peak_fraction: float = 0.0


def _check_mixed_peaks(ab1_path: str) -> float:
    """Scan chromatogram for positions with mixed (double) peaks.

    Returns the fraction of positions where the secondary peak exceeds
    ``MIXED_PEAK_THRESHOLD`` of the primary peak height.
    """
    try:
        record = SeqIO.read(ab1_path, "abi")
    except Exception:
        return 0.0

    # ABIF channels: DATA9=G, DATA10=A, DATA11=T, DATA12=C
    channels = {}
    for key in ["DATA9", "DATA10", "DATA11", "DATA12"]:
        if key in record.annotations.get("abif_raw", {}):
            channels[key] = record.annotations["abif_raw"][key]

    if len(channels) < 4:
        return 0.0

    # Find the shortest channel length for safe iteration
    min_len = min(len(v) for v in channels.values())
    if min_len == 0:
        return 0.0

    mixed_count = 0
    total_positions = 0

    for i in range(min_len):
        intensities = sorted([channels[k][i] for k in channels], reverse=True)
        primary = intensities[0]
        secondary = intensities[1]

        if primary > 0:
            total_positions += 1
            if secondary / primary > MIXED_PEAK_THRESHOLD:
                mixed_count += 1

    return mixed_count / total_positions if total_positions > 0 else 0.0


def check_consensus_quality(
    consensus_fasta: str,
    fwd_path: str | None = None,
    rev_path: str | None = None,
) -> QCResult:
    """Run quality checks on the assembled consensus sequence.

    Parameters
    ----------
    consensus_fasta : str
        FASTA-formatted consensus sequence.
    fwd_path : str, optional
        Path to forward .ab1 file for mixed-peak analysis.
    rev_path : str, optional
        Path to reverse .ab1 file for mixed-peak analysis.

    Returns
    -------
    QCResult
        Quality check results with any warnings.
    """
    warnings: list[QCWarning] = []

    # Extract sequence from FASTA
    lines = consensus_fasta.strip().split("\n")
    seq_lines = [line for line in lines if not line.startswith(">")]
    sequence = "".join(seq_lines).upper()
    seq_len = len(sequence)

    # Check minimum length
    if seq_len < MIN_CONSENSUS_LENGTH:
        warnings.append(
            QCWarning(
                code="short_read",
                severity="error",
                message=(
                    f"Consensus is only {seq_len} bp, below the {MIN_CONSENSUS_LENGTH} bp "
                    f"minimum for reliable identification."
                ),
            )
        )

    # Check N content
    n_count = sequence.count("N")
    n_fraction = n_count / seq_len if seq_len > 0 else 0.0

    if n_fraction > MAX_N_FRACTION:
        warnings.append(
            QCWarning(
                code="high_n_content",
                severity="warning",
                message=(
                    f"Consensus has {n_fraction:.1%} ambiguous bases ({n_count} Ns), "
                    f"exceeding the {MAX_N_FRACTION:.0%} threshold."
                ),
            )
        )

    # Check mixed peaks in chromatograms
    mixed_peak_fraction = 0.0
    for path in [fwd_path, rev_path]:
        if path:
            frac = _check_mixed_peaks(path)
            mixed_peak_fraction = max(mixed_peak_fraction, frac)

    if mixed_peak_fraction > MAX_MIXED_PEAK_FRACTION:
        warnings.append(
            QCWarning(
                code="mixed_peaks",
                severity="warning",
                message=(
                    f"Chromatogram shows {mixed_peak_fraction:.1%} mixed peaks, "
                    f"suggesting possible contamination or mixed culture."
                ),
            )
        )

    has_error = any(w.severity == "error" for w in warnings)

    return QCResult(
        passed=not has_error,
        warnings=warnings,
        consensus_length=seq_len,
        n_fraction=round(n_fraction, 4),
        mixed_peak_fraction=round(mixed_peak_fraction, 4),
    )
