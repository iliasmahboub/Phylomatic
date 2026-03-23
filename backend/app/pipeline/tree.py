"""Tree module: build NJ phylogenetic tree from aligned FASTA, output Newick."""

from __future__ import annotations

import sys
from io import StringIO

from Bio import AlignIO, Phylo
from Bio.Phylo.TreeConstruction import DistanceCalculator, DistanceTreeConstructor


def build_tree(aligned_fasta: str) -> str:
    """
    Build a Neighbor-Joining tree from aligned FASTA sequences.

    Returns a Newick-format string.
    """
    aln = AlignIO.read(StringIO(aligned_fasta), "fasta")

    # Rename consensus to "Query" if present
    for record in aln:
        if record.id.lower() == "consensus":
            record.id = "Query"
            record.name = "Query"
            record.description = ""

    calculator = DistanceCalculator("identity")
    dm = calculator.get_distance(aln)

    constructor = DistanceTreeConstructor()
    tree = constructor.nj(dm)

    # Write to Newick
    out = StringIO()
    Phylo.write(tree, out, "newick")
    return out.getvalue().strip()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m app.pipeline.tree <aligned.fasta>")
        sys.exit(1)

    from pathlib import Path
    aligned = Path(sys.argv[1]).read_text()
    newick = build_tree(aligned)
    print(newick)
