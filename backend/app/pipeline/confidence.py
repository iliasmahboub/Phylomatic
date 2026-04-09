"""Confidence scoring for species-level identification.

Computes a confidence level (HIGH / MODERATE / LOW) based on:
- Identity gap between top hit and best hit from a different genus
- Genus consensus among the top N hits
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.pipeline.blast import BlastHit


@dataclass
class ConfidenceResult:
    level: str  # "HIGH", "MODERATE", "LOW"
    identity_gap: float  # gap between top hit and best different-genus hit
    genus_consensus: float  # fraction of top hits agreeing on genus
    top_genus: str  # genus of the top hit
    reason: str  # human-readable explanation


def _extract_genus(description: str) -> str:
    """Extract the genus (first word) from a BLAST hit description."""
    parts = description.strip().split()
    return parts[0] if parts else "Unknown"


def compute_confidence(
    hits: list[BlastHit],
    top_n: int = 10,
) -> ConfidenceResult:
    """Score the confidence of the top BLAST identification.

    Parameters
    ----------
    hits : list[BlastHit]
        BLAST hits sorted by rank (best first).
    top_n : int
        Number of top hits to consider for genus consensus.

    Returns
    -------
    ConfidenceResult
        Confidence level with supporting metrics.
    """
    if not hits:
        return ConfidenceResult(
            level="LOW",
            identity_gap=0.0,
            genus_consensus=0.0,
            top_genus="Unknown",
            reason="No BLAST hits returned",
        )

    top_hit = hits[0]
    top_genus = _extract_genus(top_hit.description)

    # Identity gap: difference between top hit and best hit from a different genus
    identity_gap = 0.0
    best_different_genus_identity = 0.0
    for hit in hits[1:]:
        if _extract_genus(hit.description) != top_genus:
            best_different_genus_identity = hit.identity_pct
            identity_gap = top_hit.identity_pct - best_different_genus_identity
            break

    # If all hits are the same genus, gap is max
    if best_different_genus_identity == 0.0 and len(hits) > 1:
        identity_gap = top_hit.identity_pct

    # Genus consensus: fraction of top_n hits that share the top genus
    considered = hits[:top_n]
    same_genus_count = sum(
        1 for h in considered if _extract_genus(h.description) == top_genus
    )
    genus_consensus = same_genus_count / len(considered)

    # Scoring logic
    if identity_gap >= 2.0 and genus_consensus >= 0.7 and top_hit.identity_pct >= 97.0:
        level = "HIGH"
        reason = (
            f"{top_genus} identified with {top_hit.identity_pct}% identity, "
            f"{identity_gap:.1f}% gap to nearest different genus, "
            f"{genus_consensus:.0%} genus consensus"
        )
    elif identity_gap >= 0.5 or genus_consensus >= 0.5:
        level = "MODERATE"
        reason = (
            f"{top_genus} likely but identity gap is narrow ({identity_gap:.1f}%) "
            f"or genus consensus is mixed ({genus_consensus:.0%})"
        )
    else:
        level = "LOW"
        reason = (
            f"Identification uncertain: identity gap {identity_gap:.1f}%, "
            f"genus consensus {genus_consensus:.0%}"
        )

    return ConfidenceResult(
        level=level,
        identity_gap=round(identity_gap, 2),
        genus_consensus=round(genus_consensus, 2),
        top_genus=top_genus,
        reason=reason,
    )
