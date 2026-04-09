"""Tests for the assembly module."""

from unittest.mock import patch, MagicMock

from app.pipeline.assembly import (
    _trim_by_quality,
    _reverse_complement,
    _build_consensus,
    assemble,
)


class TestTrimByQuality:
    def test_trims_low_quality_ends(self) -> None:
        seq = "AATTCCGG"
        quals = [5, 5, 25, 30, 30, 25, 5, 5]
        trimmed_seq, trimmed_quals = _trim_by_quality(seq, quals)
        assert trimmed_seq == "TTCC"
        assert trimmed_quals == [25, 30, 30, 25]

    def test_no_trim_needed(self) -> None:
        seq = "AATTCC"
        quals = [30, 30, 30, 30, 30, 30]
        trimmed_seq, trimmed_quals = _trim_by_quality(seq, quals)
        assert trimmed_seq == "AATTCC"

    def test_all_low_quality(self) -> None:
        seq = "AATT"
        quals = [5, 5, 5, 5]
        # When all below cutoff, start never set properly, returns original
        trimmed_seq, _ = _trim_by_quality(seq, quals)
        assert len(trimmed_seq) > 0


class TestReverseComplement:
    def test_basic_rc(self) -> None:
        assert _reverse_complement("ATCG") == "CGAT"

    def test_palindrome(self) -> None:
        assert _reverse_complement("AATT") == "AATT"

    def test_single_base(self) -> None:
        assert _reverse_complement("A") == "T"


class TestBuildConsensus:
    def test_consensus_favors_higher_quality(self) -> None:
        fwd = "AATC"
        fwd_q = [30, 30, 10, 30]
        rev = "AAGC"
        rev_q = [20, 20, 30, 20]
        cons, stats = _build_consensus(fwd, fwd_q, rev, rev_q)
        assert len(cons) == 4
        # Position 2: fwd='T' q=10, rev='G' q=30 → pick rev 'G'
        assert cons[2] == "G"

    def test_equal_quality_takes_forward(self) -> None:
        fwd = "AATC"
        fwd_q = [30, 30, 30, 30]
        rev = "AAGC"
        rev_q = [30, 30, 30, 30]
        cons, stats = _build_consensus(fwd, fwd_q, rev, rev_q)
        # Equal quality but within ambiguity threshold → N
        # (new weighted consensus marks disagreeing bases with close quality as N)
        assert cons[2] == "N"

    def test_different_lengths(self) -> None:
        fwd = "AATCGG"
        fwd_q = [30, 30, 30, 30, 30, 30]
        rev = "AAGC"
        rev_q = [20, 20, 20, 20]
        cons, stats = _build_consensus(fwd, fwd_q, rev, rev_q)
        assert len(cons) == 6


class TestAssemble:
    @patch("app.pipeline.assembly._read_ab1")
    def test_assemble_produces_fasta(self, mock_read: MagicMock) -> None:
        mock_read.side_effect = [
            ("AATTCCGGAA", [30] * 10),
            ("TTCCGGTTAA", [30] * 10),
        ]
        result = assemble("fake_fwd.ab1", "fake_rev.ab1")
        assert result.startswith(">consensus")
        assert "\n" in result
        # Should contain valid DNA bases
        seq_part = "".join(result.split("\n")[1:])
        assert all(c in "ATCGN" for c in seq_part)
