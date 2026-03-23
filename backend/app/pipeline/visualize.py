"""Visualization module: render Newick tree to annotated SVG."""

from __future__ import annotations

import sys
from io import BytesIO, StringIO

import matplotlib
matplotlib.use("svg")
import matplotlib.pyplot as plt
from Bio import Phylo

from app.pipeline.blast import BlastHit


QUERY_COLOR = "#1D9E75"
DEFAULT_COLOR = "#666666"


def render_tree(newick: str, top_hit: BlastHit | None = None) -> str:
    """
    Render a phylogenetic tree from Newick string to SVG.

    Returns SVG as a UTF-8 string.
    """
    tree = Phylo.read(StringIO(newick), "newick")

    # Root at midpoint
    tree.root_at_midpoint()

    # Color the Query node
    for clade in tree.find_clades():
        if clade.name and "Query" in clade.name:
            clade.color = QUERY_COLOR
        elif clade.name:
            clade.color = DEFAULT_COLOR

    fig, ax = plt.subplots(figsize=(12, max(6, len(tree.get_terminals()) * 0.4)))

    Phylo.draw(
        tree,
        axes=ax,
        do_show=False,
        label_func=lambda c: c.name or "",
        label_colors=lambda name: QUERY_COLOR if name and "Query" in name else DEFAULT_COLOR,
    )

    ax.set_title("Phylogenetic Tree", fontsize=14, fontweight="bold")
    if top_hit:
        ax.set_xlabel(
            f"Top hit: {top_hit.description[:80]} ({top_hit.identity_pct}% identity)",
            fontsize=9,
            color="#555555",
        )

    plt.tight_layout()

    buf = BytesIO()
    fig.savefig(buf, format="svg", bbox_inches="tight")
    plt.close(fig)

    svg_str = buf.getvalue().decode("utf-8")
    return svg_str


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m app.pipeline.visualize <tree.nwk>")
        sys.exit(1)

    from pathlib import Path
    newick_str = Path(sys.argv[1]).read_text().strip()
    svg = render_tree(newick_str)

    out_path = Path(sys.argv[1]).with_suffix(".svg")
    out_path.write_text(svg)
    print(f"SVG written to {out_path}")
