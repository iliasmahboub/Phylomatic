"""Unit tests for the quality control module."""

from __future__ import annotations

from app.pipeline.qc import check_consensus_quality, MIN_CONSENSUS_LENGTH


def _make_fasta(seq: str) -> str:
    return f">consensus\n{seq}\n"


class TestCheckConsensusQuality:
    def test_good_sequence_passes(self) -> None:
        """A long, clean sequence should pass with no warnings."""
        seq = "ATGC" * 100  # 400 bp, no Ns
        result = check_consensus_quality(_make_fasta(seq))
        assert result.passed is True
        assert len(result.warnings) == 0
        assert result.consensus_length == 400

    def test_short_sequence_fails(self) -> None:
        """Sequence shorter than MIN_CONSENSUS_LENGTH should fail."""
        seq = "ATGC" * 10  # 40 bp
        result = check_consensus_quality(_make_fasta(seq))
        assert result.passed is False
        assert any(w.code == "short_read" for w in result.warnings)

    def test_high_n_content_warns(self) -> None:
        """Sequence with >5% Ns should produce a warning."""
        # 300 bp with 20 Ns = 6.7%
        seq = "ATGC" * 70 + "N" * 20
        result = check_consensus_quality(_make_fasta(seq))
        assert any(w.code == "high_n_content" for w in result.warnings)
        # High N content is a warning, not an error
        assert result.passed is True

    def test_borderline_n_content_no_warning(self) -> None:
        """Sequence with exactly 5% Ns should not trigger a warning."""
        # 400 bp with 20 Ns = 5.0%, threshold is > 5%
        seq = "ATGC" * 95 + "N" * 20
        result = check_consensus_quality(_make_fasta(seq))
        assert not any(w.code == "high_n_content" for w in result.warnings)

    def test_n_fraction_reported(self) -> None:
        """Verify n_fraction is computed correctly."""
        seq = "ATGC" * 50 + "N" * 10  # 210 bp, 10 Ns
        result = check_consensus_quality(_make_fasta(seq))
        expected = round(10 / 210, 4)
        assert result.n_fraction == expected
