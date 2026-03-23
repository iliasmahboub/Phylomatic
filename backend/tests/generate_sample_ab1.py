"""Generate synthetic .ab1 files for testing using BioPython."""

from pathlib import Path
from Bio.SeqRecord import SeqRecord
from Bio.Seq import Seq

SAMPLE_DIR = Path(__file__).parent / "sample_data"


def create_sample_fasta() -> None:
    """Create a sample consensus FASTA for blast/alignment/tree tests."""
    # A short 16S rRNA-like fragment (E. coli K-12)
    seq = (
        "AGAGTTTGATCCTGGCTCAGATTGAACGCTGGCGGCAGGCCTAACACATGCAAGTCGAAC"
        "GGTAACAGGAAGAAGCTTGCTTCTTTGCTGACGAGTGGCGGACGGGTGAGTAATGTCTG"
        "GGAAACTGCCTGATGGAGGGGGATAACTACTGGAAACGGTAGCTAATACCGCATAACGTCG"
        "CAAGCACAAAGAGGGGGACCTTAGGGCCTCTTGCCATCAGATGTGCCCAGATGGGATTAGC"
    )
    fasta = f">consensus\n{seq}\n"
    (SAMPLE_DIR / "consensus.fasta").write_text(fasta)
    print(f"Wrote {SAMPLE_DIR / 'consensus.fasta'}")


def create_sample_aligned_fasta() -> None:
    """Create sample aligned FASTA for tree tests."""
    seqs = {
        "Query": "AGAGTTTGATCCTGGCTCAG-ATTGAACGCTGGCGGCAGGCCTAACACATGCAAGTCGAAC",
        "AB001": "AGAGTTTGATCCTGGCTCAGAATTGAACGCTGGCGGCAGGCCTAACACATGCAAGTCGAAC",
        "AB002": "AGAGTTTGATCCTGGCTCAG-ATTGAACGCTGGCGGCAGGCCTAACAC-TGCAAGTCGAAC",
        "AB003": "AGAGTTTGATCCTGGCTCAG-ATTGAACGCTGG-GGCAGGCCTAACACATGCAAGTCGAAC",
    }
    lines = []
    for label, seq in seqs.items():
        lines.append(f">{label}")
        lines.append(seq)
    (SAMPLE_DIR / "aligned.fasta").write_text("\n".join(lines) + "\n")
    print(f"Wrote {SAMPLE_DIR / 'aligned.fasta'}")


if __name__ == "__main__":
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    create_sample_fasta()
    create_sample_aligned_fasta()
