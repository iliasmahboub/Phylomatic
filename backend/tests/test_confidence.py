"""Unit tests for the confidence scoring module."""

from __future__ import annotations

from app.pipeline.blast import BlastHit
from app.pipeline.confidence import compute_confidence, _extract_genus


def _hit(desc: str, identity: float, **kwargs) -> BlastHit:
    """Helper to create a BlastHit with sensible defaults."""
    return BlastHit(
        accession=kwargs.get("accession", "NR_000001"),
        description=desc,
        identity_pct=identity,
        coverage_pct=kwargs.get("coverage_pct", 100.0),
        e_value=kwargs.get("e_value", 0.0),
        length=kwargs.get("length", 1400),
    )


class TestExtractGenus:
    def test_simple_binomial(self) -> None:
        assert _extract_genus("Escherichia coli strain K-12") == "Escherichia"

    def test_single_word(self) -> None:
        assert _extract_genus("Bacteria") == "Bacteria"

    def test_empty_string(self) -> None:
        assert _extract_genus("") == "Unknown"


class TestComputeConfidence:
    def test_high_confidence(self) -> None:
        """Clear winner: large identity gap, high genus consensus."""
        hits = [
            _hit("Escherichia coli K-12", 99.8),
            _hit("Escherichia coli O157", 99.5),
            _hit("Escherichia fergusonii", 98.0),
            _hit("Salmonella enterica", 94.2),
        ]
        result = compute_confidence(hits)
        assert result.level == "HIGH"
        assert result.top_genus == "Escherichia"
        assert result.identity_gap >= 2.0

    def test_low_confidence_narrow_gap(self) -> None:
        """Ambiguous: top two genera nearly identical."""
        hits = [
            _hit("Escherichia coli", 98.7),
            _hit("Shigella flexneri", 98.5),
            _hit("Shigella sonnei", 98.3),
            _hit("Shigella boydii", 98.1),
        ]
        result = compute_confidence(hits)
        assert result.level in ("LOW", "MODERATE")
        assert result.identity_gap < 2.0

    def test_no_hits(self) -> None:
        """No hits returns LOW confidence."""
        result = compute_confidence([])
        assert result.level == "LOW"
        assert result.top_genus == "Unknown"

    def test_single_hit(self) -> None:
        """Single hit should still produce a result."""
        hits = [_hit("Escherichia coli", 99.0)]
        result = compute_confidence(hits)
        assert result.top_genus == "Escherichia"
        assert result.genus_consensus == 1.0

    def test_all_same_genus_high_identity(self) -> None:
        """All hits same genus with high identity should be HIGH."""
        hits = [
            _hit("Bacillus subtilis", 99.5),
            _hit("Bacillus cereus", 98.9),
            _hit("Bacillus thuringiensis", 98.7),
        ]
        result = compute_confidence(hits)
        assert result.level == "HIGH"
        assert result.genus_consensus == 1.0
