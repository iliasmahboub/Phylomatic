"""Tests for the tree construction module."""

from pathlib import Path

from app.pipeline.tree import build_tree

SAMPLE_DATA = Path(__file__).parent / "sample_data"


class TestBuildTree:
    def test_produces_valid_newick(self) -> None:
        aligned = (SAMPLE_DATA / "aligned.fasta").read_text()
        newick = build_tree(aligned)
        assert newick.endswith(";")
        assert "Query" in newick

    def test_contains_all_taxa(self) -> None:
        aligned = (SAMPLE_DATA / "aligned.fasta").read_text()
        newick = build_tree(aligned)
        for label in ["Query", "AB001", "AB002", "AB003"]:
            assert label in newick

    def test_newick_has_branch_lengths(self) -> None:
        aligned = (SAMPLE_DATA / "aligned.fasta").read_text()
        newick = build_tree(aligned)
        # Newick branch lengths appear as :0.xxxx
        assert ":" in newick

    def test_renames_consensus_to_query(self) -> None:
        # Create aligned FASTA with "consensus" label
        aligned = ">consensus\nATCGATCG\n>REF1\nATCGATCG\n>REF2\nATCGATCG\n"
        newick = build_tree(aligned)
        assert "Query" in newick
