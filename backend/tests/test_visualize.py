"""Unit tests for the visualization module."""

from __future__ import annotations

import pytest

from app.pipeline.blast import BlastHit
from app.pipeline.visualize import render_tree

SIMPLE_NEWICK = "((A:0.1,B:0.2):0.05,(C:0.15,Query:0.08):0.03);"


class TestRenderTree:
    def test_returns_svg_string(self) -> None:
        """Verify that render_tree produces a valid SVG string."""
        svg = render_tree(SIMPLE_NEWICK)
        assert svg.startswith("<?xml") or "<svg" in svg
        assert "</svg>" in svg

    def test_contains_query_label(self) -> None:
        """Verify that the Query node label appears in the SVG."""
        svg = render_tree(SIMPLE_NEWICK)
        assert "Query" in svg

    def test_contains_all_taxa(self) -> None:
        """Verify that all taxon labels appear in the SVG output."""
        svg = render_tree(SIMPLE_NEWICK)
        for taxon in ["A", "B", "C", "Query"]:
            assert taxon in svg

    def test_top_hit_subtitle(self) -> None:
        """Verify that the top hit description appears as a subtitle."""
        top_hit = BlastHit(
            accession="NR_114042",
            description="Escherichia coli strain K-12",
            identity_pct=99.5,
            coverage_pct=100.0,
            e_value=0.0,
            length=1400,
        )
        svg = render_tree(SIMPLE_NEWICK, top_hit=top_hit)
        assert "Escherichia" in svg
        assert "99.5" in svg

    def test_no_top_hit_still_works(self) -> None:
        """Verify rendering works without a top hit."""
        svg = render_tree(SIMPLE_NEWICK, top_hit=None)
        assert "<svg" in svg
