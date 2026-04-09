"""Tree module: build NJ or ML phylogenetic tree from aligned FASTA, output Newick."""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from io import StringIO
from pathlib import Path

from Bio import AlignIO, Phylo
from Bio.Phylo.TreeConstruction import DistanceCalculator, DistanceTreeConstructor


def _rename_consensus(aligned_fasta: str) -> str:
    """Rename 'consensus' to 'Query' in aligned FASTA for display."""
    aln = AlignIO.read(StringIO(aligned_fasta), "fasta")
    for record in aln:
        if record.id.lower() == "consensus":
            record.id = "Query"
            record.name = "Query"
            record.description = ""
    out = StringIO()
    AlignIO.write(aln, out, "fasta")
    return out.getvalue()


def build_nj_tree(aligned_fasta: str) -> str:
    """Build a Neighbor-Joining tree from aligned FASTA sequences.

    Returns a Newick-format string.
    """
    aligned_fasta = _rename_consensus(aligned_fasta)
    aln = AlignIO.read(StringIO(aligned_fasta), "fasta")

    calculator = DistanceCalculator("identity")
    dm = calculator.get_distance(aln)

    constructor = DistanceTreeConstructor()
    tree = constructor.nj(dm)

    out = StringIO()
    Phylo.write(tree, out, "newick")
    return out.getvalue().strip()


def build_ml_tree(aligned_fasta: str) -> str:
    """Build a maximum-likelihood tree using FastTree.

    Falls back to NJ if FastTree is not installed.

    Returns a Newick-format string.
    """
    fasttree = shutil.which("FastTree") or shutil.which("fasttree")
    if fasttree is None:
        return build_nj_tree(aligned_fasta)

    aligned_fasta = _rename_consensus(aligned_fasta)

    with tempfile.NamedTemporaryFile(mode="w", suffix=".fasta", delete=False) as tmp:
        tmp.write(aligned_fasta)
        tmp_path = tmp.name

    try:
        result = subprocess.run(
            [fasttree, "-nt", "-gtr", tmp_path],
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode != 0:
            raise RuntimeError(f"FastTree failed: {result.stderr}")
        return result.stdout.strip()
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def fasttree_available() -> bool:
    """Check whether FastTree is installed and accessible."""
    return (shutil.which("FastTree") or shutil.which("fasttree")) is not None


def build_tree(aligned_fasta: str, method: str = "nj") -> str:
    """Build a phylogenetic tree from aligned FASTA.

    Parameters
    ----------
    aligned_fasta : str
        Aligned FASTA string.
    method : str
        Tree method: ``"nj"`` for Neighbor-Joining, ``"ml"`` for Maximum Likelihood.

    Returns
    -------
    str
        Newick-format tree string.
    """
    if method == "ml":
        return build_ml_tree(aligned_fasta)
    return build_nj_tree(aligned_fasta)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m app.pipeline.tree <aligned.fasta> [nj|ml]")
        sys.exit(1)

    aligned = Path(sys.argv[1]).read_text()
    tree_method = sys.argv[2] if len(sys.argv) > 2 else "nj"
    newick = build_tree(aligned, method=tree_method)
    print(newick)
